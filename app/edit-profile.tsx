import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { profile } from '../lib/togotransit-api';
import { showAlert } from '../lib/alert';
import { ArrowLeft, User, Mail, Phone, Lock, Bell } from 'lucide-react-native';
import GlassCard from '../components/ui/GlassCard';
import FadeInStagger from '../components/ui/FadeInStagger';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateUser } = useAuth();

  const [nom, setNom] = useState(user?.nom || '');
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [email, setEmail] = useState(user?.email || '');
  const [telephone, setTelephone] = useState(user?.telephone || user?.phone || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notifications_enabled ?? true);

  React.useEffect(() => {
    if (!user) return;
    setNom(user.nom || '');
    setPrenom(user.prenom || '');
    setEmail(user.email || '');
    setTelephone(user.telephone || user.phone || '');
    setNotificationsEnabled(user.notifications_enabled ?? true);
  }, [user]);

  const [motDePasseActuel, setMotDePasseActuel] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');

  const [saving, setSaving] = useState(false);

  const enregistrer = async () => {
    if (!nom.trim() || !prenom.trim() || !telephone.trim()) {
      showAlert('Champs requis', 'Le nom, le prénom et le téléphone sont obligatoires.');
      return;
    }
    if (nouveauMotDePasse && !motDePasseActuel) {
      showAlert('Mot de passe actuel requis', 'Entrez votre mot de passe actuel pour le changer.');
      return;
    }
    if (nouveauMotDePasse && nouveauMotDePasse.length < 6) {
      showAlert('Mot de passe trop court', 'Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setSaving(true);
    try {
      const res = await profile.update({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim() || null,
        telephone: telephone.trim(),
        notifications_enabled: notificationsEnabled,
        ...(nouveauMotDePasse
          ? { mot_de_passe_actuel: motDePasseActuel, nouveau_mot_de_passe: nouveauMotDePasse }
          : {}),
      });
      await updateUser(res.user);
      setMotDePasseActuel('');
      setNouveauMotDePasse('');
      showAlert('Profil mis à jour', 'Vos informations ont été enregistrées.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      showAlert('Erreur', error.response?.data?.error || "Impossible de mettre à jour le profil.");
    } finally {
      setSaving(false);
    }
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
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <FadeInStagger index={0}>
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Informations personnelles</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Prénom</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <User size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={prenom}
                onChangeText={setPrenom}
                placeholder="Prénom"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Nom</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <User size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={nom}
                onChangeText={setNom}
                placeholder="Nom"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Mail size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Téléphone</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Phone size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={telephone}
                onChangeText={setTelephone}
                placeholder="+228 90 00 00 00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </GlassCard>
        </FadeInStagger>

        <FadeInStagger index={1}>
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Préférences</Text>
          <View style={styles.switchRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Bell size={18} color={colors.textSecondary} />
              <Text style={[styles.switchLabel, { color: colors.text }]}>Recevoir les notifications</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>
        </GlassCard>
        </FadeInStagger>

        <FadeInStagger index={2}>
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Changer le mot de passe</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Laissez vide si vous ne voulez pas changer votre mot de passe.
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Mot de passe actuel</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={motDePasseActuel}
                onChangeText={setMotDePasseActuel}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Nouveau mot de passe</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={nouveauMotDePasse}
                onChangeText={setNouveauMotDePasse}
                placeholder="Au moins 6 caractères"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
              />
            </View>
          </View>
        </GlassCard>
        </FadeInStagger>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={enregistrer}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color={colors.onPrimary} /> : (
            <Text style={[styles.saveBtnText, { color: colors.onPrimary }]}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hint: {
    fontSize: 12,
    marginTop: -8,
  },
  field: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: { fontSize: 15, fontWeight: '600' },
  saveBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '800' },
});
