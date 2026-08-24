import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Pressable,
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import {
  ArrowLeft,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  MapPin,
  Calendar,
  Filter as FilterIcon,
  ChevronDown,
  Check,
  X,
} from 'lucide-react-native';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import TrajetCard, { Trajet } from '../components/TrajetCard';
import { trajets, TrajetResult } from '../lib/togotransit-api';

type SortKey = 'heure_depart' | 'prix' | 'duree';

const formatDateLabel = (iso?: string) => {
  if (!iso) return "Aujourd'hui";
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
};
const formatPrix = (n: number, d = 'XOF') => {
  try { return new Intl.NumberFormat('fr-FR').format(Number(n) || 0) + ' ' + d; } catch { return `${n} ${d}`; }
};

export default function SearchResultsScreen() {
  const params = useLocalSearchParams<{
    depart?: string;
    arrivee?: string;
    date?: string;
  }>();
  const router = useRouter();
  const { colors } = useTheme();

  const depart = params.depart ?? '';
  const arrivee = params.arrivee ?? '';
  const date = params.date ?? undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [results, setResults] = useState<TrajetResult[]>([]);
  const [meta, setMeta] = useState<any>({});

  const [sortKey, setSortKey] = useState<SortKey>('heure_depart');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [prixMin, setPrixMin] = useState<string>('');
  const [prixMax, setPrixMax] = useState<string>('');
  const [heureDebut, setHeureDebut] = useState<string>('');
  const [heureFin, setHeureFin] = useState<string>('');
  const [exclureComplets, setExclureComplets] = useState(true);

  const compagnies = useMemo(() => {
    const map = new Map<number, { id: number; nom: string; logo_url?: string | null }>();
    results.forEach((t) => {
      if (t.compagnie?.id && !map.has(t.compagnie.id)) map.set(t.compagnie.id, t.compagnie as any);
    });
    return Array.from(map.values());
  }, [results]);
  const [compagniesSelectionnees, setCompagniesSelectionnees] = useState<Set<number>>(new Set());
  const toggleCompagnie = (id: number) => {
    setCompagniesSelectionnees((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await trajets.search({
        depart,
        arrivee,
        date,
        sort_by: sortKey,
        sort_dir: sortDir,
      });
      setResults(r.data);
      setMeta(r.meta ?? {});
      setCompagniesSelectionnees(new Set());
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [depart, arrivee, date, sortKey, sortDir]);

  React.useEffect(() => {
    loadResults();
  }, [loadResults]);

  const resultsAffiches = useMemo(() => {
    return results.filter((t) => {
      if (exclureComplets && t.places_restantes <= 0) return false;
      const pMin = prixMin ? parseFloat(prixMin) : NaN;
      const pMax = prixMax ? parseFloat(prixMax) : NaN;
      if (!isNaN(pMin) && t.prix < pMin) return false;
      if (!isNaN(pMax) && t.prix > pMax) return false;
      if (heureDebut || heureFin) {
        const [h, m] = (t.heure_depart || '00:00').split(':').map(Number);
        const minutes = (h || 0) * 60 + (m || 0);
        if (heureDebut) {
          const [hd, md] = heureDebut.split(':').map(Number);
          if (minutes < (hd || 0) * 60 + (md || 0)) return false;
        }
        if (heureFin) {
          const [hf, mf] = heureFin.split(':').map(Number);
          if (minutes > (hf || 0) * 60 + (mf || 0)) return false;
        }
      }
      if (compagniesSelectionnees.size > 0) {
        if (!t.compagnie?.id || !compagniesSelectionnees.has(t.compagnie.id)) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (sortKey) {
        case 'prix': {
          return sortDir === 'asc' ? a.prix - b.prix : b.prix - a.prix;
        }
        case 'duree': {
          const da = a.duree_minutes ?? 0;
          const db = b.duree_minutes ?? 0;
          return sortDir === 'asc' ? da - db : db - da;
        }
        case 'heure_depart':
        default: {
          const ta = new Date(a.heure_depart_iso).getTime();
          const tb = new Date(b.heure_depart_iso).getTime();
          return sortDir === 'asc' ? ta - tb : tb - ta;
        }
      }
    });
  }, [results, prixMin, prixMax, heureDebut, heureFin, exclureComplets, compagniesSelectionnees, sortKey, sortDir]);

  const openTrajet = (t: TrajetResult) => {
    const qp = new URLSearchParams();
    qp.set('id', String(t.id));
    router.push(`/trajet-detail?${qp.toString()}`);
  };

  const triLabel = {
    heure_depart: 'Heure de départ',
    prix: 'Prix',
    duree: 'Durée',
  }[sortKey];

  const nbFiltresActifs =
    (prixMin ? 1 : 0) + (prixMax ? 1 : 0) + (heureDebut ? 1 : 0) + (heureFin ? 1 : 0) +
    compagniesSelectionnees.size + (exclureComplets ? 1 : 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.topBar, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={18} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.itineraire, { color: colors.text }]} numberOfLines={1}>
                {depart || '…'} → {arrivee || '…'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <Calendar size={12} color={colors.textSecondary} />
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                {formatDateLabel(date)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.toolbar, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => setShowFilters(true)}
          style={[styles.toolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <SlidersHorizontal size={16} color={colors.text} />
          <Text style={[styles.toolBtnText, { color: colors.text }]}>Filtres</Text>
          {nbFiltresActifs > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{nbFiltresActifs}</Text>
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
          style={[styles.sortDirBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <ArrowUpDown size={16} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortBtn, { backgroundColor: colors.primaryContainer, marginLeft: 8, borderColor: colors.primaryContainer }]}
          activeOpacity={0.8}
          onPress={() => {
            const next: SortKey = sortKey === 'heure_depart' ? 'prix' : sortKey === 'prix' ? 'duree' : 'heure_depart';
            setSortKey(next);
          }}
        >
          <Clock size={14} color={colors.onPrimaryContainer} />
          <Text style={[styles.sortBtnText, { color: colors.onPrimaryContainer }]}>{triLabel}</Text>
          <ChevronDown size={14} color={colors.onPrimaryContainer} />
        </TouchableOpacity>
      </View>

      {!loading && !error && (
        <View style={[styles.summary, { backgroundColor: colors.surfaceContainerLow }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryCount, { color: colors.text }]}>
              {resultsAffiches.length} trajet{resultsAffiches.length > 1 ? 's' : ''} trouvés
              {resultsAffiches.length !== results.length ? ` sur ${results.length}` : ''}
            </Text>
            {meta.compagnies_disponibles ? (
              <Text style={[styles.summaryMeta, { color: colors.textSecondary }]}>
                {meta.compagnies_disponibles} compagnie{meta.compagnies_disponibles > 1 ? 's' : ''}
                {meta.prix_min_trouve != null ? ` · à partir de ${formatPrix(meta.prix_min_trouve)}` : ''}
              </Text>
            ) : null}
          </View>
          <MapPin size={16} color={colors.primary} />
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 2 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <LoadingState
              label="Recherche des trajets en cours…"
              description={`${depart || ''} → ${arrivee || ''}`}
            />
          ) : error ? (
            <View style={{ marginHorizontal: 16, marginTop: 10 }}>
              <ErrorState
                code={error?.code}
                description={error?.message}
                onRetry={loadResults}
                variant={error?.code === 'NETWORK_ERROR' ? 'offline' : 'error'}
              />
            </View>
          ) : resultsAffiches.length === 0 ? (
            results.length === 0 ? (
              <View style={{ marginHorizontal: 16, marginTop: 10 }}>
                <EmptyState
                  title="Aucun trajet disponible pour cette recherche"
                  description={[
                    depart && arrivee ? null : 'Sélectionnez une ville de départ et d\'arrivée.',
                    "Essayez une autre date ou augmentez l'étendue de vos filtres.",
                  ].filter(Boolean).join('\n')}
                  actionLabel="Modifier les filtres"
                  onAction={() => setShowFilters(true)}
                />
              </View>
            ) : (
              <View style={{ marginHorizontal: 16, marginTop: 10 }}>
                <EmptyState
                  title="Tous les trajets sont filtrés"
                  description="Enlevez certains filtres pour faire réapparaître des trajets."
                  actionLabel="Réinitialiser les filtres"
                  onAction={() => {
                    setPrixMin(''); setPrixMax(''); setHeureDebut(''); setHeureFin('');
                    setExclureComplets(true); setCompagniesSelectionnees(new Set());
                  }}
                />
              </View>
            )
          ) : (
            <>
              {resultsAffiches.map((t) => (
                <TrajetCard
                  key={t.id}
                  trajet={t as unknown as Trajet}
                  onPress={() => openTrajet(t)}
                />
              ))}
              <View style={{ alignItems: 'center', marginTop: 18 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                  Fin des résultats
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.filterHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <FilterIcon size={20} color={colors.primary} />
              <Text style={[styles.filterTitle, { color: colors.text }]}>Filtrer & trier</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <X size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }}>
            <View>
              <Text style={[styles.filterGroupTitle, { color: colors.text }]}>Plage de prix ({meta.prix_min_trouve != null ? `${formatPrix(meta.prix_min_trouve)} – ${formatPrix(meta.prix_max_trouve)}` : ''})</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Min</Text>
                  <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                      value={prixMin}
                      onChangeText={setPrixMin}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={colors.textSecondary}
                      style={{ color: colors.text, fontSize: 15, flex: 1, padding: 0 }}
                    />
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>XOF</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Max</Text>
                  <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                      value={prixMax}
                      onChangeText={setPrixMax}
                      keyboardType="number-pad"
                      placeholder="30000"
                      placeholderTextColor={colors.textSecondary}
                      style={{ color: colors.text, fontSize: 15, flex: 1, padding: 0 }}
                    />
                    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>XOF</Text>
                  </View>
                </View>
              </View>
            </View>

            <View>
              <Text style={[styles.filterGroupTitle, { color: colors.text }]}>Heure de départ</Text>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>À partir de</Text>
                  <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Clock size={16} color={colors.textSecondary} />
                    <TextInput
                      value={heureDebut}
                      onChangeText={setHeureDebut}
                      placeholder="06:00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      style={{ color: colors.text, fontSize: 15, padding: 0, flex: 1, marginLeft: 8 }}
                    />
                  </View>
                </View>
                <ArrowLeft size={16} color={colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Jusqu'à</Text>
                  <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Clock size={16} color={colors.textSecondary} />
                    <TextInput
                      value={heureFin}
                      onChangeText={setHeureFin}
                      placeholder="22:00"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      style={{ color: colors.text, fontSize: 15, padding: 0, flex: 1, marginLeft: 8 }}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View>
              <Text style={[styles.filterGroupTitle, { color: colors.text }]}>Compagnies</Text>
              {compagnies.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                  Aucune compagnie disponible pour cette recherche.
                </Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {compagnies.map((c) => {
                    const selected = compagniesSelectionnees.has(c.id);
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => toggleCompagnie(c.id)}
                        style={({ pressed }) => [
                          styles.compagnieChip,
                          {
                            backgroundColor: selected ? colors.primary : colors.surface,
                            borderColor: selected ? colors.primary : colors.border,
                          },
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        {selected ? <Check size={14} color={colors.onPrimary} /> : null}
                        <Text style={[styles.compagnieChipText, { color: selected ? colors.onPrimary : colors.text }]}>
                          {c.nom}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={[styles.rowBetween]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.filterGroupTitle, { color: colors.text, marginBottom: 4 }]}>
                  Masquer les trajets complets
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  N'afficher que les trajets avec au moins une place restante
                </Text>
              </View>
              <Switch
                value={exclureComplets}
                onValueChange={setExclureComplets}
                thumbColor={exclureComplets ? colors.onPrimary : colors.textSecondary}
                trackColor={{ true: colors.primary, false: colors.outlineVariant }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setPrixMin(''); setPrixMax(''); setHeureDebut(''); setHeureFin('');
                  setExclureComplets(true); setCompagniesSelectionnees(new Set());
                }}
                style={[styles.resetBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.resetBtnText, { color: colors.text }]}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={[styles.applyBtn, { backgroundColor: colors.primary, flex: 1 }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.applyBtnText, { color: colors.onPrimary }]}>Voir {resultsAffiches.length} résultat{resultsAffiches.length > 1 ? 's' : ''}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  itineraire: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  dateLabel: { fontSize: 12, fontWeight: '600' },

  toolbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 0,
  },
  toolBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  toolBtnText: { fontSize: 13, fontWeight: '700' },
  badge: {
    minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', marginLeft: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '900' },
  sortDirBtn: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  sortBtnText: { fontSize: 13, fontWeight: '700' },

  summary: {
    marginHorizontal: 16,
    paddingHorizontal: 14, paddingVertical: 12,
    borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 4,
  },
  summaryCount: { fontSize: 14, fontWeight: '800' },
  summaryMeta: { fontSize: 12, marginTop: 2 },

  filterHeader: {
    paddingHorizontal: 18, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  filterTitle: { fontSize: 19, fontWeight: '900' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filterGroupTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginLeft: 2 },
  input: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderRadius: 12, borderWidth: 1,
  },
  compagnieChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
  },
  compagnieChipText: { fontSize: 13, fontWeight: '700' },
  rowBetween: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingVertical: 10,
  },
  resetBtn: {
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  resetBtnText: { fontWeight: '800' },
  applyBtn: {
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  applyBtnText: { fontWeight: '800', fontSize: 15 },
});
