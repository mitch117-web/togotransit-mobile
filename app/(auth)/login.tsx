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
import { useAuth } from '../../lib/auth';
import { LogIn, Mail, Lock, ArrowRight, Eye, EyeOff, Truck } from 'lucide-react-native';
import FadeInStagger from '../../components/ui/FadeInStagger';
import GlassCard from '../../components/ui/GlassCard';

// Écran d'entrée de l'app : look "premium" fixe (fond marine + accent or),
// indépendant du thème clair/sombre choisi par l'utilisateur — même parti
// pris que la page de connexion web, pour une identité de marque cohérente
// dès le tout premier écran vu, sur les deux plateformes.
const GOLD = '#fd761a';
const GOLD_DIM = '#e8650a';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir votre identifiant et votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert('Échec de connexion', 'Identifiants incorrects. Veuillez vérifier vos informations.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <FadeInStagger index={0}>
            <View style={styles.header}>
              <LinearGradient colors={[GOLD, GOLD_DIM]} style={styles.logoDot}>
                <Truck size={32} color="#1a0800" strokeWidth={2.5} />
              </LinearGradient>
              <Text style={styles.title}>Bon retour !</Text>
              <Text style={styles.subtitle}>
                Connectez-vous pour gérer vos voyages et vos colis en toute simplicité.
              </Text>
            </View>
          </FadeInStagger>

          <FadeInStagger index={1}>
            <GlassCard style={styles.form} borderRadius={24} forceDark>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email ou Téléphone</Text>
                <View style={styles.inputField}>
                  <Mail size={20} color="rgba(245,247,255,0.5)" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="votre@email.com"
                    placeholderTextColor="rgba(245,247,255,0.3)"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Mot de passe</Text>
                  <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                    <Text style={styles.forgotText}>Oublié ?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputField}>
                  <Lock size={20} color="rgba(245,247,255,0.5)" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor="rgba(245,247,255,0.3)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={20} color="rgba(245,247,255,0.5)" />
                    ) : (
                      <Eye size={20} color="rgba(245,247,255,0.5)" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={[GOLD, GOLD_DIM]} style={styles.loginBtn}>
                  {loading ? (
                    <ActivityIndicator color="#1a0800" />
                  ) : (
                    <>
                      <Text style={styles.loginBtnText}>Se connecter</Text>
                      <ArrowRight size={20} color="#1a0800" strokeWidth={2.5} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          </FadeInStagger>

          <FadeInStagger index={2}>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerText}>
                Nouveau sur TogoTransit ? <Text style={styles.registerTextAccent}>Créer un compte</Text>
              </Text>
            </TouchableOpacity>
          </FadeInStagger>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1a',
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(253,118,26,0.16)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -160,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 999,
    backgroundColor: 'rgba(253,118,26,0.12)',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoDot: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#fd761a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 12,
    color: '#f5f7ff',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    color: 'rgba(245,247,255,0.55)',
  },
  form: {
    gap: 22,
    padding: 20,
  },
  inputWrapper: {
    gap: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
    color: 'rgba(245,247,255,0.55)',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fd761a',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#f5f7ff',
  },
  loginBtn: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a0800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 28,
    marginBottom: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(245,247,255,0.4)',
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(245,247,255,0.6)',
  },
  registerTextAccent: {
    color: '#fd761a',
    fontWeight: '800',
  },
});
