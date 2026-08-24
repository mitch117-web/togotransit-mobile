import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';
import { Truck, ShoppingBag, MapPin, ArrowRight, ShieldCheck, Globe, Zap } from 'lucide-react-native';
import { useAuth } from '../lib/auth';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Voyagez Sans Limites',
    description: 'Réservez vos tickets de bus en quelques secondes. Évitez les files d\'attente et voyagez sereinement.',
    icon: ShoppingBag,
    color: '#002653',
    bg: '#d7e3ff',
    feature: 'Réservation Instantanée',
    featureIcon: Zap,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '2',
    title: 'Logistique Intelligente',
    description: 'Envoyez vos colis partout au Togo. Suivi en temps réel et livraison sécurisée garantie.',
    icon: Truck,
    color: '#9d4300',
    bg: '#ffdbca',
    feature: 'Sécurité Maximale',
    featureIcon: ShieldCheck,
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: '3',
    title: 'Réseau National',
    description: 'Une couverture complète du territoire. Connectez-vous à vos proches, peu importe la distance.',
    icon: MapPin,
    color: '#3e1f00',
    bg: '#ffdcc2',
    feature: 'Partout au Togo',
    featureIcon: Globe,
    image: 'https://images.unsplash.com/photo-1527030280862-64139fba04ca?auto=format&fit=crop&w=800&q=80'
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setOnboarded } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
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
        <View style={[styles.imageDecoration, { backgroundColor: item.bg, opacity: 0.3 }]} />
        <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        <View style={[styles.featureBadge, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
          <item.featureIcon size={16} color={item.color} strokeWidth={2.5} />
          <Text style={[styles.featureText, { color: item.color }]}>{item.feature}</Text>
        </View>
      </View>
      
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.onSurface }]}>{item.title}</Text>
        <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surfaceContainerLow }]}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={[styles.logoDot, { backgroundColor: colors.primary }]}>
            <Truck size={20} color={colors.onPrimary} strokeWidth={2.5} />
          </View>
          <Text style={[styles.logoText, { color: colors.onSurface }]}>Togo<Text style={{ color: colors.primary }}>Transit</Text></Text>
        </View>
        <TouchableOpacity onPress={() => finishOnboarding('/(auth)/login')}>
          <Text style={[styles.skipText, { color: colors.onSurfaceVariant }]}>Passer</Text>
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
                  backgroundColor: index === activeIndex ? colors.primary : colors.outlineVariant + '60',
                  width: index === activeIndex ? 32 : 8,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => finishOnboarding('/(auth)/register')}
          >
            <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>Commencer l'aventure</Text>
            <ArrowRight size={20} color={colors.onPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => finishOnboarding('/(auth)/login')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.onSurfaceVariant }]}>
              Déjà un compte ? <Text style={{ color: colors.primary, fontWeight: '800' }}>Connexion</Text>
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
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  imageWrapper: {
    width: width * 0.85,
    height: height * 0.45,
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 40,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  imageDecoration: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
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
  },
  featureText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textContainer: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
    lineHeight: 38,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 10,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
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
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

