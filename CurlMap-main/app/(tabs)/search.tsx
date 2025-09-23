import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { 
  LocationCoordinates, 
  StylistSearchResult, 
  SearchFilters,
  User,
  Stylist 
} from '@/types';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  SERVICE_TYPES,
  BOOKING_CONFIG,
} from '@/constants';
import Header from '@/components/Header';
import ProductionSafeMap from '@/components/ProductionSafeMap';
import StylistCard from '@/components/StylistCard';
import SearchFiltersModal from '@/components/SearchFiltersModal';
import SearchErrorBoundary from '@/components/SearchErrorBoundary';
import { LocationService } from '@/utils/location';
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');

interface SearchScreenProps {
  route?: {
    params?: {
      filters?: SearchFilters;
      location?: LocationCoordinates;
    };
  };
}

const SearchScreen: React.FC<SearchScreenProps> = ({ route }) => {
  // State management
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [stylists, setStylists] = useState<StylistSearchResult[]>([]);
  const [filteredStylists, setFilteredStylists] = useState<StylistSearchResult[]>([]);
  const [selectedStylist, setSelectedStylist] = useState<StylistSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    radius: 0, // Default to "All" stylists instead of limited radius
    sortBy: 'distance',
    ...route?.params?.filters,
  });

  const navigation = useNavigation();
  const router = useRouter();
  const locationService = LocationService.getInstance();

  // Initialize location and search
  useFocusEffect(
    useCallback(() => {
      initializeSearch();
    }, [])
  );

  const initializeSearch = async () => {
    try {
      setIsLoading(true);
      
      // Get user location
      let location = route?.params?.location;
      if (!location) {
        const currentLocation = await getCurrentLocation();
        if (currentLocation) {
          location = currentLocation;
        }
      }
      
      if (location) {
        setUserLocation(location);
        await searchStylists(location, filters);
      }
    } catch (error) {
      console.error('Error initializing search:', error);
      Alert.alert('Error', 'Failed to load your location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
    try {
      const location = await locationService.getCurrentLocation();
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Required',
        'We need your location to find nearby stylists. Please enable location access.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: getCurrentLocation },
        ]
      );
      return null;
    }
  };

  const searchStylists = async (location: LocationCoordinates, searchFilters: SearchFilters) => {
    try {
      setIsLoading(true);
      
      // Use real API to search stylists
      const response = await apiService.searchStylists(location, searchFilters);
      console.log('Search response:', response);
      
      if (response.success && response.data && response.data.stylists) {
        const stylistsData = response.data.stylists;
        const stylistsWithDistance = stylistsData.map((stylist: any) => ({
          ...stylist,
          distance: stylist.distance || LocationService.calculateDistance(location, {
            latitude: stylist.user?.location?.coordinates?.[1] || 0,
            longitude: stylist.user?.location?.coordinates?.[0] || 0,
          }),
        }));
        setStylists(stylistsWithDistance);
        setFilteredStylists(stylistsWithDistance);
        console.log(`Found ${stylistsWithDistance.length} stylists from database`);
      } else {
        console.log('No stylists found in database or invalid response structure');
        console.log('Response data:', response.data);
        setStylists([]);
        setFilteredStylists([]);
      }
    } catch (error) {
      console.error('Error searching stylists:', error);
      Alert.alert('Error', 'Failed to search for stylists. Please check your connection.');
      setStylists([]);
      setFilteredStylists([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter stylists based on search query
  const filterStylists = useCallback((query: string, stylistList: StylistSearchResult[]) => {
    if (!query.trim()) {
      return stylistList;
    }

    const lowercaseQuery = query.toLowerCase();
    return stylistList.filter(stylist => {
      const name = stylist.user?.name?.toLowerCase() || '';
      const bio = stylist.bio?.toLowerCase() || '';
      const specialties = stylist.specialties?.join(' ').toLowerCase() || '';
      
      return name.includes(lowercaseQuery) || 
             bio.includes(lowercaseQuery) || 
             specialties.includes(lowercaseQuery);
    });
  }, []);

  // Apply search query filter
  useEffect(() => {
    const filtered = filterStylists(searchQuery, stylists);
    setFilteredStylists(filtered);
  }, [searchQuery, stylists, filterStylists]);

  // Sort stylists based on filters
  const sortedStylists = useMemo(() => {
    const sorted = [...filteredStylists];
    
    switch (filters.sortBy) {
      case 'distance':
        return sorted.sort((a, b) => a.distance - b.distance);
      case 'rating':
        return sorted.sort((a, b) => {
          const getRating = (rating: any) => {
            if (typeof rating === 'object' && rating && 'average' in rating) {
              return rating.average || 0;
            }
            return rating || 0;
          };
          return getRating(b.rating) - getRating(a.rating);
        });
      case 'price':
        return sorted.sort((a, b) => {
          const aPrice = a.basePrices?.[0]?.basePrice || 0;
          const bPrice = b.basePrices?.[0]?.basePrice || 0;
          return aPrice - bPrice;
        });
      case 'reviews':
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
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

  const handleFiltersApply = async (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    
    if (userLocation) {
      await searchStylists(userLocation, newFilters);
    }
  };

  const handleStylistSelect = (stylist: StylistSearchResult) => {
    setSelectedStylist(stylist);
    
    // Navigate to stylist profile
    router.push({
      pathname: '/stylist-profile',
      params: { stylistId: stylist._id },
    });
  };

  const renderSearchHeader = () => (
    <View style={styles.searchHeader}>
      {/* Search Input */}
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

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Filters Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.filtersButton]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color={COLORS.WHITE} />
          <Text style={styles.actionButtonText}>Filters</Text>
        </TouchableOpacity>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'map' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons 
              name="map" 
              size={16} 
              color={viewMode === 'map' ? COLORS.WHITE : COLORS.PRIMARY} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewMode === 'list' && styles.viewToggleButtonActive,
            ]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={viewMode === 'list' ? COLORS.WHITE : COLORS.PRIMARY} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderMapView = () => {
    try {
      // Validate that we have the necessary data before rendering the map
      const mapProps = {
        stylists: sortedStylists || [],
        userLocation: userLocation,
        onStylistSelect: handleStylistSelect,
        selectedStylist: selectedStylist,
        isLoading: isLoading,
        searchRadius: filters.radius || 0,
      };

      return (
        <ProductionSafeMap {...mapProps} />
      );
    } catch (error) {
      console.error('Map rendering error:', error);
      // Fallback to list view if map fails
      return (
        <View style={styles.mapErrorContainer}>
          <Ionicons name="map-outline" size={64} color={COLORS.GRAY_400} />
          <Text style={styles.mapErrorTitle}>Map Unavailable</Text>
          <Text style={styles.mapErrorText}>
            Unable to load Google Maps. Please check your API key configuration.
          </Text>
          {renderListView()}
        </View>
      );
    }
  };

  const renderListView = () => (
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
      {sortedStylists.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={64} color={COLORS.GRAY_300} />
          <Text style={styles.emptyStateTitle}>No Stylists Found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your filters or search in a different area.
          </Text>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.emptyStateButtonText}>Adjust Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.stylistsList}>
          {sortedStylists.map((stylist, index) => (
            <StylistCard
              key={`${stylist._id}-${index}`}
              stylist={stylist}
              onPress={() => handleStylistSelect(stylist)}
              showDistance={true}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <SearchErrorBoundary fallbackMessage="There was an issue loading the stylist search. This might be due to location permissions or Google Maps configuration.">
      <View style={styles.container}>
        <Header title="Find Stylists" />
        {renderSearchHeader()}
        
        <View style={styles.content}>
          {viewMode === 'map' ? renderMapView() : renderListView()}
        </View>

        {/* Search Filters Modal */}
        <SearchFiltersModal
          visible={showFilters}
          filters={filters}
          onApply={handleFiltersApply}
          onClose={() => setShowFilters(false)}
        />

        {/* Results Summary */}
        {!isLoading && (
          <View style={styles.resultsSummary}>
            <Text style={styles.resultsSummaryText}>
              {sortedStylists.length} stylists found
              {userLocation && filters.radius > 0 && ` within ${filters.radius}km`}
              {userLocation && filters.radius === 0 && ` (all stylists)`}
            </Text>
          </View>
        )}
      </View>
    </SearchErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  searchHeader: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginBottom: SPACING.SM,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
  },
  filtersButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    marginLeft: SPACING.XS,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    padding: 2,
  },
  viewToggleButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    minWidth: 44,
    alignItems: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  stylistsList: {
    padding: SPACING.MD,
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
  resultsSummary: {
    position: 'absolute',
    bottom: SPACING.MD,
    left: SPACING.MD,
    right: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsSummaryText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  mapErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
    backgroundColor: COLORS.BACKGROUND,
  },
  mapErrorTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  mapErrorText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
});

export default SearchScreen;