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
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default || maps.MapView;
    Marker = maps.Marker;
    Circle = maps.Circle;
    PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
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

// Define types locally
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
  onStylistSelect?: (stylist: StylistSearchResult) => void;
  selectedStylist?: StylistSearchResult | null;
  isLoading?: boolean;
  searchRadius?: number;
  onRegionChange?: (region: Region) => void;
}

// Web fallback component with OpenStreetMap
const WebMapFallback: React.FC<StylistMapProps> = ({
  stylists,
  userLocation,
  isLoading,
}) => {
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);

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
                Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </Text>
            </View>
          )}

          {stylists.length > 0 && (
            <View style={styles.stylistsList}>
              <Text style={styles.stylistsTitle}>
                Found {stylists.length} stylist{stylists.length !== 1 ? 's' : ''} nearby
              </Text>
              {stylists.slice(0, 3).map((stylist, index) => (
                <View key={stylist._id || index} style={styles.stylistItem}>
                  <Ionicons name="person" size={16} color={COLORS.PRIMARY} />
                  <Text style={styles.stylistName}>{stylist.user?.name || 'Hair Stylist'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    }

    // Show iframe with OpenStreetMap for web platform
    const mapUrl = userLocation 
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.longitude - 0.01},${userLocation.latitude - 0.01},${userLocation.longitude + 0.01},${userLocation.latitude + 0.01}&layer=mapnik&marker=${userLocation.latitude},${userLocation.longitude}`
      : `https://www.openstreetmap.org/export/embed.html?bbox=30.8,−18.2,31.3,−17.6&layer=mapnik`; // Zimbabwe default

    return (
      <View style={styles.container}>
        <iframe
          src={mapUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: BORDER_RADIUS.MD,
          }}
          title="OpenStreetMap"
        />
        
        <TouchableOpacity
          style={styles.webMapCloseButton}
          onPress={() => setShowInteractiveMap(false)}
        >
          <Ionicons name="close" size={20} color={COLORS.WHITE} />
        </TouchableOpacity>
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

// Native map component using OpenStreetMap tiles
const NativeMapComponent: React.FC<StylistMapProps> = ({
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
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  // Default region (Zimbabwe)
  const defaultRegion = {
    latitude: -17.8292,
    longitude: 31.0522,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };

  // Check if map components are available
  if (!MapView || !Marker || !Circle) {
    console.warn('react-native-maps components not available');
    return (
      <View style={styles.container}>
        <View style={styles.webMapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={COLORS.PRIMARY} />
          <Text style={styles.webMapTitle}>Map Unavailable</Text>
          <Text style={styles.webMapText}>
            Map components are not available on this platform.
          </Text>
          {stylists.length > 0 && (
            <Text style={styles.webMapText}>
              Found {stylists.length} stylist{stylists.length !== 1 ? 's' : ''} in your area.
            </Text>
          )}
        </View>
      </View>
    );
  }

  useEffect(() => {
    if (userLocation) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newRegion);
      
      // Animate to user location when map is ready
      if (isMapReady && mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  }, [userLocation, isMapReady]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationPermission('denied');
        Alert.alert(
          'Permission Required',
          'Please enable location permissions to see your current location on the map.',
          [{ text: 'OK' }]
        );
        return;
      }

      setLocationPermission('granted');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };

      setRegion(newRegion);
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleMapReady = () => {
    setIsMapReady(true);
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    onRegionChange?.(newRegion);
  };

  const renderUserLocationMarker = () => {
    if (!userLocation) return null;

    return (
      <Marker
        coordinate={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }}
        title="Your Location"
        description="You are here"
        pinColor={COLORS.ACCENT}
      >
        <View style={styles.userMarker}>
          <View style={styles.userMarkerInner} />
        </View>
      </Marker>
    );
  };

  const renderSearchRadius = () => {
    if (!userLocation || !searchRadius) return null;

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

  const renderStylistMarker = (stylist: StylistSearchResult, index: number) => {
    if (!stylist.user?.location?.coordinates) return null;

    const [longitude, latitude] = stylist.user.location.coordinates;
    const isSelected = selectedStylist?._id === stylist._id;

    return (
      <Marker
        key={stylist._id || index}
        coordinate={{ latitude, longitude }}
        title={stylist.user?.name || 'Hair Stylist'}
        description={`${stylist.specialties?.join(', ') || 'Hair Stylist'}`}
        onPress={() => onStylistSelect?.(stylist)}
        pinColor={isSelected ? COLORS.ACCENT : COLORS.PRIMARY}
      >
        <View style={[
          styles.stylistMarker,
          isSelected && styles.selectedStylistMarker
        ]}>
          <Ionicons 
            name="cut" 
            size={16} 
            color={COLORS.WHITE} 
          />
        </View>
      </Marker>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT} // Use default provider (OpenStreetMap on Android/iOS)
        initialRegion={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        } : defaultRegion}
        region={region || defaultRegion}
        onMapReady={handleMapReady}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={false} // We'll use custom marker
        showsMyLocationButton={false}
        showsCompass={true}
        zoomEnabled={true}
        scrollEnabled={true}
        rotateEnabled={false}
        pitchEnabled={false}
        mapType="standard"
      >
        {renderUserLocationMarker()}
        {renderSearchRadius()}
        {stylists.map(renderStylistMarker)}
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
      >
        <Ionicons name="locate" size={24} color={COLORS.PRIMARY} />
      </TouchableOpacity>

      {/* Results indicator */}
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
const ProductionSafeMap: React.FC<StylistMapProps> = (props) => {
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
  
  // Return native map component for mobile platforms
  return <NativeMapComponent {...safeProps} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.XL,
    backgroundColor: COLORS.BACKGROUND,
  },
  webMapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  webMapText: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
    lineHeight: 22,
  },
  enableMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.LG,
  },
  enableMapButtonText: {
    color: COLORS.WHITE,
    fontWeight: '600',
    marginLeft: SPACING.SM,
  },
  webMapCloseButton: {
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.FULL,
    padding: SPACING.SM,
    zIndex: 1000,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
  },
  stylistsList: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
    width: '100%',
  },
  stylistsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: SPACING.SM,
  },
  stylistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.XS,
  },
  stylistName: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginLeft: SPACING.SM,
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
    bottom: SPACING.XL,
    right: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.FULL,
    padding: SPACING.MD,
    elevation: 3,
    shadowColor: COLORS.GRAY_800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resultsContainer: {
    position: 'absolute',
    top: SPACING.MD,
    left: SPACING.MD,
    right: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    elevation: 2,
    shadowColor: COLORS.GRAY_800,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  resultsText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: '500',
    textAlign: 'center',
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.ACCENT,
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.WHITE,
  },
  stylistMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  selectedStylistMarker: {
    backgroundColor: COLORS.ACCENT,
    transform: [{ scale: 1.2 }],
  },
});

export default ProductionSafeMap;