# Production Maps Setup Guide

## ✅ Current Status
Your app is configured to work in production with `react-native-maps`, but you need to set up Google Maps API keys.

## 🔑 Required Steps for Production:

### 1. Get Google Maps API Keys
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the following APIs:
   - **Maps SDK for Android**
   - **Maps SDK for iOS** 
   - **Places API** (if using places features)

### 2. Create API Keys
Create **separate** API keys for Android and iOS:

#### Android API Key:
- Restrict to Android apps
- Add your app's SHA-1 fingerprint
- Package name: `com.curlmap.stylistapp`

#### iOS API Key:
- Restrict to iOS apps  
- Add your app's bundle ID: `com.curlmap.stylistapp`

### 3. Set Environment Variables

#### For Development:
1. Copy `.env.example` to `.env`
2. Add your API keys:
```bash
GOOGLE_MAPS_API_KEY_ANDROID=AIza...your-android-key
GOOGLE_MAPS_API_KEY_IOS=AIza...your-ios-key
```

#### For EAS Build Production:
```bash
# Set environment variables in EAS
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY_ANDROID --value "your_android_key"
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY_IOS --value "your_ios_key"
```

### 4. Build for Production
```bash
# Build Android
eas build --platform android --profile production

# Build iOS  
eas build --platform ios --profile production
```

## 📱 Platform-Specific Notes:

### Android:
- Maps will use Google Maps
- Requires Google Play Services
- No additional setup needed beyond API key

### iOS:
- Maps will use Apple Maps by default (free)
- Can optionally use Google Maps with API key
- Apple Maps doesn't require API keys

### Web:
- Falls back to the web placeholder you have configured
- Consider using Mapbox or Leaflet for web if needed

## 🔧 Alternative: Use Apple Maps on iOS
If you want to avoid Google Maps API costs on iOS, you can modify your map components to use Apple Maps (which is free):

```tsx
// In your map components, set provider to null for iOS
<MapView
  provider={Platform.OS === 'ios' ? null : 'google'}
  // ... other props
/>
```

## ✅ Verification
Your production builds will work once you:
1. ✅ Add Google Maps API keys (required for Android)
2. ✅ Set up environment variables 
3. ✅ Build with EAS Build

The map functionality will work perfectly in production builds!