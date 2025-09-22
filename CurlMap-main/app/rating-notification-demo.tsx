import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, SPACING } from '../constants';
import RatingForm from '../components/RatingForm';
import { apiService } from '../services/api';

// This component shows where rating notifications appear
export default function RatingNotificationDemo() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [unratedCount, setUnratedCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    loadCompletedBookings();
  }, []);

  const loadNotifications = async () => {
    // Mock notifications - in real app these come from backend
    const mockNotifications = [
      {
        id: '1',
        type: 'rating_request',
        title: 'Rate Your Service',
        message: 'Your appointment with Sarah Johnson is complete! How was your experience?',
        bookingId: 'booking123',
        stylistName: 'Sarah Johnson',
        serviceName: 'Braids & Styling',
        createdAt: new Date(),
        isRead: false
      },
      {
        id: '2',
        type: 'rating_request',
        title: 'Rate Your Service',
        message: 'Your session with Mike Chen is done. Share your feedback!',
        bookingId: 'booking124',
        stylistName: 'Mike Chen',
        serviceName: 'Hair Cut & Style',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false
      }
    ];
    setNotifications(mockNotifications);
    setUnratedCount(mockNotifications.filter(n => !n.isRead).length);
  };

  const loadCompletedBookings = async () => {
    // Mock completed bookings that need rating
    const mockBookings = [
      {
        _id: 'booking123',
        stylistId: { user: { name: 'Sarah Johnson' } },
        service: { name: 'Braids & Styling' },
        appointmentDate: new Date(),
        status: 'completed',
        needsRating: true,
        completedAt: new Date()
      },
      {
        _id: 'booking124',
        stylistId: { user: { name: 'Mike Chen' } },
        service: { name: 'Hair Cut & Style' },
        appointmentDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'completed',
        needsRating: true,
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ];
    setCompletedBookings(mockBookings);
  };

  const handleRateService = (booking) => {
    setSelectedBooking(booking);
    setShowRatingForm(true);
  };

  const handleNotificationTap = (notification) => {
    // Mark as read and open rating form
    const booking = completedBookings.find(b => b._id === notification.bookingId);
    if (booking) {
      handleRateService(booking);
    }
  };

  const handleRatingSubmitted = () => {
    setShowRatingForm(false);
    setSelectedBooking(null);
    // Remove the booking from unrated list
    setCompletedBookings(prev => 
      prev.filter(booking => booking._id !== selectedBooking?._id)
    );
    setNotifications(prev => 
      prev.filter(notif => notif.bookingId !== selectedBooking?._id)
    );
    setUnratedCount(prev => Math.max(0, prev - 1));
    
    Alert.alert(
      'Rating Submitted! 🌟',
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
      {/* Header with notification badge */}
      <View style={styles.header}>
        <Text style={styles.title}>Rating Notifications Demo</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications" size={24} color={COLORS.TEXT_PRIMARY} />
          {unratedCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unratedCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 1. Push Notification Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 📲 Push Notifications</Text>
        <Text style={styles.sectionSubtitle}>
          Immediate notifications when service is completed
        </Text>
        
        <View style={styles.pushNotificationDemo}>
          <View style={styles.phoneFrame}>
            <View style={styles.notificationCard}>
              <View style={styles.notificationHeader}>
                <Ionicons name="star" size={16} color={COLORS.WARNING} />
                <Text style={styles.notificationTitle}>Rate Your Service</Text>
                <Text style={styles.notificationTime}>now</Text>
              </View>
              <Text style={styles.notificationMessage}>
                Your appointment with Sarah Johnson is complete! How was your experience?
              </Text>
              <View style={styles.notificationActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionText}>TAP TO RATE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dismissButton}>
                  <Text style={styles.dismissText}>LATER</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 2. In-App Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. 🔔 In-App Notifications</Text>
        <Text style={styles.sectionSubtitle}>
          Notifications tab in your app
        </Text>
        
        {notifications.map(notification => (
          <TouchableOpacity
            key={notification.id}
            style={styles.inAppNotification}
            onPress={() => handleNotificationTap(notification)}
          >
            <View style={styles.notificationIcon}>
              <Ionicons name="star" size={20} color={COLORS.WARNING} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationMessage}>{notification.message}</Text>
              <Text style={styles.notificationMeta}>
                {notification.stylistName} • {notification.serviceName} • 
                {new Date(notification.createdAt).toLocaleTimeString()}
              </Text>
            </View>
            {!notification.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. My Bookings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. 📅 My Bookings</Text>
        <Text style={styles.sectionSubtitle}>
          Completed bookings waiting for ratings
        </Text>
        
        {completedBookings.map(booking => (
          <View key={booking._id} style={styles.bookingCard}>
            <View style={styles.bookingStatus}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.SUCCESS} />
              <Text style={styles.statusText}>COMPLETED - Ready to Rate</Text>
            </View>
            <Text style={styles.stylistName}>
              {booking.stylistId.user.name}
            </Text>
            <Text style={styles.serviceName}>
              {booking.service.name}
            </Text>
            <Text style={styles.bookingDate}>
              {new Date(booking.appointmentDate).toLocaleDateString()}
            </Text>
            <View style={styles.bookingActions}>
              <TouchableOpacity
                style={styles.rateButton}
                onPress={() => handleRateService(booking)}
              >
                <Ionicons name="star" size={16} color={COLORS.WHITE} />
                <Text style={styles.rateButtonText}>RATE SERVICE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>VIEW DETAILS</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* 4. Home Screen Banner */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. 🏠 Home Screen Banner</Text>
        <Text style={styles.sectionSubtitle}>
          Prominent reminder on your home screen
        </Text>
        
        <View style={styles.homeBanner}>
          <View style={styles.bannerIcon}>
            <Ionicons name="star" size={24} color={COLORS.PRIMARY} />
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>Rate Your Recent Service</Text>
            <Text style={styles.bannerMessage}>
              Help other customers by sharing your experience with Sarah Johnson
            </Text>
          </View>
          <TouchableOpacity style={styles.bannerAction}>
            <Text style={styles.bannerActionText}>RATE NOW</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>💡 How It Works</Text>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>
            Stylist marks your booking as "completed"
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>
            You receive notifications in multiple places
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>
            Tap any notification to open the rating form
          </Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>4</Text>
          <Text style={styles.stepText}>
            Submit your rating and help other customers
          </Text>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  notificationIcon: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.ERROR,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.SM,
    padding: SPACING.MD,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    marginBottom: SPACING.MD,
  },
  pushNotificationDemo: {
    alignItems: 'center',
  },
  phoneFrame: {
    backgroundColor: COLORS.GRAY_900,
    borderRadius: 20,
    padding: SPACING.SM,
    width: '90%',
  },
  notificationCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: SPACING.SM,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.XS,
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.GRAY_500,
  },
  notificationMessage: {
    fontSize: 13,
    color: COLORS.GRAY_700,
    marginBottom: SPACING.SM,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 4,
    marginLeft: SPACING.SM,
  },
  actionText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '500',
  },
  dismissButton: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
  },
  dismissText: {
    color: COLORS.GRAY_600,
    fontSize: 12,
  },
  inAppNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  notificationContent: {
    flex: 1,
    marginLeft: SPACING.SM,
  },
  notificationMeta: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    marginTop: SPACING.XS,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
  },
  bookingCard: {
    backgroundColor: COLORS.GRAY_50,
    borderRadius: 8,
    padding: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  bookingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.SUCCESS,
    marginLeft: SPACING.XS,
  },
  stylistName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  serviceName: {
    fontSize: 14,
    color: COLORS.GRAY_600,
  },
  bookingDate: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    marginBottom: SPACING.SM,
  },
  bookingActions: {
    flexDirection: 'row',
  },
  rateButton: {
    backgroundColor: COLORS.PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 4,
    marginRight: SPACING.SM,
  },
  rateButtonText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: SPACING.XS,
  },
  detailsButton: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_300,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 4,
  },
  detailsButtonText: {
    color: COLORS.GRAY_700,
    fontSize: 12,
  },
  homeBanner: {
    backgroundColor: COLORS.PRIMARY + '15',
    borderRadius: 8,
    padding: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    marginRight: SPACING.SM,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  bannerMessage: {
    fontSize: 14,
    color: COLORS.GRAY_600,
    marginTop: SPACING.XS,
  },
  bannerAction: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 4,
  },
  bannerActionText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: '500',
  },
  instructions: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.SM,
    padding: SPACING.MD,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  stepNumber: {
    backgroundColor: COLORS.PRIMARY,
    color: COLORS.WHITE,
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: SPACING.SM,
  },
  stepText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
});