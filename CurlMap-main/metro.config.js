const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution for react-native-maps and prevent TurboModule conflicts
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-maps': 'react-native-maps',
};

// Add support for better module resolution in production
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: false, // Disable inline requires for better stability
  },
});

// Improve stability for production builds
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;