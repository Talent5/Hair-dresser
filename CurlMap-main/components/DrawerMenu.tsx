import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useDrawer } from '@/contexts/DrawerContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8; // 80% of screen width

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  badge?: string;
}

const DrawerMenu: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { closeDrawer } = useDrawer();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            closeDrawer();
            router.replace('/auth/login' as any);
          },
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      title: 'Home',
      icon: 'home-outline',
      onPress: () => {
        closeDrawer();
        router.push('/(tabs)' as any);
      },
    },
    {
      id: 'search',
      title: 'Find Stylists',
      icon: 'search-outline',
      onPress: () => {
        closeDrawer();
        router.push('/(tabs)/search' as any);
      },
    },
    {
      id: 'bookings',
      title: 'My Bookings',
      icon: 'calendar-outline',
      onPress: () => {
        closeDrawer();
        router.push('/(tabs)/bookings' as any);
      },
    },
    {
      id: 'chat',
      title: 'Messages',
      icon: 'chatbubble-outline',
      onPress: () => {
        closeDrawer();
        router.push('/(tabs)/chat' as any);
      },
    },
    {
      id: 'profile',
      title: 'Profile',
      icon: 'person-outline',
      onPress: () => {
        closeDrawer();
        router.push('/profile' as any);
      },
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => {
        closeDrawer();
        router.push('/settings' as any);
      },
    },
  ];

  const renderUserHeader = () => (
    <LinearGradient
      colors={[COLORS.PRIMARY_DARK, COLORS.PRIMARY, COLORS.PRIMARY_LIGHT]}
      style={[styles.userHeader, { paddingTop: insets.top + SPACING.MD }]}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color={COLORS.WHITE} />
            </View>
          )}
        </View>
        
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.isStylist && (
            <View style={styles.stylistBadge}>
              <Ionicons name="cut" size={12} color={COLORS.WHITE} />
              <Text style={styles.stylistBadgeText}>Stylist</Text>
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemContent}>
        <Ionicons
          name={item.icon as any}
          size={24}
          color={COLORS.TEXT_PRIMARY}
          style={styles.menuIcon}
        />
        <Text style={styles.menuTitle}>{item.title}</Text>
        {item.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={COLORS.GRAY_400}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {renderUserHeader()}
      
      <ScrollView
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}
      >
        {menuItems.map(renderMenuItem)}
        
        {/* Divider */}
        <View style={styles.divider} />
        
        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemContent}>
            <Ionicons
              name="log-out-outline"
              size={24}
              color={COLORS.ERROR}
              style={styles.menuIcon}
            />
            <Text style={[styles.menuTitle, styles.logoutText]}>Logout</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
      
      {/* App Version */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.SM }]}>
        <Text style={styles.versionText}>CurlMap v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    width: DRAWER_WIDTH,
  },
  userHeader: {
    paddingHorizontal: SPACING.LG,
    paddingBottom: SPACING.LG,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: SPACING.MD,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: COLORS.WHITE,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 4,
  },
  stylistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.SM,
    alignSelf: 'flex-start',
  },
  stylistBadgeText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
    marginLeft: 4,
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingVertical: SPACING.SM,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    minHeight: 56,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    marginRight: SPACING.MD,
    width: 24,
  },
  menuTitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
    flex: 1,
  },
  badge: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.FULL,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 2,
    marginLeft: SPACING.SM,
  },
  badgeText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.GRAY_200,
    marginHorizontal: SPACING.LG,
    marginVertical: SPACING.SM,
  },
  logoutItem: {
    marginTop: SPACING.SM,
  },
  logoutText: {
    color: COLORS.ERROR,
  },
  footer: {
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  versionText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default DrawerMenu;