import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Truck, ShoppingBag, MapPin, ArrowRight, ShieldCheck, Globe, Zap } from 'lucide-react-native';
import { useAuth } from '../lib/auth';
import { Logo } from '../components/ui/Logo';
import { BusDawnIllustration, ParcelTrackingIllustration, NetworkIllustration } from '../components/BrandIllustrations';

const { width, height } = Dimensions.get('window');

const GOLD = '#FFB020';
const GOLD_DIM = '#F29A00';

const SLIDES = [
  {
    id: '1',
    title: 'Voyagez Sans Limites',
    description: 'Réservez vos tickets de bus en quelques secondes. Évitez les files d\'attente et voyagez sereinement.',
    icon: ShoppingBag,
    feature: 'Réservation Instantanée',
    featureIcon: Zap,
    Illustration: BusDawnIllustration,
  },
  {
    id: '2',
    title: 'Logistique Intelligente',
    description: 'Envoyez vos colis partout au Togo. Suivi en temps réel et livraison sécurisée garantie.',
    icon: Truck,
    feature: 'Sécurité Maximale',
    featureIcon: ShieldCheck,
    Illustration: ParcelTrackingIllustration,
  },
  {
    id: '3',
    title: 'Réseau National',
    description: 'Une couverture complète du territoire. Connectez-vous à vos proches, peu importe la distance.',
    icon: MapPin,
    feature: 'Partout au Togo',
    featureIcon: Globe,
    Illustration: NetworkIllustration,
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setOnboarded } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / width);
    setActiveIndex(index);
  };

  const finishOnboarding = async (path: '/(auth)/login' | '/(auth)/register') => {
    await setOnboarded();
    router.replace(path);
  };

  const renderItem = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.imageWrapper}>
        <item.Illustration />
        <View style={styles.featureBadge}>
          <item.featureIcon size={16} color={GOLD} strokeWidth={2.5} />
          <Text style={styles.featureText}>{item.feature}</Text>
        </View>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.glowTop} pointerEvents="none" />

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Logo tone="onDark" size={36} />
        </View>
        <TouchableOpacity onPress={() => finishOnboarding('/(auth)/login')}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        keyExtractor={(item) => item.id}
        scrollEventThrottle={16}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === activeIndex ? GOLD : 'rgba(245,247,255,0.2)',
                  width: index === activeIndex ? 32 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={() => finishOnboarding('/(auth)/register')} activeOpacity={0.85}>
            <LinearGradient colors={[GOLD, GOLD_DIM]} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Commencer l'aventure</Text>
              <ArrowRight size={20} color="#0A0F24" strokeWidth={2.5} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => finishOnboarding('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>
              Déjà un compte ? <Text style={{ color: GOLD, fontWeight: '800' }}>Connexion</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F24',
  },
  glowTop: {
    position: 'absolute',
    top: -160,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: 'rgba(76,99,214,0.22)',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoDot: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#f5f7ff',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(245,247,255,0.55)',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  imageWrapper: {
    width: width * 0.85,
    height: height * 0.42,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  imageDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(76,99,214,0.25)',
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  featureBadge: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    zIndex: 2,
    backgroundColor: 'rgba(10,15,36,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  featureText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: GOLD,
  },
  textContainer: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 36,
    color: '#f5f7ff',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    color: 'rgba(245,247,255,0.55)',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A0F24',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(245,247,255,0.55)',
  },
});
