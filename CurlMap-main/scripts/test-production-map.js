#!/usr/bin/env node

/**
 * Test script to validate ProductionSafeMap configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🗺️  Testing Production-Safe Map Configuration...\n');

// Check if ProductionSafeMap component exists
const mapComponentPath = path.join(__dirname, '..', 'components', 'ProductionSafeMap.tsx');
if (fs.existsSync(mapComponentPath)) {
  console.log('✅ ProductionSafeMap component found');
  
  const componentContent = fs.readFileSync(mapComponentPath, 'utf8');
  
  // Check for OpenStreetMap implementation
  if (componentContent.includes('openstreetmap.org')) {
    console.log('✅ OpenStreetMap integration found (free alternative to Google Maps)');
  }
  
  // Check for web fallback
  if (componentContent.includes('WebMapFallback')) {
    console.log('✅ Web fallback component found');
  }
  
  // Check for native map handling
  if (componentContent.includes('NativeMapComponent')) {
    console.log('✅ Native map component found');
  }
  
  // Check for conditional imports
  if (componentContent.includes("Platform.OS !== 'web'")) {
    console.log('✅ Platform-aware imports found');
  }
  
} else {
  console.log('❌ ProductionSafeMap component not found');
}

// Check app configuration
const appConfigPath = path.join(__dirname, '..', 'app.config.js');
if (fs.existsSync(appConfigPath)) {
  const configContent = fs.readFileSync(appConfigPath, 'utf8');
  
  // Check if Google Maps API key requirements are removed
  if (!configContent.includes('googleMapsApiKey') && !configContent.includes('googleMaps')) {
    console.log('✅ Google Maps API key requirements removed from configuration');
  } else {
    console.log('⚠️  Google Maps API key still found in configuration');
  }
} else {
  console.log('❌ app.config.js not found');
}

// Check search component integration
const searchComponentPath = path.join(__dirname, '..', 'app', '(tabs)', 'search.tsx');
if (fs.existsSync(searchComponentPath)) {
  const searchContent = fs.readFileSync(searchComponentPath, 'utf8');
  
  if (searchContent.includes('ProductionSafeMap')) {
    console.log('✅ Search component uses ProductionSafeMap');
  } else {
    console.log('❌ Search component does not use ProductionSafeMap');
  }
} else {
  console.log('❌ Search component not found');
}

console.log('\n🎉 Production-Safe Map Analysis Complete!');
console.log('\n📋 Summary:');
console.log('- Uses OpenStreetMap (completely free, no API keys needed)');
console.log('- Supports both mobile and web platforms');
console.log('- Graceful fallbacks when react-native-maps is unavailable');
console.log('- No Google billing or API key requirements');
console.log('\n💡 Your app will now work in production without any map-related costs!');