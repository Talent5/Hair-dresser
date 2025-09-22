import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import AnimatedSplashScreen from '@/components/AnimatedSplashScreen';
import { AuthProvider } from '@/contexts/AuthContext';
import { DrawerProvider } from '@/contexts/DrawerContext';
import { OfflineProvider } from '@/contexts/OfflineContext';
import { COLORS } from '@/constants';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  const frameworkReady = useFrameworkReady();

  useEffect(() => {
    const prepare = async () => {
      try {
        // Simulate app initialization (loading fonts, checking auth, etc.)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // App is ready
        setIsAppReady(true);
      } catch (error) {
        console.warn('Error during app initialization:', error);
        setIsAppReady(true); // Continue even if there's an error
      }
    };

    prepare();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Show splash screen while app is loading
  if (showSplash) {
    return (
      <AnimatedSplashScreen
        isReady={isAppReady && frameworkReady}
        onFinish={handleSplashFinish}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        style="dark" 
        backgroundColor="transparent"
        translucent={Platform.OS === 'android'}
      />
      <AuthProvider>
        <OfflineProvider>
          <DrawerProvider>
            <Stack screenOptions={{ 
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.BACKGROUND }
            }}>
              {/* Auth screens */}
              <Stack.Screen name="auth/login" options={{ title: 'Login' }} />
              <Stack.Screen name="auth/register" options={{ title: 'Register' }} />
              <Stack.Screen name="auth/forgot-password" options={{ title: 'Forgot Password' }} />
              <Stack.Screen name="auth/stylist-login" options={{ title: 'Stylist Login' }} />
              
              {/* Stylist screens */}
              <Stack.Screen name="stylist-setup" options={{ title: 'Stylist Setup', headerShown: false }} />
              <Stack.Screen name="stylist-dashboard" options={{ title: 'Stylist Dashboard' }} />
              <Stack.Screen name="stylist-profile" options={{ title: 'Stylist Profile' }} />
              <Stack.Screen name="stylist-menu" options={{ title: 'Stylist Menu', headerShown: false }} />
              <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile', headerShown: false }} />
              <Stack.Screen name="business-portfolio" options={{ title: 'Business Portfolio', headerShown: false }} />
              <Stack.Screen name="stylist-location-update" options={{ title: 'Update Location', headerShown: false }} />
              <Stack.Screen name="(stylist-tabs)" options={{ title: 'Stylist App' }} />
              
              {/* Chat screen */}
              <Stack.Screen name="chat-room" options={{ title: 'Chat', headerShown: false }} />
              
              {/* Main app screens */}
              <Stack.Screen name="(tabs)" options={{ title: 'Home' }} />
              <Stack.Screen 
                name="profile" 
                options={{ 
                  presentation: 'modal',
                  title: 'Profile'
                }} 
              />
              <Stack.Screen 
                name="settings" 
                options={{ 
                  presentation: 'modal',
                  title: 'Settings'
                }} 
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </DrawerProvider>
        </OfflineProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
