import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../lib/theme';
import { Compass, Ticket as TicketIcon } from 'lucide-react-native';

interface Props {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<Props> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  const { colors } = useTheme();
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceVariant }]}>
        {icon ?? <Compass size={30} color={colors.primary} />}
      </View>
      <Text style={[styles.title, { color: colors.text }]}>
        {title ?? "Aucun résultat"}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {description ?? "Modifiez vos critères de recherche pour voir des trajets."}
      </Text>
      {onAction ? (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.85}
          style={[styles.actionBtn, { backgroundColor: colors.primaryContainer }]}
        >
          <TicketIcon size={18} color={colors.onPrimaryContainer} />
          <Text style={[styles.actionText, { color: colors.onPrimaryContainer }]}>
            {actionLabel ?? "Rechercher un trajet"}
          </Text>
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
    paddingVertical: 56,
    gap: 12,
    minHeight: 320,
  },
  iconWrap: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  description: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: 14, marginTop: 4,
  },
  actionText: { fontWeight: '800', fontSize: 15 },
});

export default EmptyState;
