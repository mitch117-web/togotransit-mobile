import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { MapPin, Navigation, Clock, X, RefreshCw, Package, Truck, Locate } from 'lucide-react-native';
import api from '../lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import GlassCard from '../components/ui/GlassCard';

// react-native-maps (MapView native) a été retiré : la vraie MapView Android
// nécessite une clé Google Maps (app.json -> android.config.googleMaps.apiKey)
// qui n'est pas configurée, et son absence faisait planter l'appli dès que cet
// écran s'ouvrait sur un vrai appareil. On affiche à la place une carte
// Leaflet/OpenStreetMap (gratuite, sans clé) dans une WebView — react-native-webview
// est déjà une dépendance du projet, donc aucune reconstruction native n'est
// nécessaire et ça fonctionne aussi bien dans Expo Go que dans un build EAS.
const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #e5e7eb; }
    .tt-dot { border-radius: 50%; border: 3px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.4); }
    .tt-driver { border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; font-size: 13px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([8.2, 1.0], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

    var originIcon = L.divIcon({ className: '', iconSize: [16, 16], html: '<div class="tt-dot" style="width:16px;height:16px;background:#3b82f6"></div>' });
    var destIcon = L.divIcon({ className: '', iconSize: [16, 16], html: '<div class="tt-dot" style="width:16px;height:16px;background:#10b981"></div>' });
    var driverIcon = L.divIcon({ className: '', iconSize: [26, 26], html: '<div class="tt-driver" style="width:26px;height:26px;background:#f97316">🚌</div>' });

    var originMarker = null, destMarker = null, driverMarker = null, routeLine = null;

    var lastPoints = null;

    // Le paramètre fit ne doit être vrai qu'au premier appel (ou sur demande
    // explicite via recenter()) : le suivi relance updateMap toutes les 5-8s
    // pour déplacer le chauffeur, et refaire un fitBounds à chaque fois
    // annulait tout zoom/pan manuel de l'utilisateur — il se faisait
    // recentrer de force en boucle.
    function updateMap(origin, dest, driver, fit) {
      if (originMarker) map.removeLayer(originMarker);
      if (destMarker) map.removeLayer(destMarker);
      if (driverMarker) map.removeLayer(driverMarker);
      if (routeLine) map.removeLayer(routeLine);

      originMarker = L.marker([origin.latitude, origin.longitude], { icon: originIcon }).addTo(map);
      destMarker = L.marker([dest.latitude, dest.longitude], { icon: destIcon }).addTo(map);

      var points = [[origin.latitude, origin.longitude]];
      if (driver) {
        driverMarker = L.marker([driver.latitude, driver.longitude], { icon: driverIcon }).addTo(map);
        points.push([driver.latitude, driver.longitude]);
      }
      points.push([dest.latitude, dest.longitude]);
      lastPoints = points;

      routeLine = L.polyline(points, { color: '#f97316', weight: 3, opacity: 0.85, dashArray: driver ? null : '6 8' }).addTo(map);
      if (fit) {
        map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
      }
    }

    function recenter() {
      if (lastPoints) {
        map.fitBounds(L.latLngBounds(lastPoints), { padding: [48, 48] });
      }
    }

    window.updateMap = updateMap;
    window.recenter = recenter;
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage('ready');
  </script>
</body>
</html>`;

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
  const [mapReady, setMapReady] = useState(false);
  const watchSubscription = React.useRef<any>(null);
  const webviewRef = useRef<WebView>(null);
  const hasFittedRef = useRef(false);

  const isAssignedDriver = !!(user?.id && parcel?.driverId && user.id === parcel.driverId);

  const originCoord = getCityCoord(parcel?.origin);
  const destCoord = getCityCoord(parcel?.destination);

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
  // réelle arrive, elle est intégrée au cadrage. La carte Leaflet vit dans
  // une WebView chargée une seule fois : on met à jour ses marqueurs via
  // injectJavaScript plutôt que de recharger le HTML à chaque changement.
  useEffect(() => {
    if (!parcel || !mapReady) return;
    const driver = hasRealLocation && driverLocation ? driverLocation : null;
    const fit = !hasFittedRef.current;
    hasFittedRef.current = true;
    const js = `updateMap(${JSON.stringify(originCoord)}, ${JSON.stringify(destCoord)}, ${JSON.stringify(driver)}, ${fit}); true;`;
    webviewRef.current?.injectJavaScript(js);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parcel, mapReady, hasRealLocation, driverLocation, originCoord.latitude, originCoord.longitude, destCoord.latitude, destCoord.longitude]);

  const handleMapMessage = useCallback(() => {
    setMapReady(true);
  }, []);

  const recenterMap = useCallback(() => {
    webviewRef.current?.injectJavaScript('recenter(); true;');
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
        <WebView
          ref={webviewRef}
          source={{ html: MAP_HTML }}
          style={styles.map}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onMessage={handleMapMessage}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.map, styles.webMapPlaceholder, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          renderError={() => (
            <View style={[styles.map, styles.webMapPlaceholder, { backgroundColor: colors.surface }]}>
              <Text style={[styles.webMapText, { color: colors.text }]}>
                Carte indisponible — vérifiez votre connexion internet
              </Text>
            </View>
          )}
        />
        {mapReady && (
          <TouchableOpacity
            style={[styles.recenterBtn, { backgroundColor: colors.surface }]}
            onPress={recenterMap}
            activeOpacity={0.8}
          >
            <Locate size={20} color={colors.primary} />
          </TouchableOpacity>
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
  recenterBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
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
