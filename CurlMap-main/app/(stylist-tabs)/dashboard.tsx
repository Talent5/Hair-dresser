import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useOffline } from '@/contexts/OfflineContext';
import { apiService } from '@/services/api';

interface DashboardStats {
  todayBookings: number;
  weeklyEarnings: number;
  pendingBookings: number;
  completedBookings: number;
  totalClients: number;
  averageRating: number;
}

interface RecentBooking {
  _id: string;
  customer: {
    name: string;
    profileImage?: string;
  };
  service: string;
  scheduledDate: string;
  status: string;
  totalPrice: number;
}

export default function StylistDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, pendingActionsCount, lastSyncTime } = useOffline();
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0,
    weeklyEarnings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalClients: 0,
    averageRating: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Check if user is a stylist before making API calls
    if (!user || !user.isStylist) {
      console.log('User is not a stylist, skipping dashboard data load');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load dashboard stats and recent bookings
      const [statsResponse, bookingsResponse] = await Promise.all([
        apiService.getStylistStats(),
        apiService.getStylistBookings({ limit: 5, status: 'all' })
      ]);

      if (statsResponse.success && statsResponse.data?.stats) {
        setStats(statsResponse.data.stats);
      } else {
        console.warn('Failed to load stats:', statsResponse.message);
        // Keep default values for stats
      }

      if (bookingsResponse.success && bookingsResponse.data?.bookings) {
        setRecentBookings(bookingsResponse.data.bookings);
      } else {
        console.warn('Failed to load bookings:', bookingsResponse.message);
        // Keep empty array for bookings
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Don't show alert for network errors, just log them
      if (error.message?.includes('Network')) {
        console.log('Network error - app will retry on next refresh');
      } else {
        Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    // Check if user is a stylist before refreshing
    if (!user || !user.isStylist) {
      console.log('User is not a stylist, skipping refresh');
      return;
    }
    
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'confirmed': return COLORS.PRIMARY;
      case 'completed': return COLORS.SUCCESS;
      case 'cancelled': return COLORS.ERROR;
      default: return COLORS.GRAY_400;
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (date: string) => {
    // Handle null, undefined, or empty date strings
    if (!date) {
      return 'No date set';
    }
    
    try {
      const dateObj = new Date(date);
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.warn('Error formatting date:', date, error);
      return 'Invalid date';
    }
  };

  // Non-stylist users should not access this screen
  if (!user || !user.isStylist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="warning-outline" size={64} color={COLORS.WARNING} />
          <Text style={styles.accessDeniedTitle}>Stylist Access Only</Text>
          <Text style={styles.accessDeniedMessage}>
            This dashboard is only available for stylists. Please log in with a stylist account.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.userName}>{user?.name || 'Stylist'}</Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => router.push('/stylist-menu')}
                >
                  <Ionicons name="menu-outline" size={24} color={COLORS.WHITE} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.headerButton}
                  onPress={() => router.push('/settings')}
                >
                  <Ionicons name="notifications-outline" size={24} color={COLORS.WHITE} />
                  {pendingActionsCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.badgeText}>{pendingActionsCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Connection Status */}
            <View style={styles.connectionStatus}>
              <Ionicons 
                name={isOnline ? "wifi" : "wifi-outline"} 
                size={16} 
                color={isOnline ? COLORS.SUCCESS : COLORS.WARNING} 
              />
              <Text style={[styles.connectionText, { color: isOnline ? COLORS.SUCCESS : COLORS.WARNING }]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
              {loading && (
                <Text style={styles.pendingText}>• Loading real data...</Text>
              )}
              {!loading && isOnline && (
                <Text style={styles.pendingText}>• Live data</Text>
              )}
              {pendingActionsCount > 0 && (
                <Text style={styles.pendingText}>• {pendingActionsCount} pending</Text>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.PRIMARY}20` }]}>
                <Ionicons name="calendar" size={24} color={COLORS.PRIMARY} />
              </View>
              <Text style={styles.statValue}>{stats.todayBookings}</Text>
              <Text style={styles.statLabel}>Today's Bookings</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.SUCCESS}20` }]}>
                <Ionicons name="card" size={24} color={COLORS.SUCCESS} />
              </View>
              <Text style={styles.statValue}>{formatCurrency(stats.weeklyEarnings)}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.WARNING}20` }]}>
                <Ionicons name="time" size={24} color={COLORS.WARNING} />
              </View>
              <Text style={styles.statValue}>{stats.pendingBookings}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: `${COLORS.SECONDARY}20` }]}>
                <Ionicons name="star" size={24} color={COLORS.SECONDARY} />
              </View>
              <Text style={styles.statValue}>{stats.averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(stylist-tabs)/bookings')}
            >
              <Ionicons name="calendar" size={28} color={COLORS.PRIMARY} />
              <Text style={styles.actionLabel}>View Bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(stylist-tabs)/earnings')}
            >
              <Ionicons name="analytics" size={28} color={COLORS.SUCCESS} />
              <Text style={styles.actionLabel}>Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/stylist-setup')}
            >
              <Ionicons name="person-circle" size={28} color={COLORS.SECONDARY} />
              <Text style={styles.actionLabel}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/(stylist-tabs)/chat')}
            >
              <Ionicons name="chatbubbles" size={28} color={COLORS.PRIMARY} />
              <Text style={styles.actionLabel}>Messages</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Bookings */}
        <View style={styles.recentContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => router.push('/(stylist-tabs)/bookings')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentBookings.length > 0 ? (
            recentBookings.map((booking) => (
              <TouchableOpacity 
                key={booking._id} 
                style={styles.bookingCard}
                onPress={() => router.push('/(stylist-tabs)/bookings')}
              >
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingCustomer}>
                    <View style={styles.customerAvatar}>
                      <Ionicons name="person" size={20} color={COLORS.GRAY_400} />
                    </View>
                    <View>
                      <Text style={styles.customerName}>{booking.customer.name}</Text>
                      <Text style={styles.bookingService}>{booking.service}</Text>
                    </View>
                  </View>
                  <View style={styles.bookingStatus}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(booking.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.bookingFooter}>
                  <Text style={styles.bookingDate}>{formatDate(booking.scheduledDate)}</Text>
                  <Text style={styles.bookingPrice}>{formatCurrency(booking.totalPrice)}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color={COLORS.GRAY_400} />
              <Text style={styles.emptyText}>No recent bookings</Text>
              <Text style={styles.emptySubtext}>Your upcoming bookings will appear here</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: BORDER_RADIUS.XL,
    borderBottomRightRadius: BORDER_RADIUS.XL,
  },
  headerContent: {
    padding: SPACING.XL,
    paddingTop: SPACING.LG,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  greeting: {
    fontSize: FONT_SIZES.MD,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  userName: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  headerButton: {
    position: 'relative',
    padding: SPACING.SM,
  },
  notificationButton: {
    position: 'relative',
    padding: SPACING.SM,
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.ERROR,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    marginLeft: SPACING.XS,
  },
  pendingText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.WARNING,
    marginLeft: SPACING.XS,
  },
  statsContainer: {
    padding: SPACING.XL,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  statValue: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  statLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: SPACING.XL,
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.LG,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    alignItems: 'center',
    width: '48%',
    marginBottom: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionLabel: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
  recentContainer: {
    paddingHorizontal: SPACING.XL,
    paddingBottom: SPACING.XL,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  viewAllText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  bookingCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  bookingCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  customerName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  bookingService: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  bookingStatus: {
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
    fontWeight: '600',
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingDate: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  bookingPrice: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  emptyText: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.MD,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginTop: SPACING.SM,
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  accessDeniedTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  accessDeniedMessage: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.XL,
  },
  backButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});