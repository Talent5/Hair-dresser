import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProductionErrorBoundary from '@/components/ProductionErrorBoundary';

export default function TabLayout() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  // Redirect stylists to stylist tabs
  useEffect(() => {
    try {
      if (user && user.isStylist) {
        console.log('Stylist detected, redirecting to stylist dashboard...');
        router.replace('/stylist-dashboard');
      }
    } catch (error) {
      console.error('Error in stylist redirect:', error);
    }
  }, [user, router]);

  return (
    <ProductionErrorBoundary fallbackMessage="There was an issue with the navigation tabs. Please restart the app.">
      <ProtectedRoute>
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: COLORS.PRIMARY,
              tabBarInactiveTintColor: COLORS.GRAY_400,
              tabBarStyle: {
                backgroundColor: COLORS.WHITE,
                borderTopColor: COLORS.GRAY_200,
                height: Platform.OS === 'ios' ? 90 : 70,
                paddingBottom: Platform.OS === 'ios' ? 0 : 10,
                paddingTop: 10,
              },
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
              },
              headerShown: false,
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="home-outline" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="search"
              options={{
                title: 'Search',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="search" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="bookings"
              options={{
                title: 'Bookings',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="calendar-outline" size={size} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="chat"
              options={{
                title: 'Chat',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="chatbubble-outline" size={size} color={color} />
                ),
              }}
            />
          </Tabs>
        </View>
      </ProtectedRoute>
    </ProductionErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
});