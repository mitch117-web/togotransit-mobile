import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, TextStyle } from 'react-native';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (n: number) => string;
  style?: TextStyle | TextStyle[];
}

/**
 * Compte de 0 jusqu'à `value` à l'apparition (effet "compteur animé").
 * Implémenté avec Animated.Value + listener plutôt qu'une lib tierce pour
 * éviter d'ajouter une dépendance native de plus juste avant la soutenance.
 */
export default function AnimatedCounter({ value, duration = 900, formatter, style }: AnimatedCounterProps) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    anim.setValue(0);
    const listenerId = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listenerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <Text style={style}>{formatter ? formatter(display) : display}</Text>;
}
