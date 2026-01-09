import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

import { 
  LocationCoordinates, 
  StylistSearchResult, 
  SearchFilters,
} from '@/types';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
} from '@/constants';

const { width } = Dimensions.get('window');

interface ProductionSafeSearchProps {
  onStylistSelect?: (stylist: StylistSearchResult) => void;
}

const ProductionSafeSearch: React.FC<ProductionSafeSearchProps> = ({ onStylistSelect }) => {
  // State management with safe defaults
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Default to list for production safety
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [stylists, setStylists] = useState<StylistSearchResult[]>([]);
  const [filteredStylists, setFilteredStylists] = useState<StylistSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    radius: 0, // Default to "All" stylists
    sortBy: 'distance',
  });

  const navigation = useNavigation();
  const router = useRouter();

  // Production-safe location service
  const getCurrentLocation = useCallback(async (): Promise<LocationCoordinates | null> => {
    try {
      console.log('Getting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        // Use default location (Zimbabwe) for demo
        const defaultLocation = { latitude: -17.8292, longitude: 31.0522 };
        setUserLocation(defaultLocation);
        return defaultLocation;
      }

      console.log('Getting current position...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      console.log('Location obtained:', coords);
      setUserLocation(coords);
      setLocationError(null);
      return coords;
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Unable to get location');
      
      // Fallback to default location
      const defaultLocation = { latitude: -17.8292, longitude: 31.0522 };
      setUserLocation(defaultLocation);
      return defaultLocation;
    }
  }, []);

  // Production-safe stylist search
  const searchStylists = useCallback(async (location: LocationCoordinates, searchFilters: SearchFilters) => {
    try {
      setIsLoading(true);
      console.log('Searching stylists with location:', location, 'and filters:', searchFilters);

      // Mock data for production safety - replace with actual API call
      const mockStylists: StylistSearchResult[] = [
        {
          _id: '1',
          userId: '1',
          user: {
            _id: '1',
            role: 'stylist' as const,
            name: 'Sarah Johnson',
            phone: '+263771234567',
            email: 'sarah@example.com',
            location: {
              type: 'Point',
              coordinates: [location.longitude + 0.01, location.latitude + 0.01],
            },
            isVerified: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          portfolio: [],
          schedule: [],
          basePrices: [{ serviceName: 'Hair Cut', basePrice: 25, duration: 60, description: 'Basic haircut' }],
          rating: 4.5,
          reviewCount: 12,
          specialties: ['Natural Hair', 'Protective Styles'],
          bio: 'Professional hair stylist with 5 years experience',
          experience: 5,
          isAvailable: true,
          workingRadius: 10,
          completedBookings: 45,
          distance: 2.3,
          isOnline: true,
        },
        {
          _id: '2',
          userId: '2',
          user: {
            _id: '2',
            role: 'stylist' as const,
            name: 'Michelle Brown',
            phone: '+263777654321',
            email: 'michelle@example.com',
            location: {
              type: 'Point',
              coordinates: [location.longitude - 0.01, location.latitude - 0.01],
            },
            isVerified: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          portfolio: [],
          schedule: [],
          basePrices: [{ serviceName: 'Braids', basePrice: 40, duration: 120, description: 'Professional braiding' }],
          rating: 4.8,
          reviewCount: 8,
          specialties: ['Braids', 'Weaves'],
          bio: 'Expert in braiding and protective styles',
          experience: 3,
          isAvailable: true,
          workingRadius: 15,
          completedBookings: 32,
          distance: 1.8,
          isOnline: true,
        },
      ];

      // Apply radius filter if specified
      let filteredStylists = mockStylists;
      if (searchFilters.radius > 0) {
        filteredStylists = mockStylists.filter(stylist => stylist.distance <= searchFilters.radius);
      }

      setStylists(filteredStylists);
      setFilteredStylists(filteredStylists);
      console.log(`Found ${filteredStylists.length} stylists`);
    } catch (error) {
      console.error('Error searching stylists:', error);
      Alert.alert(
        'Search Error',
        'Unable to search for stylists at the moment. Please try again later.',
        [{ text: 'OK' }]
      );
      setStylists([]);
      setFilteredStylists([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize search on mount
  useFocusEffect(
    useCallback(() => {
      const initializeSearch = async () => {
        try {
          console.log('Initializing search...');
          const location = await getCurrentLocation();
          if (location) {
            await searchStylists(location, filters);
          }
        } catch (error) {
          console.error('Error initializing search:', error);
        }
      };

      initializeSearch();
    }, [getCurrentLocation, searchStylists, filters])
  );

  // Filter stylists based on search query
  const filterStylists = useCallback((query: string, stylistList: StylistSearchResult[]) => {
    if (!query.trim() || !Array.isArray(stylistList)) {
      return Array.isArray(stylistList) ? stylistList : [];
    }

    const lowercaseQuery = query.toLowerCase();
    return stylistList.filter(stylist => {
      try {
        const name = stylist?.user?.name?.toLowerCase() || '';
        const bio = stylist?.bio?.toLowerCase() || '';
        const specialties = Array.isArray(stylist?.specialties) 
          ? stylist.specialties.join(' ').toLowerCase() 
          : '';
        
        return name.includes(lowercaseQuery) || 
               bio.includes(lowercaseQuery) || 
               specialties.includes(lowercaseQuery);
      } catch (filterError) {
        console.warn('Error filtering stylist:', filterError);
        return false;
      }
    });
  }, []);

  // Apply search query filter
  useEffect(() => {
    const filtered = filterStylists(searchQuery, stylists);
    setFilteredStylists(filtered);
  }, [searchQuery, stylists, filterStylists]);

  // Sort stylists
  const sortedStylists = useMemo(() => {
    const sorted = [...filteredStylists];
    
    switch (filters.sortBy) {
      case 'distance':
        return sorted.sort((a, b) => a.distance - b.distance);
      case 'rating':
        return sorted.sort((a, b) => {
          const aRating = typeof a.rating === 'number' ? a.rating : 0;
          const bRating = typeof b.rating === 'number' ? b.rating : 0;
          return bRating - aRating;
        });
      case 'price':
        return sorted.sort((a, b) => {
          const aPrice = a.basePrices?.[0]?.basePrice || 0;
          const bPrice = b.basePrices?.[0]?.basePrice || 0;
          return aPrice - bPrice;
        });
      default:
        return sorted;
    }
  }, [filteredStylists, filters.sortBy]);

  const handleRefresh = async () => {
    if (userLocation) {
      setIsRefreshing(true);
      await searchStylists(userLocation, filters);
      setIsRefreshing(false);
    }
  };

  const handleStylistSelect = (stylist: StylistSearchResult) => {
    try {
      if (onStylistSelect) {
        onStylistSelect(stylist);
      } else {
        router.push({
          pathname: '/stylist-profile',
          params: { stylistId: stylist._id },
        });
      }
    } catch (error) {
      console.error('Error selecting stylist:', error);
    }
  };

  const renderStylistCard = (stylist: StylistSearchResult) => (
    <TouchableOpacity
      key={stylist._id}
      style={styles.stylistCard}
      onPress={() => handleStylistSelect(stylist)}
    >
      <View style={styles.stylistHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {stylist.user?.name?.substring(0, 2).toUpperCase() || 'ST'}
          </Text>
        </View>
        <View style={styles.stylistInfo}>
          <Text style={styles.stylistName}>{stylist.user?.name || 'Hair Stylist'}</Text>
          <Text style={styles.stylistSpecialties}>
            {Array.isArray(stylist.specialties) ? stylist.specialties.join(', ') : 'Hair Services'}
          </Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color={COLORS.WARNING} />
            <Text style={styles.rating}>
              {typeof stylist.rating === 'number' ? stylist.rating.toFixed(1) : '0.0'}
            </Text>
            <Text style={styles.reviewCount}>({stylist.reviewCount || 0} reviews)</Text>
          </View>
        </View>
      </View>
      <View style={styles.stylistFooter}>
        <Text style={styles.distance}>{stylist.distance.toFixed(1)}km away</Text>
        <Text style={styles.price}>
          From ${stylist.basePrices?.[0]?.basePrice || 25}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Stylists</Text>
        {locationError && (
          <Text style={styles.locationError}>{locationError}</Text>
        )}
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.GRAY_400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stylists, services..."
            placeholderTextColor={COLORS.GRAY_400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.GRAY_400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
      >
        {/* Results Summary */}
        <View style={styles.resultsSummary}>
          <Text style={styles.resultsSummaryText}>
            {sortedStylists.length} stylist{sortedStylists.length !== 1 ? 's' : ''} found
            {filters.radius > 0 ? ` within ${filters.radius}km` : ''}
          </Text>
        </View>

        {sortedStylists.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={COLORS.GRAY_300} />
            <Text style={styles.emptyStateTitle}>No Stylists Found</Text>
            <Text style={styles.emptyStateText}>
              {locationError 
                ? 'Unable to get your location. Please check location permissions.'
                : 'Try refreshing or check your internet connection.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleRefresh}
            >
              <Text style={styles.emptyStateButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stylistsList}>
            {sortedStylists.map(renderStylistCard)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  title: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  locationError: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.ERROR,
    textAlign: 'center',
    marginTop: SPACING.XS,
  },
  searchContainer: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  listContainer: {
    flex: 1,
  },
  resultsSummary: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  resultsSummaryText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  stylistsList: {
    padding: SPACING.MD,
  },
  stylistCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stylistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.MD,
  },
  avatarText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
  },
  stylistInfo: {
    flex: 1,
  },
  stylistName: {
    fontSize: FONT_SIZES.MD,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  stylistSpecialties: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.XS,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.XS,
    marginRight: SPACING.SM,
  },
  reviewCount: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  stylistFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distance: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  price: {
    fontSize: FONT_SIZES.SM,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
    marginTop: SPACING.XXL,
  },
  emptyStateTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.XL,
  },
  emptyStateButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
  },
  emptyStateButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  },
});

export default ProductionSafeSearch;