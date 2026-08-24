import * as React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform, Image, Dimensions, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { ArrowLeft, User, Phone, MapPin, Package, Send, Plus, Minus, Info, Camera as CameraIcon, X } from 'lucide-react-native';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import * as ImagePicker from 'expo-image-picker';

export default function SendParcelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [loading, setLoading] = React.useState(false);
  const [parcelPhoto, setParcelPhoto] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    senderName: user?.name || '',
    senderPhone: user?.phone || '',
    senderCity: 'Lomé',
    receiverName: '',
    receiverPhone: '',
    receiverCity: '',
    category: 'STANDARD',
    weight: 1.0,
    origin: 'Lomé',
    destination: '',
    paymentMethod: 'TMONEY',
    price: 1500
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à la caméra.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setParcelPhoto(result.assets[0].uri);
    }
  };

  const cities = ['Lomé', 'Kara', 'Sokodé', 'Kpalimé', 'Atakpamé', 'Dapaong'];
  const categories = [
    { label: 'Standard', value: 'STANDARD' },
    { label: 'Fragile', value: 'FRAGILE' },
    { label: 'Documents', value: 'DOCUMENTS' },
    { label: 'Périssable', value: 'PERISHABLE' }
  ];

  const calculatePrice = (weight: number, category: string) => {
    const w = Number(weight);
    if (isNaN(w)) return 0;
    let base = 1500;
    if (w > 1) base += (w - 1) * 500;
    if (category === 'FRAGILE') base += 1000;
    if (category === 'DOCUMENTS') base = 1000;
    return base;
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'weight' || field === 'category') {
        newData.price = calculatePrice(Number(newData.weight), newData.category);
      }
      if (field === 'receiverCity') {
        newData.destination = value;
      }
      return newData;
    });
  };

  const handleSubmit = async () => {
    if (!formData.receiverName || !formData.receiverPhone || !formData.receiverCity) {
      Alert.alert('Champs requis', 'Veuillez remplir toutes les informations du destinataire.');
      return;
    }

    if (!parcelPhoto) {
      Alert.alert('Photo requise', 'Veuillez prendre une photo du colis pour garantir son identification.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/parcels', {
        ...formData,
        senderId: user?.id,
        deliveryType: 'NORMAL',
        photo: parcelPhoto
      });
      
      Alert.alert(
        'Colis Enregistré !',
        `ID de suivi : ${response.data.trackingId}\n\nVotre colis a été enregistré. Veuillez vous rendre dans l'agence la plus proche pour le dépôt.`,
        [{ text: 'Voir mes colis', onPress: () => router.push('/(tabs)/parcels') }]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.response?.data?.error || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      <Stack.Screen options={{ 
        title: 'Nouvel Envoi',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
            <ArrowLeft color={colors.primary} size={24} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Enregistrement Colis</Text>
          <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>Remplissez les détails pour expédier votre colis.</Text>
        </View>

        {/* Section: Photo du Colis */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CameraIcon size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Photo du Colis</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.photoCard, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}
            onPress={pickImage}
          >
            {parcelPhoto ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: parcelPhoto }} style={styles.photoPreview} />
                <TouchableOpacity 
                  style={[styles.removePhotoBtn, { backgroundColor: colors.error }]}
                  onPress={() => setParcelPhoto(null)}
                >
                  <X color="white" size={16} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <View style={[styles.cameraIconCircle, { backgroundColor: colors.primaryContainer }]}>
                  <CameraIcon size={32} color={colors.primary} />
                </View>
                <Text style={[styles.photoHint, { color: colors.onSurfaceVariant }]}>Prendre une photo du colis</Text>
                <Text style={[styles.photoSubHint, { color: colors.outline }]}>Nécessaire pour l'identification</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Section: Expéditeur */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Expéditeur</Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Nom de l'expéditeur</Text>
              <View style={[styles.inputField, { backgroundColor: colors.surfaceContainerLow }]}>
                <User size={20} color={colors.outline} />
                <TextInput
                  style={[styles.textInput, { color: colors.onSurface }]}
                  value={formData.senderName}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Numéro de téléphone</Text>
              <View style={[styles.inputField, { backgroundColor: colors.surfaceContainerLow }]}>
                <Phone size={20} color={colors.outline} />
                <TextInput
                  style={[styles.textInput, { color: colors.onSurface }]}
                  value={formData.senderPhone}
                  editable={false}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Section: Destinataire */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color={colors.secondary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Destinataire</Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Nom du destinataire</Text>
              <View style={[styles.inputField, { borderColor: colors.outlineVariant }]}>
                <User size={20} color={colors.outline} />
                <TextInput
                  style={[styles.textInput, { color: colors.onSurface }]}
                  placeholder="Ex: Koffi Mensah"
                  placeholderTextColor={colors.outline}
                  value={formData.receiverName}
                  onChangeText={(v) => updateField('receiverName', v)}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Téléphone du destinataire</Text>
              <View style={[styles.inputField, { borderColor: colors.outlineVariant }]}>
                <Phone size={20} color={colors.outline} />
                <TextInput
                  style={[styles.textInput, { color: colors.onSurface }]}
                  placeholder="Ex: 90 00 00 00"
                  placeholderTextColor={colors.outline}
                  keyboardType="phone-pad"
                  value={formData.receiverPhone}
                  onChangeText={(v) => updateField('receiverPhone', v)}
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Ville de destination</Text>
              <View style={styles.citiesContainer}>
                {cities.map(city => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.cityChip,
                      { 
                        backgroundColor: formData.receiverCity === city ? colors.primary : colors.surfaceContainerLow,
                        borderColor: formData.receiverCity === city ? colors.primary : colors.outlineVariant
                      }
                    ]}
                    onPress={() => updateField('receiverCity', city)}
                  >
                    <Text style={[
                      styles.cityChipText, 
                      { color: formData.receiverCity === city ? colors.onPrimary : colors.onSurfaceVariant }
                    ]}>{city}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Section: Colis */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={18} color={colors.tertiary} />
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Détails du Colis</Text>
          </View>
          
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.outlineVariant + '40' }]}>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Catégorie</Text>
              <View style={styles.categoriesContainer}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.catChip,
                      { 
                        backgroundColor: formData.category === cat.value ? colors.secondaryContainer : colors.surfaceContainerLow,
                        borderColor: formData.category === cat.value ? colors.secondaryContainer : colors.outlineVariant
                      }
                    ]}
                    onPress={() => updateField('category', cat.value)}
                  >
                    <Text style={[
                      styles.catChipText, 
                      { color: formData.category === cat.value ? colors.onSecondaryContainer : colors.onSurfaceVariant }
                    ]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>Poids estimé (kg)</Text>
              <View style={styles.weightControls}>
                <TouchableOpacity 
                  style={[styles.weightBtn, { backgroundColor: colors.surfaceContainerHigh }]}
                  onPress={() => updateField('weight', Math.max(0.5, formData.weight - 0.5))}
                >
                  <Minus size={20} color={colors.onSurface} />
                </TouchableOpacity>
                <View style={[styles.weightValue, { borderColor: colors.outlineVariant }]}>
                  <Text style={[styles.weightText, { color: colors.onSurface }]}>{formData.weight.toFixed(1)} KG</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.weightBtn, { backgroundColor: colors.primary }]}
                  onPress={() => updateField('weight', formData.weight + 0.5)}
                >
                  <Plus size={20} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Price & Submit */}
        <View style={[styles.priceCard, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={[styles.priceLabel, { color: colors.onPrimary + '80' }]}>Estimation tarifaire</Text>
            <Text style={[styles.priceValue, { color: colors.onPrimary }]}>{formData.price.toLocaleString('fr-FR')} FCFA</Text>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.secondaryContainer }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onSecondaryContainer} />
            ) : (
              <>
                <Text style={[styles.submitBtnText, { color: colors.onSecondaryContainer }]}>Valider</Text>
                <Send size={20} color={colors.onSecondaryContainer} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerInfo}>
          <Info size={16} color={colors.onSurfaceVariant} />
          <Text style={[styles.footerInfoText, { color: colors.onSurfaceVariant }]}>
            Le tarif final sera confirmé par l'agent lors du dépôt en agence après pesée officielle.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerInfo: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  photoCard: {
    borderRadius: 24,
    borderWidth: 1,
    height: 200,
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoPlaceholder: {
    alignItems: 'center',
  },
  cameraIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoHint: {
    fontSize: 14,
    fontWeight: '700',
  },
  photoSubHint: {
    fontSize: 12,
    marginTop: 4,
  },
  photoPreviewContainer: {
    width: '100%',
    height: '100%',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute', 
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  citiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  cityChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  weightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  weightBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightValue: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weightText: {
    fontSize: 16,
    fontWeight: '700',
  },
  priceCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  submitBtn: {
    paddingHorizontal: 24,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  footerInfoText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },
});
