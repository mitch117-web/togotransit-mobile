import * as React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ImageBackground, Platform, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { MapPin, Calendar, Users, ArrowLeft, Search, Navigation, ArrowUpDown, ShieldCheck, Plus, Minus } from 'lucide-react-native';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BookingScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [origin, setOrigin] = React.useState('');
  const [destination, setDestination] = React.useState('');
  const [date, setDate] = React.useState(new Date());
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [passengers, setPassengers] = React.useState(1);

  const handleSearch = () => {
    router.push({
      pathname: '/search-results',
      params: { 
        origin, 
        destination, 
        date: date.toISOString(),
        passengers: passengers.toString()
      }
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const swapRoute = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ 
        title: 'Voyage',
        headerShown: false
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <ImageBackground 
            source={{ uri: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80' }}
            style={styles.heroImage}
          >
            <View style={styles.heroOverlay}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ArrowLeft color="white" size={24} />
              </TouchableOpacity>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>Où allez-vous ?</Text>
                <Text style={styles.heroSubtitle}>Réservez votre billet de bus à travers le Togo.</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Search Form */}
        <View style={[styles.searchCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant + '40' }]}>
          <View style={[styles.routeSection, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '20' }]}>
            {/* Timeline Line */}
            <View style={[styles.timelineLine, { backgroundColor: colors.outlineVariant + '40' }]} />
            
            {/* Origin Field */}
            <View style={styles.inputRow}>
              <View style={[styles.dotContainer, { borderColor: colors.primary }]}>
                <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              </View>
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Ville de départ</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={18} color={colors.outline} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.fieldInput, { color: colors.onSurface }]}
                    placeholder="Sélectionnez le départ"
                    placeholderTextColor={colors.outline}
                    value={origin}
                    onChangeText={setOrigin}
                  />
                </View>
              </View>
            </View>

            {/* Destination Field */}
            <View style={styles.inputRow}>
              <View style={[styles.dotContainer, { backgroundColor: colors.secondaryContainer, borderColor: 'transparent' }]}>
                <MapPin size={14} color={colors.onSecondaryContainer} />
              </View>
              <View style={styles.fieldContainer}>
                <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Ville d'arrivée</Text>
                <View style={styles.inputWrapper}>
                  <Navigation size={18} color={colors.outline} style={styles.fieldIcon} />
                  <TextInput
                    style={[styles.fieldInput, { color: colors.onSurface }]}
                    placeholder="Entrez la destination"
                    placeholderTextColor={colors.outline}
                    value={destination}
                    onChangeText={setDestination}
                  />
                </View>
              </View>
            </View>

            {/* Swap Button */}
            <TouchableOpacity 
              style={[styles.swapBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant + '60' }]}
              onPress={swapRoute}
            >
              <ArrowUpDown color={colors.primary} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.secondaryGrid}>
            {/* Date Field */}
            <TouchableOpacity 
              style={styles.gridItem}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Date de départ</Text>
              <View style={[styles.gridInput, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
                <Calendar size={18} color={colors.outline} style={styles.fieldIcon} />
                <Text style={[styles.gridInputText, { color: colors.onSurface }]}>
                  {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Passengers Field */}
            <View style={styles.gridItem}>
              <Text style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>Passagers</Text>
              <View style={[styles.gridInput, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
                <Users size={18} color={colors.outline} style={styles.fieldIcon} />
                <View style={styles.passengerControls}>
                  <Text style={[styles.gridInputText, { color: colors.onSurface, flex: 1 }]}>
                    {passengers} Adulte{passengers > 1 ? 's' : ''}
                  </Text>
                  <View style={[styles.counterContainer, { backgroundColor: colors.surfaceContainerLow }]}>
                    <TouchableOpacity 
                      style={styles.counterBtn}
                      onPress={() => setPassengers(Math.max(1, passengers - 1))}
                    >
                      <Minus size={16} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                    <Text style={[styles.counterValue, { color: colors.onSurface }]}>{passengers}</Text>
                    <TouchableOpacity 
                      style={[styles.counterBtn, { backgroundColor: colors.primary }]}
                      onPress={() => setPassengers(passengers + 1)}
                    >
                      <Plus size={16} color={colors.onPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          <TouchableOpacity 
            style={[styles.searchBtn, { backgroundColor: colors.secondaryContainer }]}
            onPress={handleSearch}
          >
            <Search size={24} color={colors.onSecondaryContainer} strokeWidth={3} />
            <Text style={[styles.searchBtnText, { color: colors.onSecondaryContainer }]}>Rechercher</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.surfaceVariant }]}>
          <ShieldCheck size={24} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.onSurface }]}>Paiement Mobile Sécurisé</Text>
            <Text style={[styles.infoSubtitle, { color: colors.onSurfaceVariant }]}>
              Accepte TMoney et Flooz pour des réservations rapides et sans contact.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    height: 240,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,38,83,0.6)',
    padding: 24,
    justifyContent: 'space-between',
    paddingTop: 50,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  searchCard: {
    marginHorizontal: 20,
    marginTop: -30,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  routeSection: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 20,
    position: 'relative',
    marginBottom: 20,
  },
  timelineLine: {
    position: 'absolute',
    left: 31,
    top: 40,
    bottom: 40,
    width: 2,
    zIndex: 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    zIndex: 1,
  },
  dotContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fieldContainer: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldIcon: {
    marginRight: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  swapBtn: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  secondaryGrid: {
    gap: 16,
    marginBottom: 20,
  },
  gridItem: {
    flex: 1,
  },
  gridInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  gridInputText: {
    fontSize: 15,
    fontWeight: '600',
  },
  passengerControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 8,
    gap: 10,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 14,
    fontWeight: '700',
    width: 16,
    textAlign: 'center',
  },
  searchBtn: {
    height: 60,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchBtnText: {
    fontSize: 18,
    fontWeight: '800',
  },
  infoBanner: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
});
