/**
 * TurboModule compatibility utilities
 * Handles TurboModuleRegistry related issues in React Native New Architecture
 */

// Check if TurboModuleRegistry is available
export const isTurboModuleAvailable = () => {
  try {
    const { TurboModuleRegistry } = require('react-native');
    return !!TurboModuleRegistry;
  } catch (error) {
    return false;
  }
};

// Safe module loader for TurboModule compatibility
// Note: Dynamic requires are not supported in Metro bundler
export const safeRequire = (moduleName: string) => {
  console.warn(`Dynamic require not supported in Metro bundler for module: ${moduleName}`);
  return null;
};

// Handle TurboModuleRegistry errors gracefully
export const withTurboModuleErrorHandling = <T extends any[], R>(
  fn: (...args: T) => R,
  fallback: R
) => {
  return (...args: T): R => {
    try {
      return fn(...args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('TurboModuleRegistry')) {
        console.warn('TurboModuleRegistry error handled:', error);
        return fallback;
      }
      throw error;
    }
  };
};

// Check if we're running on New Architecture
export const isNewArchitectureEnabled = () => {
  try {
    const { TurboModuleRegistry } = require('react-native');
    return !!TurboModuleRegistry?.getEnforcing;
  } catch {
    return false;
  }
};

export default {
  isTurboModuleAvailable,
  safeRequire,
  withTurboModuleErrorHandling,
  isNewArchitectureEnabled,
};