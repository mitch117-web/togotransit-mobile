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
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { LogIn, Mail, Lock, ArrowRight, Eye, EyeOff, Truck } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={[styles.logoDot, { backgroundColor: colors.primary }]}>
              <Truck size={32} color={colors.onPrimary} strokeWidth={2.5} />
            </View>
            <Text style={[styles.title, { color: colors.onSurface }]}>Bon retour !</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Connectez-vous pour gérer vos voyages et vos colis en toute simplicité.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Email ou Téléphone</Text>
              <View style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
                <Mail size={20} color={colors.outline} />
                <TextInput
                  style={[styles.textInput, { color: colors.onSurface }]}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.outline}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Mot de passe</Text>
                <TouchableOpacity>
                  <Text style={[styles.forgotText, { color: colors.primary }]}>Oublié ?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
                <Lock size={20} color={colors.outline} />
                <TextInput
                  style={[styles.textInput, { color: colors.onSurface }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.outline}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color={colors.outline} /> : <Eye size={20} color={colors.outline} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <Text style={[styles.loginBtnText, { color: colors.onPrimary }]}>Se connecter</Text>
                  <ArrowRight size={20} color={colors.onPrimary} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={[styles.divider, { backgroundColor: colors.outlineVariant + '40' }]} />
              <Text style={[styles.dividerText, { color: colors.onSurfaceVariant }]}>OU</Text>
              <View style={[styles.divider, { backgroundColor: colors.outlineVariant + '40' }]} />
            </View>

            <TouchableOpacity 
              style={styles.registerLink}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={[styles.registerText, { color: colors.onSurfaceVariant }]}>
                Nouveau sur TogoTransit ? <Text style={{ color: colors.primary, fontWeight: '800' }}>Créer un compte</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoDot: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    gap: 24,
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
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  loginBtn: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  loginBtnText: {
    fontSize: 18,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '800',
  },
  registerLink: {
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

