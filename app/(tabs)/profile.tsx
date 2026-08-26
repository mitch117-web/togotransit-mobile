import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, CreditCard, MapPin, HelpCircle, Moon, Sun } from 'lucide-react-native';
import api from '../../lib/api';
import { profile as profileApi } from '../../lib/togotransit-api';

const ROLE_LABELS: Record<string, string> = {
  voyageur: 'Client',
  gestionnaire: 'Gestionnaire',
  super_admin: 'Super Admin',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateUser } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(user?.notifications_enabled ?? true);
  const [stats, setStats] = React.useState({ tickets: 0, parcels: 0, rating: 4.9 });

  React.useEffect(() => {
    setNotificationsEnabled(user?.notifications_enabled ?? true);
  }, [user?.notifications_enabled]);

  React.useEffect(() => {
    if (user?.role === 'voyageur') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [parcelsRes, bookingsRes] = await Promise.all([
        api.get('/parcels'),
        api.get('/bookings'),
      ]);
      setStats({
        tickets: bookingsRes.data?.length || 0,
        parcels: parcelsRes.data?.length || 0,
        rating: 4.9,
      });
    } catch (error) {
      console.error('Failed to fetch profile stats', error);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      const res = await profileApi.update({ notifications_enabled: value });
      await updateUser(res.user);
    } catch (error) {
      setNotificationsEnabled(!value);
      Alert.alert('Erreur', 'Impossible de mettre à jour vos préférences de notification.');
    }
  };

  const handlePress = (label: string) => {
    switch (label) {
      case 'Adresses enregistrées':
        Alert.alert('Mes Adresses', 'Cette fonctionnalité n\'est pas encore disponible.');
        break;
      case 'Support':
        Alert.alert('Support', 'Besoin d\'aide ?\n\nAppelez-nous au +228 22 21 00 00\nou écrivez à support@togotransit.tg');
        break;
      case 'Paramètres':
        Alert.alert('Paramètres', 'Langue : Français\nDevise : FCFA (XOF)');
        break;
      default:
        Alert.alert('Information', `La fonctionnalité "${label}" sera bientôt disponible.`);
    }
  };

  const menuSections = [
    {
      title: 'Compte',
      items: [
        { icon: User, label: 'Informations personnelles', color: colors.primary, action: () => router.push('/edit-profile') },
        { icon: CreditCard, label: 'Modes de paiement', color: colors.primary, action: () => handlePress('Modes de paiement') },
        { icon: MapPin, label: 'Adresses enregistrées', color: '#38a169', action: () => handlePress('Adresses enregistrées') },
      ]
    },
    {
      title: 'Préférences',
      items: [
        { icon: theme === 'dark' ? Moon : Sun, label: 'Mode sombre', color: theme === 'dark' ? '#f59e0b' : colors.primary, isThemeSwitch: true },
        { icon: Bell, label: 'Notifications', color: '#805ad5', hasSwitch: true },
        { icon: Shield, label: 'Sécurité et Confidentialité', color: '#3182ce', action: () => router.push('/edit-profile') },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Centre d\'aide', color: colors.textSecondary, action: () => handlePress('Support') },
        { icon: Settings, label: 'Paramètres', color: colors.textSecondary, action: () => handlePress('Paramètres') },
      ]
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatarContainer, { borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: colors.primary }]}>
            <User color="white" size={16} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
        
        <View style={[styles.roleBadge, { backgroundColor: colors.surface }]}>
          <View style={[styles.roleDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.roleText, { color: colors.primary }]}>
            {ROLE_LABELS[user?.role ?? ''] ?? 'Client'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statItem, { borderRightColor: colors.border + '40' }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.tickets}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Trajets</Text>
        </View>
        <View style={[styles.statItem, { borderRightColor: colors.border + '40' }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.parcels}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Colis</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.rating}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Note</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuSections.map((section, sIndex) => (
          <View key={sIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border + '40' }]}>
              {section.items.map((item, iIndex) => (
                <TouchableOpacity
                  key={iIndex}
                  onPress={item.isThemeSwitch ? toggleTheme : item.action}
                  style={[
                    styles.menuItem, 
                    iIndex < section.items.length - 1 && { borderBottomColor: colors.border + '20', borderBottomWidth: 1 }
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '10' }]}>
                    <item.icon color={item.color} size={20} strokeWidth={2} />
                  </View>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
                  
                  {item.isThemeSwitch ? (
                    <Switch 
                      value={theme === 'dark'} 
                      onValueChange={toggleTheme}
                      trackColor={{ false: colors.border, true: colors.primary + '80' }}
                      thumbColor={theme === 'dark' ? colors.primary : '#f4f3f4'}
                    />
                  ) : item.hasSwitch ? (
                    <Switch
                      value={notificationsEnabled}
                      onValueChange={toggleNotifications}
                      trackColor={{ false: colors.border, true: colors.primary + '80' }}
                      thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
                    />
                  ) : (
                    <ChevronRight color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error + '40' }]}
          onPress={signOut}
        >
          <LogOut color={colors.error} size={20} strokeWidth={2} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Déconnexion</Text>
        </TouchableOpacity>
        
        <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0 (Build 20240519)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
    padding: 4,
    borderWidth: 1,
    borderRadius: 60,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 8,
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
  },
});

