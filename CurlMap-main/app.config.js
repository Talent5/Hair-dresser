export default {
  "expo": {
    "name": "CurlMap - Hair Stylist Platform",
    "slug": "curlmap-stylist-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "curlmap",
    "userInterfaceStyle": "light",
        "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2E073F",
      "imageUrl": "./assets/images/splash.png"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.curlmap.stylistapp",
      "config": {
        "googleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
      },
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "This app uses location to find nearby hair stylists and show your location on the map.",
        "NSLocationAlwaysUsageDescription": "This app uses location to find nearby hair stylists and show your location on the map.",
        "NSCameraUsageDescription": "This app uses camera to take photos for your portfolio and profile.",
        "NSPhotoLibraryUsageDescription": "This app needs access to photo library to upload portfolio images.",
        "NSMicrophoneUsageDescription": "This app uses microphone for voice messages in chat."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#2E073F"
      },
      "package": "com.curlmap.stylistapp",
      "versionCode": 1,
      "permissions": [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.RECORD_AUDIO",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE",
        "com.google.android.c2dm.permission.RECEIVE"
      ],
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
        }
      }
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "This app uses location to find nearby hair stylists and show your location on the map."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them with stylists.",
          "cameraPermission": "The app accesses your camera to let you take profile and portfolio photos."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#7209B7"
        }
      ],
      [
        "expo-camera",
        {
          "cameraPermission": "Allow CurlMap to access camera for taking photos."
        }
      ],
      "expo-font",
      "expo-secure-store",
      "expo-web-browser"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {},
      "eas": {
        "projectId": "dd9e1c99-e945-492b-a998-e95c9ba9d4e6"
      }
    }
  }
};