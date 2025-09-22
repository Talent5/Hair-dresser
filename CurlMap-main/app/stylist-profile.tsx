import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../contexts/AuthContext';
import { LocationService } from '../utils/location';
import api from '../services/api';

const { width } = Dimensions.get('window');

interface Service {
  name: string;
  price: number;
  duration: number;
  description: string;
}

interface StylistProfile {
  _id: string;
  userId: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    location: {
      address: string;
      coordinates: [number, number];
    };
    isVerified: boolean;
  };
  rating: number;
  reviewCount: number;
  specialties: string[];
  bio: string;
  experience: number;
  isAvailable: boolean;
  workingRadius: number;
  completedBookings: number;
  distance?: number;
  portfolio: string[];
  services: Service[];
  reviews: any[];
}

const StylistProfileScreen = () => {
  const router = useRouter();
  const { stylistId } = useLocalSearchParams();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  const [stylist, setStylist] = useState<StylistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [stylistNotFound, setStylistNotFound] = useState(false);

  useEffect(() => {
    fetchStylistProfile();
    checkIsFavorite();
  }, [stylistId]);

  const fetchStylistProfile = async () => {
    try {
      setLoading(true);
      
      if (!stylistId) {
        throw new Error('Stylist ID is required');
      }

      // Fetch real stylist data from API
      const response = await api.getStylistDetails(stylistId as string);
      
      if (response.success && response.data) {
        // Handle both possible response structures: direct stylist data or nested in .stylist property
        const stylistData = (response.data as any)?.stylist || (response.data as any);
        
        console.log('Raw stylist data from API:', stylistData);
        console.log('stylistData.userId:', stylistData.userId, 'Type:', typeof stylistData.userId);
        console.log('stylistData.user._id:', stylistData.user?._id, 'Type:', typeof stylistData.user?._id);
        
        // Transform the API response to match the expected StylistProfile interface
        const formattedStylist: StylistProfile = {
          _id: typeof stylistData._id === 'object' && stylistData._id?.$oid ? stylistData._id.$oid : String(stylistData._id || ''),
          userId: (() => {
            // Handle corrupted userId field - extract from user object if userId is corrupted
            if (stylistData.userId === '[object Object]' || !stylistData.userId || typeof stylistData.userId === 'object') {
              // Extract from user object
              if (stylistData.user && stylistData.user._id) {
                return typeof stylistData.user._id === 'object' && stylistData.user._id.$oid 
                  ? stylistData.user._id.$oid 
                  : String(stylistData.user._id);
              }
              return '';
            }
            // Handle normal cases
            return typeof stylistData.userId === 'object' && stylistData.userId?.$oid 
              ? stylistData.userId.$oid 
              : String(stylistData.userId || '');
          })(), // Handle MongoDB ObjectId format and corrupted data
          user: {
            _id: typeof stylistData.user?._id === 'object' && stylistData.user?._id?.$oid ? stylistData.user._id.$oid : String(stylistData.user?._id || ''),
            name: stylistData.user?.name || 'Unknown User',
            email: stylistData.user?.email || '',
            avatar: stylistData.user?.avatar || 'U',
            location: {
              address: LocationService.formatAddress(stylistData.user?.location?.address),
              coordinates: stylistData.user?.location?.coordinates || [0, 0],
            },
            isVerified: stylistData.user?.isVerified || false,
          },
          rating: typeof stylistData.rating === 'object' ? (stylistData.rating?.average || 0) : (stylistData.rating || 0),
          reviewCount: typeof stylistData.rating === 'object' ? (stylistData.rating?.count || 0) : (stylistData.reviewCount || 0),
          specialties: stylistData.specialties || [],
          bio: stylistData.bio || '',
          experience: stylistData.experience?.years || stylistData.experience || 0,
          isAvailable: true, // This would come from availability logic
          workingRadius: stylistData.location?.mobileRadius || 10,
          completedBookings: stylistData.statistics?.completedBookings || 0,
          portfolio: stylistData.portfolio?.map((item: any) => item.imageUrl) || [],
          services: stylistData.services?.map((service: any) => ({
            name: service.name,
            price: service.basePrice?.amount || 0,
            duration: service.duration,
            description: service.description || ''
          })) || [],
          reviews: stylistData.reviews?.map((review: any) => ({
            id: review._id,
            clientName: review.customerId?.name || 'Anonymous',
            rating: review.rating,
            comment: review.comment || '',
            date: new Date(review.createdAt).toISOString().split('T')[0],
            service: 'Service' // Could be enhanced to include actual service name
          })) || []
        };
        
        console.log('Formatted stylist userId:', formattedStylist.userId);
        console.log('Formatted stylist object:', formattedStylist);
        
        setStylist(formattedStylist);
      } else {
        throw new Error(response.message || 'Failed to fetch stylist profile');
      }
    } catch (error: any) {
      console.error('Error fetching stylist profile:', error);
      
      // Check if this is a "Stylist not found" error (could be inactive or doesn't exist)
      if (error.message?.includes('Stylist not found') || error.message?.includes('not found')) {
        setStylistNotFound(true);
      } else {
        // For other errors, show alert and go back
        Alert.alert('Error', 'Failed to load stylist profile');
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)' as any);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const checkIsFavorite = async () => {
    try {
      if (!stylistId) {
        console.log('No stylist ID provided, skipping favorite check');
        return;
      }
      const response = await api.checkIsFavorite(stylistId as string);
      setIsFavorite(response.data?.isFavorite || false);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (!stylistId) {
        Alert.alert('Error', 'Unable to update favorites');
        return;
      }
      
      setFavoriteLoading(true);
      
      if (isFavorite) {
        await api.removeFavorite(stylistId as string);
        setIsFavorite(false);
        Alert.alert('Removed', 'Stylist removed from favorites');
      } else {
        await api.addFavorite(stylistId as string);
        setIsFavorite(true);
        Alert.alert('Added', 'Stylist added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorites');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleBookService = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleInstantBooking = () => {
    console.log('Stylist object:', stylist);
    console.log('Stylist userId:', stylist?.userId, 'Type:', typeof stylist?.userId);
    
    Alert.alert(
      'Instant Booking',
      `Book ${selectedService?.name} with ${stylist?.user.name}?\n\nPrice: $${selectedService?.price}\nDuration: ${selectedService ? Math.floor(selectedService.duration / 60) : 0}h ${selectedService ? selectedService.duration % 60 : 0}m`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book Now',
          onPress: () => {
            if (!stylist?.userId) {
              Alert.alert('Error', 'Unable to book appointment. Please try again.');
              return;
            }
            setShowBookingModal(false);
            
            console.log('Navigating with stylistId:', stylist.userId);
            
            router.push({
              pathname: '/book-appointment',
              params: {
                stylistId: stylist.userId, // Use user ID for booking
                serviceId: selectedService?.name,
                price: selectedService?.price,
              }
            });
          }
        }
      ]
    );
  };

  const handleScheduleBooking = () => {
    if (!stylist?.userId) {
      Alert.alert('Error', 'Unable to book appointment. Please try again.');
      return;
    }
    setShowBookingModal(false);
    
    console.log('Schedule booking with stylistId:', stylist.userId);
    
    router.push({
      pathname: '/book-appointment', // Using book-appointment instead of schedule-appointment
      params: {
        stylistId: stylist.userId, // Use user ID for booking
        serviceId: selectedService?.name,
        price: selectedService?.price,
      }
    });
  };

  const handleStartChat = async () => {
    try {
      if (!stylist?.userId) {
        Alert.alert('Error', 'Unable to start chat. Stylist information not available.');
        return;
      }

      // Create or get existing chat
      const response = await api.createChat(stylist.userId);
      
      if (response.success && response.data) {
        router.push({
          pathname: '/chat-room',
          params: { 
            chatId: response.data._id,
            otherParticipantName: stylist.user?.name || 'Stylist'
          }
        });
      } else {
        Alert.alert('Error', 'Unable to start chat. Please try again.');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Unable to start chat. Please try again.');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)' as any);
          }
        }}
      >
        <Ionicons name="arrow-back" size={24} color="#ffffff" />
      </TouchableOpacity>
      
      <View style={styles.headerActions}>
        <TouchableOpacity 
          style={styles.headerAction}
          onPress={toggleFavorite}
          disabled={favoriteLoading}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#FF6B6B" : "#ffffff"} 
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="share-outline" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStylistInfo = () => (
    <View style={styles.stylistInfo}>
      <View style={styles.avatarContainer}>
        {stylist?.user?.avatar && stylist.user.avatar.startsWith('http') ? (
          <Image
            source={{ uri: stylist.user.avatar }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {stylist?.user?.avatar || 'U'}
            </Text>
          </View>
        )}
        {stylist?.user.isVerified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark" size={16} color="#ffffff" />
          </View>
        )}
        {stylist?.isAvailable && (
          <View style={styles.onlineBadge} />
        )}
      </View>

      <View style={styles.basicInfo}>
        <Text style={styles.name}>{stylist?.user.name}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text style={styles.rating}>
            {(stylist?.rating || 0).toFixed(1)} ({stylist?.reviewCount} reviews)
          </Text>
        </View>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={styles.location}>{LocationService.formatAddress(stylist?.user.location.address)}</Text>
          {stylist?.distance && (
            <Text style={styles.distance}>• {stylist.distance.toFixed(1)}km away</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{stylist?.experience}</Text>
        <Text style={styles.statLabel}>Years</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{stylist?.completedBookings}</Text>
        <Text style={styles.statLabel}>Bookings</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{(stylist?.rating || 0).toFixed(1)}</Text>
        <Text style={styles.statLabel}>Rating</Text>
      </View>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{stylist?.workingRadius}km</Text>
        <Text style={styles.statLabel}>Radius</Text>
      </View>
    </View>
  );

  const renderSpecialties = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Specialties</Text>
      <View style={styles.specialtiesContainer}>
        {stylist?.specialties.map((specialty, index) => (
          <View key={index} style={styles.specialtyTag}>
            <Text style={styles.specialtyText}>{specialty}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderBio = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.bio}>{stylist?.bio}</Text>
    </View>
  );

  const renderServices = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Services & Pricing</Text>
      {stylist?.services && stylist.services.length > 0 ? (
        stylist.services.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={styles.serviceCard}
            onPress={() => handleBookService(service)}
          >
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>
              <Text style={styles.serviceDuration}>
                Duration: {Math.floor(service.duration / 60)}h {service.duration % 60}m
              </Text>
            </View>
            <View style={styles.servicePrice}>
              <Text style={styles.priceText}>${service.price}</Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cut-outline" size={48} color="#6b7280" />
          <Text style={styles.emptyStateText}>No services available yet</Text>
          <Text style={styles.emptyStateSubtext}>
            This stylist hasn't added their services yet. You can still contact them to discuss your needs.
          </Text>
        </View>
      )}
    </View>
  );

  const renderPortfolio = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Portfolio</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.portfolioContainer}>
          {stylist?.portfolio.map((image, index) => (
            <TouchableOpacity
              key={index}
              style={styles.portfolioImage}
              onPress={() => setCurrentImageIndex(index)}
            >
              <Image source={{ uri: image }} style={styles.portfolioImageStyle} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.actionButton, styles.chatButton]}
        onPress={handleStartChat}
      >
        <Ionicons name="chatbubble-outline" size={20} color="#ffffff" />
        <Text style={styles.actionButtonText}>Message</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.actionButton, styles.bookButton]}
        onPress={() => {
          if (stylist?.services && stylist.services.length > 0) {
            handleBookService(stylist.services[0]);
          } else {
            // If no services, redirect to chat to discuss requirements
            Alert.alert(
              'No Services Listed',
              'This stylist hasn\'t added their services yet. You can message them to discuss your requirements.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Send Message', onPress: handleStartChat }
              ]
            );
          }
        }}
      >
        <Ionicons name="calendar-outline" size={20} color="#ffffff" />
        <Text style={styles.actionButtonText}>Book Now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBookingModal = () => (
    <Modal
      visible={showBookingModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowBookingModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Book {selectedService?.name}</Text>
            <TouchableOpacity
              onPress={() => setShowBookingModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalServiceInfo}>
            <Text style={styles.modalServiceName}>{selectedService?.name}</Text>
            <Text style={styles.modalServicePrice}>${selectedService?.price}</Text>
            <Text style={styles.modalServiceDuration}>
              Duration: {selectedService ? Math.floor(selectedService.duration / 60) : 0}h{' '}
              {selectedService ? selectedService.duration % 60 : 0}m
            </Text>
            <Text style={styles.modalServiceDescription}>
              {selectedService?.description}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.scheduleButton]}
              onPress={handleScheduleBooking}
            >
              <Ionicons name="calendar-outline" size={20} color="#7c3aed" />
              <Text style={styles.scheduleButtonText}>Schedule Later</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.instantButton]}
              onPress={handleInstantBooking}
            >
              <Ionicons name="flash-outline" size={20} color="#ffffff" />
              <Text style={styles.instantButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e63" />
        <Text style={styles.loadingText}>Loading stylist profile...</Text>
      </View>
    );
  }

  if (!stylist || stylistNotFound) {
    return (
      <View style={styles.notFoundContainer}>
        <View style={styles.notFoundContent}>
          <Ionicons name="person-circle-outline" size={80} color="#666" />
          <Text style={styles.notFoundTitle}>Stylist Unavailable</Text>
          <Text style={styles.notFoundMessage}>
            This stylist profile is currently unavailable. {'\n'}
            They may have temporarily deactivated their account or updated their settings.
          </Text>
          <TouchableOpacity
            style={styles.notFoundButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)' as any);
              }
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.notFoundButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStylistInfo()}
        {renderStats()}
        {renderSpecialties()}
        {renderBio()}
        {renderServices()}
        {renderPortfolio()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {renderActionButtons()}
      {renderBookingModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  stylistInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginTop: 100,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  onlineBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  basicInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  rating: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 5,
  },
  distance: {
    fontSize: 14,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    marginTop: 10,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e91e63',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
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
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  specialtyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  bio: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 12,
    color: '#9ca3af',
  },
  servicePrice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e91e63',
    marginRight: 8,
  },
  portfolioContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  portfolioImage: {
    marginRight: 10,
  },
  portfolioImageStyle: {
    width: 150,
    height: 200,
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  chatButton: {
    backgroundColor: '#6b7280',
  },
  bookButton: {
    backgroundColor: '#e91e63',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalServiceInfo: {
    marginBottom: 30,
  },
  modalServiceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  modalServicePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e91e63',
    marginBottom: 5,
  },
  modalServiceDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 10,
  },
  modalServiceDescription: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  scheduleButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#7c3aed',
  },
  scheduleButtonText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  instantButton: {
    backgroundColor: '#e91e63',
  },
  instantButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Not Found Styles
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 30,
  },
  notFoundContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  notFoundTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  notFoundMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  notFoundButton: {
    backgroundColor: '#e91e63',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notFoundButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#e91e63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
});

export default StylistProfileScreen;