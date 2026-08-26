import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { paiements, PaiementInitResult, PaiementStatutResult } from '../lib/togotransit-api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  ArrowLeft,
  Smartphone,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Copy,
  AlertTriangle,
  Ticket,
  RefreshCw,
  Info,
} from 'lucide-react-native';

type Methode = 'flooz' | 'tmoney';

const formatPrix = (n: number) => {
  try {
    return new Intl.NumberFormat('fr-FR').format(n || 0) + ' XOF';
  } catch {
    return `${n || 0} XOF`;
  }
};

export default function PaymentScreen() {
  const params = useLocalSearchParams<{ reservation_id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const reservationId = params.reservation_id ? parseInt(params.reservation_id, 10) : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [statut, setStatut] = useState<PaiementStatutResult | null>(null);

  const [methodeChoisie, setMethodeChoisie] = useState<Methode>('flooz');
  const [numeroTelephone, setNumeroTelephone] = useState((user?.phone || user?.telephone || '').replace(/^\+?228/, ''));
  const [initResult, setInitResult] = useState<PaiementInitResult | null>(null);
  const [initLoading, setInitLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [checking, setChecking] = useState(false);

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const loadStatut = useCallback(async () => {
    if (isNaN(reservationId)) return;
    setLoading(true);
    setError(null);
    try {
      const s = await paiements.statut(reservationId);
      setStatut(s);
      if (s.reservation.statut === 'confirmee' && s.billets_disponibles.length > 0) {
        if (pollRef.current) clearInterval(pollRef.current);
        router.replace(`/ticket?billet_id=${s.billets_disponibles[0].id}`);
      }
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    loadStatut();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadStatut]);

  useEffect(() => {
    if (initResult) {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        setChecking(true);
        loadStatut().finally(() => setChecking(false));
      }, 4000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [initResult, loadStatut]);

  const initierPaiement = async () => {
    if (isNaN(reservationId)) return;
    const telephone = numeroTelephone.replace(/\s+/g, '');
    if (telephone.length < 8) {
      Alert.alert('Numéro requis', 'Entrez le numéro Mobile Money à débiter (ex: 90123456).');
      return;
    }
    setInitLoading(true);
    setError(null);
    try {
      const res = await paiements.initier({
        reservation_id: reservationId,
        methode: methodeChoisie,
        numero_telephone: telephone,
      });
      setInitResult(res);
      setShowInstructions(true);
    } catch (e: any) {
      const msg = e?.message || e?.data?.error || 'Erreur initialisation paiement.';
      if (e?.status === 409) {
        Alert.alert('Trajet non disponible', msg);
        router.back();
      } else {
        Alert.alert('Erreur', msg);
      }
    } finally {
      setInitLoading(false);
    }
  };

  const simulerWebhook = async (resultat: 'reussi' | 'echoue') => {
    if (!initResult?.paiement.reference_transaction) return;
    try {
      await paiements.simulerWebhookMock(initResult.paiement.reference_transaction, resultat);
    } catch (e: any) {
      console.warn('Mock webhook error', e);
    }
    setChecking(true);
    setTimeout(() => {
      loadStatut().finally(() => setChecking(false));
    }, 1200);
  };

  const paiement = statut?.paiement;
  const statutFinal =
    statut?.reservation.statut === 'confirmee' ? 'confirmee'
    : paiement && 'id' in paiement ? (paiement.statut === 'reussi' ? 'reussi'
      : paiement.statut === 'echoue' ? 'echoue' : 'en_attente')
    : 'aucun';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Paiement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingState label="Vérification du paiement…" />
        ) : error && !statut ? (
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <ErrorState
              code={error?.code}
              description={error?.message}
              onRetry={loadStatut}
              variant={error?.code === 'NETWORK_ERROR' ? 'offline' : 'error'}
            />
          </View>
        ) : !statut ? null : (
          <>
            <View style={[styles.recapCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
              <View style={styles.montantRow}>
                <Text style={[styles.montantLabel, { color: colors.textSecondary }]}>Montant dû</Text>
                <Text style={[styles.montant, { color: colors.text }]}>
                  {formatPrix(statut.reservation.montant_total)}
                </Text>
              </View>
              <View style={[styles.statusRow, { borderTopColor: colors.border }]}>
                {statutFinal === 'confirmee' || statutFinal === 'reussi' ? (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: colors.primaryContainer }]}>
                      <CheckCircle2 size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusTitle, { color: colors.text }]}>Paiement confirmé</Text>
                      <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                        Votre réservation est maintenant confirmée.
                      </Text>
                    </View>
                  </>
                ) : statutFinal === 'echoue' ? (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: colors.errorContainer }]}>
                      <XCircle size={18} color={colors.error} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusTitle, { color: colors.text }]}>Paiement échoué</Text>
                      <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                        Réessayez avec une autre méthode.
                      </Text>
                    </View>
                  </>
                ) : statutFinal === 'en_attente' ? (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: colors.warning + '22' }]}>
                      {checking ? (
                        <ActivityIndicator size="small" color={colors.warning} />
                      ) : (
                        <Clock size={18} color={colors.warning} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusTitle, { color: colors.text }]}>En attente de confirmation</Text>
                      <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                        Validez le paiement sur votre téléphone puis patientez…
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.statusDot, { backgroundColor: colors.secondaryContainer }]}>
                      <Smartphone size={18} color={colors.secondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusTitle, { color: colors.text }]}>Choisissez une méthode de paiement</Text>
                      <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                        Paiement sécurisé via Mobile Money.
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {statutFinal !== 'confirmee' && statutFinal !== 'reussi' && (
              <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Méthode de paiement</Text>
                <TouchableOpacity
                  onPress={() => setMethodeChoisie('flooz')}
                  activeOpacity={0.8}
                  style={[
                    styles.methode,
                    {
                      backgroundColor: methodeChoisie === 'flooz' ? colors.primary + '14' : colors.surface,
                      borderColor: methodeChoisie === 'flooz' ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.methodeLogo, { backgroundColor: '#16a34a' }]}>
                    <Text style={styles.methodeLogoText}>F</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.methodeNom, { color: colors.text }]}>Flooz (Moov Money)</Text>
                    <Text style={[styles.methodeDesc, { color: colors.textSecondary }]}>
                      #228 - Opérateur Moov
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      {
                        backgroundColor: methodeChoisie === 'flooz' ? colors.primary : 'transparent',
                        borderColor: methodeChoisie === 'flooz' ? colors.primary : colors.outline,
                      },
                    ]}
                  >
                    {methodeChoisie === 'flooz' ? <CheckCircle2 size={14} color={colors.onPrimary} /> : null}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMethodeChoisie('tmoney')}
                  activeOpacity={0.8}
                  style={[
                    styles.methode,
                    {
                      backgroundColor: methodeChoisie === 'tmoney' ? colors.primary + '14' : colors.surface,
                      borderColor: methodeChoisie === 'tmoney' ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.methodeLogo, { backgroundColor: '#f59e0b' }]}>
                    <Text style={styles.methodeLogoText}>T</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.methodeNom, { color: colors.text }]}>T-Money (Togocom)</Text>
                    <Text style={[styles.methodeDesc, { color: colors.textSecondary }]}>
                      #228 - Opérateur Togocom
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      {
                        backgroundColor: methodeChoisie === 'tmoney' ? colors.primary : 'transparent',
                        borderColor: methodeChoisie === 'tmoney' ? colors.primary : colors.outline,
                      },
                    ]}
                  >
                    {methodeChoisie === 'tmoney' ? <CheckCircle2 size={14} color={colors.onPrimary} /> : null}
                  </View>
                </TouchableOpacity>

                <Text style={[styles.phoneLabel, { color: colors.textSecondary }]}>
                  Numéro Mobile Money à débiter
                </Text>
                <TextInput
                  value={numeroTelephone}
                  onChangeText={setNumeroTelephone}
                  placeholder="Ex: 90123456"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  style={[styles.phoneInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>
            )}

            {statutFinal === 'confirmee' && statut.billets_disponibles.length > 0 && (
              <View style={{ marginHorizontal: 16, marginTop: 14 }}>
                <TouchableOpacity
                  onPress={() =>
                    router.replace(`/ticket?billet_id=${statut.billets_disponibles[0].id}`)
                  }
                  activeOpacity={0.85}
                  style={[styles.billetBtn, { backgroundColor: colors.primary }]}
                >
                  <Ticket size={20} color={colors.onPrimary} />
                  <Text style={[styles.billetBtnText, { color: colors.onPrimary }]}>
                    Voir mon billet électronique
                  </Text>
                  <ChevronRight size={18} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>
            )}

            {(statutFinal === 'aucun' || statutFinal === 'echoue' || statutFinal === 'en_attente') && (
              <View style={{ marginHorizontal: 16, marginTop: 18 }}>
                <TouchableOpacity
                  onPress={statutFinal === 'en_attente' ? () => { setChecking(true); loadStatut().finally(() => setChecking(false)); } : initierPaiement}
                  disabled={initLoading}
                  activeOpacity={0.85}
                  style={[
                    styles.ctaBtn,
                    { backgroundColor: colors.primary },
                    initLoading && { opacity: 0.7 },
                  ]}
                >
                  {initLoading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : statutFinal === 'en_attente' ? (
                    <>
                      <RefreshCw size={18} color={colors.onPrimary} />
                      <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
                        Vérifier l'état du paiement
                      </Text>
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} color={colors.onPrimary} />
                      <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
                        {statutFinal === 'echoue' ? 'Réessayer avec ' : 'Payer par '}
                        {methodeChoisie === 'flooz' ? 'Flooz' : 'T-Money'}
                      </Text>
                      <ChevronRight size={18} color={colors.onPrimary} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {initResult && (
              <View style={{ marginHorizontal: 16, marginTop: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowInstructions(true)}
                  style={[styles.infoBtn, { backgroundColor: colors.secondaryContainer }]}
                  activeOpacity={0.7}
                >
                  <Info size={16} color={colors.onSecondaryContainer} />
                  <Text style={[styles.infoText, { color: colors.onSecondaryContainer }]}>
                    Instructions de paiement
                  </Text>
                </TouchableOpacity>
                <View style={[styles.mockBox, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
                  <AlertTriangle size={14} color={colors.warning} />
                  <Text style={[styles.mockText, { color: colors.textSecondary }]}>
                    Tests: simuler le retour Flooz/T-Money (webhook mock)
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={() => simulerWebhook('reussi')}
                      style={[styles.mockBtn, { backgroundColor: colors.primaryContainer }]}
                      activeOpacity={0.75}
                    >
                      <CheckCircle2 size={14} color={colors.onPrimaryContainer} />
                      <Text style={[styles.mockBtnText, { color: colors.onPrimaryContainer }]}>Succès</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => simulerWebhook('echoue')}
                      style={[styles.mockBtn, { backgroundColor: colors.errorContainer }]}
                      activeOpacity={0.75}
                    >
                      <XCircle size={14} color={colors.error} />
                      <Text style={[styles.mockBtnText, { color: colors.onErrorContainer }]}>Échec</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showInstructions}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInstructions(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Smartphone size={20} color={colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>Instructions de paiement</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowInstructions(false)}
              style={[styles.modalClose, { backgroundColor: colors.surfaceVariant }]}
            >
              <XCircle size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            {initResult ? (
              <>
                <View style={[styles.infoCard, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.infoCardTitle, { color: colors.onPrimaryContainer }]}>
                    {initResult.paiement.provider_label}
                  </Text>
                  <Text style={[styles.infoCardText, { color: colors.onPrimaryContainer }]}>
                    Montant : {formatPrix(initResult.paiement.montant)}
                  </Text>
                </View>

                <View style={[styles.refBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.refLabel, { color: colors.textSecondary }]}>Référence de transaction</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={[styles.refText, { color: colors.text }]} selectable>
                      {initResult.paiement.reference_transaction}
                    </Text>
                    <Copy size={14} color={colors.textSecondary} />
                  </View>
                </View>

                {initResult.paiement.instructions && initResult.paiement.instructions.length > 0 ? (
                  <View>
                    <Text style={[styles.etapesTitle, { color: colors.text }]}>Étapes</Text>
                    {initResult.paiement.instructions.map((etape, i) => (
                      <View key={i} style={styles.etapeRow}>
                        <Text style={[styles.etapeNum, { color: colors.primary }]}>{i + 1}.</Text>
                        <Text style={[styles.etapeText, { color: colors.text }]}>{etape}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <ErrorState
                title="Aucun paiement initié"
                description="Choisissez une méthode et cliquez sur le bouton de paiement."
              />
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800' },

  recapCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  montantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  montantLabel: { fontSize: 12, fontWeight: '700' },
  montant: { fontSize: 22, fontWeight: '900' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  statusDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: { fontSize: 14, fontWeight: '800' },
  statusDesc: { fontSize: 12, fontWeight: '500', marginTop: 2, lineHeight: 18 },

  sectionCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  methode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  methodeLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodeLogoText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  methodeNom: { fontSize: 14, fontWeight: '800' },
  methodeDesc: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneLabel: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  phoneInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
  },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  ctaText: { fontSize: 15, fontWeight: '800' },

  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  infoText: { fontSize: 13, fontWeight: '800' },

  mockBox: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
  },
  mockText: { fontSize: 11, fontWeight: '600', flex: 1 },
  mockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mockBtnText: { fontSize: 12, fontWeight: '800' },

  billetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  billetBtnText: { fontSize: 15, fontWeight: '800' },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: { borderRadius: 16, padding: 14 },
  infoCardTitle: { fontSize: 15, fontWeight: '800' },
  infoCardText: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  refBox: { borderRadius: 14, borderWidth: 1, padding: 12 },
  refLabel: { fontSize: 11, fontWeight: '700' },
  refText: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  etapesTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  etapeRow: { flexDirection: 'row', gap: 8, paddingVertical: 5 },
  etapeNum: { fontSize: 13, fontWeight: '900', width: 16 },
  etapeText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  delai: { fontSize: 12, fontWeight: '700' },
});
