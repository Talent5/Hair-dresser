import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

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
import Header from '@/components/Header';
import StylistCard from '@/components/StylistCard';
import SearchFiltersModal from '@/components/SearchFiltersModal';
import ProductionSafeMap from '@/components/ProductionSafeMap';
import apiService from '@/services/api';

export default function SearchScreen() {
  const router = useRouter();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [stylists, setStylists] = useState<StylistSearchResult[]>([]);
  const [filteredStylists, setFilteredStylists] = useState<StylistSearchResult[]>([]);
  const [favoriteStylists, setFavoriteStylists] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedStylist, setSelectedStylist] = useState<StylistSearchResult | null>(null);
  
  const [filters, setFilters] = useState<SearchFilters>({
    radius: 10, // Default 10km radius
    sortBy: 'distance',
  });

  // Get user's current location
  const getCurrentLocation = useCallback(async (): Promise<LocationCoordinates | null> => {
    try {
      console.log('Getting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setLocationError('Location permission denied. Using default location.');
        // Use default location (Harare, Zimbabwe)
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
      setLocationError('Unable to get location. Using default location.');
      
      // Fallback to default location
      const defaultLocation = { latitude: -17.8292, longitude: 31.0522 };
      setUserLocation(defaultLocation);
      return defaultLocation;
    }
  }, []);

  // Search for stylists
  const searchStylists = useCallback(async (location: LocationCoordinates, searchFilters: SearchFilters) => {
    try {
      setIsLoading(true);
      console.log('Searching stylists with location:', location, 'and filters:', searchFilters);

      const response = await apiService.searchStylists(location, searchFilters);
      
      if (response.success && response.data) {
        const stylistResults = response.data.stylists || [];
        setStylists(stylistResults);
        setFilteredStylists(stylistResults);
        setHasSearched(true);
        console.log(`Found ${stylistResults.length} stylists`);
      } else {
        throw new Error(response.message || 'Failed to search stylists');
      }
    } catch (error) {
      console.error('Error searching stylists:', error);
      
      // For demo purposes, use mock data if API fails
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
          basePrices: [
            { serviceName: 'Hair Cut', basePrice: 25, duration: 60, description: 'Basic haircut' },
            { serviceName: 'Hair Styling', basePrice: 35, duration: 90, description: 'Professional styling' }
          ],
          rating: 4.5,
          reviewCount: 12,
          specialties: ['Natural Hair', 'Protective Styles'],
          bio: 'Professional hair stylist with 5 years experience specializing in natural hair care.',
          experience: 5,
          isAvailable: true,
          workingRadius: 10,
          completedBookings: 45,
          distance: 2.3,
          isOnline: true,
          nextAvailableSlot: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
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
          basePrices: [
            { serviceName: 'Braids', basePrice: 40, duration: 120, description: 'Professional braiding' },
            { serviceName: 'Weaves', basePrice: 60, duration: 180, description: 'Hair weaving services' }
          ],
          rating: 4.8,
          reviewCount: 8,
          specialties: ['Braids', 'Weaves', 'Extensions'],
          bio: 'Expert in braiding and protective styles with a passion for creative designs.',
          experience: 3,
          isAvailable: true,
          workingRadius: 15,
          completedBookings: 32,
          distance: 1.8,
          isOnline: true,
        },
        {
          _id: '3',
          userId: '3',
          user: {
            _id: '3',
            role: 'stylist' as const,
            name: 'Lisa Davis',
            phone: '+263778901234',
            email: 'lisa@example.com',
            location: {
              type: 'Point',
              coordinates: [location.longitude + 0.005, location.latitude - 0.005],
            },
            isVerified: true,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          portfolio: [],
          schedule: [],
          basePrices: [
            { serviceName: 'Color Treatment', basePrice: 50, duration: 150, description: 'Hair coloring services' },
            { serviceName: 'Relaxer', basePrice: 30, duration: 120, description: 'Hair relaxing treatment' }
          ],
          rating: 4.6,
          reviewCount: 15,
          specialties: ['Color', 'Relaxers', 'Treatments'],
          bio: 'Color specialist with expertise in all hair textures and advanced treatments.',
          experience: 7,
          isAvailable: false,
          workingRadius: 8,
          completedBookings: 78,
          distance: 3.1,
          isOnline: false,
          nextAvailableSlot: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        },
      ];

      // Apply radius filter if specified
      let filteredStylists = mockStylists;
      if (searchFilters.radius > 0) {
        filteredStylists = mockStylists.filter(stylist => stylist.distance <= searchFilters.radius);
      }

      setStylists(filteredStylists);
      setFilteredStylists(filteredStylists);
      setHasSearched(true);
      console.log(`Using mock data: ${filteredStylists.length} stylists`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize location and search on mount
  useEffect(() => {
    const initializeSearch = async () => {
      const location = await getCurrentLocation();
      if (location) {
        await searchStylists(location, filters);
      }
    };

    initializeSearch();
  }, [getCurrentLocation, searchStylists, filters]);

  // Filter stylists based on search query
  const filterStylists = useCallback((query: string, stylistList: StylistSearchResult[]) => {
    if (!query.trim()) {
      return stylistList;
    }

    const lowercaseQuery = query.toLowerCase();
    return stylistList.filter(stylist => {
      const name = stylist?.user?.name?.toLowerCase() || '';
      const bio = stylist?.bio?.toLowerCase() || '';
      const specialties = stylist?.specialties?.join(' ').toLowerCase() || '';
      
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

  // Sort stylists based on current sort option
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
      case 'reviews':
        return sorted.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      default:
        return sorted;
    }
  }, [filteredStylists, filters.sortBy]);

  // Load favorites
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await apiService.getFavorites();
        if (response.success && response.data) {
          const favoriteIds = new Set(response.data.map((fav: any) => fav.stylistId));
          setFavoriteStylists(favoriteIds);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    };

    loadFavorites();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    if (userLocation) {
      setIsRefreshing(true);
      await searchStylists(userLocation, filters);
      setIsRefreshing(false);
    }
  };

  // Handle filter changes
  const handleFiltersApply = async (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
    
    if (userLocation) {
      await searchStylists(userLocation, newFilters);
    }
  };

  // Handle stylist selection
  const handleStylistPress = (stylist: StylistSearchResult) => {
    setSelectedStylist(stylist);
    router.push({
      pathname: '/stylist-profile',
      params: { stylistId: stylist._id },
    });
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (stylistId: string, isFavorite: boolean) => {
    const newFavorites = new Set(favoriteStylists);
    if (isFavorite) {
      newFavorites.add(stylistId);
    } else {
      newFavorites.delete(stylistId);
    }
    setFavoriteStylists(newFavorites);
  };

  // Handle view mode toggle
  const toggleViewMode = () => {
    setViewMode(prevMode => prevMode === 'list' ? 'map' : 'list');
  };

  // Handle map stylist selection
  const handleMapStylistSelect = (stylist: StylistSearchResult) => {
    setSelectedStylist(stylist);
    // Optional: You could show a bottom sheet or navigate to profile
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Find Stylists" />
      
      {/* Search and Filter Bar */}
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
        
        <TouchableOpacity
          style={[styles.filterButton, { marginRight: SPACING.SM }]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewToggleButton, viewMode === 'map' && styles.activeViewToggle]}
          onPress={toggleViewMode}
        >
          <Ionicons 
            name={viewMode === 'list' ? 'map-outline' : 'list-outline'} 
            size={20} 
            color={viewMode === 'map' ? COLORS.WHITE : COLORS.PRIMARY} 
          />
        </TouchableOpacity>
      </View>

      {/* Location Status */}
      {locationError && (
        <View style={styles.locationErrorContainer}>
          <Ionicons name="location-outline" size={16} color={COLORS.WARNING} />
          <Text style={styles.locationErrorText}>{locationError}</Text>
        </View>
      )}

      {/* Results Summary */}
      {hasSearched && (
        <View style={styles.resultsSummary}>
          <View style={styles.resultsSummaryTop}>
            <Text style={styles.resultsSummaryText}>
              {sortedStylists.length} stylist{sortedStylists.length !== 1 ? 's' : ''} found
              {filters.radius > 0 ? ` within ${filters.radius}km` : ''}
              {searchQuery ? ` for "${searchQuery}"` : ''}
            </Text>
            <View style={styles.viewModeIndicator}>
              <Ionicons 
                name={viewMode === 'map' ? 'map' : 'list'} 
                size={16} 
                color={COLORS.PRIMARY} 
              />
              <Text style={styles.viewModeText}>
                {viewMode === 'map' ? 'Map View' : 'List View'}
              </Text>
            </View>
          </View>
          <Text style={styles.sortByText}>
            Sorted by {filters.sortBy}
          </Text>
        </View>
      )}

      {/* Loading State */}
      {isLoading && !isRefreshing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Searching for stylists...</Text>
        </View>
      )}

      {/* Main Content - List or Map View */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <ProductionSafeMap
            stylists={sortedStylists}
            userLocation={userLocation}
            onStylistSelect={handleMapStylistSelect}
            selectedStylist={selectedStylist}
            isLoading={isLoading}
            searchRadius={filters.radius}
          />
          
          {/* Selected Stylist Card - Overlay on Map */}
          {selectedStylist && (
            <View style={styles.selectedStylistCard}>
              <View style={styles.selectedStylistHeader}>
                <View style={styles.selectedStylistInfo}>
                  <Text style={styles.selectedStylistName} numberOfLines={1}>
                    {selectedStylist.user?.name || 'Hair Stylist'}
                  </Text>
                  <View style={styles.selectedStylistMeta}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.selectedStylistRating}>
                      {typeof selectedStylist.rating === 'number' 
                        ? selectedStylist.rating.toFixed(1) 
                        : (selectedStylist.rating?.average || 0).toFixed(1)}
                    </Text>
                    <Text style={styles.selectedStylistDistance}>
                      • {selectedStylist.distance?.toFixed(1)}km away
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeStylistCard}
                  onPress={() => setSelectedStylist(null)}
                >
                  <Ionicons name="close" size={20} color={COLORS.GRAY_500} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.selectedStylistSpecialties} numberOfLines={1}>
                {selectedStylist.specialties?.join(', ') || 'Hair Styling Services'}
              </Text>
              
              <View style={styles.selectedStylistActions}>
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={() => handleStylistPress(selectedStylist)}
                >
                  <Text style={styles.viewProfileButtonText}>View Profile</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.favoriteButton}
                  onPress={() => handleFavoriteToggle(
                    selectedStylist._id, 
                    !favoriteStylists.has(selectedStylist._id)
                  )}
                >
                  <Ionicons 
                    name={favoriteStylists.has(selectedStylist._id) ? "heart" : "heart-outline"} 
                    size={20} 
                    color={favoriteStylists.has(selectedStylist._id) ? COLORS.ERROR : COLORS.GRAY_500} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : (
        /* Results List */
        <ScrollView
          style={styles.resultsList}
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
          {hasSearched && !isLoading && sortedStylists.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={64} color={COLORS.GRAY_300} />
              <Text style={styles.emptyStateTitle}>No Stylists Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery 
                  ? `No stylists found matching "${searchQuery}". Try adjusting your search or filters.`
                  : 'No stylists found in your area. Try expanding your search radius or refreshing.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={handleRefresh}
              >
                <Text style={styles.emptyStateButtonText}>Refresh Search</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.stylistsList}>
              {sortedStylists.map((stylist) => (
                <StylistCard
                  key={stylist._id}
                  stylist={stylist}
                  onPress={() => handleStylistPress(stylist)}
                  showDistance={true}
                  isFavorite={favoriteStylists.has(stylist._id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Filters Modal */}
      <SearchFiltersModal
        visible={showFilters}
        filters={filters}
        onApply={handleFiltersApply}
        onClose={() => setShowFilters(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.MD,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    marginLeft: SPACING.SM,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewToggleButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.LG,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeViewToggle: {
    backgroundColor: COLORS.PRIMARY,
  },
  locationErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  locationErrorText: {
    fontSize: FONT_SIZES.SM,
    color: '#92400E',
    marginLeft: SPACING.SM,
    flex: 1,
  },
  resultsSummary: {
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  resultsSummaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  resultsSummaryText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '600',
    flex: 1,
  },
  viewModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_100,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
  },
  viewModeText: {
    fontSize: FONT_SIZES.XS,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: SPACING.XS,
  },
  sortByText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.XS,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },
  loadingText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    marginTop: SPACING.MD,
  },
  resultsList: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
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
  // Selected Stylist Card Styles (for map view)
  selectedStylistCard: {
    position: 'absolute',
    bottom: SPACING.LG,
    left: SPACING.MD,
    right: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    elevation: 8,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  selectedStylistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  selectedStylistInfo: {
    flex: 1,
  },
  selectedStylistName: {
    fontSize: FONT_SIZES.LG,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.XS,
  },
  selectedStylistMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedStylistRating: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  selectedStylistDistance: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  closeStylistCard: {
    padding: SPACING.XS,
  },
  selectedStylistSpecialties: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: SPACING.MD,
  },
  selectedStylistActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewProfileButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginRight: SPACING.SM,
  },
  viewProfileButtonText: {
    color: COLORS.WHITE,
    fontSize: FONT_SIZES.SM,
    fontWeight: '600',
    textAlign: 'center',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.GRAY_100,
    borderRadius: BORDER_RADIUS.MD,
    justifyContent: 'center',
    alignItems: 'center',
  },
});