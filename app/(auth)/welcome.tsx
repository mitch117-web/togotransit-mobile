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
} from 'lucide-react-native';

export default function WelcomeScreen() {
  const { setOnboarded } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Bus color={colors.onPrimary} size={80} strokeWidth={1.5} />
        <Text style={[styles.title, { color: colors.onPrimary }]}>TogoTransit</Text>
        <Text style={[styles.subtitle, { color: colors.onPrimary + 'dd' }]}>
          Réservez votre trajet dans n'importe quelle compagnie togolaise
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} bounces={false}>
        <View style={styles.features}>
          {[
            { icon: '🔎', title: 'Recherche multicompagnies', desc: 'Comparez tous les trajets en un clic' },
            { icon: '💳', title: 'Paiement Mobile Money', desc: 'Flooz et T-Money acceptés' },
            { icon: '🎫', title: 'Billet électronique', desc: 'QR code pour embarquement instantané' },
          ].map((f, i) => (
            <View key={i} style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: colors.primary }]}
          onPress={async () => { await setOnboarded(); router.push('/(auth)/login'); }}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnPrimaryText, { color: colors.onPrimary }]}>Commencer</Text>
          <ArrowRight color={colors.onPrimary} size={20} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setOnboarded(); router.push('/(auth)/register'); }}
          style={{ paddingVertical: 14, alignItems: 'center' }}
        >
          <Text style={{ color: colors.textSecondary }}>
            Pas encore de compte ?{' '}
            <Text style={{ color: colors.primary, fontWeight: '700' }}>S'inscrire</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 52,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  title: { fontSize: 34, fontWeight: '800', marginTop: 16, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', marginTop: 10, maxWidth: 280 },
  body: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 20, gap: 14 },
  features: { gap: 14 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  featureIcon: { fontSize: 28 },
  featureTitle: { fontSize: 15, fontWeight: '700' },
  featureDesc: { fontSize: 13, marginTop: 4 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    fontWeight: '700',
  },
  btnPrimaryText: { fontSize: 17, fontWeight: '800' },
});
