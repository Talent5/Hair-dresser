import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const BookingConfirmationScreen = () => {
  const router = useRouter();
  const { 
    stylistName,
    stylistImage,
    service,
    date,
    time,
    location,
    price,
    bookingId 
  } = useLocalSearchParams();

  const handleViewBookings = () => {
    router.push('/(tabs)/bookings');
  };

  const handleContactStylist = () => {
    // Navigate to chat with stylist
    router.push('/chat-room'); // Will need to pass stylist info
  };

  const handleGoHome = () => {
    router.push('/(tabs)');
  };

  const renderConfirmationHeader = () => (
    <View style={styles.confirmationHeader}>
      <View style={styles.successIcon}>
        <Ionicons name="checkmark-circle" size={64} color="#10b981" />
      </View>
      <Text style={styles.confirmationTitle}>Booking Confirmed!</Text>
      <Text style={styles.confirmationSubtitle}>
        Your appointment has been successfully booked
      </Text>
    </View>
  );

  const renderStylistInfo = () => (
    <View style={styles.stylistSection}>
      <Image 
        source={{ uri: stylistImage as string || 'https://via.placeholder.com/60' }}
        style={styles.stylistImage}
      />
      <View style={styles.stylistInfo}>
        <Text style={styles.stylistName}>{stylistName}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text style={styles.rating}>4.8</Text>
          <Text style={styles.reviewCount}>(124 reviews)</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.contactButton}
        onPress={handleContactStylist}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#e91e63" />
      </TouchableOpacity>
    </View>
  );

  const renderBookingDetails = () => (
    <View style={styles.detailsSection}>
      <Text style={styles.sectionTitle}>Appointment Details</Text>
      
      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>
          <Ionicons name="cut-outline" size={20} color="#6b7280" />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>Service</Text>
          <Text style={styles.detailValue}>{service}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>Date & Time</Text>
          <Text style={styles.detailValue}>{date} at {time}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>
          <Ionicons name="location-outline" size={20} color="#6b7280" />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>{location}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>
          <Ionicons name="card-outline" size={20} color="#6b7280" />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>Total Amount</Text>
          <Text style={styles.detailValue}>${price}</Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailIcon}>
          <Ionicons name="receipt-outline" size={20} color="#6b7280" />
        </View>
        <View style={styles.detailContent}>
          <Text style={styles.detailLabel}>Booking ID</Text>
          <Text style={styles.detailValue}>#{bookingId}</Text>
        </View>
      </View>
    </View>
  );

  const renderNextSteps = () => (
    <View style={styles.nextStepsSection}>
      <Text style={styles.sectionTitle}>What's Next?</Text>
      
      <View style={styles.stepItem}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>1</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Confirmation SMS</Text>
          <Text style={styles.stepDescription}>
            You'll receive a confirmation message with all the details
          </Text>
        </View>
      </View>

      <View style={styles.stepItem}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>2</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Contact Your Stylist</Text>
          <Text style={styles.stepDescription}>
            Feel free to message your stylist with any questions
          </Text>
        </View>
      </View>

      <View style={styles.stepItem}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>3</Text>
        </View>
        <View style={styles.stepContent}>
          <Text style={styles.stepTitle}>Reminder Notifications</Text>
          <Text style={styles.stepDescription}>
            We'll send you reminders before your appointment
          </Text>
        </View>
      </View>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionSection}>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleViewBookings}
      >
        <Ionicons name="calendar-outline" size={20} color="#ffffff" />
        <Text style={styles.primaryButtonText}>View All Bookings</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleContactStylist}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#e91e63" />
        <Text style={styles.secondaryButtonText}>Message Stylist</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tertiaryButton}
        onPress={handleGoHome}
      >
        <Text style={styles.tertiaryButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleGoHome}
        >
          <Ionicons name="close" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderConfirmationHeader()}
        {renderStylistInfo()}
        {renderBookingDetails()}
        {renderNextSteps()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {renderActionButtons()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  confirmationHeader: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#ffffff',
  },
  successIcon: {
    marginBottom: 20,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  stylistSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 10,
  },
  stylistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f1f3f4',
  },
  stylistInfo: {
    flex: 1,
    marginLeft: 15,
  },
  stylistName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  nextStepsSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  actionSection: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e91e63',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    borderWidth: 1,
    borderColor: '#e91e63',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#e91e63',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tertiaryButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
  },
  tertiaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default BookingConfirmationScreen;