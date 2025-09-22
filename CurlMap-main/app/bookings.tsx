import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Booking as GlobalBooking } from '../types';

interface LocalBooking {
  _id: string;
  stylist: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  date: string;
  time: string;
  services: string[];
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  createdAt: string;
}

export default function BookingsScreen() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<LocalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Convert global booking to local booking format
  const mapToLocalBooking = (globalBooking: GlobalBooking): LocalBooking => {
    const appointmentDate = new Date(globalBooking.appointmentTime);
    
    // Map status to local format
    let localStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled' = 'pending';
    switch (globalBooking.status) {
      case 'accepted':
      case 'confirmed':
        localStatus = 'confirmed';
        break;
      case 'completed':
        localStatus = 'completed';
        break;
      case 'cancelled':
        localStatus = 'cancelled';
        break;
      default:
        localStatus = 'pending';
    }
    
    return {
      _id: globalBooking._id,
      stylist: {
        _id: globalBooking.stylistId,
        name: globalBooking.stylist?.user?.name || 'Unknown Stylist',
        profilePicture: globalBooking.stylist?.user?.avatar,
      },
      date: appointmentDate.toISOString().split('T')[0], // YYYY-MM-DD
      time: appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      services: [globalBooking.service.name],
      status: localStatus,
      totalPrice: globalBooking.negotiatedPrice,
      createdAt: globalBooking.createdAt,
    };
  };

  const fetchBookings = async () => {
    try {
      const response = await apiService.getBookings();
      if (response.success && response.data) {
        const globalBookings = response.data.bookings || [];
        const localBookings = globalBookings.map(mapToLocalBooking);
        setBookings(localBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Alert.alert('Error', 'Failed to load bookings');
      setBookings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#6B7280';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.updateBookingStatus(bookingId, 'cancelled');
              fetchBookings(); // Refresh the list
              Alert.alert('Success', 'Booking cancelled successfully');
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          },
        },
      ]
    );
  };

  const renderBookingCard = (booking: LocalBooking) => (
    <View key={booking._id} style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View>
          <Text style={styles.stylistName}>{booking.stylist.name}</Text>
          <Text style={styles.bookingDate}>{formatDate(booking.date)}</Text>
          <Text style={styles.bookingTime}>{booking.time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.servicesContainer}>
        <Text style={styles.servicesLabel}>Services:</Text>
        {booking.services.map((service: string, index: number) => (
          <Text key={index} style={styles.serviceItem}>• {service}</Text>
        ))}
      </View>

      <View style={styles.bookingFooter}>
        <Text style={styles.totalPrice}>${booking.totalPrice}</Text>
        {booking.status === 'pending' && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(booking._id)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>My Bookings</Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Bookings Yet</Text>
            <Text style={styles.emptySubtitle}>
              Book your first appointment with a stylist
            </Text>
            <TouchableOpacity 
              style={styles.bookNowButton}
              onPress={() => router.push('/(tabs)/search')}
            >
              <Text style={styles.bookNowText}>Find Stylists</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingsList}>
            {bookings.map(renderBookingCard)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 40,
  },
  bookNowButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 30,
  },
  bookNowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bookingsList: {
    padding: 20,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stylistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bookingDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bookingTime: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  servicesContainer: {
    marginBottom: 12,
  },
  servicesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceItem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});