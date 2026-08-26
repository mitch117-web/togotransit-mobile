import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { trajetDetails, reservations, TrajetDetail, PassagerInput } from '../lib/togotransit-api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  ArrowLeft,
  Plus,
  Minus,
  User,
  Phone,
  CreditCard,
  ChevronRight,
  Bus,
  Clock,
  CheckCircle2,
  MapPin,
  X,
} from 'lucide-react-native';

const formatPrix = (n: number) => {
  try {
    return new Intl.NumberFormat('fr-FR').format(n || 0) + ' XOF';
  } catch {
    return `${n || 0} XOF`;
  }
};

export default function ReservationScreen() {
  const params = useLocalSearchParams<{ id?: string; places?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const trajetId = params.id ? parseInt(params.id, 10) : NaN;
  const initialPlaces = Math.max(1, parseInt(params.places || '1', 10) || 1);

  const [loading, setLoading] = useState(!isNaN(trajetId));
  const [error, setError] = useState<any>(null);
  const [trajet, setTrajet] = useState<TrajetDetail | null>(null);

  const [nombrePlaces, setNombrePlaces] = useState(initialPlaces);
  const [passagers, setPassagers] = useState<PassagerInput[]>(
    Array.from({ length: initialPlaces }, (_, i) => ({
      nom_complet: i === 0 ? user?.name || '' : '',
      telephone: i === 0 ? user?.phone || '' : '',
    }))
  );

  const [submitting, setSubmitting] = useState(false);

  const loadTrajet = useCallback(async () => {
    if (isNaN(trajetId)) return;
    setLoading(true);
    setError(null);
    try {
      const t = await trajetDetails.get(trajetId);
      setTrajet(t);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [trajetId]);

  React.useEffect(() => {
    loadTrajet();
  }, [loadTrajet]);

  const adjustPlaces = (delta: number) => {
    const next = Math.max(1, Math.min(passagers.length + delta, trajet?.places_restantes || 8));
    if (next === passagers.length) return;

    setNombrePlaces(next);
    setPassagers((prev) => {
      if (next > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: next - prev.length }, () => ({
            nom_complet: '',
            telephone: '',
          })),
        ];
      }
      return prev.slice(0, next);
    });
  };

  const updatePassager = (i: number, field: keyof PassagerInput, value: string) => {
    setPassagers((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p))
    );
  };

  const validatePassagers = (): string | null => {
    for (let i = 0; i < passagers.length; i++) {
      const p = passagers[i];
      if (!p.nom_complet || p.nom_complet.trim().length < 2) {
        return `Nom du passager ${i + 1} invalide`;
      }
      if (!p.telephone || p.telephone.trim().length < 8) {
        return `Téléphone du passager ${i + 1} invalide`;
      }
    }
    return null;
  };

  const prixTotal = (trajet?.prix || 0) * nombrePlaces;

  const submitReservation = async () => {
    if (!trajet) return;
    const err = validatePassagers();
    if (err) {
      Alert.alert('Formulaire invalide', err);
      return;
    }
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour réserver.');
      router.replace('/(auth)/login');
      return;
    }

    setSubmitting(true);
    try {
      const res = await reservations.creer({
        trajet_id: trajet.id,
        passagers,
      });
      if (res.success) {
        router.replace(`/payment?reservation_id=${res.reservation.id}`);
      }
    } catch (e: any) {
      const msg = e?.message || e?.data?.error || 'Erreur lors de la réservation.';
      if (e?.status === 409) {
        Alert.alert('Conflit de réservation', msg + '\nLes places ont pu être prises entre temps.');
        loadTrajet();
      } else {
        Alert.alert('Erreur', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
        <Text style={[styles.title, { color: colors.text }]}>Ma réservation</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <LoadingState label="Chargement du trajet…" />
          ) : error ? (
            <View style={{ marginHorizontal: 16, marginTop: 16 }}>
              <ErrorState
                code={error?.code}
                description={error?.message}
                onRetry={loadTrajet}
                variant={error?.code === 'NETWORK_ERROR' ? 'offline' : 'error'}
              />
            </View>
          ) : !trajet ? (
            <View style={{ marginHorizontal: 16, marginTop: 16 }}>
              <ErrorState
                title="Trajet introuvable"
                description="Retournez sur les résultats et sélectionnez un trajet."
                onRetry={() => router.back()}
                retryLabel="Retour aux résultats"
              />
            </View>
          ) : (
            <>
              <View style={[styles.recapCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
                <View style={styles.compagnieRow}>
                  <View style={[styles.compagnieLogo, { backgroundColor: colors.primaryContainer }]}>
                    <Bus size={18} color={colors.onPrimaryContainer} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.compagnieNom, { color: colors.text }]}>
                      {trajet.compagnie?.nom || 'Compagnie'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Clock size={12} color={colors.textSecondary} />
                      <Text style={[styles.heures, { color: colors.text }]}>
                        {trajet.heure_depart}
                      </Text>
                      {trajet.duree_libelle ? (
                        <Text style={[styles.duree, { color: colors.textSecondary }]}>
                          · {trajet.duree_libelle}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
                <View style={[styles.routeRow, { borderTopColor: colors.border }]}>
                  <View style={styles.routeCol}>
                    <MapPin size={14} color={colors.primary} />
                    <Text style={[styles.ville, { color: colors.text }]}>{trajet.ville_depart.nom}</Text>
                  </View>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant, marginHorizontal: 6 }} />
                  <View style={[styles.routeCol, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.ville, { color: colors.text }]}>{trajet.ville_arrivee.nom}</Text>
                    <MapPin size={14} color={colors.secondary} />
                  </View>
                </View>
                <View style={[styles.prixRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.prixLabel, { color: colors.textSecondary }]}>
                    Prix par place
                  </Text>
                  <Text style={[styles.prix, { color: colors.text }]}>{formatPrix(trajet.prix)}</Text>
                </View>
              </View>

              <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Nombre de places</Text>
                  <View style={[styles.counter, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TouchableOpacity
                      onPress={() => adjustPlaces(-1)}
                      style={[styles.counterBtn, { backgroundColor: colors.surfaceVariant }]}
                      activeOpacity={0.7}
                      disabled={nombrePlaces <= 1}
                    >
                      <Minus size={16} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                    <Text style={[styles.counterNum, { color: colors.text }]}>{nombrePlaces}</Text>
                    <TouchableOpacity
                      onPress={() => adjustPlaces(1)}
                      style={[styles.counterBtn, { backgroundColor: colors.primary }]}
                      activeOpacity={0.7}
                      disabled={nombrePlaces >= (trajet?.places_restantes || 1)}
                    >
                      <Plus size={16} color={colors.onPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.placesRestantes, { color: colors.textSecondary }]}>
                  {trajet.places_restantes} place{trajet.places_restantes > 1 ? 's' : ''} disponible{trajet.places_restantes > 1 ? 's' : ''} sur ce trajet
                </Text>
              </View>

              <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
                  Informations passagers
                </Text>
                {passagers.map((p, i) => (
                  <View key={i} style={[styles.passagerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.passagerHeader}>
                      <Text style={[styles.passagerNumero, { color: colors.primary }]}>
                        Passager {i + 1}
                      </Text>
                    </View>
                    <View style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <User size={16} color={colors.textSecondary} />
                      <TextInput
                        value={p.nom_complet}
                        onChangeText={(v) => updatePassager(i, 'nom_complet', v)}
                        placeholder="Nom complet"
                        placeholderTextColor={colors.textSecondary}
                        style={[styles.textInput, { color: colors.text }]}
                      />
                    </View>
                    <View style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Phone size={16} color={colors.textSecondary} />
                      <TextInput
                        value={p.telephone}
                        onChangeText={(v) => updatePassager(i, 'telephone', v)}
                        placeholder="Téléphone (ex: +228 90...)"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="phone-pad"
                        style={[styles.textInput, { color: colors.text }]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {trajet && (
        <View style={[styles.footer, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Montant total</Text>
            <Text style={[styles.total, { color: colors.text }]}>{formatPrix(prixTotal)}</Text>
          </View>
          <TouchableOpacity
            onPress={submitReservation}
            disabled={submitting}
            activeOpacity={0.85}
            style={[
              styles.ctaBtn,
              { backgroundColor: colors.primary },
              submitting && { opacity: 0.7 },
            ]}
          >
            <CreditCard size={18} color={colors.onPrimary} />
            <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
              {submitting ? 'Création…' : 'Continuer vers le paiement'}
            </Text>
            <ChevronRight size={18} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      )}
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
    padding: 14,
    gap: 12,
  },
  compagnieRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  compagnieLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compagnieNom: { fontSize: 15, fontWeight: '800' },
  heures: { fontSize: 13, fontWeight: '700' },
  duree: { fontSize: 12, fontWeight: '600' },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  routeCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ville: { fontSize: 13, fontWeight: '700' },
  prixRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  prixLabel: { fontSize: 12, fontWeight: '600' },
  prix: { fontSize: 15, fontWeight: '900' },

  sectionCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 10,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterNum: { fontSize: 16, fontWeight: '900', minWidth: 22, textAlign: 'center' },
  placesRestantes: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  passagerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  passagerHeader: { marginBottom: 2 },
  passagerNumero: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.3 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  textInput: { flex: 1, fontSize: 14, fontWeight: '600', padding: 0 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 11, fontWeight: '600' },
  total: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  ctaText: { fontSize: 14, fontWeight: '800' },
});
