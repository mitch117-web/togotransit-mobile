import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../lib/theme';
import { ArrowLeft, Check, DoorOpen, User, ArrowRight, Info, CreditCard } from 'lucide-react-native';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

export default function SeatSelectionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { tripId, tripOrigin, tripDestination, tripPrice, vehicleType, capacity, passengers } = useLocalSearchParams();
  const { colors, theme } = useTheme();
  const [paymentStep, setPaymentStep] = React.useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<string | null>(null);

  const [selectedSeats, setSelectedSeats] = React.useState<number[]>([]);
  const [occupiedSeats, setOccupiedSeats] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [bookingLoading, setBookingLoading] = React.useState(false);
  const parsedPrice = parseInt(tripPrice as string) || 0;
  const totalPrice = selectedSeats.length * parsedPrice;

  React.useEffect(() => {
    fetchOccupiedSeats();
  }, [tripId]);

  const fetchOccupiedSeats = async () => {
    try {
      const response = await api.get('/bookings', { params: { tripId } });
      const occupied = response.data.map((b: any) => b.seatNumber);
      setOccupiedSeats(occupied);
    } catch (error) {
      console.warn('Failed to fetch occupied seats', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seatNumber: number) => {
    if (occupiedSeats.includes(seatNumber)) return;

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      // Limit to number of passengers requested if specified
      if (passengers && selectedSeats.length >= Number(passengers)) {
        Alert.alert('Info', `Vous avez déjà sélectionné vos ${passengers} places.`);
        return;
      }
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const handleContinue = async () => {
    if (!paymentStep) {
      if (selectedSeats.length === 0) {
        Alert.alert('Info', 'Veuillez sélectionner au moins un siège');
        return;
      }
      setPaymentStep(true);
    } else {
      if (!selectedPaymentMethod) {
        Alert.alert('Info', 'Veuillez sélectionner un mode de paiement');
        return;
      }
      setBookingLoading(true);
      try {
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create bookings for each selected seat
        await Promise.all(selectedSeats.map(seatNumber => 
          api.post('/bookings', {
            tripId,
            userId: user?.id,
            seatNumber,
            paymentMethod: selectedPaymentMethod
          })
        ));

        router.push({
          pathname: '/paiement-reussi',
          params: { 
            tripId: tripId as string,
            seats: selectedSeats.join(', '),
            total: (selectedSeats.length * parseInt(tripPrice as string || '0')).toString()
          }
        });
      } catch (error: any) {
        Alert.alert('Erreur', error.response?.data?.error || 'Échec de la réservation');
      } finally {
        setBookingLoading(false);
      }
    }
  };

  const renderSeat = (seatNumber: number) => {
    const isOccupied = occupiedSeats.includes(seatNumber);
    const isSelected = selectedSeats.includes(seatNumber);

    return (
      <TouchableOpacity
        key={seatNumber}
        disabled={isOccupied}
        onPress={() => toggleSeat(seatNumber)}
        style={[
          styles.seat,
          {
            backgroundColor: isSelected ? colors.primary : isOccupied ? colors.surfaceContainerHighest : colors.surfaceContainerLowest,
            borderColor: isSelected ? colors.primary : colors.outlineVariant,
            shadowColor: isSelected ? colors.primary : '#000',
          },
          isSelected && styles.selectedSeatShadow
        ]}
      >
        {isOccupied ? (
          <User size={20} color={colors.outlineVariant} />
        ) : (
          <Text style={[styles.seatNumber, { color: isSelected ? colors.onPrimary : colors.primary }]}>{seatNumber}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const totalCapacity = parseInt(capacity as string) || 45;
  const rows = [];
  for (let i = 1; i <= totalCapacity; i += 4) {
    rows.push([i, i + 1, i + 2, i + 3].filter(n => n <= totalCapacity));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      <Stack.Screen options={{ 
        title: paymentStep ? 'Paiement' : 'Choix des places',
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => paymentStep ? setPaymentStep(false) : router.back()} 
            style={{ marginLeft: 8 }}
          >
            <ArrowLeft color={colors.primary} size={24} />
          </TouchableOpacity>
        )
      }} />

      {!paymentStep ? (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Route Info Bar */}
            <View style={[styles.infoBar, { backgroundColor: colors.surface }]}>
              <View style={styles.routeContainer}>
                <Text style={[styles.routeText, { color: colors.text }]}>{tripOrigin}</Text>
                <ArrowRight size={16} color={colors.primary} />
                <Text style={[styles.routeText, { color: colors.text }]}>{tripDestination}</Text>
              </View>
              <View style={styles.badgeContainer}>
                <View style={[styles.typeBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{vehicleType}</Text>
                </View>
              </View>
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Libre</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: colors.primary, borderColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Choisi</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: colors.surfaceContainerHighest, borderColor: colors.border }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Occupé</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={[styles.busCanvas, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.busNose} />
                
                <View style={styles.busHeader}>
                  <View style={styles.driverSection}>
                    <View style={[styles.driverSeat, { backgroundColor: colors.surfaceContainerLow }]}>
                      <User size={24} color={colors.textSecondary} />
                    </View>
                    <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>Chauffeur</Text>
                  </View>
                  <View style={styles.entranceSection}>
                    <DoorOpen size={24} color={colors.textSecondary} />
                    <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>Entrée</Text>
                  </View>
                </View>

                <View style={styles.seatLayout}>
                  {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.seatRow}>
                      <View style={styles.seatPair}>
                        {row[0] && renderSeat(row[0])}
                        {row[1] && renderSeat(row[1])}
                      </View>
                      <View style={styles.aisle} />
                      <View style={styles.seatPair}>
                        {row[2] && renderSeat(row[2])}
                        {row[3] && renderSeat(row[3])}
                      </View>
                    </View>
                  ))}
                </View>
                
                <View style={styles.busTail} />
              </View>
            )}

            <View style={styles.selectionNote}>
              <Info size={16} color={colors.textSecondary} />
              <Text style={[styles.noteText, { color: colors.textSecondary }]}>
                Appuyez sur un siège pour le sélectionner ou le désélectionner.
              </Text>
            </View>
          </ScrollView>

          {/* Sticky Footer */}
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.summaryContainer}>
              <Text style={[styles.selectionSummary, { color: colors.textSecondary }]}>
                {selectedSeats.length > 0 
                  ? `${selectedSeats.length} Place${selectedSeats.length > 1 ? 's' : ''} (${selectedSeats.join(', ')})`
                  : 'Aucune place choisie'}
              </Text>
              <Text style={[styles.priceSummary, { color: colors.primary }]}>
                {(selectedSeats.length * parseInt(tripPrice as string || '0')).toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.continueBtn, 
                { backgroundColor: selectedSeats.length > 0 ? colors.primary : colors.border }
              ]}
              onPress={handleContinue}
              disabled={bookingLoading || selectedSeats.length === 0}
            >
              {bookingLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={[styles.continueBtnText, { color: "white" }]}>Continuer</Text>
                  <ArrowRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Route Info Bar */}
            <View style={[styles.infoBar, { backgroundColor: colors.surface }]}>
              <View style={styles.routeContainer}>
                <Text style={[styles.routeText, { color: colors.text }]}>{tripOrigin}</Text>
                <ArrowRight size={16} color={colors.primary} />
                <Text style={[styles.routeText, { color: colors.text }]}>{tripDestination}</Text>
              </View>
              <View style={styles.badgeContainer}>
                <View style={[styles.typeBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{vehicleType}</Text>
                </View>
              </View>
            </View>

            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryCardTitle, { color: colors.text }]}>Résumé</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Places</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  {selectedSeats.length} (Places {selectedSeats.join(', ')})
                </Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.totalPrice, { color: colors.primary }]}>
                  {totalPrice.toLocaleString('fr-FR')} FCFA
                </Text>
              </View>
            </View>

            {/* Payment Methods */}
            <View style={styles.paymentSection}>
              <Text style={[styles.paymentTitle, { color: colors.text }]}>Mode de paiement</Text>
              <TouchableOpacity 
                style={[
                  styles.paymentMethod, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: selectedPaymentMethod === 'TMONEY' ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => setSelectedPaymentMethod('TMONEY')}
              >
                <View style={[styles.paymentIcon, { backgroundColor: '#FFC10720' }]}>
                  <Text style={[styles.paymentIconText, { color: '#FFC107' }]}>TM</Text>
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentName, { color: colors.text }]}>TMoney</Text>
                  <Text style={[styles.paymentDesc, { color: colors.textSecondary }]}>Paiement mobile Togo</Text>
                </View>
                {selectedPaymentMethod === 'TMONEY' && (
                  <Check size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.paymentMethod, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: selectedPaymentMethod === 'FLOOZ' ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => setSelectedPaymentMethod('FLOOZ')}
              >
                <View style={[styles.paymentIcon, { backgroundColor: '#4CAF5020' }]}>
                  <Text style={[styles.paymentIconText, { color: '#4CAF50' }]}>FZ</Text>
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentName, { color: colors.text }]}>Flooz</Text>
                  <Text style={[styles.paymentDesc, { color: colors.textSecondary }]}>Paiement mobile Moov</Text>
                </View>
                {selectedPaymentMethod === 'FLOOZ' && (
                  <Check size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.paymentMethod, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: selectedPaymentMethod === 'CASH' ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => setSelectedPaymentMethod('CASH')}
              >
                <View style={[styles.paymentIcon, { backgroundColor: colors.primaryContainer }]}>
                  <CreditCard size={20} color={colors.primary} />
                </View>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentName, { color: colors.text }]}>Espèces</Text>
                  <Text style={[styles.paymentDesc, { color: colors.textSecondary }]}>Paiement à l'agence</Text>
                </View>
                {selectedPaymentMethod === 'CASH' && (
                  <Check size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Sticky Footer */}
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={styles.summaryContainer}>
              <Text style={[styles.selectionSummary, { color: colors.textSecondary }]}>Total à payer</Text>
              <Text style={[styles.priceSummary, { color: colors.primary }]}>
                {totalPrice.toLocaleString('fr-FR')} FCFA
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.continueBtn, 
                { backgroundColor: selectedPaymentMethod ? colors.primary : colors.border }
              ]}
              onPress={handleContinue}
              disabled={bookingLoading || !selectedPaymentMethod}
            >
              {bookingLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Text style={[styles.continueBtnText, { color: "white" }]}>Payer maintenant</Text>
                  <ArrowRight size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
  },
  summaryCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: '800',
  },
  paymentSection: {
    gap: 16,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIconText: {
    fontSize: 16,
    fontWeight: '800',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  paymentDesc: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '800',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 32,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  busCanvas: {
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    borderRadius: 40,
    borderWidth: 2,
    padding: 20,
    paddingTop: 40,
    position: 'relative',
  },
  busNose: {
    position: 'absolute',
    top: -2,
    left: '20%',
    right: '20%',
    height: 10,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: 'inherit',
  },
  busHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
    borderStyle: 'dashed',
  },
  driverSection: {
    alignItems: 'center',
    gap: 8,
  },
  driverSeat: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entranceSection: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  seatLayout: {
    gap: 20,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seatPair: {
    flexDirection: 'row',
    gap: 12,
  },
  aisle: {
    width: 40,
  },
  seat: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedSeatShadow: {
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  seatNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  occupiedIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  busTail: {
    marginTop: 40,
    height: 10,
    borderTopWidth: 2,
    borderTopColor: '#f0f0f0',
    borderStyle: 'dashed',
  },
  selectionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 32,
    paddingHorizontal: 20,
  },
  noteText: {
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  summaryContainer: {
    gap: 4,
  },
  selectionSummary: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceSummary: {
    fontSize: 20,
    fontWeight: '800',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  continueBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
