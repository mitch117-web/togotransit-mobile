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
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';
import { UserPlus, ArrowLeft, User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react-native';
import api from '../../lib/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs pour créer votre compte.');
      return;
    }
    if (!agreed) {
      Alert.alert('Conditions d\'utilisation', 'Veuillez accepter les conditions d\'utilisation.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/users', {
        name,
        email,
        phone,
        password,
        role: 'CLIENT',
      });
      
      Alert.alert(
        'Bienvenue !',
        'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.',
        [{ text: 'Se connecter', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.');
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
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]} 
            onPress={() => router.back()}
          >
            <ArrowLeft color={colors.primary} size={24} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onSurface }]}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              Rejoignez la première plateforme de transport et logistique du Togo.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Nom complet</Text>
              <View style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
                <User size={20} color={colors.outline} />
                <TextInput
                  style={[styles.textInput, { color: colors.onSurface }]}
                  placeholder="Ex: Koffi Mensah"
                  placeholderTextColor={colors.outline}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Email</Text>
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
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Téléphone</Text>
              <View style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
                <Phone size={20} color={colors.outline} />
                <TextInput
                  style={[styles.textInput, { color: colors.onSurface }]}
                  placeholder="Ex: 90 00 00 00"
                  placeholderTextColor={colors.outline}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>Mot de passe</Text>
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
              style={styles.termsRow}
              onPress={() => setAgreed(!agreed)}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: agreed ? colors.primary : colors.outlineVariant, backgroundColor: agreed ? colors.primary : 'transparent' }
              ]}>
                {agreed && <Check size={14} color="white" strokeWidth={3} />}
              </View>
              <Text style={[styles.termsText, { color: colors.onSurfaceVariant }]}>
                J'accepte les <Text style={{ color: colors.primary, fontWeight: '700' }}>Conditions d'Utilisation</Text> et la <Text style={{ color: colors.primary, fontWeight: '700' }}>Politique de Confidentialité</Text>.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.registerBtn, { backgroundColor: agreed ? colors.primary : colors.outlineVariant }]}
              onPress={handleRegister}
              disabled={loading || !agreed}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <Text style={[styles.registerBtnText, { color: colors.onPrimary }]}>Créer mon compte</Text>
                  <ShieldCheck size={20} color={colors.onPrimary} strokeWidth={2.5} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.loginLink}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={[styles.loginText, { color: colors.onSurfaceVariant }]}>
                Déjà membre ? <Text style={{ color: colors.primary, fontWeight: '800' }}>Se connecter</Text>
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
    paddingTop: 20,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  registerBtn: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  registerBtnText: {
    fontSize: 18,
    fontWeight: '800',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  loginText: {
    fontSize: 15,
    fontWeight: '600',
  },
});