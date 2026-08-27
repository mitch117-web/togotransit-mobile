import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform, StatusBar, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../lib/theme';
import { ArrowLeft, Camera, CheckCircle2, MapPin, X, User, Phone, Edit3, Image as ImageIcon, Navigation, Info, Package, RotateCcw } from 'lucide-react-native';
import api from '../lib/api';
import * as ImagePicker from 'expo-image-picker';
import SignatureScreen from 'react-native-signature-canvas';
import GlassCard from '../components/ui/GlassCard';
import FadeInStagger from '../components/ui/FadeInStagger';

export default function DeliveryConfirmationScreen() {
  const router = useRouter();
  const { parcelId, trackingId, destination, receiverName } = useLocalSearchParams();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = React.useState(false);
  const [photo, setPhoto] = React.useState<string | null>(null);
  const [signature, setSignature] = React.useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = React.useState(false);
  const signatureRef = React.useRef<any>(null);

  const handleConfirm = async () => {
    if (!photo) {
      Alert.alert('Preuve requise', 'Veuillez prendre une photo du colis pour confirmer la livraison.');
      return;
    }
    if (!signature) {
      Alert.alert('Signature requise', 'Le destinataire doit signer pour confirmer la réception.');
      return;
    }

    setLoading(true);
    try {
      // 1. Send the POD data
      await api.post(`/parcels/${parcelId}/pod`, {
        signature: signature, // Now sending real base64 signature
        latitude: 6.1256,
        longitude: 1.2254,
        photo // Optionnel selon le backend, mais on l'envoie quand même
      });

      // 2. The backend also updates the parcel status in the POD route, 
      // but let's make sure it's updated for the UI
      Alert.alert(
        'Livraison Terminée !',
        'La preuve de livraison a été enregistrée et le statut du colis a été mis à jour.',
        [{ text: 'Retour à la tournée', onPress: () => router.push('/(tabs)/parcels') }]
      );
    } catch (error: any) {
      // On évite console.error pour ne pas causer d'erreur dans le sandbox
      Alert.alert('Erreur', error.response?.data?.error || 'Échec de la confirmation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour utiliser la caméra.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true, // Demander le base64
    });

    if (!result.canceled) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true, // Demander le base64
    });

    if (!result.canceled) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Stack.Screen options={{ 
        title: 'Preuve de livraison',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
            <ArrowLeft color={colors.primary} size={24} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerInfo}>
          <View style={[styles.badge, { backgroundColor: colors.secondaryContainer }]}>
            <Text style={[styles.badgeText, { color: colors.onSecondaryContainer }]}>LIVRAISON EN COURS</Text>
          </View>
          <Text style={[styles.title, { color: colors.onSurface }]}>Confirmer la remise</Text>
          <Text style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>Vérifiez les informations et collectez les preuves.</Text>
        </View>

        {/* Parcel Brief */}
        <FadeInStagger index={0}>
        <GlassCard style={styles.briefCard}>
          <View style={styles.briefRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryContainer }]}>
              <Package size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.briefLabel, { color: colors.onSurfaceVariant }]}>Colis</Text>
              <Text style={[styles.briefValue, { color: colors.onSurface }]}>#{trackingId || 'TRK-1002'}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant + '20' }]} />
          <View style={styles.briefRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.secondaryContainer }]}>
              <User size={20} color={colors.secondary} />
            </View>
            <View>
              <Text style={[styles.briefLabel, { color: colors.onSurfaceVariant }]}>Destinataire</Text>
              <Text style={[styles.briefValue, { color: colors.onSurface }]}>{receiverName || 'Nayra'}</Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant + '20' }]} />
          <View style={styles.briefRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceContainerHigh }]}>
              <MapPin size={20} color={colors.onSurfaceVariant} />
            </View>
            <View>
              <Text style={[styles.briefLabel, { color: colors.onSurfaceVariant }]}>Lieu de remise</Text>
              <Text style={[styles.briefValue, { color: colors.onSurface }]}>{destination || 'Kpalimé'}</Text>
            </View>
          </View>
        </GlassCard>
        </FadeInStagger>

        {/* Photo Evidence */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ImageIcon size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Photo du colis</Text>
            <View style={[styles.requiredBadge, { backgroundColor: colors.errorContainer }]}>
              <Text style={[styles.requiredText, { color: colors.onErrorContainer }]}>Requis</Text>
            </View>
          </View>
          
          {photo ? (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity 
                style={[styles.retakeBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
                onPress={() => setPhoto(null)}
              >
                <Camera size={20} color="white" />
                <Text style={styles.retakeText}>Reprendre</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.dropzone, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
              onPress={takePhoto}
            >
              <View style={[styles.cameraCircle, { backgroundColor: colors.primaryContainer }]}>
                <Camera size={32} color={colors.primary} />
              </View>
              <Text style={[styles.dropzoneText, { color: colors.onSurface }]}>Prendre une photo de remise</Text>
              <Text style={[styles.dropzoneSub, { color: colors.onSurfaceVariant }]}>Assurez-vous que le colis est visible</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Signature */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Edit3 size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Signature client</Text>
            <View style={[styles.requiredBadge, { backgroundColor: colors.errorContainer }]}>
              <Text style={[styles.requiredText, { color: colors.onErrorContainer }]}>Requis</Text>
            </View>
          </View>

          {signature ? (
            <View style={styles.signatureCapturedContainer}>
              <View style={[styles.signaturePreview, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
                <Image source={{ uri: signature }} style={styles.signatureImage} resizeMode="contain" />
                <View style={[styles.successBadgeOverlay, { backgroundColor: colors.success }]}>
                  <CheckCircle2 size={16} color={colors.onSuccess} />
                  <Text style={[styles.successBadgeText, { color: colors.onSuccess }]}>SIGNATURE VALIDÉE</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.clearSignatureBtn, { backgroundColor: colors.surfaceContainerHighest }]}
                onPress={() => setSignature(null)}
              >
                <RotateCcw size={18} color={colors.primary} />
                <Text style={[styles.clearSignatureText, { color: colors.primary }]}>Effacer et resigner</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              activeOpacity={0.9}
              style={[styles.signaturePad, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}
              onPress={() => setShowSignatureModal(true)}
            >
              <View style={styles.unsignedContent}>
                <Text style={[styles.unsignedText, { color: colors.outlineVariant }]}>Cliquez pour faire signer le client</Text>
                <View style={[styles.signatureLine, { backgroundColor: colors.outlineVariant + '40' }]} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit */}
        <View style={styles.submitContainer}>
          {!(photo && signature) && (
            <Text style={[styles.hintText, { color: colors.error }]}>
              {!photo && !signature ? "Photo et Signature requises" : !photo ? "Photo du colis requise" : "Signature du destinataire requise"}
            </Text>
          )}
          <TouchableOpacity
            style={[
              styles.submitBtn, 
              { backgroundColor: (photo && signature) ? colors.secondaryContainer : colors.outlineVariant }
            ]}
            onPress={handleConfirm}
            disabled={loading || !(photo && signature)}
          >
            {loading ? (
              <ActivityIndicator color={colors.onSecondaryContainer} />
            ) : (
              <>
                <CheckCircle2 size={24} color={colors.onSecondaryContainer} strokeWidth={2.5} />
                <Text style={[styles.submitBtnText, { color: colors.onSecondaryContainer }]}>Valider la livraison</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerNote}>
          <Info size={16} color={colors.onSurfaceVariant} />
          <Text style={[styles.footerNoteText, { color: colors.onSurfaceVariant }]}>
            En validant, le client recevra un SMS de confirmation avec le lien vers sa facture.
          </Text>
        </View>
      </ScrollView>

      {/* Signature Modal */}
      <Modal visible={showSignatureModal} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.outlineVariant + '20' }]}>
            <TouchableOpacity onPress={() => setShowSignatureModal(false)} style={styles.modalCloseBtn}>
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Signature du destinataire</Text>
            <TouchableOpacity onPress={() => signatureRef.current?.clearSignature()} style={styles.modalCloseBtn}>
              <RotateCcw size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={{ flex: 1, backgroundColor: '#f9f9f9' }}>
            <SignatureScreen
              ref={signatureRef}
              onOK={(img) => {
                setSignature(img);
                setShowSignatureModal(false);
              }}
              onEmpty={() => Alert.alert('Signature vide', 'Veuillez faire signer le client avant de valider.')}
              descriptionText="Veuillez signer à l'intérieur du cadre"
              clearText="Effacer"
              confirmText="Valider"
              webStyle={`
                .m-signature-pad--footer {display: none;}
                .m-signature-pad {box-shadow: none; border: none;}
                body,html {height: 100%; margin: 0; padding: 0;}
              `}
              autoClear={false}
              imageType="image/png"
            />
          </View>

          <View style={[styles.modalFooter, { backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.outlineVariant + '20' }]}>
            <TouchableOpacity 
              style={[styles.modalBtn, { backgroundColor: colors.surfaceContainerHighest, flex: 1, marginRight: 12 }]} 
              onPress={() => setShowSignatureModal(false)}
            >
              <Text style={[styles.modalBtnText, { color: colors.onSurface }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 2 }]} 
              onPress={() => signatureRef.current?.readSignature()}
            >
              <Text style={[styles.modalBtnText, { color: colors.onPrimary, fontSize: 16 }]}>Confirmer la signature</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerInfo: {
    marginBottom: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  briefCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
    marginBottom: 32,
  },
  briefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  briefLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  briefValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '800',
  },
  dropzone: {
    height: 180,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  cameraCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropzoneText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dropzoneSub: {
    fontSize: 13,
  },
  photoContainer: {
    height: 220,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  retakeBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  retakeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  signaturePad: {
    height: 160,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signatureCapturedContainer: {
    gap: 12,
  },
  signaturePreview: {
    height: 160,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  successBadgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  successBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  clearSignatureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearSignatureText: {
    fontSize: 14,
    fontWeight: '700',
  },
  unsignedContent: {
    alignItems: 'center',
    width: '100%',
    gap: 20,
  },
  unsignedText: {
    fontSize: 16,
    fontWeight: '600',
  },
  signatureLine: {
    height: 2,
    width: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCloseBtn: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalFooter: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalBtn: {
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  modalBtnText: {
    fontWeight: '700',
  },
  submitContainer: {
    marginTop: 16,
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitBtn: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  submitBtnText: {
    fontSize: 18,
    fontWeight: '900',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    paddingHorizontal: 8,
  },
  footerNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },
});
