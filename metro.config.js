const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// react-native-maps needs a Google Maps API key (app.json ->
// android.config.googleMaps.apiKey) to render on a real Android build —
// without one, mounting the native MapView crashes the whole app on
// startup of any screen that uses it. No key is configured yet, so the
// dummy fallback is aliased on every platform (not just web) until one is
// added; flip this back to `if (process.env.EXPO_OS === 'web')` once a
// real key is in place.
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-maps': path.resolve(__dirname, 'lib/MapDummy.tsx'),
};

module.exports = config;
