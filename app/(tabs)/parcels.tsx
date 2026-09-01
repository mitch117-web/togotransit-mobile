import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../../lib/theme';
import { Search, Package, MapPin, ChevronRight, RefreshCw, User, Navigation } from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import api from '../../lib/api';
import { useRouter } from 'expo-router';
import GlassCard from '../../components/ui/GlassCard';
import FadeInStagger from '../../components/ui/FadeInStagger';

export default function ParcelsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    fetchParcels();
  }, [user]);

  const fetchParcels = async (searchQuery = '') => {
    setLoading(true);
    try {
      const params: any = {};
      if (searchQuery) {
        params.q = searchQuery;
      }

      const response = await api.get('/parcels', { params });
      setParcels(response.data);
    } catch (error) {
      console.warn('Failed to fetch parcels', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Un colis est "à livrer" du point de vue de cet utilisateur s'il est le
  // chauffeur assigné — pas un rôle global, chaque utilisateur (voyageur)
  // peut avoir à la fois ses propres envois et des livraisons assignées.
  const isMyDelivery = (item: any) =>
    item.driverId != null && String(item.driverId) === String(user?.id);

  const handleAction = (item: any) => {
    if (isMyDelivery(item)) {
      const qp = new URLSearchParams({
        parcelId: String(item.id),
        trackingId: item.trackingId ?? '',
        destination: item.destination ?? '',
        receiverName: item.receiverName ?? '',
      });
      router.push(`/delivery-confirmation?${qp.toString()}`);
    } else {
      router.push(`/parcel-details?parcelId=${item.id}`);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchParcels(search);
  };

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (text: string) => {
    setSearch(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchParcels(text);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const translateStatus = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'IN_AGENCY': return 'En agence';
      case 'IN_TRANSIT': return 'En transit';
      case 'OUT_FOR_DELIVERY': return 'En livraison';
      case 'DELIVERED': return 'Livré';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: colors.success + '20', text: colors.success };
      case 'IN_TRANSIT':
        return { bg: colors.primary + '20', text: colors.primary };
      case 'PENDING':
      case 'IN_AGENCY':
        return { bg: colors.secondary + '20', text: colors.secondary };
      default:
        return { bg: colors.outlineVariant + '40', text: colors.tabIconDefault };
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const statusStyle = getStatusColor(item.status);
    const isDriver = isMyDelivery(item);

    if (isDriver) {
      const isDelivered = item.status === 'DELIVERED';
      return (
        <FadeInStagger index={index}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={isDelivered && { opacity: 0.7 }}
          onPress={() => !isDelivered && handleAction(item)}
        >
        <GlassCard style={styles.parcelCard}>
          <View style={styles.parcelHeader}>
            <View>
              <Text style={[styles.labelSmall, { color: colors.onSurfaceVariant }]}>
                {isDelivered ? 'LIVRAISON TERMINÉE' : 'COLIS À LIVRER'}
              </Text>
              <Text style={[styles.parcelNumber, { color: colors.primary, marginTop: 2, fontWeight: '700' }]}>{item.trackingId}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <View style={[styles.dot, { backgroundColor: statusStyle.text }]} />
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {translateStatus(item.status)}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant + '40' }]} />

          <View style={styles.driverInfoSection}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.primaryContainer + '20' }]}>
                <User color={colors.primary} size={16} />
              </View>
              <View>
                <Text style={[styles.labelMini, { color: colors.onSurfaceVariant }]}>Destinataire</Text>
                <Text style={[styles.infoValue, { color: colors.onSurface }]}>{item.receiverName}</Text>
                <Text style={[styles.infoSubValue, { color: colors.onSurfaceVariant }]}>{item.receiverPhone}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: colors.secondaryContainer + '20' }]}>
                <MapPin color={colors.secondary} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.labelMini, { color: colors.onSurfaceVariant }]}>Lieu de livraison</Text>
                <Text style={[styles.infoValue, { color: colors.onSurface }]} numberOfLines={2}>
                  {item.destination}
                </Text>
              </View>
            </View>
          </View>

          {!isDelivered && (
            <View style={styles.cardActions}>
              {(item.status === 'IN_TRANSIT' || item.status === 'OUT_FOR_DELIVERY') && (
                <TouchableOpacity
                  style={[styles.trackButton, { backgroundColor: colors.surfaceContainerHigh, marginTop: 0, marginBottom: 10 }]}
                  onPress={() => router.push(`/live-tracking?parcelId=${item.id}`)}
                >
                  <Navigation size={18} color={colors.primary} />
                  <Text style={[styles.trackButtonText, { color: colors.primary }]}>Partager ma position</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.driverActionBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleAction(item)}
              >
                <Text style={[styles.btnText, { color: colors.onPrimary }]}>Confirmer la livraison</Text>
                <ChevronRight color={colors.onPrimary} size={18} />
              </TouchableOpacity>
            </View>
          )}
          
          {isDelivered && (
            <View style={[styles.deliveredBadge, { marginTop: 12 }]}>
              <RefreshCw size={14} color={colors.success} />
              <Text style={[styles.deliveredText, { color: colors.success, marginLeft: 6, fontWeight: '700' }]}>
                Mis à jour dans le système
              </Text>
            </View>
          )}
        </GlassCard>
        </TouchableOpacity>
        </FadeInStagger>
      );
    }

    return (
      <FadeInStagger index={index}>
      <GlassCard style={styles.parcelCard}>
        <TouchableOpacity
          style={styles.parcelContent}
          onPress={() => handleAction(item)}
        >
          <View style={styles.parcelHeader}>
            <View style={[styles.parcelIcon, { backgroundColor: colors.surfaceContainerHigh }]}>
              <Package color={colors.primary} size={24} />
            </View>
            <View style={styles.parcelInfo}>
              <Text style={[styles.parcelNumber, { color: colors.text }]}>{item.trackingId}</Text>
              <Text style={[styles.parcelDate, { color: colors.textSecondary }]}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {translateStatus(item.status)}
              </Text>
            </View>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeItem}>
              <MapPin color={colors.textSecondary} size={16} />
              <Text style={[styles.routeText, { color: colors.text }]}>{item.origin}</Text>
            </View>
            <View style={[styles.routeDivider, { backgroundColor: colors.border + '40' }]} />
            <View style={styles.routeItem}>
              <MapPin color={colors.primary} size={16} />
              <Text style={[styles.routeText, { color: colors.text }]}>{item.destination}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {(item.status === 'IN_TRANSIT' || item.status === 'OUT_FOR_DELIVERY') && (
          <TouchableOpacity
            style={[styles.trackButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/live-tracking?parcelId=${item.id}`)}
          >
            <Navigation size={18} color={colors.onPrimary} />
            <Text style={[styles.trackButtonText, { color: colors.onPrimary }]}>
              Suivi en Direct
            </Text>
          </TouchableOpacity>
        )}
      </GlassCard>
      </FadeInStagger>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mes Colis</Text>
        <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
          {parcels.some(isMyDelivery) ? 'Vos envois et vos livraisons assignées' : 'Suivez vos expéditions'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '60' }]}>
          <Search color={colors.tabIconDefault} size={20} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Numéro de suivi (ex: TRK-1000)..."
            placeholderTextColor={colors.tabIconDefault}
            value={search}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={parcels}
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package color={colors.tabIconDefault} size={64} strokeWidth={1} />
              <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
                Aucun colis trouvé
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 0,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  searchContainer: {
    padding: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 24,
    paddingTop: 0,
  },
  parcelCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  parcelContent: {
    width: '100%',
  },
  parcelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  parcelIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  parcelInfo: {
    flex: 1,
  },
  parcelNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  parcelDate: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelMini: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  driverInfoSection: {
    gap: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoSubValue: {
    fontSize: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardActions: {
    marginTop: 8,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  deliveredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  deliveredText: {
    fontSize: 13,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  routeDivider: {
    flex: 1,
    height: 2,
    marginHorizontal: 12,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  driverActionBtn: {
    marginTop: 16,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
