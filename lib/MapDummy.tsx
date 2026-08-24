// Dummy module for react-native-maps on web
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from './theme';

export const Marker = () => null;
export const Polyline = () => null;

interface MapViewProps {
  style?: any;
  region?: any;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  children?: React.ReactNode;
}

const MapView: React.FC<MapViewProps> = ({ style, children, ...props }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[style, styles.placeholder, { backgroundColor: colors.surface }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        Carte disponible sur mobile uniquement
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default MapView;
