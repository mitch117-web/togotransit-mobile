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

const translateParcelStatus = (status?: string) => {
  switch (status) {
    case 'IN_AGENCY': return 'En agence';
    case 'IN_TRANSIT': return 'En transit';
    case 'OUT_FOR_DELIVERY': return 'En livraison';
    case 'DELIVERED': return 'Livré';
    default: return status || '';
  }
};

// Coordonnées réelles (approximatives) des villes togolaises utilisées par
// l'app — permet de tracer un itinéraire départ → destination qui suit la
// vraie géographie du pays plutôt qu'une ligne arbitraire. Le pays n'a pas
// encore de géocodage réel en base (villes.latitude/longitude sont nulles).
const TOGO_CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  'lomé': { latitude: 6.1319, longitude: 1.2228 },
  'lome': { latitude: 6.1319, longitude: 1.2228 },
  'tsévié': { latitude: 6.4167, longitude: 1.2167 },
  'tsevie': { latitude: 6.4167, longitude: 1.2167 },
  'aného': { latitude: 6.2333, longitude: 1.6000 },
  'aneho': { latitude: 6.2333, longitude: 1.6000 },
  'kpalimé': { latitude: 6.9000, longitude: 0.6333 },
  'kpalime': { latitude: 6.9000, longitude: 0.6333 },
  'atakpamé': { latitude: 7.5333, longitude: 1.1333 },
  'atakpame': { latitude: 7.5333, longitude: 1.1333 },
  'sokodé': { latitude: 8.9833, longitude: 1.1333 },
  'sokode': { latitude: 8.9833, longitude: 1.1333 },
  'kara': { latitude: 9.5511, longitude: 1.1861 },
  'bafilo': { latitude: 9.3500, longitude: 1.2833 },
  'mango': { latitude: 10.3667, longitude: 0.4667 },
  'dapaong': { latitude: 10.8628, longitude: 0.2078 },
  'cinkassé': { latitude: 11.0833, longitude: 0.2833 },
  'cinkasse': { latitude: 11.0833, longitude: 0.2833 },
};

const getCityCoord = (nom?: string) => {
  const key = (nom || '').trim().toLowerCase();
  return TOGO_CITY_COORDS[key] || TOGO_CITY_COORDS['lomé'];
};

// Distance à vol d'oiseau (formule de haversine) entre deux coordonnées GPS,
// en kilomètres.
const haversineKm = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h))
};

// Estimation réelle (distance haversine / vitesse moyenne route togolaise
// ~50 km/h) — pas de simulation, un vrai calcul à partir des coordonnées
// connues du trajet.
const AVG_SPEED_KMH = 50
const formatEta = (km: number) => {
  const minutes = Math.max(5, Math.round((km / AVG_SPEED_KMH) * 60))
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h} h ${m} min` : `${h} h`
};

// Région par défaut couvrant tout le Togo, affichée le temps que la carte
// se cadre précisément sur l'itinéraire réel (voir fitToCoordinates).
const TOGO_DEFAULT_REGION = { latitude: 8.2, longitude: 1.0, latitudeDelta: 6.5, longitudeDelta: 3.2 };

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
  const watchSubscription = React.useRef<any>(null);
  const mapRef = React.useRef<any>(null);

  const isAssignedDriver = !!(user?.id && parcel?.driverId && user.id === parcel.driverId);

  const originCoord = getCityCoord(parcel?.origin);
  const destCoord = getCityCoord(parcel?.destination);
  const routeCoordinates = [originCoord, destCoord];

  // ETA recalculée à partir de la vraie position (si connue) ou du départ,
  // jamais figée.
  const eta = parcel
    ? formatEta(haversineKm(hasRealLocation && driverLocation ? driverLocation : originCoord, destCoord))
    : '—';

  useEffect(() => {
    if (!parcelId) return;
    fetchParcel();
    const poll = setInterval(fetchParcel, 5000);
    return () => clearInterval(poll);
  }, [parcelId]);

  useEffect(() => {
    return () => {
      watchSubscription.current?.remove?.();
    };
  }, []);

  // Pas de simulation de déplacement : tant qu'aucune position GPS réelle
  // n'a été partagée par le chauffeur, on affiche simplement l'itinéraire
  // (départ → destination), cadré proprement sur la carte. Si une position
  // réelle arrive, elle est intégrée au cadrage.
  useEffect(() => {
    if (!parcel) return;
    const points = hasRealLocation && driverLocation
      ? [originCoord, driverLocation, destCoord]
      : [originCoord, destCoord];
    mapRef.current?.fitToCoordinates?.(points, {
      edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
      animated: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcel, hasRealLocation, driverLocation]);

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
          {isAssignedDriver || hasRealLocation ? 'Suivi en Direct' : 'Itinéraire du Colis'}
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
              ref={mapRef}
              style={styles.map}
              initialRegion={TOGO_DEFAULT_REGION}
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
                  {translateParcelStatus(parcel.status)}
                </Text>
              </View>
            </View>

            <View style={styles.etaSection}>
              <View style={[styles.etaIcon, { backgroundColor: colors.secondaryContainer }]}>
                <Clock size={20} color={colors.secondary} />
              </View>
              <View style={styles.etaDetails}>
                <Text style={[styles.etaLabel, { color: colors.textSecondary }]}>
                  {hasRealLocation ? "Temps d'arrivée estimé" : "Estimation (itinéraire, sans position live)"}
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
                <Navigation size={20} color={colors.onPrimary} />
                <Text style={[styles.actionButtonText, { color: colors.onPrimary }]}>
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

            {!isAssignedDriver && !hasRealLocation && (
              <View style={[styles.trackingActive, { backgroundColor: colors.textSecondary + '15', borderColor: colors.border }]}>
                <Truck size={16} color={colors.textSecondary} />
                <Text style={[styles.trackingText, { color: colors.textSecondary }]}>
                  {parcel.driverId
                    ? "En attente de la position du chauffeur — itinéraire prévu affiché"
                    : "Aucun chauffeur assigné pour l'instant — itinéraire prévu affiché"}
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
