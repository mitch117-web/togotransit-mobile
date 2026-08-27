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
import { UserPlus, ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react-native';
import { useAuth } from '../../lib/auth';
import { firstValidationError } from '../../lib/api';
import FadeInStagger from '../../components/ui/FadeInStagger';
import GlassCard from '../../components/ui/GlassCard';

const GOLD = '#fd761a';
const GOLD_DIM = '#e8650a';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir votre nom, votre téléphone et votre mot de passe.');
      return;
    }
    if (!agreed) {
      Alert.alert("Conditions d'utilisation", "Veuillez accepter les conditions d'utilisation.");
      return;
    }

    const parts = name.trim().split(/\s+/);
    const prenom = parts[0] || name.trim();
    const nom = parts.slice(1).join(' ') || parts[0];

    if (prenom.length < 2 || nom.length < 2) {
      Alert.alert('Nom invalide', 'Entrez votre nom complet (prénom et nom, 2 caractères minimum chacun).');
      return;
    }
    if (phone.trim().length < 8 || !/^[0-9+\s-]+$/.test(phone.trim())) {
      Alert.alert('Téléphone invalide', 'Le numéro doit contenir au moins 8 chiffres (uniquement chiffres, espaces, "+" ou "-").');
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert('Email invalide', 'Vérifiez le format de votre adresse email, ou laissez le champ vide.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);
    try {
      await signUp({ nom, prenom, telephone: phone, email: email || undefined, mot_de_passe: password });
      router.replace('/(tabs)');
    } catch (error: any) {
      const detail = firstValidationError(error?.data?.details);
      Alert.alert('Erreur', detail || error?.data?.error || error?.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.glowTop} pointerEvents="none" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={GOLD} size={24} />
          </TouchableOpacity>

          <FadeInStagger index={0}>
            <View style={styles.header}>
              <Text style={styles.title}>Créer un compte</Text>
              <Text style={styles.subtitle}>
                Rejoignez la première plateforme de transport et logistique du Togo.
              </Text>
            </View>
          </FadeInStagger>

          <FadeInStagger index={1}>
            <GlassCard style={styles.form} borderRadius={24} forceDark>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Nom complet</Text>
                <View style={styles.inputField}>
                  <User size={20} color="rgba(245,247,255,0.5)" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: Koffi Mensah"
                    placeholderTextColor="rgba(245,247,255,0.3)"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email (optionnel)</Text>
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
                <Text style={styles.label}>Téléphone</Text>
                <View style={styles.inputField}>
                  <Phone size={20} color="rgba(245,247,255,0.5)" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ex: 90 00 00 00"
                    placeholderTextColor="rgba(245,247,255,0.3)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Mot de passe</Text>
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

              <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)}>
                <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                  {agreed && <Check size={14} color="#1a0800" strokeWidth={3} />}
                </View>
                <Text style={styles.termsText}>
                  J'accepte les <Text style={styles.termsAccent}>Conditions d'Utilisation</Text> et la{' '}
                  <Text style={styles.termsAccent}>Politique de Confidentialité</Text>.
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleRegister} disabled={loading || !agreed} activeOpacity={0.85}>
                <LinearGradient
                  colors={agreed ? [GOLD, GOLD_DIM] : ['#2a3450', '#2a3450']}
                  style={styles.registerBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#1a0800" />
                  ) : (
                    <>
                      <Text style={[styles.registerBtnText, !agreed && { color: 'rgba(245,247,255,0.4)' }]}>
                        Créer mon compte
                      </Text>
                      <ShieldCheck size={20} color={agreed ? '#1a0800' : 'rgba(245,247,255,0.4)'} strokeWidth={2.5} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          </FadeInStagger>

          <FadeInStagger index={2}>
            <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginText}>
                Déjà membre ? <Text style={styles.loginTextAccent}>Se connecter</Text>
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
    top: -120,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(253,118,26,0.14)',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 20,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  header: {
    marginBottom: 28,
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
    lineHeight: 22,
    color: 'rgba(245,247,255,0.55)',
  },
  form: {
    gap: 18,
    padding: 20,
  },
  inputWrapper: {
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
    color: 'rgba(245,247,255,0.55)',
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: GOLD,
    borderColor: GOLD,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(245,247,255,0.55)',
  },
  termsAccent: {
    color: GOLD,
    fontWeight: '700',
  },
  registerBtn: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  registerBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a0800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(245,247,255,0.6)',
  },
  loginTextAccent: {
    color: GOLD,
    fontWeight: '800',
  },
});
