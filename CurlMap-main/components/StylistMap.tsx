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

// Conditional import for react-native-maps - only on native platforms
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default || maps.MapView;
    Marker = maps.Marker;
    Circle = maps.Circle;
  } catch (error) {
    console.warn('react-native-maps not available:', error);
  }
}

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
import { withTurboModuleErrorHandling } from '../utils/turboModuleCompat';
import TurboModuleErrorBoundary from './TurboModuleErrorBoundary';

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

// Web fallback component with interactive map
const WebMapFallback: React.FC<StylistMapProps> = ({
  stylists,
  userLocation,
  isLoading,
}) => {
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);

  // Simple interactive web map using OpenStreetMap tiles
  const renderInteractiveWebMap = () => {
    if (!showInteractiveMap) {
      return (
        <View style={styles.webMapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={COLORS.PRIMARY} />
          <Text style={styles.webMapTitle}>Free Interactive Map</Text>
          <Text style={styles.webMapText}>
            Using OpenStreetMap - completely free with no billing required!
          </Text>
          
          <TouchableOpacity
            style={styles.enableMapButton}
            onPress={() => setShowInteractiveMap(true)}
          >
            <Ionicons name="map" size={20} color={COLORS.WHITE} />
            <Text style={styles.enableMapButtonText}>Show Interactive Map</Text>
          </TouchableOpacity>

          {userLocation && (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={16} color={COLORS.PRIMARY} />
              <Text style={styles.locationText}>
                Current Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
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
      );
    }

    // Basic iframe-based OpenStreetMap for web
    const lat = userLocation?.latitude || -17.8292;
    const lng = userLocation?.longitude || 31.0522;
    const zoom = 13;
    
    return (
      <View style={styles.webMapContainer}>
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 12,
          }}
          title="Free OpenStreetMap"
        />
        
        <TouchableOpacity
          style={styles.webMapCloseButton}
          onPress={() => setShowInteractiveMap(false)}
        >
          <Ionicons name="close" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>

        {stylists.length > 0 && (
          <View style={styles.webMapResultsContainer}>
            <Text style={styles.webMapResultsText}>
              {stylists.length} stylist{stylists.length !== 1 ? 's' : ''} nearby
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderInteractiveWebMap()}
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Searching for stylists...</Text>
        </View>
      )}
    </View>
  );
};

