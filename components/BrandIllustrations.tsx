import React from 'react';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Brand } from '../constants/Colors';

/**
 * Illustrations de l'accueil (onboarding) : dessinées dans l'identité « Soleil », sans photo ni connexion réseau.
 * Chaque illustration remplit son conteneur (repère 320 x 340, recadrage centré).
 */
const SKY = '#24347A';
const HILL_FAR = '#1B2866';
const HILL_NEAR = '#131D4F';
const ROAD = '#0C1233';
const GRID = '#2A3A80';
const CARD = '#1B2866';

const Stars = () => (
  <G fill={Brand.sunSoft}>
    <Circle cx={40} cy={44} r={1.8} opacity={0.7} />
    <Circle cx={92} cy={74} r={1.4} opacity={0.6} />
    <Circle cx={150} cy={36} r={1.6} opacity={0.7} />
    <Circle cx={272} cy={48} r={1.5} opacity={0.6} />
    <Circle cx={298} cy={92} r={1.2} opacity={0.5} />
  </G>
);

/** Un bus sur la route à l'aube : réserver un trajet. */
export const BusDawnIllustration: React.FC = () => (
  <Svg width="100%" height="100%" viewBox="0 0 320 340" preserveAspectRatio="xMidYMid slice">
    <Rect width={320} height={340} fill={SKY} />
    <Stars />
    <Circle cx={225} cy={175} r={92} fill={Brand.sun} opacity={0.14} />
    <Circle cx={225} cy={175} r={66} fill={Brand.sun} opacity={0.24} />
    <Circle cx={225} cy={175} r={44} fill={Brand.sun} />
    <Path d="M0 205 C50 170 110 185 160 200 C215 216 270 185 320 192 V340 H0 Z" fill={HILL_FAR} />
    <Path d="M0 240 C60 214 130 230 190 244 C245 256 290 236 320 238 V340 H0 Z" fill={HILL_NEAR} />
    <Rect y={262} width={320} height={78} fill={ROAD} />
    <Rect y={262} width={320} height={3} fill={GRID} />
    <Path d="M10 290 H310" stroke={Brand.sun} strokeWidth={4} strokeDasharray="18 14" strokeLinecap="round" />
    <Path d="M236 254 L304 234 L304 276 Z" fill={Brand.sunSoft} opacity={0.2} />
    <Rect x={80} y={194} width={100} height={9} rx={4.5} fill="#E3E8F8" />
    <Rect x={52} y={204} width={184} height={62} rx={12} fill={Brand.white} />
    {[64, 94, 124, 154].map((x) => (
      <Rect key={x} x={x} y={214} width={24} height={20} rx={4} fill={Brand.indigo} />
    ))}
    <Rect x={186} y={212} width={16} height={42} rx={3} fill={Brand.indigo} />
    <Path d="M210 214 H224 Q232 214 232 222 V238 H210 Z" fill={Brand.indigo} />
    <Rect x={52} y={244} width={184} height={8} fill={Brand.sun} />
    <Circle cx={54} cy={254} r={3} fill="#FF6B6B" />
    <Circle cx={232} cy={256} r={4} fill={Brand.sunSoft} />
    <Circle cx={96} cy={268} r={14} fill={Brand.indigoDeep} />
    <Circle cx={96} cy={268} r={5.5} fill="#CBD5E1" />
    <Circle cx={196} cy={268} r={14} fill={Brand.indigoDeep} />
    <Circle cx={196} cy={268} r={5.5} fill="#CBD5E1" />
  </Svg>
);

