import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import {
  LogIn,
  Phone,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Bus,
  Mail,
  KeyRound,
} from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [login, setLogin] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'otp'>('request');
  const router = useRouter();
  const { colors } = useTheme();

  const submitRequest = async () => {
    if (!login.trim()) {
      Alert.alert('Informations manquantes', 'Saisissez votre email ou téléphone');
      return;
    }
    setLoading(true);
    try {
      // TODO: endpoint réel de demande d'OTP
      await new Promise((r) => setTimeout(r, 800));
      setStep('otp');
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async () => {
    if (!otp || !newPassword || newPassword.length < 6) {
      Alert.alert('Attention', 'Code OTP et nouveau mot de passe (6 caractères min.) sont requis');
      return;
    }
    setLoading(true);
    try {
      // TODO: endpoint réel
      await new Promise((r) => setTimeout(r, 800));
      Alert.alert('Mot de passe mis à jour', 'Vous pouvez maintenant vous connecter', [
        { text: 'Se connecter', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: true, headerTitle: step === 'request' ? 'Récupérer mon compte' : 'Code de vérification', headerBackTitle: 'Retour' }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={[styles.logoCircle, { backgroundColor: colors.primaryContainer }]}>
            <KeyRound color={colors.primary} size={32} />
          </View>
          <Text style={[styles.h1, { color: colors.text }]}>
            {step === 'request' ? "Avez-vous oublié votre mot de passe ?" : "Vérifiez votre téléphone"}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {step === 'request'
              ? "Saisissez votre numéro de téléphone ou votre email. Nous vous enverrons un code de vérification."
              : "Un code OTP vous a été envoyé. Saisissez-le puis définissez votre nouveau mot de passe."}
          </Text>

          <View style={styles.form}>
            {step === 'request' ? (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Email ou Téléphone</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {login.includes('@') ? (
                    <Mail size={18} color={colors.textSecondary} />
                  ) : (
                    <Phone size={18} color={colors.textSecondary} />
                  )}
                  <TextInput
                    value={login}
                    onChangeText={setLogin}
                    autoCapitalize="none"
                    keyboardType={Platform.select({ default: 'default' } as any)}
                    placeholder="ex: +228 90 00 00 00  ou  monemail@exemple.com"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.btnPrimary, loading && { opacity: 0.65 }, { backgroundColor: colors.primary }]}
                  disabled={loading}
                  onPress={submitRequest}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <>
                      <Text style={[styles.btnPrimaryText, { color: colors.onPrimary }]}>Envoyer le code</Text>
                      <ArrowRight color={colors.onPrimary} size={18} />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.label, { color: colors.text }]}>Code OTP</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Lock size={18} color={colors.textSecondary} />
                  <TextInput
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="Ex: 123456"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>

                <Text style={[styles.label, { color: colors.text, marginTop: 4 }]}>Nouveau mot de passe</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Lock size={18} color={colors.textSecondary} />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.input, { color: colors.text, flex: 1 }]}
                  />
                  <TouchableOpacity onPress={() => setShowNew(v => !v)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    {showNew ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.btnPrimary, loading && { opacity: 0.65 }, { backgroundColor: colors.primary }]}
                  disabled={loading}
                  onPress={submitOtp}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={[styles.btnPrimaryText, { color: colors.onPrimary }]}>Réinitialiser le mot de passe</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep('request')} style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ color: colors.primary, fontWeight: '600' }}>Renvoyer le code</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 22, paddingTop: 20, gap: 10 },
  logoCircle: {
    alignSelf: 'center',
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  h1: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  hint: { textAlign: 'center', marginTop: 6, fontSize: 14, lineHeight: 20 },
  form: { marginTop: 22, gap: 14 },
  label: { fontWeight: '700', fontSize: 13, marginLeft: 4, marginBottom: -6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16, borderRadius: 14, marginTop: 4,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800' },
});
