import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Enhanced map component with better error handling
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;

// Safer import with better error handling
const loadMapComponents = () => {
  if (Platform.OS === 'web') {
    return false;
  }
  
  try {
    const maps = require('react-native-maps');
    MapView = maps.default || maps.MapView;
    Marker = maps.Marker;
    Circle = maps.Circle;
    return !!(MapView && Marker && Circle);
  } catch (error) {
    console.warn('react-native-maps failed to load:', error);
    return false;
  }
};

import { 
  LocationCoordinates, 
  StylistSearchResult,
  SearchFilters 
} from '../types';
import { 
  COLORS, 
  SPACING, 
  MAP_CONFIG, 
  BORDER_RADIUS,
  BOOKING_CONFIG 
} from '../constants';
import { LocationService } from '../utils/location';

// Define types locally to avoid importing from react-native-maps
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface StylistMapProps {
  stylists: StylistSearchResult[];
  userLocation: LocationCoordinates | null;
  onStylistSelect: (stylist: StylistSearchResult) => void;
  selectedStylist?: StylistSearchResult | null;
  isLoading?: boolean;
  searchRadius?: number;
  onRegionChange?: (region: Region) => void;
}

// Fallback component for when maps are not available
const MapFallback: React.FC<StylistMapProps> = ({
  stylists,
  userLocation,
  isLoading,
  onStylistSelect,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.fallbackContainer}>
        <Ionicons name="map-outline" size={64} color={COLORS.GRAY_400} />
        <Text style={styles.fallbackTitle}>Map Unavailable</Text>
        <Text style={styles.fallbackText}>
          Map functionality is temporarily unavailable.{'\n'}
          Please switch to list view to browse stylists.
        </Text>
        
        {userLocation && (
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color={COLORS.PRIMARY} />
            <Text style={styles.locationText}>
              Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}
        
        {stylists.length > 0 && (
          <View style={styles.stylistsInfo}>
            <Text style={styles.stylistsCount}>
              {stylists.length} stylist{stylists.length !== 1 ? 's' : ''} found nearby
            </Text>
          </View>
        )}
      </View>
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Searching for stylists...</Text>
        </View>
      )}
    </View>
  );
};

