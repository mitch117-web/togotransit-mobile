import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Brand } from '../../constants/Colors';

/**
 * Logo TogoTransit « Soleil » : un T sous un soleil levant.
 * - variant "circle" : pastille indigo (fonds clairs, listes, en-têtes)
 * - variant "glyph"  : T blanc + soleil sans pastille (fonds sombres)
 * La géométrie est celle des icônes de l'application (repère 64 x 64).
 */
type MarkProps = {
  size?: number;
  variant?: 'circle' | 'glyph';
  glyphColor?: string;
};

export const LogoMark: React.FC<MarkProps> = ({ size = 40, variant = 'circle', glyphColor = Brand.white }) => (
  <Svg width={size} height={size} viewBox={variant === 'glyph' ? '8 8 48 48' : '0 0 64 64'}>
    {variant === 'circle' && <Circle cx={32} cy={32} r={32} fill={Brand.indigo} />}
    <Path d="M22.5 20 A9.5 9.5 0 0 1 41.5 20 Z" fill={Brand.sun} />
    <Rect x={12} y={20} width={40} height={9} rx={3} fill={glyphColor} />
    <Rect x={26.5} y={24} width={11} height={30} rx={3} fill={glyphColor} />
  </Svg>
);

type LogoProps = {
  size?: number;
  tone?: 'onLight' | 'onDark';
  showWordmark?: boolean;
};

/** Logo complet : marque + nom. Sur fond sombre, « Togo » est blanc et « Transit » prend la couleur du soleil. */
export const Logo: React.FC<LogoProps> = ({ size = 36, tone = 'onLight', showWordmark = true }) => {
  const dark = tone === 'onDark';
  return (
    <View style={styles.row}>
      <LogoMark size={size} variant={dark ? 'glyph' : 'circle'} />
      {showWordmark && (
        <Text style={[styles.word, { fontSize: Math.round(size * 0.56) }]}>
          <Text style={{ color: dark ? Brand.white : Brand.indigo, fontWeight: '900' }}>Togo</Text>
          <Text style={{ color: dark ? Brand.sun : Brand.indigo, fontWeight: dark ? '900' : '500' }}>Transit</Text>
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  word: { letterSpacing: -0.5 },
});

export default Logo;
