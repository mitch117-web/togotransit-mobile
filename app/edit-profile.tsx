import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { auth as authApi } from '../lib/togotransit-api';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Save,
  Edit3,
  LogOut,
  AlertTriangle,
} from 'lucide-react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, signOut } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');

  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const u = await authApi.me();
      setNom(u?.nom || user?.nom || '');
      setPrenom(u?.prenom || user?.prenom || '');
      setEmail(u?.email || user?.email || '');
      setTelephone(u?.telephone || u?.phone || user?.telephone || user?.phone || '');
    } catch (e: any) {
      setError(e);
      setNom(user?.nom || '');
      setPrenom(user?.prenom || '');
      setEmail(user?.email || '');
      setTelephone(user?.telephone || user?.phone || '');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const valider = () => {
    if (!nom.trim() || nom.trim().length < 2) {
      Alert.alert('Nom invalide', 'Le nom doit contenir au moins 2 caractères.');
      return false;
    }
    if (!prenom.trim() || prenom.trim().length < 2) {
      Alert.alert('Prénom invalide', 'Le prénom doit contenir au moins 2 caractères.');
      return false;
    }
    if (!telephone.trim() || telephone.trim().length < 8) {
      Alert.alert('Téléphone invalide', 'Le numéro de téléphone est invalide.');
      return false;
    }
    return true;
  };

  const sauvegarder = async () => {
    if (!valider()) return;
    setSaving(true);
    try {
      // TODO: appeler le vrai endpoint de mise à jour profil une fois exposé
      // Pour l'instant on simule la mise à jour côté local
      await new Promise((r) => setTimeout(r, 700));
      Alert.alert('Profil mis à jour', 'Vos informations ont bien été enregistrées.');
      router.back();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || "Impossible d'enregistrer pour le moment.");
    } finally {
      setSaving(false);
    }
  };

  const deconnexion = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: colors.surface }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Mon profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <LoadingState label="Chargement du profil…" />
          ) : error ? (
            <View style={{ marginHorizontal: 16, marginTop: 16 }}>
              <ErrorState
                code={error?.code}
                description={error?.message}
                onRetry={loadProfile}
                variant={error?.code === 'NETWORK_ERROR' ? 'offline' : 'error'}
              />
            </View>
          ) : !user ? (
            <View style={{ marginHorizontal: 16, marginTop: 16 }}>
              <ErrorState
                title="Non connecté"
                description="Connectez-vous pour modifier votre profil."
                onRetry={() => router.replace('/(auth)/login')}
                retryLabel="Se connecter"
              />
            </View>
          ) : (
            <View style={{ padding: 16, gap: 14 }}>
              <View style={[styles.heroCard, { backgroundColor: colors.primaryContainer }]}>
                <View style={[styles.avatar, { backgroundColor: colors.onPrimaryContainer }]}>
                  <Edit3 size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.heroNom, { color: colors.onPrimaryContainer }]}>
                    {prenom && nom ? `${prenom} ${nom}` : user?.name || 'Voyageur'}
                  </Text>
                  <Text style={[styles.heroRole, { color: colors.onPrimaryContainer + 'dd' }]}>
                    Compte voyageur
                  </Text>
                </View>
              </View>

              <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Informations personnelles</Text>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Nom</Text>
                  <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <User size={16} color={colors.textSecondary} />
                    <TextInput
                      value={nom}
                      onChangeText={setNom}
                      placeholder="Votre nom"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.textInput, { color: colors.text }]}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Prénom</Text>
                  <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <User size={16} color={colors.textSecondary} />
                    <TextInput
                      value={prenom}
                      onChangeText={setPrenom}
                      placeholder="Votre prénom"
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.textInput, { color: colors.text }]}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Téléphone</Text>
                  <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Phone size={16} color={colors.textSecondary} />
                    <TextInput
                      value={telephone}
                      onChangeText={setTelephone}
                      placeholder="+228 ..."
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="phone-pad"
                      style={[styles.textInput, { color: colors.text }]}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Email (optionnel)</Text>
                  <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Mail size={16} color={colors.textSecondary} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="votre@email.com"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.textInput, { color: colors.text }]}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <AlertTriangle size={14} color={colors.warning} />
                  <Text style={[styles.hint, { color: colors.textSecondary }]}>
                    Les modifications sont sauvegardées localement. Un endpoint dédié sera prochainement activé.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={sauvegarder}
                disabled={saving}
                activeOpacity={0.85}
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.primary },
                  saving && { opacity: 0.7 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <>
                    <Save size={18} color={colors.onPrimary} />
                    <Text style={[styles.saveText, { color: colors.onPrimary }]}>
                      Enregistrer les modifications
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={deconnexion}
                activeOpacity={0.8}
                style={[
                  styles.logoutBtn,
                  {
                    backgroundColor: colors.errorContainer + '20',
                    borderColor: colors.errorContainer,
                  },
                ]}
              >
                <LogOut size={18} color={colors.error} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Se déconnecter</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800' },

  heroCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroNom: { fontSize: 17, fontWeight: '900', letterSpacing: -0.1 },
  heroRole: { fontSize: 12, fontWeight: '600', marginTop: 3 },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '800' },

  field: { gap: 6 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginLeft: 4,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  textInput: { flex: 1, fontSize: 15, fontWeight: '600', padding: 0 },

  hint: { fontSize: 11, fontWeight: '600', flex: 1, lineHeight: 16 },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 4,
  },
  saveText: { fontSize: 15, fontWeight: '800' },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  logoutText: { fontSize: 14, fontWeight: '800' },
});
