import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { reservations, ReservationRecord } from '../lib/togotransit-api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  ArrowLeft,
  MapPin,
  Bus,
  Calendar,
  Clock,
  Ticket as TicketIcon,
  User,
  Phone,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react-native';

const formatPrix = (n: number) => {
  try {
    return new Intl.NumberFormat('fr-FR').format(n || 0) + ' XOF';
  } catch {
    return `${n || 0} XOF`;
  }
};

const formatDateBillet = (iso?: string) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

export default function TicketDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const reservationId = params.id ? parseInt(params.id, 10) : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [reservation, setReservation] = useState<ReservationRecord | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadReservation = useCallback(async () => {
    if (isNaN(reservationId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await reservations.get(reservationId);
      if (res.success) {
        setReservation(res.data);
      } else {
        setError({ message: 'Réservation introuvable' });
      }
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  React.useEffect(() => {
    loadReservation();
  }, [loadReservation]);

  const annulerReservation = async () => {
    if (!reservation) return;
    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ? Les places seront restituées.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            setCancelLoading(true);
            try {
              const res = await reservations.annuler(reservation.id);
              if (res.success) {
                Alert.alert('Annulée', 'Votre réservation a bien été annulée.');
                loadReservation();
              } else {
                Alert.alert('Erreur', res.message || "Impossible d'annuler.");
              }
            } catch (e: any) {
              Alert.alert('Erreur', e?.message || "Impossible d'annuler.");
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ]
    );
  };

  const trajet = reservation?.trajet;
  const passagers = reservation?.passagers ?? [];
  const statutBg =
    reservation?.statut === 'confirmee'
      ? colors.primaryContainer
      : reservation?.statut === 'annulee'
        ? colors.errorContainer
        : colors.secondaryContainer;
  const statutColor =
    reservation?.statut === 'confirmee'
      ? colors.onPrimaryContainer
      : reservation?.statut === 'annulee'
        ? colors.onErrorContainer
        : colors.onSecondaryContainer;
  const statutLabel =
    reservation?.statut === 'confirmee'
      ? 'Confirmée'
      : reservation?.statut === 'annulee'
        ? 'Annulée'
        : 'En attente';
  const StatutIcon =
    reservation?.statut === 'confirmee'
      ? CheckCircle2
      : reservation?.statut === 'annulee'
        ? XCircle
        : Clock;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Détail réservation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingState label="Chargement de la réservation…" />
        ) : error ? (
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <ErrorState
              code={error?.code}
              description={error?.message}
              onRetry={loadReservation}
              variant={error?.code === 'NETWORK_ERROR' ? 'offline' : 'error'}
            />
          </View>
        ) : !reservation ? (
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <ErrorState
              title="Réservation introuvable"
              description="Retournez sur Mes réservations."
              onRetry={() => router.replace('/(tabs)/tickets')}
              retryLabel="Mes réservations"
            />
          </View>
        ) : (
          <View style={{ padding: 16, gap: 14 }}>
            <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <TicketIcon size={18} color={colors.primary} />
                  <Text style={[styles.resId, { color: colors.text }]}>#{reservation.id}</Text>
                </View>
                <View style={[styles.statutBadge, { backgroundColor: statutBg }]}>
                  <StatutIcon size={14} color={statutColor} />
                  <Text style={[styles.statutBadgeText, { color: statutColor, marginLeft: 6 }]}>
                    {statutLabel}
                  </Text>
                </View>
              </View>
            </View>

            {trajet ? (
              <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.picto, { backgroundColor: colors.primaryContainer }]}>
                    <Bus size={18} color={colors.onPrimaryContainer} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.compagnieNom, { color: colors.text }]}>
                      {trajet.compagnie?.nom || 'Compagnie'}
                    </Text>
                    <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                      {formatDateBillet(trajet.date_depart)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.trajetBox, { borderTopColor: colors.border }]}>
                  <View style={{ alignItems: 'center' }}>
                    <MapPin size={14} color={colors.primary} />
                    <View style={[styles.trait, { backgroundColor: colors.outlineVariant }]} />
                    <MapPin size={14} color={colors.secondary} />
                  </View>
                  <View style={{ flex: 1, paddingLeft: 10, gap: 16 }}>
                    <View>
                      <Text style={[styles.villeNom, { color: colors.text }]}>
                        {trajet.ville_depart?.nom ?? ''}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Clock size={11} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                          {trajet.heure_depart || '—'}
                        </Text>
                      </View>
                    </View>
                    <View>
                      <Text style={[styles.villeNom, { color: colors.text }]}>
                        {trajet.ville_arrivee?.nom ?? ''}
                      </Text>
                      <Text style={[styles.metaText, { color: colors.textSecondary, marginTop: 2 }]}>
                        {trajet.duree_libelle ? `Durée ${trajet.duree_libelle}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Passager{passagers.length > 1 ? 's' : ''}
              </Text>
              {passagers.map((p, i) => (
                <View key={i} style={styles.row}>
                  <View style={[styles.avatar, { backgroundColor: colors.surfaceVariant }]}>
                    <User size={14} color={colors.onSurfaceVariant} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.nomPassager, { color: colors.text }]}>
                      {p.nom_complet}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Phone size={11} color={colors.textSecondary} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {p.telephone}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Montant & paiement</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {reservation.nombre_places} place{reservation.nombre_places > 1 ? 's' : ''}
                </Text>
                <Text style={[styles.summaryVal, { color: colors.text }]}>
                  {formatPrix(reservation.montant_total)}
                </Text>
              </View>
              <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.text, fontWeight: '800' }]}>Total</Text>
                <Text style={[styles.total, { color: colors.text }]}>
                  {formatPrix(reservation.montant_total)}
                </Text>
              </View>

              {reservation.paiements && reservation.paiements.length > 0 ? (
                reservation.paiements.map((p) => (
                  <View key={p.id} style={[styles.paymentRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <CreditCard size={14} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.paiementMethode, { color: colors.text }]}>
                        {String(p.methode).toUpperCase()}
                      </Text>
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                        {p.statut} {p.reference_transaction ? `· ${p.reference_transaction}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.summaryVal, { color: colors.text }]}>
                      {formatPrix(p.montant)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <AlertTriangle size={14} color={colors.warning} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    Aucun paiement encore enregistré
                  </Text>
                </View>
              )}
            </View>

            {reservation.billets && reservation.billets.length > 0 ? (
              <View style={{ flexDirection: 'column', gap: 8 }}>
                {reservation.billets.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() =>
                      router.push({ pathname: '/ticket', params: { billet_id: String(b.id) } })
                    }
                    activeOpacity={0.8}
                    style={[styles.billetRow, { backgroundColor: colors.primaryContainer, borderColor: colors.primary }]}
                  >
                    <TicketIcon size={18} color={colors.onPrimaryContainer} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.billetRowTitle, { color: colors.onPrimaryContainer }]}>
                        Voir le billet {b.numero_billet}
                      </Text>
                      <Text style={[styles.billetRowStatus, { color: colors.onPrimaryContainer }]}>
                        Statut : {b.statut}
                      </Text>
                    </View>
                    <ChevronRight size={18} color={colors.onPrimaryContainer} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {reservation.statut !== 'annulee' ? (
              <View style={{ flexDirection: 'column', gap: 8, marginTop: 6 }}>
                {reservation.statut === 'en_attente' &&
                  (!reservation.paiements || reservation.paiements.length === 0 ||
                    reservation.paiements.every((p) => p.statut === 'echoue')) ? (
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/payment',
                        params: { reservation_id: String(reservation.id) },
                      })
                    }
                    activeOpacity={0.85}
                    style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
                  >
                    <CreditCard size={18} color={colors.onPrimary} />
                    <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
                      Payer maintenant
                    </Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  onPress={annulerReservation}
                  disabled={cancelLoading}
                  activeOpacity={0.8}
                  style={[
                    styles.cancelBtn,
                    {
                      backgroundColor: colors.errorContainer + '20',
                      borderColor: colors.errorContainer,
                    },
                    cancelLoading && { opacity: 0.6 },
                  ]}
                >
                  <XCircle size={18} color={colors.error} />
                  <Text style={[styles.cancelText, { color: colors.error }]}>
                    {cancelLoading ? 'Annulation…' : 'Annuler la réservation'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800' },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  resId: { fontSize: 14, fontWeight: '900' },
  statutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statutBadgeText: { fontSize: 11, fontWeight: '800' },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800' },
  picto: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compagnieNom: { fontSize: 15, fontWeight: '800' },
  dateLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  trajetBox: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingTop: 14,
    marginTop: 2,
    borderTopWidth: 1,
    gap: 8,
  },
  trait: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    marginLeft: 6,
  },
  villeNom: { fontSize: 15, fontWeight: '800' },
  metaText: { fontSize: 12, fontWeight: '500' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nomPassager: { fontSize: 14, fontWeight: '700' },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 0,
  },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryVal: { fontSize: 14, fontWeight: '700' },
  total: { fontSize: 17, fontWeight: '900' },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  paiementMethode: { fontSize: 13, fontWeight: '800' },

  billetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  billetRowTitle: { fontSize: 14, fontWeight: '800' },
  billetRowStatus: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 16,
  },
  ctaText: { fontSize: 15, fontWeight: '800' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cancelText: { fontSize: 14, fontWeight: '800' },
});
