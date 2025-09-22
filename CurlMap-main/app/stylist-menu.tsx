import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MenuItem {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  rightElement?: 'arrow' | 'switch';
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  badge?: string;
  color?: string;
}

export default function StylistMenu() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState(true);
  const [autoAcceptBookings, setAutoAcceptBookings] = useState(false);

  const handleEditProfile = () => {
    // Navigate to personal profile editing (names, contact info, etc.)
    router.push('/edit-profile');
  };

  const handleManagePortfolio = () => {
    // Navigate to business portfolio management (work samples, business info)
    router.push('/business-portfolio');
  };

  const handleUpdateLocation = () => {
    // Navigate to location update screen
    router.push('/stylist-location-update');
  };

  const handleManageServices = () => {
    router.push('/services-management');
  };

  const handleSetAvailability = () => {
    router.push('/availability-settings');
  };

  const handlePaymentSettings = () => {
    router.push('/payment-settings');
  };

  const handleBusinessSettings = () => {
    router.push('/business-information');
  };

  const handleViewReviews = () => {
    // Navigate to reviews
    Alert.alert('Reviews', 'Reviews management coming soon!');
  };

  const handleViewAnalytics = () => {
    // Navigate to analytics
    Alert.alert('Analytics', 'Analytics coming soon!');
  };

  const handleSupport = () => {
    Alert.alert('Support', 'Contact support at support@curlmap.com');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy coming soon!');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Terms of service coming soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/auth/stylist-login');
          }
        }
      ]
    );
  };

  const menuSections: MenuSection[] = [
    {
      title: 'Profile & Business',
      items: [
        {
          icon: 'person-outline',
          title: 'Edit Profile',
          subtitle: 'Update name, email, phone & personal info',
          onPress: handleEditProfile,
          rightElement: 'arrow',
          color: COLORS.PRIMARY,
        },
        {
          icon: 'briefcase-outline',
          title: 'Business Portfolio',
          subtitle: 'Manage work gallery, bio & business info',
          onPress: handleManagePortfolio,
          rightElement: 'arrow',
          color: COLORS.SUCCESS,
        },
        {
          icon: 'cut-outline',
          title: 'Services & Pricing',
          subtitle: 'Update your services and rates',
          onPress: handleManageServices,
          rightElement: 'arrow',
          color: COLORS.WARNING,
        },
        {
          icon: 'calendar-outline',
          title: 'Availability',
          subtitle: 'Set your working hours',
          onPress: handleSetAvailability,
          rightElement: 'arrow',
          color: COLORS.INFO,
        },
        {
          icon: 'location-outline',
          title: 'Update Location',
          subtitle: 'Set your business location on map',
          onPress: handleUpdateLocation,
          rightElement: 'arrow',
          color: COLORS.ERROR,
        },
      ],
    },
    {
      title: 'Business Settings',
      items: [
        {
          icon: 'card-outline',
          title: 'Payment Settings',
          subtitle: 'Bank details and payout preferences',
          onPress: handlePaymentSettings,
          rightElement: 'arrow',
          color: COLORS.SUCCESS,
        },
        {
          icon: 'business-outline',
          title: 'Business Information',
          subtitle: 'License, insurance, and certifications',
          onPress: handleBusinessSettings,
          rightElement: 'arrow',
          color: COLORS.PRIMARY,
        },
        {
          icon: 'checkmark-done-outline',
          title: 'Auto-Accept Bookings',
          subtitle: 'Automatically accept new bookings',
          onPress: () => {},
          rightElement: 'switch',
          switchValue: autoAcceptBookings,
          onSwitchChange: setAutoAcceptBookings,
          color: COLORS.WARNING,
        },
      ],
    },
    {
      title: 'Performance & Insights',
      items: [
        {
          icon: 'star-outline',
          title: 'Reviews & Ratings',
          subtitle: 'View customer feedback',
          onPress: handleViewReviews,
          rightElement: 'arrow',
          badge: '4.8',
          color: COLORS.WARNING,
        },
        {
          icon: 'analytics-outline',
          title: 'Analytics',
          subtitle: 'Business performance insights',
          onPress: handleViewAnalytics,
          rightElement: 'arrow',
          color: COLORS.INFO,
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Push notifications and alerts',
          onPress: () => {},
          rightElement: 'switch',
          switchValue: notificationsEnabled,
          onSwitchChange: setNotificationsEnabled,
          color: COLORS.PRIMARY,
        },
        {
          icon: 'radio-outline',
          title: 'Availability Status',
          subtitle: 'Show as available to customers',
          onPress: () => {},
          rightElement: 'switch',
          switchValue: availabilityStatus,
          onSwitchChange: setAvailabilityStatus,
          color: availabilityStatus ? COLORS.SUCCESS : COLORS.ERROR,
        },
      ],
    },
    {
      title: 'Support & Legal',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Help & Support',
          subtitle: 'Get help or contact support',
          onPress: handleSupport,
          rightElement: 'arrow',
          color: COLORS.INFO,
        },
        {
          icon: 'shield-outline',
          title: 'Privacy Policy',
          subtitle: 'How we protect your data',
          onPress: handlePrivacyPolicy,
          rightElement: 'arrow',
          color: COLORS.GRAY_600,
        },
        {
          icon: 'document-text-outline',
          title: 'Terms of Service',
          subtitle: 'Service terms and conditions',
          onPress: handleTermsOfService,
          rightElement: 'arrow',
          color: COLORS.GRAY_600,
        },
      ],
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
          <Ionicons name={item.icon as any} size={20} color={item.color} />
        </View>
        <View style={styles.menuItemText}>
          <View style={styles.titleRow}>
            <Text style={styles.menuItemTitle}>{item.title}</Text>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      
      {item.rightElement === 'arrow' && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.GRAY_400} />
      )}
      
      {item.rightElement === 'switch' && (
        <Switch
          value={item.switchValue}
          onValueChange={item.onSwitchChange}
          trackColor={{ false: COLORS.GRAY_300, true: `${item.color}40` }}
          thumbColor={item.switchValue ? item.color : COLORS.GRAY_400}
        />
      )}
    </TouchableOpacity>
  );

  const renderSection = (section: MenuSection, sectionIndex: number) => (
    <View key={sectionIndex} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>
        {section.items.map((item, index) => renderMenuItem(item, index))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/stylist-dashboard' as any);
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.WHITE} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Menu</Text>
          
          <View style={styles.placeholder} />
        </View>
        
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={COLORS.WHITE} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || 'Stylist'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'stylist@curlmap.com'}</Text>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: availabilityStatus ? COLORS.SUCCESS : COLORS.ERROR }]} />
              <Text style={styles.statusText}>
                {availabilityStatus ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Menu Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuSections.map((section, index) => renderSection(section, index))}
        
        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.ERROR} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingBottom: SPACING.XL,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.MD,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  placeholder: {
    width: 40,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.LG,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: FONT_SIZES.SM,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: SPACING.XS,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.XS,
  },
  statusText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
  },
  section: {
    marginTop: SPACING.LG,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
    paddingHorizontal: SPACING.XS,
  },
  sectionContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    paddingVertical: SPACING.XS,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  menuItemText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  badge: {
    backgroundColor: COLORS.WARNING,
    borderRadius: 12,
    paddingHorizontal: SPACING.XS,
    paddingVertical: 2,
    marginLeft: SPACING.XS,
  },
  badgeText: {
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  logoutSection: {
    marginTop: SPACING.XL,
    paddingHorizontal: SPACING.MD,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    paddingVertical: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.ERROR,
  },
  logoutText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.ERROR,
    marginLeft: SPACING.XS,
  },
  bottomSpacing: {
    height: SPACING.XL,
  },
});