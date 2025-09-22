const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution for react-native-maps
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-maps': 'react-native-maps',
};

// Add support for TurboModules
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;