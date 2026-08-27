import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  forceDark?: boolean;
}

/**
 * Carte "glassmorphism" : superposition translucide + bordure fine.
 *
 * Volontairement sans flou natif (expo-blur/BlurView) : ce composant a
 * d'abord utilisé un vrai BlurView, mais il s'est révélé peu fiable sur
 * certains appareils Android via Expo Go (rendu blanc/opaque au lieu du
 * flou sombre attendu, rendant l'app illisible en thème sombre). Une
 * simple superposition rgba donne un résultat visuellement très proche
 * et fonctionne de façon identique sur tous les appareils — c'est aussi
 * exactement l'approche déjà utilisée sur la page de connexion web.
 *
 * `forceDark` ignore le thème clair/sombre choisi dans l'app : à utiliser
 * sur les écrans à identité visuelle fixe (login/register/forgot-password)
 * dont le texte est codé en dur en blanc — sans ça, sur thème clair, la
 * carte redevient blanche et ce texte blanc devient invisible.
 */
export default function GlassCard({ children, style, borderRadius = 20, forceDark = false }: GlassCardProps) {
  const { isDark: isDarkTheme, colors } = useTheme();
  const isDark = forceDark || isDarkTheme;

  return (
    <View
      style={[
        styles.base,
        isDark
          ? { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', borderRadius }
          : { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border, borderRadius },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: { elevation: 2 },
    }),
  },
});
