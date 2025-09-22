// This file helps generate splash screen images in different formats
// Run this script to convert SVG to PNG for Expo compatibility

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateSplashScreenAssets() {
  const svgPath = path.join(__dirname, 'splash.svg');
  const assetsDir = __dirname;
  
  // Create splash.png (main splash screen)
  await sharp(svgPath)
    .png()
    .resize(1284, 2778) // iPhone Pro Max size
    .toFile(path.join(assetsDir, 'splash.png'));
    
  // Create adaptive-icon.png for Android
  await sharp(svgPath)
    .png()
    .resize(1024, 1024)
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
    
  // Create notification-icon.png
  await sharp(svgPath)
    .png()
    .resize(96, 96)
    .toFile(path.join(assetsDir, 'notification-icon.png'));
    
  console.log('Splash screen assets generated successfully!');
}

// Run only if sharp is available
if (typeof require !== 'undefined') {
  try {
    require('sharp');
    generateSplashScreenAssets();
  } catch (error) {
    console.log('Sharp not available. Please generate PNG assets manually from the SVG file.');
  }
}