import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, FlatList, Platform, StatusBar, Modal, RefreshControl } from 'react-native';
import { useTheme } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { useRouter } from 'expo-router';
import { QrCode as QrIcon, Camera as CameraIcon, History, X, Ticket, Calendar, User as UserIcon, MapPin, ChevronRight } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../../lib/api';
import { reservations as reservationsApi, ReservationRecord, trajets as trajetsApi, MonTrajetConduit } from '../../lib/togotransit-api';

export default function TicketsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const isStaff = user?.role === 'gestionnaire' || user?.role === 'super_admin';

  // Un voyageur qui conduit un trajet aujourd'hui peut aussi valider
  // l'embarquement de ses passagers — pas de rôle "chauffeur" à part,
  // juste une assignation Trajet.driver_id détectée ici.
  const [monTrajetChauffeur, setMonTrajetChauffeur] = useState<MonTrajetConduit | null>(null);
  const canScan = isStaff || monTrajetChauffeur != null;

  // --- Vue voyageur : mes réservations / billets ---
  const [mesReservations, setMesReservations] = useState<ReservationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyReservations = useCallback(async () => {
    try {
      const res = await reservationsApi.mesReservations();
      setMesReservations(res.data || []);
    } catch (error) {
      console.error('Failed to fetch reservations', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isStaff) {
      setLoading(false);
      return;
    }
    if (user?.role === 'voyageur') {
      trajetsApi
        .mesTrajets()
        .then((res) => setMonTrajetChauffeur(res.data?.[0] ?? null))
        .catch(() => setMonTrajetChauffeur(null));
    }
    fetchMyReservations();
  }, [isStaff, user?.role, fetchMyReservations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyReservations();
  };

  // --- Vue gestionnaire / super_admin : scanner d'embarquement ---
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isValidating, setIsValidating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (isValidating) return;
    setIsValidating(true);
    try {
      let numero_billet = data;
      try {
        const parsed = JSON.parse(data);
        if (parsed?.numero_billet) numero_billet = parsed.numero_billet;
      } catch (_) {
        // Le QR n'est pas du JSON structuré : on utilise la valeur brute comme numéro de billet.
      }

      const response = await api.post('/billets/verifier', { numero_billet });
      const { message, client, trajet, passagers } = response.data;

      setScanHistory((prev) => [
        {
          id: `${numero_billet}-${Date.now()}`,
          numero_billet,
          client,
          trajet,
          passagers,
          scanned_at: new Date().toISOString(),
        },
        ...prev,
      ]);

      Alert.alert(
        'Succès',
        [
          message,
          client ? `Passager : ${client.nom}` : null,
          trajet ? `Trajet : ${trajet.ville_depart} → ${trajet.ville_arrivee}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
        [{ text: 'OK', onPress: () => setIsScanning(false) }]
      );
    } catch (error: any) {
      Alert.alert(
        'Erreur de validation',
        error.response?.data?.error || 'Une erreur est survenue lors de la validation du billet.'
      );
    } finally {
      setIsValidating(false);
    }
  };

  if (canScan) {
    if (!permission) {
      return <View style={[styles.container, { backgroundColor: colors.background }]} />;
    }

    if (!permission.granted) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
          <View style={styles.center}>
            <CameraIcon size={64} color={colors.outline} strokeWidth={1} />
            <Text style={[styles.permissionText, { color: colors.text }]}>Accès à la caméra requis</Text>
            <Text style={[styles.permissionSubtitle, { color: colors.tabIconDefault }]}>
              Nous avons besoin de votre permission pour utiliser la caméra afin de scanner les billets des passagers.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={requestPermission}
            >
              <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Accorder la permission</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (isScanning) {
      return (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          >
            <View style={styles.overlay}>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
                onPress={() => setIsScanning(false)}
              >
                <X color="white" size={28} />
              </TouchableOpacity>

              <View style={styles.scanTargetContainer}>
                <View style={[styles.scanFrame, { borderColor: 'white' }]}>
                  {isValidating && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="white" />
                    </View>
                  )}
                  <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                  <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
                </View>
              </View>

              <View style={styles.scanTextContainer}>
                <Text style={styles.scanText}>Placez le QR Code dans le cadre</Text>
                <Text style={styles.scanSubtitle}>La validation sera automatique</Text>
              </View>
            </View>
          </CameraView>
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Validation</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            {monTrajetChauffeur
              ? `${monTrajetChauffeur.ville_depart.nom} → ${monTrajetChauffeur.ville_arrivee.nom} · ${new Date(monTrajetChauffeur.date_depart).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Scannez les billets des passagers'}
          </Text>
        </View>

        <View style={styles.scannerHero}>
          <View style={[styles.scannerPlaceholder, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={[styles.scannerFrame, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              <QrIcon color={colors.primary} size={100} strokeWidth={1.5} />
            </View>
          </View>

          <View style={styles.instructions}>
            <Text style={[styles.instructionTitle, { color: colors.text }]}>Comment valider ?</Text>
            <Text style={[styles.instructionText, { color: colors.tabIconDefault }]}>
              1. Cliquez sur le bouton ci-dessous{'\n'}
              2. Pointez la caméra vers le QR Code{'\n'}
              3. Attendez la confirmation visuelle
            </Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.scanButton, { backgroundColor: colors.primary }]} onPress={() => setIsScanning(true)}>
          <CameraIcon color={colors.onPrimary} size={24} />
          <Text style={[styles.scanButtonText, { color: colors.onPrimary }]}>Démarrer le scanner</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.historyButton, { borderColor: colors.outlineVariant }]}
          onPress={() => setShowHistory(true)}
        >
          <History color={colors.primary} size={20} />
          <Text style={[styles.historyText, { color: colors.primary }]}>
            Voir les billets scannés ({scanHistory.length})
          </Text>
        </TouchableOpacity>

        <Modal visible={showHistory} animationType="slide" transparent onRequestClose={() => setShowHistory(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Billets scannés (session)</Text>
                <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.modalCloseBtn}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <FlatList
                data={scanHistory}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.modalList}
                ListEmptyComponent={
                  <View style={styles.emptyHistory}>
                    <History size={48} color={colors.outlineVariant} />
                    <Text style={[styles.emptyHistoryText, { color: colors.onSurfaceVariant }]}>
                      Aucun billet scanné pour l'instant.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={[styles.historyItem, { borderBottomColor: colors.outlineVariant }]}>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyName, { color: colors.text }]}>{item.client?.nom ?? 'Passager'}</Text>
                      <Text style={[styles.historyRoute, { color: colors.onSurfaceVariant }]}>
                        {item.trajet?.ville_depart} → {item.trajet?.ville_arrivee}
                      </Text>
                      <Text style={[styles.historyDate, { color: colors.outline }]}>
                        {new Date(item.scanned_at).toLocaleString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                )}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // --- Vue voyageur ---
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mes Tickets</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Présentez votre QR Code lors de l'embarquement
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={mesReservations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item }) => {
            const trajet = item.trajet;
            const billets = item.billets ?? [];
            return (
              <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                <View style={[styles.ticketHeader, { borderBottomColor: colors.outlineVariant }]}>
                  <View style={[styles.ticketType, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <Ticket size={16} color={colors.primary} />
                    <Text style={[styles.ticketTypeText, { color: colors.primary }]}>
                      {trajet?.compagnie?.nom ?? 'TICKET VOYAGE'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statutBadge,
                      {
                        backgroundColor:
                          item.statut === 'confirmee'
                            ? colors.primaryContainer
                            : item.statut === 'annulee'
                              ? colors.errorContainer
                              : colors.secondaryContainer,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statutBadgeText,
                        {
                          color:
                            item.statut === 'confirmee'
                              ? colors.onPrimaryContainer
                              : item.statut === 'annulee'
                                ? colors.onErrorContainer
                                : colors.onSecondaryContainer,
                        },
                      ]}
                    >
                      {item.statut === 'confirmee' ? 'Confirmée' : item.statut === 'annulee' ? 'Annulée' : 'En attente'}
                    </Text>
                  </View>
                </View>

                <View style={styles.ticketBody}>
                  <View style={styles.routeSection}>
                    <View style={styles.routePoint}>
                      <MapPin size={18} color={colors.primary} />
                      <Text style={[styles.locationName, { color: colors.text }]}>{trajet?.ville_depart?.nom}</Text>
                    </View>
                    <View style={[styles.routeLine, { backgroundColor: colors.outlineVariant }]} />
                    <View style={styles.routePoint}>
                      <MapPin size={18} color={colors.secondary} />
                      <Text style={[styles.locationName, { color: colors.text }]}>{trajet?.ville_arrivee?.nom}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { borderBottomColor: colors.outlineVariant, borderStyle: 'dashed' }]} />

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Calendar size={16} color={colors.tabIconDefault} />
                      <View>
                        <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Départ</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {trajet?.date_depart
                            ? new Date(trajet.date_depart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                            : '—'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <UserIcon size={16} color={colors.tabIconDefault} />
                      <View>
                        <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Places</Text>
                        <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '800' }]}>
                          {item.nombre_places}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {item.statut === 'en_attente' ? (
                    <TouchableOpacity
                      style={[styles.payButton, { backgroundColor: colors.primary }]}
                      onPress={() => router.push({ pathname: '/payment', params: { reservation_id: String(item.id) } })}
                    >
                      <Text style={[styles.payButtonText, { color: colors.onPrimary }]}>Continuer le paiement</Text>
                      <ChevronRight size={18} color={colors.onPrimary} />
                    </TouchableOpacity>
                  ) : billets.length > 0 ? (
                    billets.map((billet) => (
                      <TouchableOpacity
                        key={billet.id}
                        style={[styles.billetButton, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
                        onPress={() => router.push({ pathname: '/ticket', params: { billet_id: String(billet.id) } })}
                      >
                        <Text style={[styles.billetButtonText, { color: colors.text }]}>N° {billet.numero_billet}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={[styles.billetButtonCta, { color: colors.primary }]}>Voir le billet</Text>
                          <ChevronRight size={16} color={colors.primary} />
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={[styles.noBilletText, { color: colors.tabIconDefault }]}>
                      Billet en cours de génération…
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerLow }]}>
                <Ticket size={48} color={colors.outline} strokeWidth={1} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucun ticket</Text>
              <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
                Vos réservations de voyage apparaîtront ici.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  ticketCard: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  ticketType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  ticketTypeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  statutBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statutBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  ticketBody: {
    padding: 20,
    gap: 4,
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  routePoint: {
    alignItems: 'center',
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  routeLine: {
    height: 1,
    flex: 0.5,
    marginHorizontal: 10,
  },
  divider: {
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
  },
  payButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  billetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  billetButtonText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  billetButtonCta: {
    fontSize: 13,
    fontWeight: '800',
  },
  noBilletText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Scanner Styles
  scannerHero: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  scannerPlaceholder: {
    height: 240,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  scannerFrame: {
    width: 160,
    height: 160,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  instructions: {
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  scanButton: {
    marginHorizontal: 24,
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  historyButton: {
    marginHorizontal: 24,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 40,
  },
  historyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Camera Modal Styles
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginRight: 24,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanTargetContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderWidth: 1,
    borderRadius: 32,
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 24,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  scanTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  scanText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  scanSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    paddingHorizontal: 32,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Modal History Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    padding: 24,
  },
  historyItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  historyInfo: {
    gap: 4,
  },
  historyName: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyRoute: {
    fontSize: 13,
  },
  historyDate: {
    fontSize: 11,
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 16,
    opacity: 0.5,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
