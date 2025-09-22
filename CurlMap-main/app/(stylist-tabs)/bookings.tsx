import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING } from '@/constants';
import Header from '@/components/Header';
import { apiService } from '@/services/api';
import OfflineBookingService from '@/services/OfflineBookingService';
import NotificationService, { BookingNotification } from '@/services/NotificationService';
import { Booking, BookingStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { LocationService } from '@/utils/location';

interface BookingItemProps {
  booking: Booking & { 
    userRole?: 'customer' | 'stylist';
    otherParty?: any;
    canCancel?: boolean;
  };
  onStatusUpdate: () => void;
  router: any;
}

const BookingItem: React.FC<BookingItemProps> = ({ booking, onStatusUpdate, router }) => {
  const { user } = useAuth();
  const isStylist = user?.isStylist || false;
  const isCustomer = !user?.isStylist;
  
  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'accepted': return '#4CAF50';
      case 'confirmed': return '#2196F3';
      case 'in_progress': return '#9C27B0';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'rejected': return '#F44336';
      default: return '#757575';
    }
  };

  const getStatusAbbreviation = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'PENDING';
      case 'accepted': return 'ACCEPT';
      case 'confirmed': return 'CONFIRM';
      case 'in_progress': return 'ACTIVE';
      case 'completed': return 'DONE';
      case 'cancelled': return 'CANCEL';
      case 'rejected': return 'REJECT';
      default: return status.toUpperCase();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine which party name to show
  const getDisplayName = () => {
    if (isStylist) {
      return booking.otherParty?.name || booking.customer?.name || 'Customer';
    } else {
      return booking.otherParty?.name || booking.stylist?.user?.name || 'Stylist';
    }
  };

  const getDisplayRole = () => {
    return isStylist ? 'Customer' : 'Stylist';
  };

  const handlePress = () => {
    router.push({
      pathname: '/booking-detail',
      params: { bookingId: booking._id }
    });
  };

  return (
    <TouchableOpacity 
      style={[
        styles.bookingItem, 
        booking.status === 'pending' && styles.pendingBookingItem
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.bookingHeader}>
        <Text style={styles.serviceName} numberOfLines={1}>{booking.service.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText} numberOfLines={1} ellipsizeMode="tail">{booking.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.description}>{booking.service.description}</Text>

      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.detailLabel}>{getDisplayRole()}:</Text>
          <Text style={styles.detailText}>{getDisplayName()}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{formatDate(booking.appointmentTime)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{booking.service.estimatedDuration} minutes</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={16} color="#666" />
          <Text style={styles.detailText}>${booking.negotiatedPrice}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{LocationService.formatAddress(booking.location.address)}</Text>
        </View>
      </View>

      <View style={styles.tapToViewContainer}>
        <Ionicons name="chevron-forward-outline" size={20} color={COLORS.PRIMARY} />
        <Text style={styles.tapToViewText}>Tap to view details</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function BookingsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('pending');
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [isOffline, setIsOffline] = useState(!OfflineBookingService.isNetworkOnline());
  const [pendingActions, setPendingActions] = useState(0);

  const isStylist = user?.isStylist || false;
  const isCustomer = !user?.isStylist;

  const getFilteredBookings = () => {
    if (activeFilter === 'all') {
      return allBookings;
    } else {
      return allBookings.filter(booking => booking.status === activeFilter);
    }
  };

  const getPendingCount = () => {
    return allBookings.filter(booking => booking.status === 'pending').length;
  };

  const getStatusDisplayName = (status: BookingStatus | 'all') => {
    switch (status) {
      case 'all': return 'All';
      case 'pending': return isStylist ? 'New Requests' : 'Pending';
      case 'confirmed': return isStylist ? 'Upcoming' : 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getScreenTitle = () => {
    if (isStylist) {
      return 'My Appointments';
    }
    return 'My Bookings';
  };

  const getScreenSubtitle = () => {
    if (isStylist) {
      return 'Manage your client appointments';
    }
    return 'Track your styling appointments';
  };

  const fetchBookings = async () => {
    // Check if user is a stylist before making API calls
    if (!user || !user.isStylist) {
      console.log('User is not a stylist, skipping bookings fetch');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiService.getBookings();
      if (response.success && response.data) {
        // Backend returns { bookings: [...], pagination: {...} }
        const bookingsData = response.data.bookings;
        const validBookings = Array.isArray(bookingsData) ? bookingsData : [];
        setAllBookings(validBookings);
        console.log(`Fetched ${validBookings.length} bookings from database`);
      } else {
        console.log('No bookings found in database');
        setAllBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to fetch bookings. Please check your connection.');
      setAllBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    // Check if user is a stylist before refreshing
    if (!user || !user.isStylist) {
      console.log('User is not a stylist, skipping bookings refresh');
      return;
    }
    
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBookings();
    
    // Subscribe to notifications
    const unsubscribe = NotificationService.subscribe((newNotifications: BookingNotification[]) => {
      setNotifications(newNotifications);
    });
    
    // Check offline status periodically
    const offlineInterval = setInterval(() => {
      setIsOffline(!OfflineBookingService.isNetworkOnline());
      setPendingActions(OfflineBookingService.getPendingActionsCount());
    }, 2000);
    
    return () => {
      unsubscribe();
      clearInterval(offlineInterval);
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header 
          title={getScreenTitle()} 
          rightComponent={
            <TouchableOpacity onPress={() => router.push('/stylist-menu')}>
              <Ionicons name="menu-outline" size={24} color={COLORS.TEXT_PRIMARY} />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      </View>
    );
  }

  // Non-stylist users should not access this screen
  if (!user || !user.isStylist) {
    return (
      <View style={styles.container}>
        <Header title="Access Denied" />
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="warning-outline" size={64} color={COLORS.WARNING} />
          <Text style={styles.accessDeniedTitle}>Stylist Access Only</Text>
          <Text style={styles.accessDeniedMessage}>
            This section is only available for stylists. Please log in with a stylist account.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title={getScreenTitle()} 
        rightComponent={
          <TouchableOpacity onPress={() => router.push('/stylist-menu')}>
            <Ionicons name="menu-outline" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        }
      />
      
      {/* Offline Status Indicator */}
      {isOffline && (
        <View style={styles.offlineBar}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.offlineText}>
            Offline Mode {pendingActions > 0 && `• ${pendingActions} pending actions`}
          </Text>
        </View>
      )}
      
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Appointments</Text>
        <Text style={styles.subtitle}>Manage your upcoming and past bookings</Text>
        
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'confirmed', 'completed'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.activeFilterTab
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterTabText,
                activeFilter === filter && styles.activeFilterTabText
              ]}>
                {getStatusDisplayName(filter)}
                {filter === 'pending' && getPendingCount() > 0 && (
                  <Text style={styles.pendingBadge}> ({getPendingCount()})</Text>
                )}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {getFilteredBookings().length === 0 ? (
          <View style={styles.placeholder}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.placeholderText}>
              {activeFilter === 'pending' ? 'No pending bookings' : 
               activeFilter === 'confirmed' ? 'No confirmed bookings' :
               activeFilter === 'completed' ? 'No completed bookings' :
               'No bookings yet'}
            </Text>
            <Text style={styles.placeholderSubtext}>
              {activeFilter === 'all' ? 'Book your first appointment to get started!' : 
               `No ${activeFilter} bookings found in your account`}
            </Text>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {getFilteredBookings().map((booking) => (
              <BookingItem 
                key={booking._id} 
                booking={booking} 
                onStatusUpdate={fetchBookings}
                router={router}
              />
            ))}
          </View>
        )}
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
    padding: SPACING.LG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: FONT_SIZES.MD,
    color: '#666',
  },
  title: {
    fontSize: FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XL,
  },
  placeholder: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  placeholderText: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  placeholderSubtext: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  bookingsList: {
    gap: SPACING.MD,
  },
  bookingItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: SPACING.LG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pendingBookingItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
    backgroundColor: '#fff9f9',
    shadowColor: '#ff6b6b',
    shadowOpacity: 0.15,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  serviceName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 75,
    maxWidth: 75,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  description: {
    fontSize: FONT_SIZES.SM,
    color: '#666',
    marginBottom: SPACING.MD,
  },
  bookingDetails: {
    gap: SPACING.SM,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.SM,
  },
  detailLabel: {
    fontSize: FONT_SIZES.SM,
    color: '#666',
    fontWeight: '600',
  },
  detailText: {
    fontSize: FONT_SIZES.SM,
    color: '#666',
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.LG,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.SM,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeFilterTab: {
    backgroundColor: COLORS.PRIMARY,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterTabText: {
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterTabText: {
    color: 'white',
  },
  pendingBadge: {
    fontSize: FONT_SIZES.XS,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
  offlineBar: {
    backgroundColor: '#ff6b6b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
  },
  offlineText: {
    color: '#fff',
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    marginLeft: SPACING.XS,
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
  tapToViewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.SM,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tapToViewText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.PRIMARY,
    fontWeight: '500',
    marginLeft: SPACING.XS,
  },
});