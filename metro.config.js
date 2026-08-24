const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Alias react-native-maps to a dummy module on web
if (process.env.EXPO_OS === 'web') {
  config.resolver.alias = {
    ...config.resolver.alias,
    'react-native-maps': path.resolve(__dirname, 'lib/MapDummy.tsx'),
  };
}

module.exports = config;
