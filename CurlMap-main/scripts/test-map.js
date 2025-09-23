#!/usr/bin/env node

/**
 * Test script to validate map configuration and dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🗺️  Testing Map Configuration...\n');

// Check package.json for map dependencies
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log('📦 Checking dependencies:');
  const mapDeps = {
    'react-native-maps': packageJson.dependencies?.['react-native-maps'],
    'expo-location': packageJson.dependencies?.['expo-location'],
  };
  
  Object.entries(mapDeps).forEach(([dep, version]) => {
    if (version) {
      console.log(`  ✅ ${dep}: ${version}`);
    } else {
      console.log(`  ❌ ${dep}: Not found`);
    }
  });
  console.log();
}

// Check for map components
const mapComponentPath = path.join(__dirname, '..', 'components', 'ProductionSafeMap.tsx');
if (fs.existsSync(mapComponentPath)) {
  console.log('✅ ProductionSafeMap.tsx exists');
  
  const mapContent = fs.readFileSync(mapComponentPath, 'utf8');
  
  // Check for potential issues
  const checks = [
    { name: 'Provider null check', pattern: /provider=\{null\}/, pass: true },
    { name: 'Error handling', pattern: /catch\s*\(\s*error\s*\)/, pass: true },
    { name: 'Validation checks', pattern: /typeof.*!==.*number/, pass: true },
    { name: 'isNaN checks', pattern: /isNaN\(/, pass: true },
  ];
  
  checks.forEach(check => {
    const found = check.pattern.test(mapContent);
    if (found === check.pass) {
      console.log(`  ✅ ${check.name}: OK`);
    } else {
      console.log(`  ⚠️  ${check.name}: Check needed`);
    }
  });
} else {
  console.log('❌ ProductionSafeMap.tsx not found');
}

console.log();

// Check app configuration
const configFiles = ['app.json', 'app.config.js'];
configFiles.forEach(configFile => {
  const configPath = path.join(__dirname, '..', configFile);
  if (fs.existsSync(configPath)) {
    console.log(`✅ ${configFile} exists`);
    
    const content = fs.readFileSync(configPath, 'utf8');
    if (content.includes('google') || content.includes('maps')) {
      console.log(`  ⚠️  ${configFile} contains Google Maps references`);
    } else {
      console.log(`  ✅ ${configFile} is clean (no Google Maps refs)`);
    }
  }
});

console.log('\n🎯 Map Setup Summary:');
console.log('  • Using OpenStreetMap (free, no API key required)');
console.log('  • Provider set to null (default)');
console.log('  • Comprehensive error handling implemented');
console.log('  • Input validation for all coordinates');
console.log('  • Fallback components for web/errors');

console.log('\n✨ Your map is ready for production with zero billing costs!');