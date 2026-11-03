import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, CalendarCheck, MapPin, User, Armchair } from 'lucide-react-native';
import { useTheme } from '../lib/theme';
import { describeDepart } from '../lib/billet';

export type ScanEtat = 'valide' | 'utilise' | 'annule' | 'inconnu' | 'refuse' | 'erreur';

export interface ScanResult {
  etat: ScanEtat;
  titre: string;
  message: string;
  numero?: string;
  passagers?: { nom_complet: string; numero_siege?: string | null }[];
  sieges?: string[];
  trajet?: {
    compagnie?: string;
    ville_depart?: string;
    ville_arrivee?: string;
    depart_at?: string;
    date_depart?: string;
    vehicule?: { type?: string | null; immatriculation?: string } | null;
  } | null;
}

/**
 * Résultat d'un scan, en grand : vert (embarquement autorisé), jaune (déjà utilisé), rouge (annulé, inconnu),
 * gris (billet d'une autre compagnie ou d'un autre trajet, erreur réseau). Le contrôleur lit d'abord la couleur,
 * puis les détails : qui, où, quand, quel siège.
 */
export default function ScanResultSheet({
  result,
  onClose,
}: {
  result: ScanResult | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  if (!result) return null;

  const style = {
    valide: { bg: colors.secondary, fg: colors.onSecondary, Icon: CheckCircle2 },
    utilise: { bg: colors.tertiary, fg: colors.onTertiary, Icon: CalendarCheck },
    annule: { bg: colors.error, fg: colors.onError, Icon: XCircle },
    inconnu: { bg: colors.error, fg: colors.onError, Icon: HelpCircle },
    refuse: { bg: colors.surfaceVariant, fg: colors.onSurfaceVariant, Icon: AlertTriangle },
    erreur: { bg: colors.surfaceVariant, fg: colors.onSurfaceVariant, Icon: AlertTriangle },
  }[result.etat];

  const trajet = result.trajet;
  const depart = describeDepart(trajet?.depart_at ?? trajet?.date_depart);
  const sieges = result.sieges?.length ? result.sieges : (result.passagers ?? []).map((p) => p.numero_siege).filter(Boolean) as string[];

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.banner, { backgroundColor: style.bg }]}>
            <style.Icon size={44} color={style.fg} strokeWidth={2} />
            <Text style={[styles.titre, { color: style.fg }]}>{result.titre}</Text>
            <Text style={[styles.message, { color: style.fg }]}>{result.message}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.details}>
            {trajet?.ville_depart ? (
              <View style={styles.ligne}>
                <MapPin size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.valeur, { color: colors.text }]}>
                    {trajet.ville_depart} → {trajet.ville_arrivee}
                  </Text>
                  {trajet.compagnie ? (
                    <Text style={[styles.sous, { color: colors.onSurfaceVariant }]}>
                      {trajet.compagnie}
                      {trajet.vehicule?.immatriculation ? ` · ${trajet.vehicule.immatriculation}` : ''}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {depart ? (
              <View style={styles.ligne}>
                <CalendarCheck size={18} color={colors.primary} />
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <Text style={[styles.valeur, { color: colors.text }]}>{depart.texte}</Text>
                  {depart.ecartJours !== 0 ? (
                    <View style={[styles.alerte, { backgroundColor: colors.tertiaryContainer }]}>
                      <Text style={[styles.alerteTexte, { color: colors.onTertiaryContainer }]}>
                        {depart.relatif ? `Départ ${depart.relatif.toLowerCase()}` : 'Autre jour que le départ'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {sieges.length ? (
              <View style={styles.ligne}>
                <Armchair size={18} color={colors.primary} />
                <Text style={[styles.valeur, { color: colors.text }]}>
                  {sieges.length > 1 ? 'Sièges' : 'Siège'} {sieges.map((s) => `#${s}`).join(' ')}
                </Text>
              </View>
            ) : null}

            {result.passagers?.length ? (
              <View style={styles.ligne}>
                <User size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  {result.passagers.map((p, i) => (
                    <Text key={i} style={[styles.valeur, { color: colors.text }]}>
                      {p.nom_complet}
                    </Text>
                  ))}
                </View>
              </View>
            ) : null}

            {result.numero ? (
              <Text style={[styles.numero, { color: colors.onSurfaceVariant }]}>N° {result.numero}</Text>
            ) : null}
          </ScrollView>

          <TouchableOpacity style={[styles.bouton, { backgroundColor: colors.primary }]} onPress={onClose} activeOpacity={0.85}>
            <Text style={[styles.boutonTexte, { color: colors.onPrimary }]}>Scanner le suivant</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,15,36,0.55)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', maxHeight: '88%', paddingBottom: 20 },
  banner: { alignItems: 'center', gap: 6, paddingTop: 26, paddingBottom: 22, paddingHorizontal: 24 },
  titre: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  message: { fontSize: 14, fontWeight: '600', textAlign: 'center', opacity: 0.92 },
  details: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 6, gap: 14 },
  ligne: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  valeur: { fontSize: 16, fontWeight: '800' },
  sous: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  alerte: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  alerteTexte: { fontSize: 12, fontWeight: '800' },
  numero: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginTop: 4 },
  bouton: { marginHorizontal: 24, marginTop: 12, borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  boutonTexte: { fontSize: 16, fontWeight: '800' },
});
