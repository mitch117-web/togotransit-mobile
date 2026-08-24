import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Pressable,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Bus,
  Star,
  Users as UsersIcon,
  Plus,
  Minus,
  AlertTriangle,
  Phone,
  ShieldCheck,
  MessageSquare,
  CalendarDays,
  Car,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react-native';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { trajetDetails, TrajetDetail as TrajetDetailType } from '../lib/togotransit-api';

const formatPrix = (p: number, devise: string = 'XOF') => {
  try {
    return new Intl.NumberFormat('fr-FR').format(Number(p) || 0) + ` ${devise}`;
  } catch {
    return `${Number(p) || 0} ${devise}`;
  }
};

const initialsLogo = (nom: string) =>
  nom.split(/[\s\-]+/).slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const formatLongDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

export default function TrajetDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const trajetId = params.id ? (isNaN(parseInt(params.id, 10)) ? null : parseInt(params.id, 10)) : null;

  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'empty'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [trajet, setTrajet] = useState<TrajetDetailType | null>(null);
  const [nbPlaces, setNbPlaces] = useState(1);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    if (!trajetId) {
      setState('error');
      setErrorMsg('Trajet invalide');
      return;
    }
    let mounted = true;
    (async () => {
      try {
        setState('loading');
        const d = await trajetDetails.get(trajetId);
        if (!mounted) return;
        if (!d || !d.id) {
          setState('empty');
        } else {
          setTrajet(d);
          setNbPlaces(Math.min(1, Math.max(1, d.places_restantes ?? 1)));
          setState('idle');
        }
      } catch (err: any) {
        if (!mounted) return;
        setState('error');
        setErrorMsg(err?.response?.data?.error || err?.message || 'Erreur chargement');
      }
    })();
    return () => { mounted = false; };
  }, [trajetId, retryNonce]);

  const prixTotal = useMemo(
    () => (trajet ? trajet.prix * nbPlaces : 0),
    [trajet, nbPlaces]
  );

  const maxPlaces = trajet ? Math.max(1, Math.min(9, trajet.places_restantes ?? 1)) : 1;
  const estComplet = trajet ? (trajet.places_restantes ?? 0) <= 0 : false;
  const estBientotComplet = trajet ? (trajet.places_restantes ?? 0) > 0 && (trajet.places_restantes ?? 0) <= 5 : false;
  const estDispo = !estComplet && trajet?.statut === 'planifie';

  if (state === 'loading') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.headerBar, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Détail du trajet</Text>
          <View style={{ width: 22 }} />
        </View>
        <LoadingState label="Chargement du trajet..." />
      </SafeAreaView>
    );
  }

  if (state === 'error') {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.headerBar, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Détail du trajet</Text>
          <View style={{ width: 22 }} />
        </View>
        <ErrorState
          title="Impossible de charger le trajet"
          description={errorMsg}
          onRetry={() => setRetryNonce(n => n + 1)}
        />
      </SafeAreaView>
    );
  }

  if (state === 'empty' || !trajet) {
    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={[styles.headerBar, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Trajet</Text>
          <View style={{ width: 22 }} />
        </View>
        <EmptyState
          icon={<AlertTriangle size={42} color={colors.onSurfaceVariant} />}
          title="Trajet non disponible"
          description="Ce trajet n'existe pas ou n'est plus accessible à la réservation."
          actionLabel="Retour aux résultats"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const canGoReserve = estDispo && nbPlaces > 0 && nbPlaces <= maxPlaces;

  const goReservation = () => {
    if (!canGoReserve || !trajetId) return;
    router.push({
      pathname: '/reservation',
      params: {
        trajet_id: String(trajetId),
        nb_places: String(nbPlaces),
      },
    });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.headerBar, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {trajet.ville_depart?.nom} → {trajet.ville_arrivee?.nom}
        </Text>
        <Pressable
          onPress={async () => {
            try {
              const msg = `TogoTransit - ${trajet.ville_depart?.nom} → ${trajet.ville_arrivee?.nom} le ${formatLongDate(trajet.date_depart)} à ${trajet.heure_depart} — ${formatPrix(trajet.prix)}`;
              await Share.share({ message: msg, title: 'Trajet TogoTransit' });
            } catch {}
          }}
          hitSlop={12}
        >
          <ChevronRight size={22} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 180 }}>
        {/* Compagnie card */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
          <View style={styles.compagnieRow}>
            {trajet.compagnie?.logo_url ? (
              <Image source={{ uri: trajet.compagnie.logo_url }} style={styles.compLogo} />
            ) : (
              <View style={[styles.compInit, { backgroundColor: colors.primaryContainer }]}>
                <Text style={[styles.compInitText, { color: colors.onPrimaryContainer }]}>
                  {initialsLogo(trajet.compagnie?.nom || 'TC')}
                </Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.compNom, { color: colors.text }]} numberOfLines={1}>
                {trajet.compagnie?.nom || 'Compagnie de transport'}
              </Text>
              <View style={styles.ratingRow}>
                {trajet.note_moyenne ? (
                  <>
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                      {Number(trajet.note_moyenne).toFixed(1)} · {trajet.avis_count ?? 0} avis
                    </Text>
                  </>
                ) : (
                  <Text style={[styles.ratingText, { color: colors.textSecondary }]}>Pas d'avis pour le moment</Text>
                )}
              </View>
            </View>
            {trajet.compagnie?.telephone ? (
              <TouchableOpacity
                style={[styles.phoneBtn, { backgroundColor: colors.secondaryContainer }]}
                hitSlop={10}
              >
                <Phone size={18} color={colors.onSecondaryContainer} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Itinéraire & heure */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
          <View style={styles.routeContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
              <View style={styles.routeDots}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                <View style={[styles.dash, { backgroundColor: colors.outlineVariant }]} />
                <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
              </View>
              <View style={{ flex: 1, gap: 16 }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.heure, { color: colors.text }]}>{trajet.heure_depart}</Text>
                    <Text style={[styles.statutBadge, { backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer }]}>
                      Départ
                    </Text>
                  </View>
                  <Text style={[styles.villeNom, { color: colors.text }]}>{trajet.ville_depart?.nom}</Text>
                  {trajet.ville_depart?.region ? (
                    <Text style={[styles.region, { color: colors.textSecondary }]}>{trajet.ville_depart.region}</Text>
                  ) : null}
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.heure, { color: colors.text }]}>
                      {trajet.date_arrivee_estimee
                        ? (() => {
                            const d = new Date(trajet.date_arrivee_estimee);
                            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                          })()
                        : '—'}
                    </Text>
                    <Text style={[styles.statutBadge, { backgroundColor: colors.tertiaryContainer, color: colors.onTertiaryContainer }]}>
                      Arrivée estimée
                    </Text>
                  </View>
                  <Text style={[styles.villeNom, { color: colors.text }]}>{trajet.ville_arrivee?.nom}</Text>
                  {trajet.ville_arrivee?.region ? (
                    <Text style={[styles.region, { color: colors.textSecondary }]}>{trajet.ville_arrivee.region}</Text>
                  ) : null}
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

            <View style={styles.metaInfo}>
              <View style={styles.metaItem}>
                <CalendarDays size={16} color={colors.onSurfaceVariant} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {formatLongDate(trajet.date_depart)}
                </Text>
              </View>
              {trajet.duree_libelle ? (
                <View style={styles.metaItem}>
                  <Clock size={16} color={colors.onSurfaceVariant} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>Durée {trajet.duree_libelle}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Véhicule + places */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Véhicule & disponibilité</Text>

          {trajet.vehicule ? (
            <View style={styles.vehiculeRow}>
              <View style={[styles.vehiculeIconBox, { backgroundColor: colors.primaryContainer }]}>
                {trajet.vehicule.type?.toLowerCase().includes('mini') ? (
                  <Car size={20} color={colors.onPrimaryContainer} />
                ) : (
                  <Bus size={20} color={colors.onPrimaryContainer} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.vehiculeNom, { color: colors.text }]} numberOfLines={1}>
                  {trajet.vehicule.type || 'Véhicule'}
                </Text>
                {trajet.vehicule.immatriculation ? (
                  <Text style={[styles.vehiculeImmat, { color: colors.textSecondary }]}>
                    Immatriculation · {trajet.vehicule.immatriculation}
                  </Text>
                ) : null}
                <Text style={[styles.vehiculeCap, { color: colors.textSecondary }]}>
                  {trajet.places_disponibles_total ?? trajet.vehicule.nombre_places ?? 0} places au total
                </Text>
              </View>
            </View>
          ) : null}

          {trajet.chauffeur ? (
            <View style={[styles.chauffeurRow, { backgroundColor: colors.surfaceContainerLow }]}>
              <View style={[styles.chauffeurIconBox, { backgroundColor: colors.tertiaryContainer }]}>
                <UserIcon size={18} color={colors.onTertiaryContainer} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.chauffeurLabel, { color: colors.textSecondary }]}>Chauffeur</Text>
                <Text style={[styles.chauffeurNom, { color: colors.text }]}>{trajet.chauffeur.nom}</Text>
              </View>
              {trajet.chauffeur.telephone ? (
                <TouchableOpacity style={[styles.smallPhone, { backgroundColor: colors.secondaryContainer }]} hitSlop={8}>
                  <Phone size={15} color={colors.onSecondaryContainer} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={[styles.placesRow, { backgroundColor: estComplet ? colors.errorContainer : estBientotComplet ? colors.warning + '20' : colors.secondaryContainer }]}>
            <UsersIcon size={18} color={estComplet ? colors.error : estBientotComplet ? '#78350f' : colors.onSecondaryContainer} />
            <Text
              style={[
                styles.placesText,
                { color: estComplet ? colors.onErrorContainer : estBientotComplet ? '#78350f' : colors.onSecondaryContainer },
              ]}
            >
              {estComplet
                ? 'Trajet complet'
                : `${trajet.places_restantes} place${trajet.places_restantes! > 1 ? 's' : ''} disponible${trajet.places_restantes! > 1 ? 's' : ''}`}
            </Text>
          </View>
        </View>

        {/* Avis */}
        {trajet.avis && trajet.avis.length > 0 ? (
          <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Avis récents</Text>
              <Text style={[styles.voirTout, { color: colors.primary }]}>Tous ({trajet.avis_count ?? trajet.avis.length})</Text>
            </View>
            <View style={{ marginTop: 12, gap: 12 }}>
              {trajet.avis.slice(0, 3).map((a: any) => (
                <View key={a.id} style={[styles.avisItem, { backgroundColor: colors.surfaceContainerLow }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.avisUser, { color: colors.text }]}>
                      {a.utilisateur?.prenom || a.utilisateur?.nom ? `${a.utilisateur?.prenom ?? ''} ${a.utilisateur?.nom ?? ''}`.trim() : 'Voyageur'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Star size={12} color="#f59e0b" fill="#f59e0b" />
                      <Text style={[styles.avisNote, { color: colors.text }]}>{Number(a.note).toFixed(1)}</Text>
                    </View>
                  </View>
                  {a.commentaire ? (
                    <Text style={[styles.avisCommentaire, { color: colors.textSecondary }]} numberOfLines={3}>
                      {a.commentaire}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={[styles.sectionCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border, opacity: 0.85 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.avisEmptyIcon, { backgroundColor: colors.tertiaryContainer }]}>
                <MessageSquare size={18} color={colors.onTertiaryContainer} />
              </View>
              <Text style={[styles.avisEmpty, { color: colors.textSecondary }]}>
                Aucun avis pour ce trajet — soyez le premier à laisser un retour après votre voyage !
              </Text>
            </View>
          </View>
        )}

        {/* Garantie */}
        <View style={{ marginTop: 8, marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', gap: 10 }}>
          <View style={[styles.garantieChip, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <ShieldCheck size={14} color={colors.primary} />
            <Text style={[styles.garantieText, { color: colors.textSecondary }]}>Paiement sécurisé</Text>
          </View>
          <View style={[styles.garantieChip, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border }]}>
            <Bus size={14} color={colors.primary} />
            <Text style={[styles.garantieText, { color: colors.textSecondary }]}>Véhicule vérifié</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar: nombre places + bouton réserver */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.nbPlacesLabel, { color: colors.textSecondary }]}>Nombre de places</Text>
          <View style={styles.nbPlacesControl}>
            <TouchableOpacity
              disabled={nbPlaces <= 1}
              style={[styles.placeBtn, { backgroundColor: colors.surfaceContainerHigh, opacity: nbPlaces <= 1 ? 0.45 : 1 }]}
              onPress={() => setNbPlaces(n => Math.max(1, n - 1))}
              hitSlop={8}
            >
              <Minus size={18} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.nbPlacesValue, { color: colors.text }]}>{nbPlaces}</Text>
            <TouchableOpacity
              disabled={nbPlaces >= maxPlaces || !estDispo}
              style={[styles.placeBtn, { backgroundColor: colors.surfaceContainerHigh, opacity: (nbPlaces >= maxPlaces || !estDispo) ? 0.45 : 1 }]}
              onPress={() => setNbPlaces(n => Math.min(maxPlaces, n + 1))}
              hitSlop={8}
            >
              <Plus size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 2, paddingLeft: 12 }}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total ({nbPlaces} place{nbPlaces > 1 ? 's' : ''})</Text>
          <Text style={[styles.totalPrix, { color: colors.text }]}>{formatPrix(prixTotal, trajet.devise)}</Text>
        </View>

        <TouchableOpacity
          disabled={!canGoReserve}
          onPress={goReservation}
          style={[
            styles.ctaBtn,
            { backgroundColor: canGoReserve ? colors.primary : colors.surfaceContainerHigh },
            Platform.OS === 'ios' && !canGoReserve ? { opacity: 0.55 } : null,
          ]}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, { color: canGoReserve ? colors.onPrimary : colors.onSurfaceVariant }]}>
            {estComplet ? 'Complet' : !estDispo ? 'Indisponible' : 'Réserver'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'transparent',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.1, flex: 1, textAlign: 'center' },

  sectionCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  compagnieRow: { flexDirection: 'row', alignItems: 'center' },
  compLogo: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#e5e7eb' },
  compInit: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  compInitText: { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  compNom: { fontSize: 16, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ratingText: { fontSize: 12, fontWeight: '600' },
  phoneBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },

  routeContainer: { gap: 14 },
  routeDots: { width: 16, alignItems: 'center', paddingTop: 4, gap: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dash: { width: 2, height: 48, borderRadius: 2, marginVertical: 4 },
  heure: { fontSize: 20, fontWeight: '900', letterSpacing: 0.2 },
  statutBadge: {
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  villeNom: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  region: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  divider: { height: 1, width: '100%', marginVertical: 4, borderRadius: 1 },
  metaInfo: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 15, fontWeight: '800', marginBottom: 12 },
  vehiculeRow: { flexDirection: 'row', alignItems: 'center' },
  vehiculeIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  vehiculeNom: { fontSize: 14, fontWeight: '800' },
  vehiculeImmat: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  vehiculeCap: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  chauffeurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  chauffeurIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chauffeurLabel: { fontSize: 11, fontWeight: '600' },
  chauffeurNom: { fontSize: 13, fontWeight: '800', marginTop: 1 },
  smallPhone: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  placesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  placesText: { fontSize: 13, fontWeight: '800' },

  voirTout: { fontSize: 12, fontWeight: '800' },
  avisItem: { padding: 12, borderRadius: 14 },
  avisUser: { fontSize: 13, fontWeight: '800' },
  avisNote: { fontSize: 13, fontWeight: '800' },
  avisCommentaire: { fontSize: 13, fontWeight: '500', marginTop: 6, lineHeight: 18 },
  avisEmptyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avisEmpty: { fontSize: 13, fontWeight: '500', flex: 1, lineHeight: 18 },

  garantieChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  garantieText: { fontSize: 12, fontWeight: '700' },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 22,
    borderTopWidth: 1,
    gap: 10,
  },
  nbPlacesLabel: { fontSize: 11, fontWeight: '700' },
  nbPlacesControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  placeBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  nbPlacesValue: { fontSize: 18, fontWeight: '900', minWidth: 22, textAlign: 'center' },
  totalLabel: { fontSize: 11, fontWeight: '700' },
  totalPrix: { fontSize: 18, fontWeight: '900', letterSpacing: 0.1 },
  ctaBtn: {
    width: 114,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    shadowColor: '#0b1c30',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ctaText: { fontSize: 15, fontWeight: '900', letterSpacing: 0.2 },
});
