import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/constants';

export default function IndexScreen() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    console.log('Index Screen - Auth State:', { isAuthenticated, isLoading, hasUser: !!user });
    
    if (!isLoading) {
      if (isAuthenticated) {
        console.log('User is authenticated, navigating to tabs');
        // User is authenticated, navigate to main app tabs
        router.replace('/(tabs)' as any);
      } else {
        console.log('User is not authenticated, navigating to login');
        // User is not authenticated, navigate to login
        router.replace('/auth/login' as any);
      }
    }
  }, [isAuthenticated, isLoading, user]);

  // Show loading while determining auth state
  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: COLORS.BACKGROUND 
    }}>
      <ActivityIndicator size="large" color={COLORS.PRIMARY} />
    </View>
  );
}