// Native map component (only loaded on native platforms)
const NativeMapComponent: React.FC<StylistMapProps> = ({
  stylists,
  userLocation,
  onStylistSelect,
  selectedStylist,
  isLoading = false,
  searchRadius = BOOKING_CONFIG.SEARCH_RADIUS_KM,
  onRegionChange,
}) => {
  // Check if map components are available
  if (!MapView || !Marker || !Circle) {
    console.warn('react-native-maps components not available');
    return (
      <View style={styles.container}>
        <View style={styles.webMapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={COLORS.GRAY_400} />
          <Text style={styles.webMapTitle}>Map Unavailable</Text>
          <Text style={styles.webMapText}>
            Map functionality is not available on this platform.
          </Text>
        </View>
      </View>
    );
  }
  
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region>({
    latitude: -17.8292,
    longitude: 31.0522,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [isMapReady, setIsMapReady] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (userLocation && isMapReady) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  }, [userLocation, isMapReady]);

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
      
      if (location && mapRef.current) {
        const newRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
        setRegion(newRegion);
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    }
  };

  const handleMapReady = () => {
    setIsMapReady(true);
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    if (newRegion && typeof newRegion === 'object' && 
        typeof newRegion.latitude === 'number' && 
        typeof newRegion.longitude === 'number') {
      setRegion(newRegion);
      onRegionChange?.(newRegion);
    }
  };

  const renderStylistMarker = (stylist: StylistSearchResult) => {
    const isSelected = selectedStylist?._id === stylist._id;
    
    // Validate stylist coordinates
    const lat = stylist.user?.location?.coordinates?.[1];
    const lng = stylist.user?.location?.coordinates?.[0];
    
    if (typeof lat !== 'number' || typeof lng !== 'number' || 
        isNaN(lat) || isNaN(lng) || 
        lat === 0 || lng === 0) {
      console.warn('Invalid stylist coordinates:', stylist._id, lat, lng);
      return null;
    }
    
    return (
      <Marker
        key={stylist._id}
        coordinate={{
          latitude: lat,
          longitude: lng,
        }}
        onPress={() => onStylistSelect(stylist)}
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
              {stylist.user?.name}
            </Text>
            <Text style={styles.markerInfoSubText}>
              ⭐ {typeof stylist.rating === 'number' ? stylist.rating.toFixed(1) : (stylist.rating?.average || 0).toFixed(1)} • {LocationService.formatDistance(stylist.distance)}
            </Text>
          </View>
        )}
      </Marker>
    );
  };

  const renderUserLocationMarker = () => {
    if (!userLocation || 
        typeof userLocation.latitude !== 'number' || 
        typeof userLocation.longitude !== 'number' ||
        isNaN(userLocation.latitude) || 
        isNaN(userLocation.longitude)) {
      return null;
    }

    return (
      <Marker
        coordinate={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.userMarker}>
          <View style={styles.userMarkerInner} />
        </View>
      </Marker>
    );
  };

  const renderSearchRadius = () => {
    if (!userLocation || 
        typeof userLocation.latitude !== 'number' || 
        typeof userLocation.longitude !== 'number' ||
        isNaN(userLocation.latitude) || 
        isNaN(userLocation.longitude) ||
        typeof searchRadius !== 'number' ||
        isNaN(searchRadius) ||
        searchRadius <= 0) {
      return null;
    }

    return (
      <Circle
        center={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
        radius={searchRadius * 1000} // Convert km to meters
        strokeColor={COLORS.PRIMARY}
        strokeWidth={2}
        fillColor={`${COLORS.PRIMARY}20`}
      />
    );
  };

  if (locationPermission === 'denied') {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="location-outline" size={64} color={COLORS.GRAY_400} />
        <Text style={styles.permissionTitle}>Location Access Required</Text>
        <Text style={styles.permissionText}>
          To find nearby hair stylists, we need access to your location.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestLocationPermission}
        >
          <Text style={styles.permissionButtonText}>Enable Location</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: -17.8292,
          longitude: 31.0522,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onMapReady={handleMapReady}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={false} // We'll use custom marker
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        loadingEnabled={true}
        loadingIndicatorColor={COLORS.PRIMARY}
        loadingBackgroundColor={COLORS.WHITE}
        mapType="standard"
        // OpenStreetMap configuration (completely free!)
        provider={undefined} // Use default provider (OpenStreetMap)
        // Enable better performance and caching
        cacheEnabled={true}
        maxZoomLevel={20}
        minZoomLevel={3}
        // Improved user experience
        showsPointsOfInterest={true}
        showsBuildings={true}
        showsTraffic={false}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
      >
        {userLocation && renderUserLocationMarker()}
        {userLocation && searchRadius > 0 && renderSearchRadius()}
        {Array.isArray(stylists) && stylists.filter(stylist => 
          stylist && 
          stylist.user?.location?.coordinates && 
          Array.isArray(stylist.user.location.coordinates) &&
          stylist.user.location.coordinates.length >= 2
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

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={() => {
            if (mapRef.current && region) {
              const zoomedIn = {
                ...region,
                latitudeDelta: region.latitudeDelta * 0.5,
                longitudeDelta: region.longitudeDelta * 0.5,
              };
              mapRef.current.animateToRegion(zoomedIn, 300);
              setRegion(zoomedIn);
            }
          }}
        >
          <Ionicons name="add" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={() => {
            if (mapRef.current && region) {
              const zoomedOut = {
                ...region,
                latitudeDelta: region.latitudeDelta * 2,
                longitudeDelta: region.longitudeDelta * 2,
              };
              mapRef.current.animateToRegion(zoomedOut, 300);
              setRegion(zoomedOut);
            }
          }}
        >
          <Ionicons name="remove" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

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
};

// Main component that chooses between native and web versions
const StylistMap: React.FC<StylistMapProps> = (props) => {
  // Validate props to prevent undefined errors
  const safeProps = {
    ...props,
    stylists: Array.isArray(props.stylists) ? props.stylists : [],
    userLocation: props.userLocation && 
                  typeof props.userLocation.latitude === 'number' && 
                  typeof props.userLocation.longitude === 'number' ? 
                  props.userLocation : null,
    searchRadius: typeof props.searchRadius === 'number' && 
                  props.searchRadius > 0 ? 
                  props.searchRadius : BOOKING_CONFIG.SEARCH_RADIUS_KM,
    isLoading: Boolean(props.isLoading),
  };

  // Return web fallback for web platform
  if (Platform.OS === 'web') {
    return <WebMapFallback {...safeProps} />;
  }
  
  // Return native map component wrapped in error boundary for mobile platforms
  return (
    <TurboModuleErrorBoundary fallback={<WebMapFallback {...safeProps} />}>
      <NativeMapComponent {...safeProps} />
    </TurboModuleErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
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
  mapControls: {
    position: 'absolute',
    top: SPACING.XL,
    right: SPACING.MD,
    flexDirection: 'column',
  },
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.XS,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
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
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
    backgroundColor: COLORS.BACKGROUND,
  },
  webMapContainer: {
    flex: 1,
    position: 'relative',
    padding: SPACING.MD,
    backgroundColor: COLORS.BACKGROUND,
  },
  webMapCloseButton: {
    position: 'absolute',
    top: SPACING.LG,
    right: SPACING.LG,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.ERROR,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  webMapResultsContainer: {
    position: 'absolute',
    bottom: SPACING.LG,
    left: SPACING.LG,
    right: SPACING.LG,
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
  webMapResultsText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: '600',
  },
  enableMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
    marginTop: SPACING.LG,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  enableMapButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  webMapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  webMapText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.LG,
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

export default StylistMap;