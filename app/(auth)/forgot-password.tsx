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
import { LinearGradient } from 'expo-linear-gradient';
import {
  Phone,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  KeyRound,
} from 'lucide-react-native';
import FadeInStagger from '../../components/ui/FadeInStagger';
import GlassCard from '../../components/ui/GlassCard';

const GOLD = '#fd761a';
const GOLD_DIM = '#e8650a';

export default function ForgotPasswordScreen() {
  const [login, setLogin] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'otp'>('request');
  const router = useRouter();

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
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: step === 'request' ? 'Récupérer mon compte' : 'Code de vérification',
          headerBackTitle: 'Retour',
          headerStyle: { backgroundColor: '#070d1a' },
          headerTintColor: '#f5f7ff',
        }}
      />

      <View style={styles.glowTop} pointerEvents="none" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <FadeInStagger index={0}>
            <LinearGradient colors={[GOLD, GOLD_DIM]} style={styles.logoCircle}>
              <KeyRound color="#1a0800" size={32} />
            </LinearGradient>
            <Text style={styles.h1}>
              {step === 'request' ? "Avez-vous oublié votre mot de passe ?" : "Vérifiez votre téléphone"}
            </Text>
            <Text style={styles.hint}>
              {step === 'request'
                ? "Saisissez votre numéro de téléphone ou votre email. Nous vous enverrons un code de vérification."
                : "Un code OTP vous a été envoyé. Saisissez-le puis définissez votre nouveau mot de passe."}
            </Text>
          </FadeInStagger>

          <FadeInStagger index={1}>
          <GlassCard style={styles.form} borderRadius={24} forceDark>
            {step === 'request' ? (
              <>
                <Text style={styles.label}>Email ou Téléphone</Text>
                <View style={styles.inputWrap}>
                  {login.includes('@') ? (
                    <Mail size={18} color="rgba(245,247,255,0.5)" />
                  ) : (
                    <Phone size={18} color="rgba(245,247,255,0.5)" />
                  )}
                  <TextInput
                    value={login}
                    onChangeText={setLogin}
                    autoCapitalize="none"
                    placeholder="ex: +228 90 00 00 00  ou  monemail@exemple.com"
                    placeholderTextColor="rgba(245,247,255,0.3)"
                    style={styles.input}
                  />
                </View>

                <TouchableOpacity onPress={submitRequest} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient colors={[GOLD, GOLD_DIM]} style={[styles.btnPrimary, loading && { opacity: 0.65 }]}>
                    {loading ? (
                      <ActivityIndicator color="#1a0800" />
                    ) : (
                      <>
                        <Text style={styles.btnPrimaryText}>Envoyer le code</Text>
                        <ArrowRight color="#1a0800" size={18} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Code OTP</Text>
                <View style={styles.inputWrap}>
                  <Lock size={18} color="rgba(245,247,255,0.5)" />
                  <TextInput
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="Ex: 123456"
                    placeholderTextColor="rgba(245,247,255,0.3)"
                    style={styles.input}
                  />
                </View>

                <Text style={[styles.label, { marginTop: 4 }]}>Nouveau mot de passe</Text>
                <View style={styles.inputWrap}>
                  <Lock size={18} color="rgba(245,247,255,0.5)" />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(245,247,255,0.3)"
                    style={[styles.input, { flex: 1 }]}
                  />
                  <TouchableOpacity onPress={() => setShowNew(v => !v)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    {showNew ? <EyeOff size={18} color="rgba(245,247,255,0.5)" /> : <Eye size={18} color="rgba(245,247,255,0.5)" />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={submitOtp} disabled={loading} activeOpacity={0.85}>
                  <LinearGradient colors={[GOLD, GOLD_DIM]} style={[styles.btnPrimary, loading && { opacity: 0.65 }]}>
                    {loading ? (
                      <ActivityIndicator color="#1a0800" />
                    ) : (
                      <Text style={styles.btnPrimaryText}>Réinitialiser le mot de passe</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep('request')} style={{ alignItems: 'center', paddingVertical: 8 }}>
                  <Text style={{ color: GOLD, fontWeight: '600' }}>Renvoyer le code</Text>
                </TouchableOpacity>
              </>
            )}
          </GlassCard>
          </FadeInStagger>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070d1a' },
  glowTop: {
    position: 'absolute',
    top: -140,
    right: -100,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(253,118,26,0.14)',
  },
  content: { padding: 22, paddingTop: 20, gap: 10 },
  logoCircle: {
    alignSelf: 'center',
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  h1: { fontSize: 24, fontWeight: '800', textAlign: 'center', color: '#f5f7ff' },
  hint: { textAlign: 'center', marginTop: 6, fontSize: 14, lineHeight: 20, color: 'rgba(245,247,255,0.55)' },
  form: { marginTop: 22, gap: 14, padding: 20 },
  label: { fontWeight: '700', fontSize: 13, marginLeft: 4, marginBottom: -6, color: 'rgba(245,247,255,0.55)' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 16 : 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  input: { flex: 1, fontSize: 15, padding: 0, color: '#f5f7ff' },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16, borderRadius: 14, marginTop: 4,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#1a0800', textTransform: 'uppercase', letterSpacing: 0.5 },
});
