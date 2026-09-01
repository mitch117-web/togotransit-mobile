import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../lib/theme';
import { Clock, MapPin, Bus, ChevronRight, Star, Users as UsersIcon } from 'lucide-react-native';
import GlassCard from './ui/GlassCard';

export interface Trajet {
  id: number;
  compagnie?: {
    id: number;
    nom: string;
    logo_url?: string | null;
    note_moyenne?: number | null;
    avis_count?: number;
    telephone?: string;
  } | null;
  ville_depart: { id?: number; nom: string; region?: string | null };
  ville_arrivee: { id?: number; nom: string; region?: string | null };
  heure_depart: string;
  date_depart: string;
  date_arrivee_estimee?: string | null;
  duree_libelle?: string | null;
  duree_minutes?: number | null;
  prix: number;
  devise?: string;
  vehicule?: {
    id: number;
    type?: string | null;
    immatriculation?: string;
    nombre_places?: number;
  } | null;
  places_restantes: number;
  places_disponibles_total?: number;
  statut?: string;
  comporte_plan_sieges?: boolean;
}

interface Props {
  trajet: Trajet;
  onPress?: () => void;
  compact?: boolean;
}

const formatPrix = (p: number, devise: string = 'XOF') => {
  try {
    return new Intl.NumberFormat('fr-FR').format(Number(p) || 0) + ` ${devise}`;
  } catch {
    return `${Number(p) || 0} ${devise}`;
  }
};

