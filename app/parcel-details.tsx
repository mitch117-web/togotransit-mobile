import * as React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Image, Dimensions, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { ArrowLeft, Package, MapPin, Clock, Info, CheckCircle2, ChevronRight, Copy, Share2, Navigation, Calendar, User, Phone, Weight, Map as MapIcon, Truck } from 'lucide-react-native';
import api from '../lib/api';
import { useAuth } from '../lib/auth';

const { width } = Dimensions.get('window');

export default function ParcelDetailsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { parcelId } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [parcel, setParcel] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  
  // LIVE TRACKING COORDINATES
  const [liveLocation, setLiveLocation] = React.useState<{lat: number, lng: number} | null>(null);

  React.useEffect(() => {
    fetchParcelDetails();
    
    // Set up polling for updates every 5 seconds if not delivered
    const interval = setInterval(() => {
      if (parcel?.status && parcel.status !== 'DELIVERED') {
        fetchParcelDetails(true); // silent fetch
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [parcelId, parcel?.status]);

  const fetchParcelDetails = async (silent = false) => {
    try {
      // On force un peu le chargement si ce n'est pas un refresh ou silent
      if (!refreshing && !silent) setLoading(true);
      
      const response = await api.get(`/parcels/${parcelId}`);
      const found = response.data;
      
      if (found) {
        // Extract latest live location from history
        try {
          const history = JSON.parse(found.statusHistory || '[]');
          const lastGpsUpdate = [...history].reverse().find(entry => entry.metadata?.latitude);
          if (lastGpsUpdate) {
            setLiveLocation({
              lat: lastGpsUpdate.metadata.latitude,
              lng: lastGpsUpdate.metadata.longitude
            });
          }
        } catch (e) {
          console.log('Error parsing history for GPS');
        }
      }

      setParcel(found);
    } catch (error) {
      console.error('Failed to fetch parcel details', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchParcelDetails();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'CREATED': return { label: 'Créé', color: colors.outline, bg: colors.surfaceContainerHigh };
      case 'PENDING': return { label: 'En attente', color: colors.secondary, bg: colors.secondaryContainer };
      case 'IN_AGENCY': return { label: 'En agence', color: colors.primary, bg: colors.primaryContainer };
      case 'IN_TRANSIT': return { label: 'En transit', color: '#006adc', bg: '#d1e4ff' };
      case 'OUT_FOR_DELIVERY': return { label: 'En livraison', color: '#9d4300', bg: '#ffdbca' };
      case 'DELIVERED': return { label: 'Livré', color: colors.success, bg: colors.success + '20' };
      default: return { label: status, color: colors.outline, bg: colors.surfaceContainerHigh };
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceContainerLow, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!parcel) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' }]}>
        <Package size={64} color={colors.outlineVariant} strokeWidth={1} />
        <Text style={[styles.errorTitle, { color: colors.onSurface }]}>Colis non trouvé</Text>
        <Text style={[styles.errorSubtitle, { color: colors.onSurfaceVariant }]}>Nous n'avons pas pu trouver les informations pour ce colis.</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.backBtnText, { color: colors.onPrimary }]}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getStatusInfo(parcel.status);
  const history = JSON.parse(parcel.statusHistory || '[]');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      <Stack.Screen options={{ 
        title: 'Suivi de colis',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
            <ArrowLeft color={colors.primary} size={24} />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 8 }}>
            <Share2 color={colors.primary} size={20} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Tracking ID & Status Header */}
        <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Numéro de suivi</Text>
              <View style={styles.trackingIdRow}>
                <Text style={[styles.trackingId, { color: colors.onSurface }]}>{parcel.trackingId}</Text>
                <TouchableOpacity style={styles.copyBtn}>
                  <Copy size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant + '40' }]} />
          
          <View style={styles.routeHeader}>
            <View style={styles.routePoint}>
              <MapPin size={18} color={colors.primary} />
              <Text style={[styles.routeName, { color: colors.onSurface }]}>{parcel.origin}</Text>
            </View>
            <View style={[styles.routeLine, { backgroundColor: colors.outlineVariant + '60' }]} />
            <View style={styles.routePoint}>
              <Navigation size={18} color={colors.secondary} />
              <Text style={[styles.routeName, { color: colors.onSurface }]}>{parcel.destination}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
            <Clock size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.onSurface }]}>Est. Livraison</Text>
            <Text style={[styles.actionBtnValue, { color: colors.primary }]}>24 Mai</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
            <Weight size={20} color={colors.secondary} />
            <Text style={[styles.actionBtnText, { color: colors.onSurface }]}>Poids total</Text>
            <Text style={[styles.actionBtnValue, { color: colors.secondary }]}>{parcel.weight} KG</Text>
          </TouchableOpacity>
        </View>

        {/* Map Visualization (Simulated Live Tracking) */}
        {parcel.status !== 'DELIVERED' && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Localisation en direct</Text>
            <View style={[styles.liveBadge, { backgroundColor: colors.success + '20' }]}>
              <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.liveText, { color: colors.success }]}>{liveLocation ? 'LIVE' : 'EST.'}</Text>
            </View>
          </View>
          <View style={[styles.mapContainer, { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.outlineVariant + '40' }]}>
            {/* Simulated Map Background (Togo Path) */}
            <View style={styles.simulatedMap}>
              <View style={[styles.mainRoad, { backgroundColor: colors.outlineVariant + '40' }]} />
              
              {/* Origin Point */}
              <View style={[styles.mapMarker, { top: '80%', left: '45%' }]}>
                <View style={[styles.markerDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.markerLabel, { color: colors.onSurfaceVariant }]}>{parcel.origin}</Text>
              </View>

              {/* Destination Point */}
              <View style={[styles.mapMarker, { top: '20%', left: '55%' }]}>
                <View style={[styles.markerDot, { backgroundColor: colors.secondary }]} />
                <Text style={[styles.markerLabel, { color: colors.onSurfaceVariant }]}>{parcel.destination}</Text>
              </View>

              {/* Moving Parcel (Live or Simulated) */}
              <View style={[styles.truckMarker, { 
                top: liveLocation 
                  ? '50%' // Here we could use real math to map GPS to UI 
                  : parcel.status === 'DELIVERED' ? '20%' : parcel.status === 'IN_TRANSIT' ? '50%' : '80%', 
                left: liveLocation ? '50%' : parcel.status === 'DELIVERED' ? '55%' : parcel.status === 'IN_TRANSIT' ? '50%' : '45%',
                backgroundColor: colors.primary,
                borderWidth: liveLocation ? 3 : 0,
                borderColor: 'white'
              }]}>
                <Truck size={14} color="white" />
                {liveLocation && (
                  <View style={[styles.liveIndicator, { backgroundColor: colors.success }]} />
                )}
              </View>
            </View>

            <View style={styles.mapOverlay}>
              <View style={styles.mapActions}>
                <TouchableOpacity style={[styles.mapActionBtn, { backgroundColor: colors.surface }]}>
                  <Navigation size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        )}

        {/* Proof of Delivery (POD) */}
        {parcel.status === 'DELIVERED' && parcel.pod && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Preuve de livraison</Text>
              <CheckCircle2 size={20} color={colors.success} />
            </View>
            <View style={[styles.podCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
              {parcel.pod.photoUrl && (
                <View style={styles.podSection}>
                  <Text style={[styles.podLabel, { color: colors.onSurfaceVariant }]}>Photo de remise</Text>
                  <View style={styles.podPhotoContainer}>
                    <Image source={{ uri: parcel.pod.photoUrl }} style={styles.podPhoto} />
                  </View>
                </View>
              )}
              
              {parcel.pod.signatureUrl && (
                <View style={styles.podSection}>
                  <View style={styles.podLabelRow}>
                    <Text style={[styles.podLabel, { color: colors.onSurfaceVariant }]}>Signature du destinataire</Text>
                    <View style={[styles.verifiedBadge, { backgroundColor: colors.success + '20' }]}>
                      <CheckCircle2 size={12} color={colors.success} />
                      <Text style={[styles.verifiedText, { color: colors.success }]}>CONFIRMÉE</Text>
                    </View>
                  </View>
                  <View style={[styles.signatureContainer, { backgroundColor: colors.surfaceContainerLow }]}>
                    <Image source={{ uri: parcel.pod.signatureUrl }} style={styles.signaturePhoto} resizeMode="contain" />
                  </View>
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: colors.outlineVariant + '20', marginVertical: 12 }]} />
              
              <View style={styles.podMeta}>
                <Clock size={14} color={colors.outline} />
                <Text style={[styles.podMetaText, { color: colors.outline }]}>
                  Livré le {new Date(parcel.pod.deliveredAt || parcel.pod.updatedAt).toLocaleString('fr-FR')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Parcel Photo Display (Original) */}
        {parcel.photo && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Photo du colis</Text>
            <View style={[styles.parcelPhotoCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
              <Image source={{ uri: parcel.photo }} style={styles.parcelPhotoLarge} />
            </View>
          </View>
        )}

        {/* Timeline Tracking */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Historique du parcours</Text>
          <View style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
            {history.length > 0 ? history.map((item: any, index: number) => {
              const isLatest = index === history.length - 1;
              const isFirst = index === 0;
              const info = getStatusInfo(item.status);
              
              return (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot, 
                      { backgroundColor: isLatest ? info.color : colors.outlineVariant + '60' },
                      isLatest && { shadowColor: info.color, elevation: 4 }
                    ]} />
                    {!isFirst && <View style={[styles.timelineLineFull, { backgroundColor: colors.outlineVariant + '40' }]} />}
                  </View>
                  <View style={styles.timelineRight}>
                    <View style={styles.timelineHeader}>
                      <Text style={[styles.timelineStatus, { color: isLatest ? info.color : colors.onSurface, fontWeight: isLatest ? '800' : '600' }]}>
                        {info.label}
                      </Text>
                      <Text style={[styles.timelineTime, { color: colors.onSurfaceVariant }]}>
                        {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={[styles.timelineLocation, { color: colors.onSurfaceVariant }]}>{item.location}</Text>
                    <Text style={[styles.timelineDate, { color: colors.outline }]}>
                      {new Date(item.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                </View>
              );
            }).reverse() : (
              <View style={styles.emptyTimeline}>
                <Clock size={40} color={colors.outlineVariant} />
                <Text style={[styles.emptyTimelineText, { color: colors.onSurfaceVariant }]}>L'historique sera mis à jour dès que le colis bougera.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contacts Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Informations de contact</Text>
          <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
            <View style={styles.contactItem}>
              <View style={[styles.contactIcon, { backgroundColor: colors.primaryContainer }]}>
                <User size={18} color={colors.primary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactLabel, { color: colors.onSurfaceVariant }]}>Expéditeur</Text>
                <Text style={[styles.contactName, { color: colors.onSurface }]}>{parcel.senderName || user?.name}</Text>
                <Text style={[styles.contactPhone, { color: colors.onSurfaceVariant }]}>{parcel.senderPhone || user?.phone}</Text>
              </View>
            </View>
            
            <View style={[styles.divider, { backgroundColor: colors.outlineVariant + '20', marginVertical: 12 }]} />
            
            <View style={styles.contactItem}>
              <View style={[styles.contactIcon, { backgroundColor: colors.secondaryContainer }]}>
                <User size={18} color={colors.secondary} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactLabel, { color: colors.onSurfaceVariant }]}>Destinataire</Text>
                <Text style={[styles.contactName, { color: colors.onSurface }]}>{parcel.receiverName}</Text>
                <Text style={[styles.contactPhone, { color: colors.onSurfaceVariant }]}>{parcel.receiverPhone}</Text>
              </View>
              <TouchableOpacity style={[styles.callBtn, { backgroundColor: colors.secondaryContainer }]}>
                <Phone size={18} color={colors.onSecondaryContainer} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Parcel Specs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Spécifications du colis</Text>
          <View style={[styles.specsCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: colors.onSurfaceVariant }]}>Catégorie</Text>
              <Text style={[styles.specValue, { color: colors.onSurface }]}>{parcel.category}</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: colors.onSurfaceVariant }]}>Paiement</Text>
              <View style={[styles.payBadge, { backgroundColor: parcel.paymentStatus === 'PAID' ? colors.success + '15' : colors.error + '15' }]}>
                <Text style={[styles.payText, { color: parcel.paymentStatus === 'PAID' ? colors.success : colors.error }]}>
                  {parcel.paymentStatus === 'PAID' ? 'PAYÉ' : 'À RÉGLER'}
                </Text>
              </View>
            </View>
            <View style={styles.specItem}>
              <Text style={[styles.specLabel, { color: colors.onSurfaceVariant }]}>Créé le</Text>
              <Text style={[styles.specValue, { color: colors.onSurface }]}>
                {new Date(parcel.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  trackingIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingId: {
    fontSize: 22,
    fontWeight: '800',
  },
  copyBtn: {
    padding: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    width: '100%',
    marginBottom: 20,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routePoint: {
    alignItems: 'center',
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  routeLine: {
    height: 1,
    flex: 0.4,
    marginHorizontal: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtnValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  section: {
    marginTop: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mapContainer: {
    height: 180,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  simulatedMap: {
    ...StyleSheet.absoluteFillObject,
    padding: 20,
  },
  mainRoad: {
    position: 'absolute',
    width: 4,
    height: '100%',
    left: '50%',
    marginLeft: -2,
    borderRadius: 2,
  },
  mapMarker: {
    position: 'absolute',
    alignItems: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  markerLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  truckMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 10,
  },
  liveIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  mapActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  mapActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  parcelPhotoCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    height: 200,
  },
  parcelPhotoLarge: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  podCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  podSection: {
    marginBottom: 16,
  },
  podLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  podLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '900',
  },
  podPhotoContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
  },
  podPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  signatureContainer: {
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  signaturePhoto: {
    width: '100%',
    height: '100%',
  },
  podMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  podMetaText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 4,
  },
  timelineCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineLeft: {
    width: 20,
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
    marginTop: 6,
  },
  timelineLineFull: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    left: 5,
    zIndex: 0,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timelineStatus: {
    fontSize: 16,
  },
  timelineTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  timelineLocation: {
    fontSize: 14,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyTimeline: {
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  emptyTimelineText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
  },
  contactPhone: {
    fontSize: 13,
    fontWeight: '500',
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  specsCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  payBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  payText: {
    fontSize: 11,
    fontWeight: '800',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  backBtn: {
    paddingHorizontal: 32,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
