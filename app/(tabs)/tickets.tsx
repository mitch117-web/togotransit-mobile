import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Button, ActivityIndicator, FlatList, Platform, StatusBar, Modal, TextInput } from 'react-native';
import { useTheme } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { QrCode as QrIcon, Camera as CameraIcon, History, X, Ticket, Calendar, User as UserIcon, MapPin, Star, Download } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import api from '../../lib/api';

export default function TicketsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (user?.role === 'CLIENT') {
      fetchUserTickets();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchScanHistory = async () => {
    setFetchingHistory(true);
    try {
      // Pour le chauffeur ou l'agent, on récupère les tickets avec le statut BOARDED
      const response = await api.get('/bookings', { params: { status: 'BOARDED' } });
      setScanHistory(response.data);
      setShowHistory(true);
    } catch (error) {
      console.error('Failed to fetch scan history', error);
      Alert.alert('Erreur', 'Impossible de charger l\'historique des scans.');
    } finally {
      setFetchingHistory(false);
    }
  };

  const fetchUserTickets = async () => {
    try {
      const response = await api.get('/bookings', { params: { userId: user?.id } });
      setBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch tickets', error);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (booking: any) => {
    setSelectedBooking(booking);
    setRating(0);
    setReviewText('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (rating === 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner une note');
      return;
    }
    setSubmittingReview(true);
    try {
      // Simulate review submission (in a real app, you'd send this to your API
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Succès', 'Votre avis a été soumis ! Merci pour votre feedback !');
      setShowReviewModal(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de soumettre votre avis');
    } finally {
      setSubmittingReview(false);
    }
  };

  const downloadPDF = (booking: any) => {
    // Simulation of PDF download (in real app, you'd generate and download PDF)
    Alert.alert(
      'Téléchargement démarré',
      `Le ticket pour ${booking.trip.origin} → ${booking.trip.destination} est en cours de téléchargement...`,
      [{ text: 'OK' }]
    );
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (isValidating) return;
    
    setIsValidating(true);
    try {
      const response = await api.post('/bookings/validate', { bookingId: data });
      const { booking, message } = response.data;
      
      Alert.alert(
        'Succès',
        `${message}\n\nPassager: ${booking.user.name}\nTrajet: ${booking.trip.origin} → ${booking.trip.destination}\nSiège: ${booking.seatNumber}`,
        [{ text: 'OK', onPress: () => setIsScanning(false) }]
      );
    } catch (error: any) {
      console.error('Validation error', error.response?.data || error.message);
      Alert.alert(
        'Erreur de validation',
        error.response?.data?.error || 'Une erreur est survenue lors de la validation du ticket.'
      );
    } finally {
      setIsValidating(false);
    }
  };

  if (!permission) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <View style={styles.center}>
          <CameraIcon size={64} color={colors.outline} strokeWidth={1} />
          <Text style={[styles.permissionText, { color: colors.text }]}>
            Accès à la caméra requis
          </Text>
          <Text style={[styles.permissionSubtitle, { color: colors.tabIconDefault }]}>
            Nous avons besoin de votre permission pour utiliser la caméra afin de scanner les tickets.
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
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
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

  if (user?.role === 'DRIVER' || user?.role === 'AGENT') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Validation</Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            Scannez les tickets des passagers
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
              1. Cliquez sur le bouton ci-dessous{"\n"}
              2. Pointez la caméra vers le QR Code{"\n"}
              3. Attendez la confirmation visuelle
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => setIsScanning(true)}
        >
          <CameraIcon color={colors.onPrimary} size={24} />
          <Text style={[styles.scanButtonText, { color: colors.onPrimary }]}>
            Démarrer le scanner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.historyButton, { borderColor: colors.outlineVariant }]}
          onPress={fetchScanHistory}
          disabled={fetchingHistory}
        >
          {fetchingHistory ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <History color={colors.primary} size={20} />
              <Text style={[styles.historyText, { color: colors.primary }]}>Voir l'historique des scans</Text>
            </>
          )}
        </TouchableOpacity>

        <Modal
          visible={showHistory}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowHistory(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Historique des Scans</Text>
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
                      Aucun scan aujourd'hui.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={[styles.historyItem, { borderBottomColor: colors.outlineVariant }]}>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyName, { color: colors.text }]}>{item.user.name}</Text>
                      <Text style={[styles.historyRoute, { color: colors.onSurfaceVariant }]}>
                        {item.trip.origin} → {item.trip.destination}
                      </Text>
                      <Text style={[styles.historyDate, { color: colors.outline }]}>
                        {new Date(item.createdAt).toLocaleString('fr-FR')}
                      </Text>
                    </View>
                    <View style={[styles.seatBadge, { backgroundColor: colors.primaryContainer }]}>
                      <Text style={[styles.seatText, { color: colors.primary }]}>#{item.seatNumber}</Text>
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
        <>
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                <View style={[styles.ticketHeader, { borderBottomColor: colors.outlineVariant }]}>
                  <View style={[styles.ticketType, { backgroundColor: colors.surfaceContainerHigh }]}>
                    <Ticket size={16} color={colors.primary} />
                    <Text style={[styles.ticketTypeText, { color: colors.primary }]}>TICKET VOYAGE</Text>
                  </View>
                  <Text style={[styles.ticketId, { color: colors.tabIconDefault }]}>#{item.id.substring(0, 8).toUpperCase()}</Text>
                </View>

                <View style={styles.ticketBody}>
                  <View style={styles.routeSection}>
                    <View style={styles.routePoint}>
                      <MapPin size={18} color={colors.primary} />
                      <Text style={[styles.locationName, { color: colors.text }]}>{item.trip?.origin}</Text>
                    </View>
                    <View style={[styles.routeLine, { backgroundColor: colors.outlineVariant }]} />
                    <View style={styles.routePoint}>
                      <MapPin size={18} color={colors.secondary} />
                      <Text style={[styles.locationName, { color: colors.text }]}>{item.trip?.destination}</Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { borderBottomColor: colors.outlineVariant, borderStyle: 'dashed' }]} />

                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <Calendar size={16} color={colors.tabIconDefault} />
                      <View>
                        <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Départ</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {new Date(item.trip?.departureTime).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <UserIcon size={16} color={colors.tabIconDefault} />
                      <View>
                        <Text style={[styles.detailLabel, { color: colors.tabIconDefault }]}>Siège</Text>
                        <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '800' }]}>{item.seatNumber}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.qrSection, { backgroundColor: colors.surfaceContainerLow }]}>
                    <View style={[styles.qrContainer, { backgroundColor: 'white', padding: 16, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }]}>
                      <QRCode
                        value={item.id}
                        size={160}
                        color="black"
                        backgroundColor="white"
                      />
                    </View>
                    <Text style={[styles.qrHint, { color: colors.tabIconDefault }]}>Scannez pour embarquer</Text>
                    <Text style={[styles.qrId, { color: colors.outline }]}>{item.id}</Text>
                  </View>
                </View>

                <View style={[styles.ticketFooter, { backgroundColor: colors.surfaceContainerHigh }]}>
                  <Text style={[styles.passengerLabel, { color: colors.tabIconDefault }]}>Passager</Text>
                  <Text style={[styles.passengerName, { color: colors.text }]}>{user?.name}</Text>
                </View>
                
                {/* Review button for completed trips */}
                <TouchableOpacity
                  style={[styles.reviewButton, { backgroundColor: colors.primary }]}
                  onPress={() => openReviewModal(item)}
                >
                  <Star size={16} color="white" />
                  <Text style={[styles.reviewButtonText, { color: "white" }]}>Donner un avis</Text>
                </TouchableOpacity>
                
                {/* Download PDF button */}
                <TouchableOpacity
                  style={[styles.downloadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => downloadPDF(item)}
                >
                  <Download size={16} color={colors.primary} />
                  <Text style={[styles.downloadButtonText, { color: colors.primary }]}>Télécharger PDF</Text>
                </TouchableOpacity>
                
                {/* Ticket side cutouts */}
                <View style={[styles.cutout, styles.cutoutLeft, { backgroundColor: colors.background, borderColor: colors.outlineVariant }]} />
                <View style={[styles.cutout, styles.cutoutRight, { backgroundColor: colors.background, borderColor: colors.outlineVariant }]} />
              </View>
            )}
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
          
          {/* Review Modal */}
          <Modal
            visible={showReviewModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowReviewModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Donner votre avis</Text>
                  <TouchableOpacity onPress={() => setShowReviewModal(false)} style={styles.modalCloseBtn}>
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.reviewModalBody}>
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity key={star} onPress={() => setRating(star)}>
                        <Star
                          size={40}
                          color={star <= rating ? colors.primary : colors.border}
                          fill={star <= rating ? colors.primary : "transparent"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  <TextInput
                    style={[styles.reviewInput, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.border, color: colors.text }]}
                    placeholder="Partagez votre expérience..."
                    placeholderTextColor={colors.textSecondary}
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline
                    numberOfLines={4}
                  />
                  
                  <TouchableOpacity
                    style={[styles.submitReviewButton, { backgroundColor: colors.primary }]}
                    onPress={submitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={[styles.submitReviewText, { color: "white" }]}>Soumettre l'avis</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
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
    marginBottom: 24,
    overflow: 'hidden',
    position: 'relative',
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  ticketBody: {
    padding: 20,
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
    marginBottom: 24,
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
  qrSection: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
  },
  qrContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 12,
    position: 'relative',
  },
  qrOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  qrHint: {
    fontSize: 12,
    marginTop: 12,
    fontWeight: '600',
  },
  qrId: {
    fontSize: 8,
    marginTop: 4,
    opacity: 0.5,
  },
  ticketFooter: {
    padding: 16,
    alignItems: 'center',
  },
  passengerLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewModalBody: {
    padding: 24,
    gap: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
  },
  submitReviewButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitReviewText: {
    fontSize: 16,
    fontWeight: '700',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderWidth: 1,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cutout: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    top: '40%', // Adjust based on where the divider is
    borderWidth: 1,
    zIndex: 10,
  },
  cutoutLeft: {
    left: -11,
  },
  cutoutRight: {
    right: -11,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  historyInfo: {
    flex: 1,
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
  seatBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  seatText: {
    fontSize: 14,
    fontWeight: '800',
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
