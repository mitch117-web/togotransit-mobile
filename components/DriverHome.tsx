import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { Bus, MapPin, Users, Package, ChevronRight, Navigation, Clock } from 'lucide-react-native';
import { MonTrajetConduit } from '../lib/togotransit-api';
import GlassCard from './ui/GlassCard';
import FadeInStagger from './ui/FadeInStagger';

type DriverParcel = {
  id: number;
  trackingId: string;
  status: string;
  receiverName: string;
  receiverPhone: string;
  destination: string;
};

interface DriverHomeProps {
  prenom: string;
  compagnieNom: string | null;
  trajets: MonTrajetConduit[];
  parcels: DriverParcel[];
  refreshing: boolean;
  onRefresh: () => void;
}

const translateStatutTrajet = (statut: string) => {
  switch (statut) {
    case 'planifie': return 'Planifié';
    case 'en_cours': return 'En cours';
    case 'termine': return 'Terminé';
    case 'annule': return 'Annulé';
    default: return statut;
  }
};

const translateStatutColis = (statut: string) => {
  switch (statut) {
    case 'IN_AGENCY': return 'En agence';
    case 'IN_TRANSIT': return 'En transit';
    case 'DELIVERED': return 'Livré';
    default: return statut;
  }
};

export default function DriverHome({ prenom, compagnieNom, trajets, parcels, refreshing, onRefresh }: DriverHomeProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const colisActifs = parcels.filter((p) => p.status !== 'DELIVERED');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={[styles.hello, { color: colors.onPrimary + 'cc' }]}>Bonjour,</Text>
          <Text style={[styles.userName, { color: colors.onPrimary }]}>{prenom} 👋</Text>
          <View style={[styles.chauffeurBadge, { backgroundColor: colors.onPrimary + '18' }]}>
            <Bus size={14} color={colors.onPrimary} />
            <Text style={[styles.chauffeurBadgeText, { color: colors.onPrimary }]}>
              Chauffeur{compagnieNom ? ` — ${compagnieNom}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mon trajet du jour</Text>
          {trajets.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucun trajet ne vous est assigné pour l'instant.
              </Text>
            </View>
          ) : (
            trajets.map((t, i) => (
              <FadeInStagger key={t.id} index={i}>
              <GlassCard
                style={styles.card}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.compagnieNom, { color: colors.primary }]}>{t.compagnie?.nom ?? 'Compagnie'}</Text>
                  <View style={[styles.statutBadge, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={[styles.statutBadgeText, { color: colors.onPrimaryContainer }]}>
                      {translateStatutTrajet(t.statut)}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeRow}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={[styles.routeText, { color: colors.text }]}>{t.ville_depart.nom}</Text>
                  <ChevronRight size={14} color={colors.textSecondary} />
                  <MapPin size={16} color={colors.secondary} />
                  <Text style={[styles.routeText, { color: colors.text }]}>{t.ville_arrivee.nom}</Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {new Date(t.date_depart).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Users size={14} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {t.passagers_a_bord} à bord
                    </Text>
                  </View>
                </View>

                {t.vehicule ? (
                  <Text style={[styles.vehiculeText, { color: colors.textSecondary }]}>
                    {t.vehicule.type} · {t.vehicule.immatriculation}
                  </Text>
                ) : null}
              </GlassCard>
              </FadeInStagger>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Ma tournée de livraison</Text>
            {colisActifs.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: colors.secondaryContainer }]}>
                <Text style={[styles.countBadgeText, { color: colors.onSecondaryContainer }]}>{colisActifs.length}</Text>
              </View>
            )}
          </View>

          {colisActifs.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Aucun colis à livrer pour l'instant.
              </Text>
            </View>
          ) : (
            colisActifs.map((p, i) => (
              <FadeInStagger key={p.id} index={i}>
              <GlassCard
                style={styles.card}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Package size={16} color={colors.secondary} />
                    <Text style={[styles.compagnieNom, { color: colors.text }]}>{p.trackingId}</Text>
                  </View>
                  <View style={[styles.statutBadge, { backgroundColor: colors.secondaryContainer }]}>
                    <Text style={[styles.statutBadgeText, { color: colors.onSecondaryContainer }]}>
                      {translateStatutColis(p.status)}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.metaText, { color: colors.textSecondary, marginTop: 6 }]}>
                  Pour {p.receiverName} · {p.destination}
                </Text>

                <View style={styles.cardActionsRow}>
                  {p.status === 'IN_TRANSIT' && (
                    <TouchableOpacity
                      style={[styles.secondaryBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                      onPress={() => router.push(`/live-tracking?parcelId=${p.id}`)}
                    >
                      <Navigation size={16} color={colors.primary} />
                      <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>Position</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      const qp = new URLSearchParams({
                        parcelId: String(p.id),
                        trackingId: p.trackingId ?? '',
                        destination: p.destination ?? '',
                        receiverName: p.receiverName ?? '',
                      });
                      router.push(`/delivery-confirmation?${qp.toString()}`);
                    }}
                  >
                    <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>Confirmer la livraison</Text>
                    <ChevronRight size={16} color={colors.onPrimary} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
              </FadeInStagger>
            ))
          )}

          {parcels.length > colisActifs.length && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/parcels')} style={styles.voirTout}>
              <Text style={[styles.voirToutText, { color: colors.primary }]}>
                Voir tout l'historique des livraisons
              </Text>
              <ChevronRight size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 6 },
  hello: { fontSize: 13, fontWeight: '600' },
  userName: { fontSize: 20, fontWeight: '800' },
  chauffeurBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
  },
  chauffeurBadgeText: { fontSize: 12, fontWeight: '700' },
  section: { marginTop: 20, paddingHorizontal: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 12 },
  countBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginBottom: 12 },
  countBadgeText: { fontSize: 12, fontWeight: '800' },
  emptyCard: { borderRadius: 18, borderWidth: 1, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center' },
  card: { borderRadius: 20, padding: 16, marginBottom: 14 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  compagnieNom: { fontSize: 15, fontWeight: '800' },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statutBadgeText: { fontSize: 11, fontWeight: '800' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  routeText: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 12 },
  metaRow: { flexDirection: 'row', gap: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '600' },
  vehiculeText: { fontSize: 12, marginTop: 8 },
  cardActionsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 14 },
  primaryBtnText: { fontSize: 13, fontWeight: '800' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, paddingHorizontal: 14, borderRadius: 14 },
  secondaryBtnText: { fontSize: 13, fontWeight: '700' },
  voirTout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  voirToutText: { fontSize: 13, fontWeight: '700' },
});
