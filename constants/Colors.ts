/**
 * TogoTransit Design System Colors
 *
 * Identité « Soleil » : indigo (confiance, nuit), soleil levant (accent chaud), turquoise (confirmation).
 * Le texte courant reste sur des fonds clairs avec un contraste AA ; le soleil (#FFB020) sert d'accent,
 * jamais de couleur de texte sur fond clair.
 */

export interface ThemeColors {
  text: string;
  background: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  primary: string;
  primaryHover: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  surface: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  outline: string;
  outlineVariant: string;
  surfaceTint: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  success: string;
  onSuccess: string;
  warning: string;
  primaryFixed: string;
  primaryFixedDim: string;
  onPrimaryFixed: string;
  onPrimaryFixedVariant: string;
  secondaryFixed: string;
  secondaryFixedDim: string;
  onSecondaryFixed: string;
  onSecondaryFixedVariant: string;
  tertiaryFixed: string;
  tertiaryFixedDim: string;
  onTertiaryFixed: string;
  onTertiaryFixedVariant: string;
  textSecondary: string;
  border: string;
}

/** Couleurs de marque, utilisables telles quelles (logo, écrans sombres d'accueil et de connexion). */
export const Brand = {
  indigo: '#1C2A5E',
  indigoDeep: '#0A0F24',
  indigoNight: '#121A38',
  sun: '#FFB020',
  sunSoft: '#FFE7B8',
  turquoise: '#14A89A',
  white: '#FFFFFF',
} as const;

export const Colors: {
  light: ThemeColors;
  dark: ThemeColors;
} = {
  light: {
    text: '#0E1530',
    background: '#F6F8FD',
    tint: '#1C2A5E',
    tabIconDefault: '#6B7597',
    tabIconSelected: '#1C2A5E',
    primary: '#1C2A5E',
    primaryHover: '#141F47',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E3E8F8',
    onPrimaryContainer: '#101A3F',
    secondary: '#0B7A70',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D3F1EC',
    onSecondaryContainer: '#053F39',
    tertiary: '#FFB020',
    onTertiary: '#2B1A00',
    tertiaryContainer: '#FFE7B8',
    onTertiaryContainer: '#4A2E00',
    surface: '#EEF1F8',
    surfaceDim: '#D5DBEC',
    surfaceBright: '#F6F8FD',
    surfaceVariant: '#E3E8F4',
    onSurface: '#0E1530',
    onSurfaceVariant: '#55607F',
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F8FAFE',
    surfaceContainer: '#E9EDF7',
    surfaceContainerHigh: '#E1E6F3',
    surfaceContainerHighest: '#0E153010',
    inverseSurface: '#1B2447',
    inverseOnSurface: '#EEF1FF',
    inversePrimary: '#B7C3F2',
    outline: '#6B7597',
    outlineVariant: '#DCE1F0',
    surfaceTint: '#1C2A5E',
    error: '#D92D20',
    onError: '#FFFFFF',
    errorContainer: '#FEF0EE',
    onErrorContainer: '#7A1710',
    success: '#12A36B',
    onSuccess: '#003D27',
    warning: '#F59E0B',
    primaryFixed: '#DDE3FA',
    primaryFixedDim: '#B7C3F2',
    onPrimaryFixed: '#0A1233',
    onPrimaryFixedVariant: '#26367A',
    secondaryFixed: '#CDEFEA',
    secondaryFixedDim: '#9BDDD5',
    onSecondaryFixed: '#03322D',
    onSecondaryFixedVariant: '#0B5B53',
    tertiaryFixed: '#FFE7B8',
    tertiaryFixedDim: '#FFCF7A',
    onTertiaryFixed: '#2B1A00',
    onTertiaryFixedVariant: '#6B4300',
    textSecondary: '#55607F',
    border: '#E1E6F3',
  },
  dark: {
    text: '#F2F5FF',
    background: '#0A0F24',
    tint: '#FFB020',
    tabIconDefault: '#7C88B0',
    tabIconSelected: '#FFB020',
    primary: '#AFC0FF',
    primaryHover: '#9AB0FF',
    onPrimary: '#0F1A44',
    primaryContainer: '#26346F',
    onPrimaryContainer: '#DCE3FF',
    secondary: '#4FD1C5',
    onSecondary: '#002F2B',
    secondaryContainer: '#0B4F49',
    onSecondaryContainer: '#CDF5F0',
    tertiary: '#FFB020',
    onTertiary: '#2B1A00',
    tertiaryContainer: '#4A3300',
    onTertiaryContainer: '#FFE7B8',
    surface: '#121A38',
    surfaceDim: '#070B1A',
    surfaceBright: '#212C57',
    surfaceVariant: '#1A2347',
    onSurface: '#F2F5FF',
    onSurfaceVariant: '#A7B0D0',
    surfaceContainerLowest: '#0C1230',
    surfaceContainerLow: '#101733',
    surfaceContainer: '#151D3C',
    surfaceContainerHigh: '#1C2548',
    surfaceContainerHighest: '#252F57',
    inverseSurface: '#F2F5FF',
    inverseOnSurface: '#0A0F24',
    inversePrimary: '#1C2A5E',
    outline: '#7C88B0',
    outlineVariant: '#28335E',
    surfaceTint: '#AFC0FF',
    error: '#FF6B6B',
    onError: '#4A0B0B',
    errorContainer: '#6B1A1A',
    onErrorContainer: '#FFE3E3',
    success: '#4ADE9A',
    onSuccess: '#003D27',
    warning: '#FBBF24',
    primaryFixed: '#DDE3FA',
    primaryFixedDim: '#B7C3F2',
    onPrimaryFixed: '#0A1233',
    onPrimaryFixedVariant: '#26367A',
    secondaryFixed: '#CDEFEA',
    secondaryFixedDim: '#9BDDD5',
    onSecondaryFixed: '#03322D',
    onSecondaryFixedVariant: '#0B5B53',
    tertiaryFixed: '#FFE7B8',
    tertiaryFixedDim: '#FFCF7A',
    onTertiaryFixed: '#2B1A00',
    onTertiaryFixedVariant: '#6B4300',
    textSecondary: '#A7B0D0',
    border: '#222C52',
  },
};
