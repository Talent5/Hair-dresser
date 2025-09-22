import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LocationService } from '../utils/location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

interface TimeSlot {
  time: string;
  available: boolean;
}

const BookAppointmentScreen = () => {
  const router = useRouter();
  const { stylistId, serviceId, price } = useLocalSearchParams();
  const { user } = useAuth();

  // Debug logging to see what we receive
  console.log('Received params:', { stylistId, serviceId, price });
  console.log('stylistId type:', typeof stylistId, 'value:', stylistId);
  console.log('stylistId as string:', String(stylistId));

  // Ensure stylistId is a string and handle edge cases
  let stylistIdString: string;
  if (Array.isArray(stylistId)) {
    stylistIdString = stylistId[0] || '';
  } else if (stylistId && typeof stylistId === 'string') {
    stylistIdString = stylistId;
  } else {
    stylistIdString = String(stylistId || '');
  }
  
  console.log('Final stylistIdString:', stylistIdString);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [location, setLocation] = useState('my_location');
  const [customLocation, setCustomLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [customerOffer, setCustomerOffer] = useState(price ? parseFloat(price as string).toString() : '');
  const [loading, setLoading] = useState(false);

  const basePrice = price ? parseFloat(price as string) : 0;
  const minimumPrice = basePrice * 0.8; // 20% below base price
  const offerPrice = customerOffer ? parseFloat(customerOffer) : basePrice;

  // Generate next 7 days
  const getNextWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Generate time slots
  const getTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 18; // 6 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        // Mock availability - in real app, fetch from API
        const available = Math.random() > 0.3; // 70% chance of being available
        slots.push({ time, available });
      }
    }
    return slots;
  };

  const handleBookAppointment = async () => {
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    if (location === 'custom' && !customLocation.trim()) {
      Alert.alert('Error', 'Please enter a custom location');
      return;
    }

    // Validate customer offer price
    if (!customerOffer || isNaN(parseFloat(customerOffer))) {
      Alert.alert('Error', 'Please enter a valid offer amount');
      return;
    }

    if (offerPrice < minimumPrice) {
      Alert.alert(
        'Offer Too Low',
        `Your offer of $${offerPrice.toFixed(2)} is too low. The minimum acceptable price is $${minimumPrice.toFixed(2)} (20% below the recommended price of $${basePrice.toFixed(2)}).`,
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Create appointment date/time
      const appointmentDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const bookingData = {
        stylistId: stylistIdString,
        service: {
          name: serviceId as string,
          category: 'braids', // This should be determined from service
          duration: 240, // Should come from service data
          basePrice: parseFloat(price as string)
        },
        pricing: {
          basePrice: basePrice,
          negotiatedPrice: offerPrice,
          customerOffer: offerPrice,
          depositAmount: offerPrice * 0.1, // 10% deposit
          additionalFees: [],
          totalAmount: offerPrice,
          currency: 'USD'
        },
        appointmentDateTime: appointmentDateTime.toISOString(),
        location: {
          type: location === 'my_location' ? 'customer_location' : 'customer_location',
          address: {
            street: location === 'my_location' ? LocationService.formatAddress(user?.location?.address) || '' : customLocation,
            suburb: '',
            city: '',
            coordinates: user?.location?.coordinates || [0, 0]
          },
          instructions: notes,
          additionalFee: 0
        },
        notes
      };

      console.log('Booking data being sent:', JSON.stringify(bookingData, null, 2));

      // Create booking via API
      const response = await apiService.createBooking(bookingData);
      
      if (response.success && response.data) {
        const isNegotiated = offerPrice < basePrice;
        const alertTitle = isNegotiated ? 'Offer Submitted!' : 'Booking Confirmed!';
        const alertMessage = isNegotiated 
          ? `Your offer of $${offerPrice.toFixed(2)} has been submitted and is pending stylist approval.\n\nAppointment: ${selectedDate.toLocaleDateString()} at ${selectedTime}`
          : `Your appointment has been booked for ${selectedDate.toLocaleDateString()} at ${selectedTime}\n\nPrice: $${offerPrice.toFixed(2)}`;
          
        Alert.alert(
          alertTitle,
          alertMessage,
          [
            {
              text: 'View Details',
              onPress: () => router.push({
                pathname: '/booking-confirmation',
                params: {
                  stylistName: 'Selected Stylist', // Would come from stylist data
                  service: serviceId,
                  date: selectedDate.toLocaleDateString(),
                  time: selectedTime,
                  location: location === 'my_location' ? LocationService.formatAddress(user?.location?.address) : customLocation,
                  price: offerPrice.toFixed(2),
                  originalPrice: basePrice !== offerPrice ? basePrice.toFixed(2) : undefined,
                  bookingId: response.data?._id || 'unknown'
                }
              })
            },
            {
              text: 'View Bookings',
              onPress: () => router.push('/(tabs)/bookings')
            }
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  const renderDateSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.dateContainer}>
          {getNextWeekDates().map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateCard,
                selectedDate.toDateString() === date.toDateString() && styles.selectedDateCard
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dateText,
                selectedDate.toDateString() === date.toDateString() && styles.selectedDateText
              ]}>
                {formatDate(date)}
              </Text>
              <Text style={[
                styles.dayText,
                selectedDate.toDateString() === date.toDateString() && styles.selectedDayText
              ]}>
                {date.getDate()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderTimeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Time</Text>
      <View style={styles.timeGrid}>
        {getTimeSlots().map((slot, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.timeSlot,
              !slot.available && styles.unavailableTimeSlot,
              selectedTime === slot.time && styles.selectedTimeSlot
            ]}
            onPress={() => slot.available && setSelectedTime(slot.time)}
            disabled={!slot.available}
          >
            <Text style={[
              styles.timeText,
              !slot.available && styles.unavailableTimeText,
              selectedTime === slot.time && styles.selectedTimeText
            ]}>
              {slot.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderLocationSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location</Text>
      
      <TouchableOpacity
        style={[
          styles.locationOption,
          location === 'my_location' && styles.selectedLocationOption
        ]}
        onPress={() => setLocation('my_location')}
      >
        <Ionicons 
          name="home-outline" 
          size={20} 
          color={location === 'my_location' ? '#e91e63' : '#6b7280'} 
        />
        <View style={styles.locationInfo}>
          <Text style={[
            styles.locationTitle,
            location === 'my_location' && styles.selectedLocationTitle
          ]}>
            My Location
          </Text>
          <Text style={styles.locationSubtitle}>
            {LocationService.formatAddress(user?.location?.address) || 'Your saved address'}
          </Text>
        </View>
        {location === 'my_location' && (
          <Ionicons name="checkmark-circle" size={20} color="#e91e63" />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.locationOption,
          location === 'custom' && styles.selectedLocationOption
        ]}
        onPress={() => setLocation('custom')}
      >
        <Ionicons 
          name="location-outline" 
          size={20} 
          color={location === 'custom' ? '#e91e63' : '#6b7280'} 
        />
        <View style={styles.locationInfo}>
          <Text style={[
            styles.locationTitle,
            location === 'custom' && styles.selectedLocationTitle
          ]}>
            Custom Location
          </Text>
          <Text style={styles.locationSubtitle}>Enter a different address</Text>
        </View>
        {location === 'custom' && (
          <Ionicons name="checkmark-circle" size={20} color="#e91e63" />
        )}
      </TouchableOpacity>

      {location === 'custom' && (
        <TextInput
          style={styles.customLocationInput}
          placeholder="Enter address or location details"
          value={customLocation}
          onChangeText={setCustomLocation}
          multiline
        />
      )}
    </View>
  );

  const renderNotesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Any special instructions, preferences, or requirements..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />
    </View>
  );

  const renderPricingSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Offer</Text>
      <Text style={styles.pricingInfo}>
        Recommended price: <Text style={styles.recommendedPrice}>${basePrice.toFixed(2)}</Text>
      </Text>
      <Text style={styles.pricingSubtitle}>
        Enter your offer (minimum: ${minimumPrice.toFixed(2)})
      </Text>
      
      <View style={styles.priceInputContainer}>
        <Text style={styles.currencySymbol}>$</Text>
        <TextInput
          style={styles.priceInput}
          placeholder={basePrice.toFixed(2)}
          value={customerOffer}
          onChangeText={setCustomerOffer}
          keyboardType="decimal-pad"
          autoCorrect={false}
        />
      </View>
      
      {offerPrice < basePrice && offerPrice >= minimumPrice && (
        <View style={styles.savingsContainer}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.savingsText}>
            You'll save ${(basePrice - offerPrice).toFixed(2)} with this offer!
          </Text>
        </View>
      )}
      
      {offerPrice < minimumPrice && customerOffer && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color="#f59e0b" />
          <Text style={styles.warningText}>
            Offer too low. Minimum acceptable price is ${minimumPrice.toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderBookingSummary = () => (
    <View style={styles.summarySection}>
      <Text style={styles.sectionTitle}>Booking Summary</Text>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Service:</Text>
        <Text style={styles.summaryValue}>{serviceId}</Text>
      </View>
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Date:</Text>
        <Text style={styles.summaryValue}>
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>
      
      {selectedTime && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time:</Text>
          <Text style={styles.summaryValue}>{selectedTime}</Text>
        </View>
      )}
      
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Location:</Text>
        <Text style={styles.summaryValue}>
          {location === 'my_location' ? 'Your location' : 'Custom location'}
        </Text>
      </View>
      
      <View style={[styles.summaryRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Your Offer:</Text>
        <Text style={styles.totalValue}>${offerPrice.toFixed(2)}</Text>
      </View>
      
      {offerPrice !== basePrice && (
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Recommended Price:</Text>
          <Text style={[styles.summaryValue, styles.originalPrice]}>${basePrice.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderDateSelector()}
        {renderTimeSelector()}
        {renderLocationSelector()}
        {renderPricingSection()}
        {renderNotesSection()}
        {renderBookingSummary()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.bookButton, (!selectedTime || loading || offerPrice < minimumPrice || !customerOffer) && styles.disabledButton]}
          onPress={handleBookAppointment}
          disabled={!selectedTime || loading || offerPrice < minimumPrice || !customerOffer}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="calendar-outline" size={20} color="#ffffff" />
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 15,
  },
  dateContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  dateCard: {
    alignItems: 'center',
    padding: 15,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    minWidth: 70,
  },
  selectedDateCard: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 5,
  },
  selectedDateText: {
    color: '#ffffff',
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  selectedDayText: {
    color: '#ffffff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  timeSlot: {
    width: '25%',
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  timeSlotButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#e91e63',
    borderColor: '#e91e63',
  },
  unavailableTimeSlot: {
    backgroundColor: '#f1f3f4',
    borderColor: '#e9ecef',
    opacity: 0.5,
  },
  timeText: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  selectedTimeText: {
    color: '#ffffff',
  },
  unavailableTimeText: {
    color: '#9ca3af',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 10,
  },
  selectedLocationOption: {
    backgroundColor: '#fdf2f8',
    borderColor: '#e91e63',
  },
  locationInfo: {
    flex: 1,
    marginLeft: 15,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  selectedLocationTitle: {
    color: '#e91e63',
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  customLocationInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#212529',
    marginTop: 10,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#212529',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pricingInfo: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 5,
  },
  recommendedPrice: {
    fontWeight: 'bold',
    color: '#e91e63',
  },
  pricingSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 15,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6b7280',
    marginRight: 5,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
  },
  savingsText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginLeft: 5,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 6,
    marginTop: 5,
  },
  warningText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '500',
    marginLeft: 5,
  },
  summarySection: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 10,
    paddingTop: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  footer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  bookButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e91e63',
    paddingVertical: 15,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#adb5bd',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default BookAppointmentScreen;