// Enhanced native map component with comprehensive error handling
const SafeMapComponent: React.FC<StylistMapProps> = ({
  stylists,
  userLocation,
  onStylistSelect,
  selectedStylist,
  isLoading = false,
  searchRadius = BOOKING_CONFIG.SEARCH_RADIUS_KM,
  onRegionChange,
}) => {
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (userLocation && isMapReady && !mapError) {
      updateMapRegion(userLocation);
    }
  }, [userLocation, isMapReady, mapError]);

  const initializeMap = async () => {
    try {
      await checkLocationPermission();
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map');
    }
  };

  const updateMapRegion = (location: LocationCoordinates) => {
    try {
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newRegion);
      
      // Safely animate to region
      if (mapRef.current && mapRef.current.animateToRegion) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error updating map region:', error);
    }
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status === 'granted' ? 'granted' : 'denied');
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationPermission('denied');
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted' ? 'granted' : 'denied');
      
      if (status === 'granted') {
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location access in settings to find nearby stylists.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const locationService = LocationService.getInstance();
      if (!locationService) {
        console.error('LocationService not available');
        return;
      }
      
      const location = await locationService.getCurrentLocation();
      
      if (location) {
        updateMapRegion(location);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    }
  };

  const handleMapReady = () => {
    console.log('Map is ready');
    setIsMapReady(true);
    setMapError(null);
  };

  const handleMapError = (error: any) => {
    console.error('Map error:', error);
    setMapError('Map failed to load');
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    try {
      setRegion(newRegion);
      onRegionChange?.(newRegion);
    } catch (error) {
      console.error('Error handling region change:', error);
    }
  };

  const renderStylistMarker = (stylist: StylistSearchResult, index: number) => {
    try {
      // Validate stylist data
      if (!stylist || !stylist._id || !stylist.user?.location?.coordinates) {
        console.warn('Invalid stylist data for marker:', stylist);
        return null;
      }

      const coordinates = {
        latitude: stylist.user.location.coordinates[1],
        longitude: stylist.user.location.coordinates[0],
      };

      // Validate coordinates are valid numbers
      if (isNaN(coordinates.latitude) || isNaN(coordinates.longitude) || 
          coordinates.latitude === 0 || coordinates.longitude === 0) {
        console.warn('Invalid coordinates for stylist:', stylist._id, coordinates);
        return null;
      }

      const isSelected = selectedStylist?._id === stylist._id;
      
      return (
        <Marker
          key={`stylist-${stylist._id}-${index}`}
          coordinate={coordinates}
          onPress={() => {
            try {
              onStylistSelect(stylist);
            } catch (error) {
              console.error('Error selecting stylist:', error);
            }
          }}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={[
            styles.markerContainer,
            isSelected && styles.selectedMarkerContainer
          ]}>
            <View style={[
              styles.marker,
              isSelected && styles.selectedMarker
            ]}>
              <Ionicons
                name="cut"
                size={16}
                color={isSelected ? COLORS.WHITE : COLORS.PRIMARY}
              />
            </View>
            <View style={[
              styles.markerTriangle,
              isSelected && styles.selectedMarkerTriangle
            ]} />
          </View>
          
          {isSelected && (
            <View style={styles.markerInfoContainer}>
              <Text style={styles.markerInfoText} numberOfLines={1}>
                {stylist.user?.name || 'Stylist'}
              </Text>
              <Text style={styles.markerInfoSubText}>
                ⭐ {typeof stylist.rating === 'number' ? stylist.rating.toFixed(1) : (stylist.rating?.average || 0).toFixed(1)} • {LocationService.formatDistance(stylist.distance)}
              </Text>
            </View>
          )}
        </Marker>
      );
    } catch (error) {
      console.error('Error rendering stylist marker:', error);
      return null;
    }
  };

  const renderUserLocationMarker = () => {
    if (!userLocation) return null;

    try {
      return (
        <Marker
          coordinate={userLocation}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.userMarker}>
            <View style={styles.userMarkerInner} />
          </View>
        </Marker>
      );
    } catch (error) {
      console.error('Error rendering user marker:', error);
      return null;
    }
  };

  const renderSearchRadius = () => {
    if (!userLocation || !Circle) return null;

    try {
      return (
        <Circle
          center={userLocation}
          radius={searchRadius * 1000} // Convert km to meters
          strokeColor={COLORS.PRIMARY}
          strokeWidth={2}
          fillColor={`${COLORS.PRIMARY}20`}
        />
      );
    } catch (error) {
      console.error('Error rendering search radius:', error);
      return null;
    }
  };

  // Show fallback if there's an error or permission is denied
  if (mapError || locationPermission === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons 
          name={mapError ? "warning-outline" : "location-outline"} 
          size={64} 
          color={COLORS.GRAY_400} 
        />
        <Text style={styles.permissionTitle}>
          {mapError ? 'Map Error' : 'Location Access Required'}
        </Text>
        <Text style={styles.permissionText}>
          {mapError ? 
            'There was an issue loading the map. Please try refreshing.' :
            'To find nearby hair stylists, we need access to your location.'
          }
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={mapError ? () => setMapError(null) : requestLocationPermission}
        >
          <Text style={styles.permissionButtonText}>
            {mapError ? 'Retry' : 'Enable Location'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  try {
    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={undefined} // Explicitly set to undefined for default provider
          initialRegion={region || {
            latitude: -17.8292, // Harare, Zimbabwe default
            longitude: 31.0522,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          }}
          onMapReady={handleMapReady}
          onError={handleMapError}
          onRegionChangeComplete={handleRegionChangeComplete}
          showsUserLocation={false} // We'll use custom marker
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          loadingEnabled={true}
          loadingIndicatorColor={COLORS.PRIMARY}
          loadingBackgroundColor={COLORS.WHITE}
          mapType="standard"
          zoomEnabled={true}
          scrollEnabled={true}
          pitchEnabled={false}
          rotateEnabled={false}
        >
          {renderUserLocationMarker()}
          {renderSearchRadius()}
          {stylists.filter(stylist => 
            stylist.user?.location?.coordinates?.[0] && 
            stylist.user?.location?.coordinates?.[1]
          ).map(renderStylistMarker)}
        </MapView>

        {/* Loading overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>Searching for stylists...</Text>
          </View>
        )}

        {/* My Location Button */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={getCurrentLocation}
          activeOpacity={0.7}
        >
          <Ionicons name="locate" size={24} color={COLORS.PRIMARY} />
        </TouchableOpacity>

        {/* Results count */}
        {stylists.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {stylists.length} stylist{stylists.length !== 1 ? 's' : ''} found nearby
            </Text>
          </View>
        )}
      </View>
    );
  } catch (error) {
    console.error('Error rendering map:', error);
    return (
      <MapFallback 
        stylists={stylists}
        userLocation={userLocation}
        onStylistSelect={onStylistSelect}
        selectedStylist={selectedStylist}
        isLoading={isLoading}
        searchRadius={searchRadius}
        onRegionChange={onRegionChange}
      />
    );
  }
};

// Main component with enhanced error handling
const ProductionSafeMap: React.FC<StylistMapProps> = (props) => {
  const [mapComponentsLoaded, setMapComponentsLoaded] = useState<boolean | null>(null);

  useEffect(() => {
    const loaded = loadMapComponents();
    setMapComponentsLoaded(loaded);
  }, []);

  // Show loading while checking map components
  if (mapComponentsLoaded === null) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      </View>
    );
  }

  // Return fallback for web platform or if map components failed to load
  if (Platform.OS === 'web' || !mapComponentsLoaded) {
    return <MapFallback {...props} />;
  }
  
  // Return safe map component for mobile platforms
  return <SafeMapComponent {...props} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
    backgroundColor: COLORS.GRAY_100,
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  fallbackText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.LG,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
    backgroundColor: COLORS.BACKGROUND,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XL,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
  },
  permissionButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  markerContainer: {
    alignItems: 'center',
  },
  selectedMarkerContainer: {
    zIndex: 1000,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.WHITE,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedMarker: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.WHITE,
    transform: [{ scale: 1.2 }],
  },
  markerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.PRIMARY,
    marginTop: -1,
  },
  selectedMarkerTriangle: {
    borderTopColor: COLORS.PRIMARY,
  },
  markerInfoContainer: {
    position: 'absolute',
    top: -60,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
    alignItems: 'center',
  },
  markerInfoText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  markerInfoSubText: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.WHITE,
    borderWidth: 3,
    borderColor: COLORS.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.ACCENT,
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
    zIndex: 1000,
  },
  loadingText: {
    marginTop: SPACING.MD,
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: SPACING.XL + 60, // Above results container
    right: SPACING.MD,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resultsContainer: {
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
  resultsText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    marginBottom: SPACING.MD,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.XS,
  },
  stylistsInfo: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
  },
  stylistsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.WHITE,
    textAlign: 'center',
  },
});

export default ProductionSafeMap;