/** Un colis suivi sur la carte : envoyer et suivre un colis. */
export const ParcelTrackingIllustration: React.FC = () => (
  <Svg width="100%" height="100%" viewBox="0 0 320 340" preserveAspectRatio="xMidYMid slice">
    <Rect width={320} height={340} fill={SKY} />
    <Stars />
    <Circle cx={270} cy={50} r={60} fill={Brand.sun} opacity={0.14} />
    <Rect x={28} y={56} width={264} height={228} rx={24} fill={CARD} />
    <G stroke={GRID} strokeWidth={2}>
      <Path d="M28 112 H292" />
      <Path d="M28 168 H292" />
      <Path d="M28 224 H292" />
      <Path d="M96 56 V284" />
      <Path d="M160 56 V284" />
      <Path d="M224 56 V284" />
    </G>
    <Path
      d="M70 244 C112 244 108 186 160 184 S222 124 248 112"
      stroke={Brand.sun}
      strokeWidth={5}
      strokeDasharray="1 12"
      strokeLinecap="round"
      fill="none"
    />
    <Circle cx={70} cy={244} r={10} fill={Brand.white} />
    <Circle cx={70} cy={244} r={4.5} fill={Brand.indigo} />
    <Rect x={132} y={158} width={56} height={50} rx={8} fill={Brand.sun} />
    <Rect x={154} y={158} width={12} height={50} fill="#E89B00" />
    <Rect x={138} y={188} width={20} height={14} rx={2.5} fill={Brand.sunSoft} />
    <Path
      d="M248 74 C233 74 224 85 224 98 C224 115 242 128 248 142 C254 128 272 115 272 98 C272 85 263 74 248 74 Z"
      fill={Brand.turquoise}
    />
    <Circle cx={248} cy={98} r={9} fill={Brand.white} />
  </Svg>
);

const CITY_LABEL = { fontSize: 12, fontWeight: '700' as const, fill: '#F2F5FF' };

/** Les grandes villes reliées entre elles : un réseau qui couvre tout le pays. */
export const NetworkIllustration: React.FC = () => (
  <Svg width="100%" height="100%" viewBox="0 0 320 340" preserveAspectRatio="xMidYMid slice">
    <Rect width={320} height={340} fill={SKY} />
    <Stars />
    <Circle cx={52} cy={64} r={44} fill={Brand.sun} opacity={0.16} />
    <Circle cx={52} cy={64} r={24} fill={Brand.sun} opacity={0.3} />
    <G stroke={Brand.white} strokeOpacity={0.35} strokeLinecap="round" fill="none">
      <Path d="M160 300 C160 262 184 244 180 204 S160 148 172 108 S186 62 178 34" strokeWidth={4} />
      <Path d="M180 204 C150 204 130 214 112 232" strokeWidth={3} strokeDasharray="2 8" />
      <Path d="M160 300 C190 300 215 292 240 296" strokeWidth={3} strokeDasharray="2 8" />
    </G>
    <Circle cx={160} cy={300} r={19} fill="none" stroke={Brand.sun} strokeOpacity={0.45} strokeWidth={2} />
    <Circle cx={160} cy={300} r={11} fill={Brand.sun} />
    <G fill={Brand.white}>
      <Circle cx={180} cy={204} r={7} />
      <Circle cx={166} cy={148} r={7} />
      <Circle cx={172} cy={108} r={7} />
      <Circle cx={178} cy={34} r={7} />
      <Circle cx={112} cy={232} r={5} />
      <Circle cx={240} cy={296} r={5} />
    </G>
    <SvgText x={160} y={328} textAnchor="middle" {...CITY_LABEL}>Lomé</SvgText>
    <SvgText x={240} y={318} textAnchor="middle" {...CITY_LABEL}>Aného</SvgText>
    <SvgText x={112} y={254} textAnchor="middle" {...CITY_LABEL}>Kpalimé</SvgText>
    <SvgText x={196} y={208} textAnchor="start" {...CITY_LABEL}>Atakpamé</SvgText>
    <SvgText x={182} y={152} textAnchor="start" {...CITY_LABEL}>Sokodé</SvgText>
    <SvgText x={188} y={112} textAnchor="start" {...CITY_LABEL}>Kara</SvgText>
    <SvgText x={194} y={38} textAnchor="start" {...CITY_LABEL}>Dapaong</SvgText>
  </Svg>
);
