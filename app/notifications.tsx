import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Platform, StatusBar, RefreshControl, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { ArrowLeft, Bell, Ticket, Wallet, Package, AlertTriangle, Clock, X } from 'lucide-react-native';
import { notifications as notificationsApi, NotificationRecord } from '../lib/togotransit-api';
import GlassCard from '../components/ui/GlassCard';
import FadeInStagger from '../components/ui/FadeInStagger';

const POLL_INTERVAL_MS = 30000;

function iconForType(type: string) {
  switch (type) {
    case 'RESERVATION': return Ticket;
    case 'PAIEMENT': return Wallet;
    case 'PARCEL': return Package;
    case 'DELAYED_PARCEL': return Package;
    case 'OVERLOADED_DRIVER': return AlertTriangle;
    case 'PENDING_PAYMENT': return Clock;
    default: return Bell;
  }
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [items, setItems] = React.useState<NotificationRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selected, setSelected] = React.useState<NotificationRecord | null>(null);

  const fetchNotifications = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await notificationsApi.list();
      setItems(data);
    } catch (error) {
      console.warn('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(true), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handlePress = (item: NotificationRecord) => {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      notificationsApi.marquerLue(item.id).catch(() => {});
    }
    setSelected(item);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ArrowLeft color={colors.primary} size={24} />
            </TouchableOpacity>
          ),
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
          renderItem={({ item, index }) => {
            const Icon = iconForType(item.type);
            return (
              <FadeInStagger index={index}>
                <TouchableOpacity activeOpacity={0.7} onPress={() => handlePress(item)}>
                  <GlassCard style={styles.card}>
                    <View style={styles.row}>
                      <View
                        style={[
                          styles.iconWrap,
                          { backgroundColor: item.isRead ? colors.surfaceContainerHigh : colors.primaryContainer },
                        ]}
                      >
                        <Icon size={20} color={item.isRead ? colors.tabIconDefault : colors.primary} />
                      </View>
                      <View style={styles.textWrap}>
                        <View style={styles.titleRow}>
                          <Text
                            style={[styles.title, { color: colors.text, fontWeight: item.isRead ? '600' : '800' }]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          {!item.isRead && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
                        </View>
                        <Text style={[styles.message, { color: colors.tabIconDefault }]} numberOfLines={2}>
                          {item.message}
                        </Text>
                        <Text style={[styles.time, { color: colors.outline }]}>{timeAgo(item.createdAt)}</Text>
                      </View>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </FadeInStagger>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceContainerLow }]}>
                <Bell size={48} color={colors.outline} strokeWidth={1} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune notification</Text>
              <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
                Vos réservations, paiements et livraisons apparaîtront ici.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={selected != null}
        animationType="fade"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {selected && (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.iconWrap,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    {React.createElement(iconForType(selected.type), { size: 20, color: colors.primary })}
                  </View>
                  <TouchableOpacity onPress={() => setSelected(null)} style={styles.modalCloseBtn} hitSlop={10}>
                    <X size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{selected.title}</Text>
                <Text style={[styles.modalTime, { color: colors.outline }]}>{timeAgo(selected.createdAt)}</Text>
                <Text style={[styles.modalMessage, { color: colors.text }]}>{selected.message}</Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    marginBottom: 12,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    flexShrink: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalTime: {
    fontSize: 12,
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
  },
});
