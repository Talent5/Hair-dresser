import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';
import Header from '@/components/Header';
import AuthContext from '@/contexts/AuthContext';

export default function HomeScreen() {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const navigateToCreateRequest = () => {
    router.push('/create-request');
  };

  const navigateToNearbyRequests = () => {
    router.push('/nearby-requests');
  };

  return (
    <View style={styles.container}>
      <Header title="CurlMap" />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Welcome to CurlMap!</Text>
          <Text style={styles.subtitle}>Your Live Hair Stylist Platform</Text>
          <Text style={styles.description}>
            Create styling requests and connect with professional hair stylists in your area instantly.
          </Text>
        </View>

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {/* For Clients */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={navigateToCreateRequest}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>✨</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Request a Style</Text>
              <Text style={styles.actionDescription}>
                Describe what you want and get offers from nearby stylists
              </Text>
            </View>
          </TouchableOpacity>

          {/* For Stylists */}
          {user?.isStylist && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={navigateToNearbyRequests}
            >
              <View style={[styles.actionIcon, styles.stylistIcon]}>
                <Text style={styles.actionIconText}>💼</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>View Nearby Requests</Text>
                <Text style={styles.actionDescription}>
                  See styling requests from clients in your area and make offers
                </Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/search')}
          >
            <View style={[styles.actionIcon, styles.searchIcon]}>
              <Text style={styles.actionIconText}>🔍</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Find Stylists</Text>
              <Text style={styles.actionDescription}>
                Browse stylists in your area and book appointments
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <View style={[styles.actionIcon, styles.chatIcon]}>
              <Text style={styles.actionIconText}>💬</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Messages</Text>
              <Text style={styles.actionDescription}>
                Chat with your stylists and clients
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create Request</Text>
              <Text style={styles.stepDescription}>
                Describe the style you want and your offer price
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get Offers</Text>
              <Text style={styles.stepDescription}>
                Nearby stylists will see your request and make offers
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Choose & Chat</Text>
              <Text style={styles.stepDescription}>
                Select your favorite offer and chat to coordinate details
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.XL,
  },
  welcomeSection: {
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.XL,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.TITLE,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  subtitle: {
    fontSize: FONT_SIZES.XL,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  description: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsSection: {
    paddingHorizontal: SPACING.LG,
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  stylistIcon: {
    backgroundColor: '#28a745',
  },
  searchIcon: {
    backgroundColor: '#007bff',
  },
  chatIcon: {
    backgroundColor: '#6f42c1',
  },
  actionIconText: {
    fontSize: 20,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
  howItWorksSection: {
    paddingHorizontal: SPACING.LG,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 18,
  },
});