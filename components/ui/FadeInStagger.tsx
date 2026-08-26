import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

interface FadeInStaggerProps {
  children: React.ReactNode;
  index?: number;
  delayStep?: number;
  style?: StyleProp<ViewStyle>;
  distance?: number;
}

/**
 * Entrée animée (fondu + glissement vertical) pour donner un effet "staggered"
 * à une liste : passer `index` (position dans la liste) pour décaler chaque
 * élément de `delayStep` ms. Basé sur Animated (pas de dépendance native
 * supplémentaire) pour rester léger et sûr à intégrer partout.
 */
export default function FadeInStagger({
  children,
  index = 0,
  delayStep = 70,
  distance = 16,
  style,
}: FadeInStaggerProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay: index * delayStep,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay: index * delayStep,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}
