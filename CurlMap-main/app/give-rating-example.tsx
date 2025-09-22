import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../constants';
import RatingForm from '../components/RatingForm';
import { apiService } from '../services/api';

// Example: Rating Flow Page
export default function GiveRatingExample() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);

  useEffect(() => {
    loadCompletedBookings();
  }, []);

  const loadCompletedBookings = async () => {
    try {
      // Get bookings that are completed but not yet rated
      const response = await apiService.getBookings({ status: 'completed' });
      const unratedBookings = response.data.filter(booking => !booking.hasBeenRated);
      setBookings(unratedBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleBookingSelect = (booking) => {
    setSelectedBooking(booking);
    setShowRatingForm(true);
  };

  const handleRatingSubmitted = () => {
    setShowRatingForm(false);
    setSelectedBooking(null);
    loadCompletedBookings(); // Refresh the list
    Alert.alert(
      'Rating Submitted!',
      'Thank you for your feedback. Your rating helps other customers choose the best stylists.',
      [{ text: 'OK' }]
    );
  };

  if (showRatingForm && selectedBooking) {
    return (
      <RatingForm
        booking={selectedBooking}
        onSubmit={handleRatingSubmitted}
        onCancel={() => setShowRatingForm(false)}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rate Your Recent Services</Text>
        <Text style={styles.subtitle}>
          Help other customers by sharing your experience
        </Text>
      </View>

      {bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No completed services to rate at the moment.
          </Text>
          <Text style={styles.emptySubtext}>
            Complete a booking to leave a rating!
          </Text>
        </View>
      ) : (
        <View style={styles.bookingsList}>
          <Text style={styles.sectionTitle}>Pending Ratings</Text>
          {bookings.map((booking) => (
            <TouchableOpacity
              key={booking._id}
              style={styles.bookingCard}
              onPress={() => handleBookingSelect(booking)}
            >
              <View style={styles.bookingInfo}>
                <Text style={styles.stylistName}>
                  {booking.stylistId?.user?.name || 'Stylist'}
                </Text>
                <Text style={styles.serviceName}>
                  {booking.service || 'Hair Service'}
                </Text>
                <Text style={styles.serviceDate}>
                  {new Date(booking.appointmentDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.ratingPrompt}>
                <Text style={styles.rateText}>Tap to Rate</Text>
                <Text style={styles.starsIcon}>⭐⭐⭐⭐⭐</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.helpSection}>
        <Text style={styles.helpTitle}>💡 Rating Tips</Text>
        <Text style={styles.helpText}>
          • Be honest and constructive in your feedback{'\n'}
          • Rate different aspects like quality, punctuality, and communication{'\n'}
          • Include photos if you're happy with the result{'\n'}
          • Your reviews help stylists improve their services
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.GRAY_600,
    textAlign: 'center',
    marginTop: SPACING.SM,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.GRAY_600,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.GRAY_500,
    textAlign: 'center',
  },
  bookingsList: {
    padding: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  bookingCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookingInfo: {
    flex: 1,
  },
  stylistName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  serviceName: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    marginTop: SPACING.XS,
  },
  serviceDate: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    marginTop: SPACING.XS,
  },
  ratingPrompt: {
    alignItems: 'center',
  },
  rateText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  starsIcon: {
    fontSize: 16,
    marginTop: SPACING.XS,
  },
  helpSection: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.MD,
    padding: SPACING.MD,
    borderRadius: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    lineHeight: 20,
  },
});