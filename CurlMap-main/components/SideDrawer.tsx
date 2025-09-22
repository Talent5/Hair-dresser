import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants';

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  badge?: number;
  color?: string;
}

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  memberSince: string;
  isVerified: boolean;
}

interface SideDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
  userProfile?: UserProfile;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'grid-outline',
    route: 'dashboard',
    color: COLORS.PRIMARY,
  },
  {
    id: 'bookings',
    title: 'My Bookings',
    icon: 'calendar-outline',
    route: 'bookings',
    badge: 3,
    color: COLORS.ACCENT,
  },
  {
    id: 'portfolio',
    title: 'Portfolio',
    icon: 'images-outline',
    route: 'portfolio',
    color: COLORS.SECONDARY,
  },
  {
    id: 'earnings',
    title: 'Earnings',
    icon: 'wallet-outline',
    route: 'earnings',
    color: COLORS.SUCCESS,
  },
  {
    id: 'reviews',
    title: 'Reviews',
    icon: 'star-outline',
    route: 'reviews',
    color: COLORS.WARNING,
  },
  {
    id: 'chat',
    title: 'Messages',
    icon: 'chatbubble-outline',
    route: 'chat',
    badge: 5,
    color: COLORS.INFO,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: 'trending-up-outline',
    route: 'analytics',
    color: COLORS.PRIMARY_LIGHT,
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings-outline',
    route: 'settings',
    color: COLORS.GRAY_600,
  },
];

const DEFAULT_USER: UserProfile = {
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612ad82?w=150&h=150&fit=crop&crop=face',
  rating: 4.8,
  reviewCount: 127,
  memberSince: 'March 2023',
  isVerified: true,
};

const SideDrawer: React.FC<SideDrawerProps> = ({
  isVisible,
  onClose,
  onNavigate,
  userProfile = DEFAULT_USER,
}) => {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Open drawer
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 400,
          delay: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Close drawer
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleMenuItemPress = (item: MenuItem) => {
    if (item.route) {
      onNavigate(item.route);
    }
    onClose();
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={14} color={COLORS.WARNING} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={14} color={COLORS.WARNING} />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={14}
          color={COLORS.GRAY_400}
        />
      );
    }

    return stars;
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
      
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          { opacity: overlayOpacity },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[COLORS.PRIMARY_DARK, COLORS.PRIMARY]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.drawerBackground}
        />

        <SafeAreaView style={styles.safeArea}>
          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  {userProfile.avatar && userProfile.avatar.startsWith('http') ? (
                    <Image
                      source={{ uri: userProfile.avatar }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarText}>
                        {userProfile.avatar || userProfile.name?.substring(0, 2).toUpperCase() || 'U'}
                      </Text>
                    </View>
                  )}
                  {userProfile.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark" size={12} color={COLORS.WHITE} />
                    </View>
                  )}
                </View>
                
                <View style={styles.profileInfo}>
                  <Text style={styles.userName}>{userProfile.name}</Text>
                  <Text style={styles.userEmail}>{userProfile.email}</Text>
                  
                  {/* Rating */}
                  <View style={styles.ratingContainer}>
                    <View style={styles.starsContainer}>
                      {renderStarRating(userProfile.rating)}
                    </View>
                    <Text style={styles.ratingText}>
                      {(userProfile.rating || 0).toFixed(1)} ({userProfile.reviewCount} reviews)
                    </Text>
                  </View>
                  
                  <Text style={styles.memberSince}>
                    Member since {userProfile.memberSince}
                  </Text>
                </View>
              </View>

              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>127</Text>
                  <Text style={styles.statLabel}>Clients</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>98%</Text>
                  <Text style={styles.statLabel}>Satisfaction</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>$2.5K</Text>
                  <Text style={styles.statLabel}>This Month</Text>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <ScrollView style={styles.menuSection} showsVerticalScrollIndicator={false}>
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={item.color}
                    />
                  </View>
                  
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  
                  {item.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                  
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={COLORS.GRAY_400}
                    style={styles.menuArrow}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.footerButton} onPress={onClose}>
                <Ionicons name="help-circle-outline" size={20} color={COLORS.WHITE} />
                <Text style={styles.footerButtonText}>Help & Support</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.footerButton}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.WHITE} />
                <Text style={styles.footerButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    elevation: 16,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  drawerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.LG,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.MD,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  profileInfo: {
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
    marginBottom: SPACING.SM,
  },
  ratingContainer: {
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  ratingText: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  memberSince: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.MD,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  statLabel: {
    fontSize: FONT_SIZES.XS,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuSection: {
    flex: 1,
    paddingTop: SPACING.MD,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    marginHorizontal: SPACING.MD,
    marginVertical: 2,
    borderRadius: BORDER_RADIUS.MD,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  menuTitle: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    color: COLORS.WHITE,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: COLORS.ERROR,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.SM,
  },
  badgeText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  menuArrow: {
    marginLeft: SPACING.XS,
  },
  footer: {
    padding: SPACING.LG,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  footerButtonText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WHITE,
    marginLeft: SPACING.SM,
    fontWeight: '500',
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
  },
});

export default SideDrawer;