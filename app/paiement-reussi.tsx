import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { CheckCircle2, Ticket, ArrowRight, Home, Share2, Download } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { seats, total } = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.content}>
        {/* Success Header */}
        <View style={styles.header}>
          <View style={[styles.successIconContainer, { backgroundColor: colors.success + '20' }]}>
            <CheckCircle2 size={80} color={colors.success} strokeWidth={1.5} />
          </View>
          <Text style={[styles.title, { color: colors.onSurface }]}>Paiement Réussi !</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
            Votre réservation a été confirmée avec succès.
          </Text>
        </View>

        {/* Ticket Preview Card */}
        <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
          <View style={styles.ticketHeader}>
            <Ticket size={24} color={colors.primary} />
            <Text style={[styles.ticketType, { color: colors.primary }]}>Ticket de voyage</Text>
          </View>

          <View style={[styles.divider, { borderBottomColor: colors.outlineVariant + '40' }]} />

          <View style={styles.ticketBody}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>Sièges</Text>
                <Text style={[styles.detailValue, { color: colors.onSurface }]}>{seats || 'Non spécifié'}</Text>
              </View>
              <View style={[styles.detailItem, { alignItems: 'flex-end' }]}>
                <Text style={[styles.detailLabel, { color: colors.onSurfaceVariant }]}>Montant Total</Text>
                <Text style={[styles.detailValue, { color: colors.primary }]}>{total || '0'} FCFA</Text>
              </View>
            </View>

            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, { backgroundColor: colors.success + '15' }]}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.statusText, { color: colors.success }]}>Confirmé</Text>
              </View>
            </View>
          </View>

          {/* Ticket Perforation */}
          <View style={styles.perforationContainer}>
            <View style={[styles.perforationCircle, { left: -10, backgroundColor: colors.surfaceContainerLow }]} />
            <View style={[styles.perforationLine, { borderBottomColor: colors.outlineVariant + '60' }]} />
            <View style={[styles.perforationCircle, { right: -10, backgroundColor: colors.surfaceContainerLow }]} />
          </View>

          <View style={styles.ticketFooter}>
            <Text style={[styles.footerNote, { color: colors.onSurfaceVariant }]}>
              Présentez ce ticket ou votre code QR à l'embarquement.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/tickets')}
          >
            <Text style={[styles.primaryBtnText, { color: colors.onPrimary }]}>Voir mes tickets</Text>
            <ArrowRight size={20} color={colors.onPrimary} />
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.outlineVariant }]}>
              <Download size={20} color={colors.onSurfaceVariant} />
              <Text style={[styles.secondaryBtnText, { color: colors.onSurfaceVariant }]}>Télécharger</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.outlineVariant }]}>
              <Share2 size={20} color={colors.onSurfaceVariant} />
              <Text style={[styles.secondaryBtnText, { color: colors.onSurfaceVariant }]}>Partager</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.homeBtn}
            onPress={() => router.push('/(tabs)')}
          >
            <Home size={20} color={colors.primary} />
            <Text style={[styles.homeBtnText, { color: colors.primary }]}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  ticketCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    marginBottom: 40,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  ticketType: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  divider: {
    borderBottomWidth: 1,
    marginHorizontal: 20,
  },
  ticketBody: {
    padding: 20,
    gap: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  perforationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    position: 'relative',
  },
  perforationCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    zIndex: 1,
  },
  perforationLine: {
    width: '85%',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  ticketFooter: {
    padding: 20,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  primaryBtn: {
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  homeBtn: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
