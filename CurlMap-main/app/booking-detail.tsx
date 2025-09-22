import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { LocationService } from '@/utils/location';
import { Booking, BookingStatus } from '@/types';

export default function BookingDetailScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isStylist = user?.isStylist || false;

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBookingById(bookingId as string);
      if (response.success && response.data) {
        setBooking(response.data);
      } else {
        Alert.alert('Error', 'Failed to load booking details');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      Alert.alert('Error', 'Failed to load booking details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return COLORS.WARNING;
      case 'accepted': return COLORS.SUCCESS;
      case 'confirmed': return COLORS.PRIMARY;
      case 'in_progress': return COLORS.SECONDARY;
      case 'completed': return COLORS.SUCCESS;
      case 'cancelled': return COLORS.ERROR;
      case 'rejected': return COLORS.ERROR;
      default: return COLORS.GRAY_400;
    }
  };

  const getStatusDisplayName = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'Pending Approval';
      case 'accepted': return 'Accepted';
      case 'confirmed': return 'Confirmed';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date set';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleAcceptBooking = () => {
    Alert.alert(
      'Accept Booking',
      `Accept this booking with ${booking?.customer?.name || 'customer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.updateBookingStatus(booking!._id, 'accepted');
              await fetchBookingDetails(); // Refresh booking data
              Alert.alert('Success', 'Booking accepted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to accept booking');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRejectBooking = () => {
    Alert.alert(
      'Reject Booking',
      `Reject this booking with ${booking?.customer?.name || 'customer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.updateBookingStatus(booking!._id, 'rejected', 'Stylist unavailable');
              await fetchBookingDetails(); // Refresh booking data
              Alert.alert('Success', 'Booking rejected');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject booking');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCompleteBooking = () => {
    Alert.alert(
      'Complete Booking',
      'Mark this booking as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.updateBookingStatus(booking!._id, 'completed');
              await fetchBookingDetails(); // Refresh booking data
              Alert.alert('Success', 'Booking completed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to complete booking');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      `Cancel this booking with ${booking?.customer?.name || 'customer'}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const reason = 'Stylist cancellation';
              await apiService.cancelBooking(booking!._id, reason);
              await fetchBookingDetails(); // Refresh booking data
              Alert.alert('Success', 'Booking cancelled');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel booking');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleChatWithClient = () => {
    if (booking?.chatId) {
      router.push({
        pathname: '/chat-room',
        params: { 
          chatId: booking.chatId,
          bookingId: booking._id 
        }
      });
    } else {
      Alert.alert('Info', 'Chat will be available once the booking is accepted');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Booking Details</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderBookingStatus = () => (
    <View style={styles.statusContainer}>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking!.status) }]}>
        <Text style={styles.statusText}>{getStatusDisplayName(booking!.status)}</Text>
      </View>
    </View>
  );

  const renderCustomerInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Customer Information</Text>
      <View style={styles.customerCard}>
        <View style={styles.customerAvatar}>
          {booking?.customer?.profileImage ? (
            <Image source={{ uri: booking.customer.profileImage }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={32} color={COLORS.GRAY_400} />
          )}
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{booking?.customer?.name || 'Customer'}</Text>
          <Text style={styles.customerEmail}>{booking?.customer?.email}</Text>
          {booking?.customer?.phone && (
            <Text style={styles.customerPhone}>{booking.customer.phone}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.contactButton} onPress={handleChatWithClient}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderServiceDetails = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Service Details</Text>
      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Ionicons name="cut-outline" size={20} color={COLORS.GRAY_500} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Service</Text>
            <Text style={styles.detailValue}>{booking?.service?.name || 'Hair Service'}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={20} color={COLORS.GRAY_500} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{booking?.service?.estimatedDuration || 0} minutes</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="cash-outline" size={20} color={COLORS.GRAY_500} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Price</Text>
            <Text style={styles.detailValue}>${booking?.negotiatedPrice || 0}</Text>
          </View>
        </View>
        
        {booking?.service?.description && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.GRAY_500} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{booking.service.description}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderAppointmentDetails = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Appointment Details</Text>
      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color={COLORS.GRAY_500} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{formatDate(booking?.appointmentTime || '')}</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={20} color={COLORS.GRAY_500} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>
              {LocationService.formatAddress(booking?.location?.address) || 'Location not specified'}
            </Text>
          </View>
        </View>
        
        {booking?.notes && (
          <View style={styles.detailRow}>
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.GRAY_500} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{booking.notes}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderActions = () => {
    if (!isStylist || !booking) return null;

    const actions = [];

    // Pending bookings - Accept/Reject
    if (booking.status === 'pending') {
      actions.push(
        <TouchableOpacity 
          key="accept" 
          style={[styles.actionButton, styles.acceptButton]} 
          onPress={handleAcceptBooking}
          disabled={actionLoading}
        >
          <Ionicons name="checkmark-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Accept Booking</Text>
        </TouchableOpacity>
      );
      actions.push(
        <TouchableOpacity 
          key="reject" 
          style={[styles.actionButton, styles.rejectButton]} 
          onPress={handleRejectBooking}
          disabled={actionLoading}
        >
          <Ionicons name="close-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Reject Booking</Text>
        </TouchableOpacity>
      );
    }

    // Accepted/Confirmed bookings - Complete/Cancel
    if (booking.status === 'accepted' || booking.status === 'confirmed') {
      actions.push(
        <TouchableOpacity 
          key="complete" 
          style={[styles.actionButton, styles.completeButton]} 
          onPress={handleCompleteBooking}
          disabled={actionLoading}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Mark Complete</Text>
        </TouchableOpacity>
      );
      actions.push(
        <TouchableOpacity 
          key="cancel" 
          style={[styles.actionButton, styles.cancelButton]} 
          onPress={handleCancelBooking}
          disabled={actionLoading}
        >
          <Ionicons name="close-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
      );
    }

    // Chat button (always available if booking is not rejected/cancelled)
    if (!['rejected', 'cancelled'].includes(booking.status)) {
      actions.push(
        <TouchableOpacity 
          key="chat" 
          style={[styles.actionButton, styles.chatButton]} 
          onPress={handleChatWithClient}
          disabled={actionLoading}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Chat with Customer</Text>
        </TouchableOpacity>
      );
    }

    return actions.length > 0 ? (
      <View style={styles.actionsSection}>
        {actionLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          </View>
        )}
        {actions}
      </View>
    ) : null;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.ERROR} />
          <Text style={styles.errorText}>Booking not found</Text>
          <TouchableOpacity style={styles.backToListButton} onPress={() => router.back()}>
            <Text style={styles.backToListText}>Back to Bookings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderBookingStatus()}
        {renderCustomerInfo()}
        {renderServiceDetails()}
        {renderAppointmentDetails()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      {renderActions()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  headerSpacer: {
    width: 40,
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
    color: COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
  },
  errorText: {
    fontSize: FONT_SIZES.LG,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.XL,
  },
  backToListButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
  },
  backToListText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  statusBadge: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
  },
  statusText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  section: {
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.MD,
  },
  customerCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.GRAY_100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  customerEmail: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  customerPhone: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  contactButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  detailContent: {
    flex: 1,
    marginLeft: SPACING.MD,
  },
  detailLabel: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  detailValue: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  actionsSection: {
    padding: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.SM,
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  acceptButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  rejectButton: {
    backgroundColor: COLORS.ERROR,
  },
  completeButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  cancelButton: {
    backgroundColor: COLORS.ERROR,
  },
  chatButton: {
    backgroundColor: COLORS.SECONDARY,
  },
  bottomSpacing: {
    height: SPACING.XL,
  },
});