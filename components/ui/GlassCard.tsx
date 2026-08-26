import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../lib/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  borderRadius?: number;
}

/**
 * Carte glassmorphism : fond flouté + bordure translucide.
 * En mode clair, le flou est désactivé au profit d'une carte pleine classique
 * (le glass ne se lit pas sur fond clair) — le composant reste donc utilisable
 * partout sans condition côté appelant.
 */
export default function GlassCard({ children, style, intensity = 40, borderRadius = 20 }: GlassCardProps) {
  const { isDark, colors } = useTheme();

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