const initialsLogo = (nom: string) => {
  return nom
    .split(/[\s\-]+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const TrajetCard: React.FC<Props> = ({ trajet, onPress, compact }) => {
  const { colors } = useTheme();
  const compagnie = trajet.compagnie;
  const isLowStock = trajet.places_restantes <= 5 && trajet.places_restantes > 0;
  const isSoldOut = trajet.places_restantes <= 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isSoldOut || !onPress}
      style={[isSoldOut && { opacity: 0.65 }]}
    >
    <GlassCard
      style={[styles.card, compact && styles.cardCompact]}
      borderRadius={compact ? 16 : 20}
    >
      <View style={styles.header}>
        <View style={[styles.compagnieRow]}>
          {compagnie?.logo_url ? (
            <Image
              source={{ uri: compagnie.logo_url }}
              style={[styles.logo, { backgroundColor: colors.surfaceVariant }]}
            />
          ) : (
            <View style={[styles.initials, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.initialsText, { color: colors.onPrimaryContainer }]}>
                {initialsLogo(compagnie?.nom || 'TC')}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.compagnieNom, { color: colors.text }]} numberOfLines={1}>
              {compagnie?.nom || 'Compagnie'}
            </Text>
            {compagnie?.note_moyenne ? (
              <View style={styles.ratingRow}>
                <Star size={12} color="#f59e0b" fill="#f59e0b" />
                <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                  {Number(compagnie.note_moyenne).toFixed(1)}{' '}
                  <Text style={{ fontWeight: '500' }}>
                    ({compagnie.avis_count ?? 0} avis)
                  </Text>
                </Text>
              </View>
            ) : (
              <View style={{ height: 2 }} />
            )}
          </View>
          <View style={[styles.prixBox, { backgroundColor: colors.primaryContainer }]}>
            <Text style={[styles.prix, { color: colors.onPrimaryContainer }]}>
              {formatPrix(trajet.prix, trajet.devise)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.routeRow}>
        <View style={styles.villeCol}>
          <View style={[styles.timeDot, { backgroundColor: colors.primary }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.heure, { color: colors.text }]}>{trajet.heure_depart}</Text>
            <Text style={[styles.ville, { color: colors.text }]} numberOfLines={1}>
              {trajet.ville_depart.nom}
            </Text>
            {trajet.ville_depart.region ? (
              <Text style={[styles.region, { color: colors.textSecondary }]}>
                {trajet.ville_depart.region}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.trajetMiddle}>
          {trajet.duree_libelle ? (
            <View style={[styles.dureeChip, { backgroundColor: colors.surfaceVariant }]}>
              <Clock size={12} color={colors.onSurfaceVariant} />
              <Text style={[styles.duree, { color: colors.onSurfaceVariant }]}>
                {trajet.duree_libelle}
              </Text>
            </View>
          ) : null}
          <View style={[styles.rail, { backgroundColor: colors.outlineVariant }]}>
            <Bus size={12} color={colors.primary} />
          </View>
        </View>

        <View style={[styles.villeCol, { alignItems: 'flex-end' }]}>
          <View style={[styles.timeDot, { backgroundColor: colors.secondary }]} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={[styles.heure, { color: colors.text }]}>
              {trajet.date_arrivee_estimee
                ? (() => {
                    const d = new Date(trajet.date_arrivee_estimee);
                    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                  })()
                : '—'}
            </Text>
            <Text style={[styles.ville, { color: colors.text }]} numberOfLines={1}>
              {trajet.ville_arrivee.nom}
            </Text>
            {trajet.ville_arrivee.region ? (
              <Text style={[styles.region, { color: colors.textSecondary }]}>
                {trajet.ville_arrivee.region}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {!compact ? (
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={[styles.placesBadge, {
              backgroundColor: isSoldOut ? colors.errorContainer : isLowStock ? colors.warning + '20' : colors.secondaryContainer,
            }]}>
              <UsersIcon size={13} color={isSoldOut ? colors.error : isLowStock ? colors.warning : colors.secondary} />
              <Text style={[styles.placesText, {
                color: isSoldOut ? colors.onErrorContainer : isLowStock ? '#78350f' : colors.onSecondaryContainer,
              }]}>
                {isSoldOut ? 'Complet' : `${trajet.places_restantes} place${trajet.places_restantes > 1 ? 's' : ''} restante${trajet.places_restantes > 1 ? 's' : ''}`}
              </Text>
            </View>
            {trajet.vehicule?.type ? (
              <Text style={[styles.vehiculeType, { color: colors.textSecondary }]}>
                · {trajet.vehicule.type}
              </Text>
            ) : null}
          </View>
          <View style={styles.footerRight}>
            <Text style={[styles.cta, { color: colors.primary }]}>
              {isSoldOut ? 'Indisponible' : 'Réserver'}
            </Text>
            {!isSoldOut ? <ChevronRight size={16} color={colors.primary} /> : null}
          </View>
        </View>
      ) : null}
    </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    padding: 14,
    gap: 12,
    shadowColor: '#0b1c30',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  cardCompact: {
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 0,
    marginVertical: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  compagnieRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 12, resizeMode: 'cover' },
  initials: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  initialsText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  compagnieNom: { fontWeight: '800', fontSize: 15, letterSpacing: -0.1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText: { fontSize: 12, fontWeight: '600' },
  prixBox: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
  },
  prix: { fontSize: 15, fontWeight: '900', letterSpacing: -0.2 },

  routeRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  villeCol: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  timeDot: {
    width: 10, height: 10, borderRadius: 5, marginTop: 5,
  },
  heure: { fontSize: 18, fontWeight: '900', letterSpacing: 0.2, lineHeight: 22 },
  ville: { fontSize: 14, fontWeight: '700', marginTop: 2, lineHeight: 18 },
  region: { fontSize: 12, fontWeight: '500', marginTop: 1 },

  trajetMiddle: { width: 86, alignItems: 'center', justifyContent: 'center', paddingTop: 6 },
  rail: {
    width: '100%',
    height: 2, marginTop: 10, marginBottom: 8,
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dureeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  duree: { fontSize: 11, fontWeight: '700' },

  footer: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
    justifyContent: 'space-between',
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  placesBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
  },
  placesText: { fontSize: 12, fontWeight: '800' },
  vehiculeType: { fontSize: 12, fontWeight: '600' },
  cta: { fontSize: 14, fontWeight: '800' },
});

export default TrajetCard;
