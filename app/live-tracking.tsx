import React, { useState, useEffect, lazy, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { MapPin, Navigation, Clock, X, RefreshCw, Package, Truck } from 'lucide-react-native';
import api from '../lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GlassCard from '../components/ui/GlassCard';

// Charger react-native-maps seulement sur mobile
const MapView = Platform.OS !== 'web' 
  ? lazy(() => import('react-native-maps').then(mod => ({ default: mod.default })))
  : ({ style }: { style?: any }) => {
      const { colors } = useTheme();
      return (
        <View style={[style, styles.webMapPlaceholder, { backgroundColor: colors.surface }]}>
          <Text style={[styles.webMapText, { color: colors.text }]}>
            Carte disponible sur mobile uniquement
          </Text>
        </View>
      );
    };

const Marker = Platform.OS !== 'web'
  ? lazy(() => import('react-native-maps').then(mod => ({ default: mod.Marker })))
  : () => null;

const Polyline = Platform.OS !== 'web'
  ? lazy(() => import('react-native-maps').then(mod => ({ default: mod.Polyline })))
  : () => null;

export default function LiveTrackingScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { parcelId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [parcel, setParcel] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<any>(null);
  const [hasRealLocation, setHasRealLocation] = useState(false);
  const [region, setRegion] = useState<any>({
    latitude: 6.1725,
    longitude: 1.2314,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [eta, setEta] = useState('25 min');
  const watchSubscription = React.useRef<any>(null);

  // Route de secours (démo) utilisée uniquement tant qu'aucune position GPS
  // réelle n'a encore été reçue du chauffeur.
  const routeCoordinates = [
    { latitude: 6.1725, longitude: 1.2314 }, // Lomé
    { latitude: 6.1525, longitude: 1.2514 },
    { latitude: 6.1325, longitude: 1.2714 },
    { latitude: 6.1125, longitude: 1.2914 },
    { latitude: 6.0925, longitude: 1.3114 },
  ];

  const isAssignedDriver = !!(user?.id && parcel?.driverId && user.id === parcel.driverId);

  useEffect(() => {
    if (!parcelId) return;
    fetchParcel();
    const poll = setInterval(fetchParcel, 5000);
    let simIndex = 0;
    const sim = setInterval(() => {
      if (hasRealLocation) return;
      const newLocation = routeCoordinates[simIndex % routeCoordinates.length];
      setDriverLocation(newLocation);
      setRegion({ ...newLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      simIndex++;
    }, 3000);
    return () => {
      clearInterval(poll);
      clearInterval(sim);
    };
  }, [parcelId, hasRealLocation]);

  useEffect(() => {
    return () => {
      watchSubscription.current?.remove?.();
    };
  }, []);

  const fetchParcel = async () => {
    try {
      const response = await api.get(`/parcels/${parcelId}`);
      const found = response.data;
      setParcel(found);

      try {
        const history = JSON.parse(found?.statusHistory || '[]');
        const lastGps = [...history].reverse().find((entry: any) => entry?.metadata?.latitude);
        if (lastGps) {
          const loc = { latitude: lastGps.metadata.latitude, longitude: lastGps.metadata.longitude };
          setDriverLocation(loc);
          setRegion({ ...loc, latitudeDelta: 0.01, longitudeDelta: 0.01 });
          setHasRealLocation(true);
        }
      } catch (_) {
        // historique invalide, on garde la position précédente
      }
    } catch (error) {
      console.warn('Failed to fetch parcel', error);
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre position pour le suivi en direct.');
      return;
    }
    setTracking(true);
    watchSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 8000, distanceInterval: 20 },
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await api.post(`/parcels/${parcelId}/location`, { latitude, longitude });
        } catch (error) {
          console.warn('Failed to push location', error);
        }
      }
    );
  };

  const stopTracking = () => {
    watchSubscription.current?.remove?.();
    watchSubscription.current = null;
    setTracking(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Suivi en Direct
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchParcel}>
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        {Platform.OS !== 'web' ? (
          <Suspense fallback={<ActivityIndicator size="large" color={colors.primary} />}>
            <MapView
              style={styles.map}
              region={region}
              showsUserLocation={isAssignedDriver}
              showsMyLocationButton={isAssignedDriver}
            >
              {driverLocation && (
                <Marker
                  coordinate={driverLocation}
                  title="Votre chauffeur"
                  description="En route vers vous"
                >
                  <View style={[styles.driverMarker, { backgroundColor: colors.primary }]}>
                    <Truck size={20} color="white" />
                  </View>
                </Marker>
              )}

              {parcel && (
                <>
                  <Marker
                    coordinate={routeCoordinates[0]}
                    title="Point de départ"
                    description={parcel.origin}
                  >
                    <View style={[styles.originMarker, { backgroundColor: colors.secondary }]}>
                      <MapPin size={16} color="white" />
                    </View>
                  </Marker>

                  <Marker
                    coordinate={routeCoordinates[routeCoordinates.length - 1]}
                    title="Destination"
                    description={parcel.destination}
                  >
                    <View style={[styles.destinationMarker, { backgroundColor: colors.success }]}>
                      <Package size={16} color="white" />
                    </View>
                  </Marker>
                </>
              )}

              <Polyline
                coordinates={routeCoordinates}
                strokeColor={colors.primary}
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            </MapView>
          </Suspense>
        ) : (
          <MapView style={styles.map} />
        )}
      </View>

      {/* Bottom Info Panel */}
      <GlassCard style={styles.infoPanel} borderRadius={24}>
        {parcel && (
          <>
            <View style={styles.parcelInfo}>
              <View style={[styles.parcelIcon, { backgroundColor: colors.primaryContainer }]}>
                <Package size={24} color={colors.primary} />
              </View>
              <View style={styles.parcelDetails}>
                <Text style={[styles.trackingId, { color: colors.text }]}>
                  {parcel.trackingId}
                </Text>
                <Text style={[styles.parcelStatus, { color: colors.primary }]}>
                  En Transit
                </Text>
              </View>
            </View>

            <View style={styles.etaSection}>
              <View style={[styles.etaIcon, { backgroundColor: colors.secondaryContainer }]}>
                <Clock size={20} color={colors.secondary} />
              </View>
              <View style={styles.etaDetails}>
                <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>
                  Temps d'arrivée estimé
                </Text>
                <Text style={[styles.etaValue, { color: colors.text }]}>
                  {eta}
                </Text>
              </View>
            </View>

            <View style={styles.routeInfo}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.routeText, { color: colors.text }]}>
                  {parcel.origin}
                </Text>
              </View>
              <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.routeText, { color: colors.text }]}>
                  {parcel.destination}
                </Text>
              </View>
            </View>

            {isAssignedDriver && !tracking && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={startTracking}
              >
                <Navigation size={20} color="white" />
                <Text style={styles.actionButtonText}>
                  Partager ma position
                </Text>
              </TouchableOpacity>
            )}

            {isAssignedDriver && tracking && (
              <TouchableOpacity
                style={[styles.trackingActive, { backgroundColor: colors.success + '20', borderColor: colors.success }]}
                onPress={stopTracking}
              >
                <View style={styles.pulseDot} />
                <Text style={[styles.trackingText, { color: colors.success }]}>
                  Position partagée en direct — Arrêter
                </Text>
              </TouchableOpacity>
            )}

            {!isAssignedDriver && hasRealLocation && (
              <View style={[styles.trackingActive, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
                <View style={styles.pulseDot} />
                <Text style={[styles.trackingText, { color: colors.success }]}>
                  Position du chauffeur en direct
                </Text>
              </View>
            )}
          </>
        )}
      </GlassCard>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webMapPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMapText: {
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  refreshButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  driverMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  originMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  destinationMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoPanel: {
    padding: 24,
    gap: 20,
  },
  parcelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  parcelIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parcelDetails: {
    flex: 1,
  },
  trackingId: {
    fontSize: 18,
    fontWeight: '800',
  },
  parcelStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  etaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  etaIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  etaDetails: {
    flex: 1,
  },
  etaLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  routeLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 16,
  },
  actionButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  trackingActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
  },
  trackingText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
