import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../lib/auth';
import { ThemeProvider, useTheme } from '../lib/theme';
import { useEffect } from 'react';
import AIChatbot from '../components/AIChatbot';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function AppContent() {
  const { colors, theme } = useTheme();

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="search-results" options={{ title: 'Résultats de recherche' }} />
        <Stack.Screen name="trajet-detail" options={{ title: 'Détails du trajet' }} />
        <Stack.Screen name="reservation" options={{ title: 'Réservation' }} />
        <Stack.Screen name="payment" options={{ title: 'Paiement' }} />
        <Stack.Screen name="ticket" options={{ title: 'Mon billet' }} />
        <Stack.Screen name="ticket-detail" options={{ title: 'Détail du billet' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Modifier mon profil' }} />
        <Stack.Screen name="send-parcel" options={{ title: 'Envoyer un colis', presentation: 'card' }} />
        <Stack.Screen name="parcel-details" options={{ title: 'Détails du colis' }} />
        <Stack.Screen name="delivery-confirmation" options={{ title: 'Confirmer la livraison' }} />
        <Stack.Screen name="booking" options={{ title: 'Réserver un ticket' }} />
        <Stack.Screen name="seats" options={{ title: 'Choisir vos sièges' }} />
        <Stack.Screen name="paiement-reussi" options={{ headerShown: false }} />
        <Stack.Screen name="live-tracking" options={{ title: 'Suivi en direct' }} />
      </Stack>
      <AIChatbot />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
          <ThemedStatusBar />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  const { theme } = useTheme();
  return <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />;
}
