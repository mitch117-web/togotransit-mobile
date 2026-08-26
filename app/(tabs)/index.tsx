import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import {
  MapPin,
  ArrowRightLeft,
  Calendar,
  Search as SearchIcon,
  Bell,
  ChevronDown,
  Clock,
  Sparkles,
  User,
  X,
} from 'lucide-react-native';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import TrajetCard, { Trajet } from '../../components/TrajetCard';
import DriverHome from '../../components/DriverHome';
import { villes, trajets, Ville, TrajetResult, MonTrajetConduit } from '../../lib/togotransit-api';
import api from '../../lib/api';

const formatDate = (d: Date) => {
  try {
    return d.toISOString().slice(0, 10);
  } catch { return ''; }
};
const formatDateLabel = (iso?: string) => {
  if (!iso) return "Choisir une date";
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

type VillePickerKind = 'depart' | 'arrivee' | null;

export default function SearchHomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const today = new Date();
  const [depart, setDepart] = useState<string>('');
  const [arrivee, setArrivee] = useState<string>('');
  const [date, setDate] = useState<string>(formatDate(today));

  const [pickerKind, setPickerKind] = useState<VillePickerKind>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<any>(null);
  const [pickerResults, setPickerResults] = useState<Ville[]>([]);

  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<any>(null);
  const [quickResults, setQuickResults] = useState<TrajetResult[]>([]);

  const userNameLabel = user?.prenom
    ? `${user.prenom}`
    : user?.name
      ? String(user.name).split(' ')[0]
      : 'Voyageur';

  // "Chauffeur" n'est pas un rôle à part dans ce système : c'est un voyageur
  // assigné comme conducteur sur un trajet et/ou comme livreur sur un colis.
  // On ne peut le savoir qu'en interrogeant ces deux assignations.
  const [checkingDriverMode, setCheckingDriverMode] = useState(true);
  const [isDriver, setIsDriver] = useState(false);
  const [driverTrajets, setDriverTrajets] = useState<MonTrajetConduit[]>([]);
  const [driverParcels, setDriverParcels] = useState<any[]>([]);
  const [driverRefreshing, setDriverRefreshing] = useState(false);

  const checkDriverMode = React.useCallback(async () => {
    if (user?.role !== 'voyageur' || !user?.id) {
      setCheckingDriverMode(false);
      return;
    }
    try {
      const [trajetsRes, parcelsRes] = await Promise.all([
        trajets.mesTrajets().catch(() => ({ data: [] as MonTrajetConduit[] })),
        api.get('/parcels').catch(() => ({ data: [] })),
      ]);
      const myTrajets = trajetsRes.data || [];
      const myParcels = (parcelsRes.data || []).filter(
        (p: any) => p.driverId != null && String(p.driverId) === String(user.id)
      );
      setDriverTrajets(myTrajets);
      setDriverParcels(myParcels);
      setIsDriver(myTrajets.length > 0 || myParcels.length > 0);
    } catch (_) {
      // en cas d'échec, on retombe simplement sur l'écran voyageur classique
    } finally {
      setCheckingDriverMode(false);
      setDriverRefreshing(false);
    }
  }, [user?.role, user?.id]);

  React.useEffect(() => {
    checkDriverMode();
  }, [checkDriverMode]);

  const onPick = (kind: VillePickerKind) => {
    setPickerKind(kind);
    setPickerQuery(kind === 'depart' ? depart : arrivee);
    setPickerResults([]);
    setPickerError(null);
    searchVilles(kind === 'depart' ? depart : arrivee);
  };

  const searchVilles = async (q: string) => {
    setPickerLoading(true);
    setPickerError(null);
    try {
      const res = await villes.search(q || '');
      setPickerResults(res);
    } catch (e: any) {
      setPickerError(e);
    } finally {
      setPickerLoading(false);
    }
  };

  const selectVille = (v: Ville) => {
    if (pickerKind === 'depart') setDepart(v.nom);
    if (pickerKind === 'arrivee') setArrivee(v.nom);
    setPickerKind(null);
  };

  const swapVilles = () => {
    const d = depart;
    setDepart(arrivee);
    setArrivee(d);
  };

  const submitSearch = () => {
    if (!depart.trim() || !arrivee.trim()) return;
    const params = new URLSearchParams();
    params.set('depart', depart);
    params.set('arrivee', arrivee);
    if (date) params.set('date', date);
    router.push(`/search-results?${params.toString()}`);
  };

  const openTrajet = (t: TrajetResult) => {
    const params = new URLSearchParams();
    params.set('id', String(t.id));
    router.push(`/trajet-detail?${params.toString()}`);
  };

  const loadQuickTrajets = React.useCallback(async () => {
    setQuickLoading(true);
    setQuickError(null);
    try {
      const r = await trajets.search({
        date,
        sort_by: 'heure_depart',
        sort_dir: 'asc',
      });
      setQuickResults(r.data.slice(0, 5));
    } catch (e) {
      setQuickError(e);
    } finally {
      setQuickLoading(false);
    }
  }, [date]);

  React.useEffect(() => {
    loadQuickTrajets();
  }, [loadQuickTrajets]);

  const datesRapides = [0, 1, 2, 3].map(n => addDays(today, n));

  if (checkingDriverMode) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background, justifyContent: 'center' }]} edges={['top']}>
        <LoadingState label="Chargement…" />
      </SafeAreaView>
    );
  }

  if (isDriver) {
    return (
      <DriverHome
        prenom={userNameLabel}
        compagnieNom={driverTrajets[0]?.compagnie?.nom ?? driverParcels[0]?.compagnie?.nom ?? null}
        trajets={driverTrajets}
        parcels={driverParcels}
        refreshing={driverRefreshing}
        onRefresh={() => {
          setDriverRefreshing(true);
          checkDriverMode();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.header, { backgroundColor: colors.primary, paddingBottom: 40 }]}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.hello, { color: colors.onPrimary + 'cc' }]}>Bonjour,</Text>
                <Text style={[styles.userName, { color: colors.onPrimary }]}>{userNameLabel} 👋</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.onPrimary + '18' }]}>
                  <Bell size={20} color={colors.onPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/profile')}
                  style={[styles.iconBtn, styles.avatarBtn, { backgroundColor: colors.onPrimary + '22' }]}
                >
                  <User size={18} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.heroTitle, { color: colors.onPrimary }]}>
              Où souhaitez-vous aller ?
            </Text>
            <Text style={[styles.heroSub, { color: colors.onPrimary + 'dd' }]}>
              Comparez toutes les compagnies de transport togolaises en une recherche.
            </Text>
          </View>

          <View style={[styles.searchCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border, marginTop: -28 }]}>
            <View style={styles.searchRow}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Départ</Text>
              <TouchableOpacity
                onPress={() => onPick('depart')}
                style={[styles.fieldRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.pinWrap, { backgroundColor: colors.primaryContainer }]}>
                  <MapPin size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  {depart ? (
                    <Text style={[styles.fieldValue, { color: colors.text }]}>{depart}</Text>
                  ) : (
                    <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Ville de départ</Text>
                  )}
                </View>
                <ChevronDown size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.swapWrap}>
              <TouchableOpacity
                onPress={swapVilles}
                style={[styles.swapBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <ArrowRightLeft size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchRow, { marginTop: 8 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Arrivée</Text>
              <TouchableOpacity
                onPress={() => onPick('arrivee')}
                style={[styles.fieldRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <View style={[styles.pinWrap, { backgroundColor: colors.secondaryContainer }]}>
                  <MapPin size={18} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  {arrivee ? (
                    <Text style={[styles.fieldValue, { color: colors.text }]}>{arrivee}</Text>
                  ) : (
                    <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Ville d'arrivée</Text>
                  )}
                </View>
                <ChevronDown size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchRow, { marginTop: 12 }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date du voyage</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {datesRapides.map((d) => {
                  const iso = formatDate(d);
                  const active = iso === date;
                  return (
                    <TouchableOpacity
                      key={iso}
                      onPress={() => setDate(iso)}
                      activeOpacity={0.8}
                      style={[
                        styles.dateChip,
                        {
                          backgroundColor: active ? colors.primary : colors.surface,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.dateChipDay, { color: active ? colors.onPrimary : colors.text }]}>
                        {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </Text>
                      <Text style={[styles.dateChipNum, { color: active ? colors.onPrimary : colors.text }]}>
                        {d.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <TouchableOpacity
              onPress={submitSearch}
              disabled={!depart.trim() || !arrivee.trim()}
              activeOpacity={0.85}
              style={[
                styles.searchBtn,
                { backgroundColor: colors.primary },
                (!depart.trim() || !arrivee.trim()) && { opacity: 0.55 },
              ]}
            >
              <SearchIcon color={colors.onPrimary} size={18} />
              <Text style={[styles.searchBtnText, { color: colors.onPrimary }]}>
                Rechercher un trajet
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} color={colors.warning} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggestions du jour</Text>
            </View>
            <Text style={[styles.sectionDate, { color: colors.textSecondary }]}>
              {formatDateLabel(date)}
            </Text>
          </View>

          {quickLoading ? (
            <View style={{ marginTop: 10, marginHorizontal: 16 }}>
              <LoadingState label="Recherche des trajets du jour…" />
            </View>
          ) : quickError ? (
            <View style={{ marginHorizontal: 16, marginTop: 10 }}>
              <ErrorState
                code={quickError?.code}
                description={quickError?.message}
                onRetry={loadQuickTrajets}
                variant={quickError?.code === 'NETWORK_ERROR' ? 'offline' : 'error'}
              />
            </View>
          ) : quickResults.length === 0 ? (
            <View style={{ marginHorizontal: 16, marginTop: 10 }}>
              <ErrorState
                variant="error"
                title="Pas encore de trajets pour cette date"
                description="Ajustez votre destination ou votre date puis lancez une recherche."
              />
            </View>
          ) : (
            <View style={{ marginTop: 2 }}>
              {quickResults.map((t) => (
                <TrajetCard
                  key={t.id}
                  trajet={t as unknown as Trajet}
                  onPress={() => openTrajet(t)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={pickerKind !== null}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPickerKind(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choisir la ville de {pickerKind === 'depart' ? 'départ' : 'arrivée'}
              </Text>
              <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                Tapez quelques lettres pour affiner
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: colors.surfaceVariant }]}
              onPress={() => setPickerKind(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SearchIcon size={18} color={colors.textSecondary} />
            <TextInput
              value={pickerQuery}
              onChangeText={(q) => {
                setPickerQuery(q);
                searchVilles(q);
              }}
              placeholder="Ex : Lomé, Kara, Cotonou…"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>

          <View style={{ flex: 1 }}>
            {pickerLoading && pickerResults.length === 0 ? (
              <LoadingState label="Recherche des villes…" />
            ) : pickerError ? (
              <ErrorState
                code={pickerError?.code}
                description={pickerError?.message}
                onRetry={() => searchVilles(pickerQuery)}
                variant={pickerError?.code === 'NETWORK_ERROR' ? 'offline' : 'error'}
              />
            ) : pickerResults.length === 0 ? (
              <ErrorState
                title="Aucune ville trouvée"
                description="Essayez une autre orthographe."
              />
            ) : (
              <FlatList
                data={pickerResults}
                keyExtractor={(v) => String(v.id)}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => selectVille(item)}
                    style={({ pressed }) => [
                      styles.villeRow,
                      {
                        backgroundColor: pressed ? colors.surfaceVariant : colors.background,
                        borderBottomColor: colors.border,
                      },
                    ]}
                    android_ripple={{ color: colors.primary + '22' }}
                  >
                    <View style={[styles.villeIcon, { backgroundColor: colors.primaryContainer }]}>
                      <MapPin size={16} color={colors.onPrimaryContainer} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.villeNom, { color: colors.text }]}>{item.nom}</Text>
                      {item.region || item.pays ? (
                        <Text style={[styles.villeMeta, { color: colors.textSecondary }]}>
                          {[item.region, item.pays].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                )}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 14, gap: 8 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hello: { fontSize: 13, fontWeight: '600' },
  userName: { fontSize: 18, fontWeight: '800', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
  },
  avatarBtn: { borderWidth: 1, borderColor: 'transparent' },
  heroTitle: { fontSize: 26, fontWeight: '900', marginTop: 10, letterSpacing: -0.3, paddingRight: 40 },
  heroSub: { fontSize: 14, lineHeight: 20, marginTop: 6, paddingRight: 20 },

  searchCard: {
    marginHorizontal: 16,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#0b1c30',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  searchRow: {},
  fieldLabel: { fontSize: 12, fontWeight: '700', marginLeft: 4, marginBottom: 6 },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  pinWrap: {
    width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  fieldValue: { fontSize: 16, fontWeight: '700' },
  placeholder: { fontSize: 14, fontWeight: '500' },

  swapWrap: { alignItems: 'center', marginTop: -10, marginBottom: -10, zIndex: 5 },
  swapBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  dateChip: {
    width: 58, paddingVertical: 8, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', gap: 2, marginVertical: 2,
  },
  dateChipDay: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  dateChipNum: { fontSize: 16, fontWeight: '900' },

  searchBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    marginTop: 16, paddingVertical: 16, borderRadius: 16,
  },
  searchBtnText: { fontSize: 16, fontWeight: '800' },

  sectionHeader: {
    marginTop: 22,
    marginHorizontal: 20,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  sectionDate: { fontSize: 12, fontWeight: '600' },

  modalHeader: {
    paddingHorizontal: 18, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalSub: { fontSize: 13, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchBar: {
    margin: 16, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderRadius: 14, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },

  villeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1,
  },
  villeIcon: {
    width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  villeNom: { fontSize: 15, fontWeight: '700' },
  villeMeta: { fontSize: 12, marginTop: 2 },
});
