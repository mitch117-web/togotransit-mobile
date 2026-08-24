import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../lib/theme';
import { Loader2 } from 'lucide-react-native';

interface Props {
  label?: string;
  description?: string;
}

export const LoadingState: React.FC<Props> = ({
  label = 'Chargement en cours…',
  description,
}) => {
  const { colors } = useTheme();
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.spinnerWrap, { backgroundColor: colors.primaryContainer }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      {description ? (
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
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
    gap: 14,
    minHeight: 240,
  },
  spinnerWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 16, fontWeight: '700' },
  description: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});

export default LoadingState;
