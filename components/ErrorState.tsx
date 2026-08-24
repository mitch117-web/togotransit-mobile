import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../lib/theme';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react-native';

interface Props {
  title?: string;
  description?: string;
  code?: string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'error' | 'offline';
}

export const ErrorState: React.FC<Props> = ({
  title,
  description,
  code,
  onRetry,
  retryLabel = 'Réessayer',
  variant = 'error',
}) => {
  const { colors } = useTheme();
  const Icon = variant === 'offline' ? WifiOff : AlertTriangle;
  const bgColor = variant === 'offline' ? colors.secondaryContainer : colors.errorContainer;
  const iconColor = variant === 'offline' ? colors.secondary : colors.error;
  const effectiveTitle = title
    ?? (variant === 'offline' ? 'Aucune connexion réseau' : 'Un problème est survenu');
  const effectiveDesc = description
    ?? (variant === 'offline' ? "Activez vos données mobiles ou le Wi-Fi puis réessayez." : "Nous n'avons pas pu effectuer cette opération pour le moment.");

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Icon color={iconColor} size={30} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{effectiveTitle}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{effectiveDesc}</Text>
      {code ? (
        <View style={[styles.codeChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.codeText, { color: colors.textSecondary }]}>{code}</Text>
        </View>
      ) : null}
      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.8}
          style={[styles.retryBtn, { backgroundColor: colors.primary, marginTop: code ? 6 : 10 }]}
        >
          <RefreshCw color={colors.onPrimary} size={18} />
          <Text style={[styles.retryText, { color: colors.onPrimary }]}>{retryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    gap: 10,
    minHeight: 300,
  },
  iconWrap: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  description: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  codeChip: {
    marginTop: 6,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1,
  },
  codeText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14,
  },
  retryText: { fontSize: 15, fontWeight: '800' },
});

export default ErrorState;
