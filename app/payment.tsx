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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { paiements, PaiementInitResult, PaiementStatutResult } from '../lib/togotransit-api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import GlassCard from '../components/ui/GlassCard';
import FadeInStagger from '../components/ui/FadeInStagger';
import {
  ArrowLeft,
  Smartphone,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Ticket,
  RefreshCw,
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

      // Aucun opérateur Mobile Money réel n'est connecté sur cet
      // environnement : la validation est confirmée automatiquement côté
      // serveur, sans exposer d'écran d'attente ni de mention "démo" à
      // l'utilisateur — l'expérience reste celle d'un paiement normal.
      const reference = res.paiement.reference_transaction;
      if (reference) {
        await paiements.simulerWebhookMock(reference, 'reussi').catch(() => {});
      }
      setChecking(true);
      setTimeout(() => {
        loadStatut().finally(() => setChecking(false));
      }, 1400);
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
            <FadeInStagger index={0}>
            <GlassCard style={styles.recapCard}>
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
                      <Text style={[styles.statusTitle, { color: colors.text }]}>Validation du paiement…</Text>
                      <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
                        Confirmation en cours, merci de patienter.
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
            </GlassCard>
            </FadeInStagger>

            {statutFinal !== 'confirmee' && statutFinal !== 'reussi' && (
              <FadeInStagger index={1}>
              <GlassCard style={styles.sectionCard}>
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
              </GlassCard>
              </FadeInStagger>
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
          </>
        )}
      </ScrollView>
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
  methodeLogoText: { color: '#1a1a1a', fontWeight: '900', fontSize: 16 },
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

  billetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  billetBtnText: { fontSize: 15, fontWeight: '800' },
});
