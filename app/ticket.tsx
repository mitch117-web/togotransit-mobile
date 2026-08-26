import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { billets, BilletDetail } from '../lib/togotransit-api';
import { showAlert } from '../lib/alert';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  ArrowLeft,
  MapPin,
  Bus,
  Share2,
  Download,
  Calendar,
  Ticket as TicketIcon,
  User,
  Phone,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

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

export default function TicketScreen() {
  const params = useLocalSearchParams<{
    billet_id?: string;
    reservation_id?: string;
  }>();
  const router = useRouter();
  const { colors } = useTheme();

  const billetId = params.billet_id
    ? parseInt(params.billet_id, 10)
    : NaN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [billet, setBillet] = useState<BilletDetail | null>(null);

  const loadBillet = useCallback(async () => {
    if (isNaN(billetId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await billets.get(billetId);
      if (res.success) {
        setBillet(res.data);
      } else {
        setError({ message: 'Billet introuvable' });
      }
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [billetId]);

  React.useEffect(() => {
    loadBillet();
  }, [loadBillet]);

  const ticketRef = useRef<View>(null);
  const [processing, setProcessing] = useState<'share' | 'download' | null>(null);

  const captureTicketImage = async (): Promise<string | null> => {
    if (!ticketRef.current || Platform.OS === 'web') return null;
    try {
      return await captureRef(ticketRef, { format: 'png', quality: 1 });
    } catch (_) {
      return null;
    }
  };

  const partager = async () => {
    if (processing) return;
    setProcessing('share');
    try {
      const uri = await captureTicketImage();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Mon billet TogoTransit' });
        return;
      }
      const trajet = billet?.reservation?.trajet;
      await Share.share({
        title: 'Mon billet TogoTransit',
        message: billet
          ? `Billet #${billet.numero_billet}\nTrajet : ${trajet?.ville_depart?.nom ?? ''} → ${trajet?.ville_arrivee?.nom ?? ''}\nDate : ${formatDateBillet(trajet?.date_depart)}`
          : 'Mon billet TogoTransit',
      });
    } catch (_) {
      showAlert('Erreur', "Impossible de partager le billet pour l'instant.");
    } finally {
      setProcessing(null);
    }
  };

  const telecharger = async () => {
    if (processing) return;
    if (Platform.OS === 'web') {
      showAlert('Indisponible sur web', 'Le téléchargement du billet est disponible sur l\'application mobile.');
      return;
    }
    setProcessing('download');
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission requise', "Autorisez l'accès à vos photos pour enregistrer le billet.");
        return;
      }
      const uri = await captureTicketImage();
      if (!uri) {
        showAlert('Erreur', "Impossible de générer l'image du billet.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      showAlert('Billet téléchargé', 'Le billet a été enregistré dans vos photos.');
    } catch (_) {
      showAlert('Erreur', "Impossible de télécharger le billet pour l'instant.");
    } finally {
      setProcessing(null);
    }
  };

  const trajet = billet?.reservation?.trajet;
  const passagers = billet?.reservation?.passagers ?? [];
  const statutBg =
    billet?.statut === 'valide'
      ? colors.primaryContainer
      : billet?.statut === 'utilise'
        ? colors.secondaryContainer
        : colors.errorContainer;
  const statutColor =
    billet?.statut === 'valide'
      ? colors.onPrimaryContainer
      : billet?.statut === 'utilise'
        ? colors.onSecondaryContainer
        : colors.onErrorContainer;
  const statutLabel =
    billet?.statut === 'valide'
      ? 'Valide'
      : billet?.statut === 'utilise'
        ? 'Utilisé'
        : 'Annulé';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/tickets')}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Mon billet</Text>
        <TouchableOpacity
          onPress={partager}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Share2 size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <LoadingState label="Chargement du billet…" />
        ) : error ? (
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <ErrorState
              code={error?.code}
              description={error?.message}
              onRetry={loadBillet}
              variant={error?.code === 'NETWORK_ERROR' ? 'offline' : 'error'}
            />
          </View>
        ) : !billet || !trajet ? (
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <ErrorState
              title="Billet introuvable"
              description="Veuillez réessayer depuis « Mes réservations »."
              onRetry={() => router.replace('/(tabs)/tickets')}
              retryLabel="Voir mes réservations"
            />
          </View>
        ) : (
          <View style={styles.content}>
            <View
              ref={ticketRef}
              collapsable={false}
              style={[styles.billetCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}
            >
              <View style={styles.billetHeader}>
                <View style={[styles.compagnieWrap, { backgroundColor: colors.primaryContainer }]}>
                  <Bus size={22} color={colors.onPrimaryContainer} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.compagnieNom, { color: colors.text }]}>
                    {trajet.compagnie?.nom || 'Compagnie'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Calendar size={12} color={colors.textSecondary} />
                    <Text style={[styles.billetDate, { color: colors.textSecondary }]}>
                      {formatDateBillet(trajet.date_depart)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.statutBadge, { backgroundColor: statutBg }]}>
                  <Text style={[styles.statutBadgeText, { color: statutColor }]}>
                    {statutLabel}
                  </Text>
                </View>
              </View>

              <View style={[styles.qrWrap, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <QRCode
                  value={billet.code_qr || billet.numero_billet}
                  size={180}
                  color={colors.text}
                  backgroundColor={colors.background}
                />
              </View>

              <View style={[styles.trajetBox, { borderTopColor: colors.border }]}>
                <View style={{ alignItems: 'center' }}>
                  <MapPin size={14} color={colors.primary} />
                  <View style={[styles.trait, { backgroundColor: colors.outlineVariant }]} />
                  <MapPin size={14} color={colors.secondary} />
                </View>
                <View style={{ flex: 1, paddingLeft: 10, gap: 18 }}>
                  <View>
                    <Text style={[styles.villeNom, { color: colors.text }]}>
                      {trajet.ville_depart?.nom ?? ''}
                    </Text>
                    {trajet.vehicule?.type ? (
                      <Text style={[styles.vehicule, { color: colors.textSecondary }]}>
                        {trajet.vehicule.type}
                      </Text>
                    ) : null}
                  </View>
                  <View>
                    <Text style={[styles.villeNom, { color: colors.text }]}>
                      {trajet.ville_arrivee?.nom ?? ''}
                    </Text>
                    <Text style={[styles.numeroBillet, { color: colors.textSecondary }]}>
                      N° {billet.numero_billet}
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 18 }}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.heure, { color: colors.text }]}>
                      {new Date(trajet.date_depart).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text style={[styles.villeRegion, { color: colors.textSecondary }]}>
                      {trajet.ville_depart?.region ?? ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <TicketIcon size={14} color={colors.primary} />
                    <Text style={[styles.billetPlaces, { color: colors.textSecondary, marginTop: 2 }]}>
                      {billet.reservation?.nombre_places ?? 1} place
                      {(billet.reservation?.nombre_places ?? 1) > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.passagersBox, { borderTopColor: colors.border }]}>
                <Text style={[styles.passagersTitle, { color: colors.text }]}>
                  Passager{passagers.length > 1 ? 's' : ''}
                </Text>
                {passagers.map((p, i) => (
                  <View key={i} style={styles.passagerRow}>
                    <View style={[styles.passagerIcon, { backgroundColor: colors.surfaceVariant }]}>
                      <User size={14} color={colors.onSurfaceVariant} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.passagerNom, { color: colors.text }]}>
                        {p.nom_complet}
                      </Text>
                      {p.telephone ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <Phone size={11} color={colors.textSecondary} />
                          <Text style={[styles.passagerTel, { color: colors.textSecondary }]}>
                            {p.telephone}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity
                onPress={partager}
                disabled={processing !== null}
                style={[styles.btnSecondary, { backgroundColor: colors.surface, borderColor: colors.border, opacity: processing === 'download' ? 0.5 : 1 }]}
                activeOpacity={0.75}
              >
                <Share2 size={18} color={colors.text} />
                <Text style={[styles.btnText, { color: colors.text }]}>
                  {processing === 'share' ? 'Partage…' : 'Partager'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={telecharger}
                disabled={processing !== null}
                style={[styles.btnSecondary, { backgroundColor: colors.surface, borderColor: colors.border, opacity: processing === 'share' ? 0.5 : 1 }]}
                activeOpacity={0.75}
              >
                <Download size={18} color={colors.text} />
                <Text style={[styles.btnText, { color: colors.text }]}>
                  {processing === 'download' ? 'Téléchargement…' : 'Télécharger'}
                </Text>
              </TouchableOpacity>
            </View>
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

  content: { padding: 16, gap: 16 },

  billetCard: {
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
    overflow: 'hidden',
  },
  billetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  compagnieWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compagnieNom: { fontSize: 15, fontWeight: '800' },
  billetDate: { fontSize: 12, fontWeight: '600' },
  statutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statutBadgeText: { fontSize: 11, fontWeight: '800' },
  qrWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
  },
  trajetBox: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
  },
  trait: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    marginLeft: 6,
  },
  villeNom: { fontSize: 15, fontWeight: '800' },
  heure: { fontSize: 15, fontWeight: '900' },
  villeRegion: { fontSize: 11, fontWeight: '600' },
  vehicule: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  numeroBillet: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  billetPlaces: { fontSize: 12, fontWeight: '700' },

  passagersBox: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 10,
  },
  passagersTitle: { fontSize: 13, fontWeight: '800', marginBottom: 4 },
  passagerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passagerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passagerNom: { fontSize: 14, fontWeight: '700' },
  passagerTel: { fontSize: 12, fontWeight: '500' },

  btnRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 4,
  },
  btnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  btnText: { fontSize: 14, fontWeight: '800' },
});
