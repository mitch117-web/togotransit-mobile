import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  borderRadius?: number;
  forceDark?: boolean;
}

/**
 * Carte glassmorphism : fond flouté + bordure translucide.
 * En mode clair, le flou est désactivé au profit d'une carte pleine classique
 * (le glass ne se lit pas sur fond clair) — le composant reste donc utilisable
 * partout sans condition côté appelant.
 *
 * `forceDark` ignore le thème clair/sombre choisi dans l'app : à utiliser sur
 * les écrans à identité visuelle fixe (login/register/forgot-password) dont
 * le texte est codé en dur en blanc — sans ça, sur thème clair, la carte
 * redevient blanche et ce texte blanc devient invisible.
 */
export default function GlassCard({ children, style, intensity = 40, borderRadius = 20, forceDark = false }: GlassCardProps) {
  const { isDark: isDarkTheme, colors } = useTheme();
  const isDark = forceDark || isDarkTheme;

  if (!isDark) {
    return (
      <View
        style={[
          styles.plain,
          { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.border, borderRadius },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View style={[{ borderRadius, overflow: 'hidden' }, style]}>
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: 'rgba(255,255,255,0.05)' },
        ]}
      />
      <View style={[styles.glassBorder, { borderRadius }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  plain: {
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
  glassBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
});
