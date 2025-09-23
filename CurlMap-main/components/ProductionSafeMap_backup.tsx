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
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

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
  onStylistSelect: (stylist: StylistSearchResult) => void;
  selectedStylist?: StylistSearchResult | null;
  isLoading?: boolean;
  searchRadius?: number;
  onRegionChange?: (region: Region) => void;
}

const ProductionSafeMap: React.FC<StylistMapProps> = ({
  stylists = [],
  userLocation,
  onStylistSelect,
  selectedStylist,
  isLoading = false,
  searchRadius = 5,
  onRegionChange,
}) => {
  const mapRef = useRef<MapView>(null);
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

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (userLocation && isMapReady) {
      updateMapRegion(userLocation);
    }
  }, [userLocation, isMapReady]);

  const initializeMap = async () => {
    try {
      await checkLocationPermission();
    } catch (error) {
      console.error('Map initialization error:', error);
    }
  };

  const updateMapRegion = (location: LocationCoordinates) => {
    if (!location || !mapRef.current) return;

    const newRegion = {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
    
    setRegion(newRegion);
    mapRef.current.animateToRegion(newRegion, 1000);
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
          'Please enable location access in settings to find nearby stylists.'
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const locationService = LocationService.getInstance();
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
    
    if (userLocation) {
      updateMapRegion(userLocation);
    }
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    onRegionChange?.(newRegion);
  };

  const renderStylistMarker = (stylist: StylistSearchResult, index: number) => {
    if (!stylist?.user?.location?.coordinates || stylist.user.location.coordinates.length !== 2) {
      return null;
    }

    const [longitude, latitude] = stylist.user.location.coordinates;
    const coordinates = { latitude, longitude };
    const isSelected = selectedStylist?._id === stylist._id;
    
    return (
      <Marker
        key={`stylist-${stylist._id}-${index}`}
        coordinate={coordinates}
        onPress={() => onStylistSelect(stylist)}
      >
        <View style={[styles.marker, isSelected && styles.selectedMarker]}>
          <Ionicons
            name="cut"
            size={16}
            color={isSelected ? COLORS.WHITE : COLORS.PRIMARY}
          />
        </View>
      </Marker>
    );
  };

  const renderUserLocationMarker = () => {
    if (!userLocation) return null;

    return (
      <Marker coordinate={userLocation}>
        <View style={styles.userMarker}>
          <View style={styles.userMarkerInner} />
        </View>
      </Marker>
    );
  };

  const renderSearchRadius = () => {
    if (!userLocation || searchRadius <= 0) return null;

    return (
      <Circle
        center={userLocation}
        radius={searchRadius * 1000} // Convert km to meters
        strokeColor={COLORS.PRIMARY}
        strokeWidth={2}
        fillColor={`${COLORS.PRIMARY}20`}
      />
    );
  };

  // Show permission request if needed
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
        provider={PROVIDER_GOOGLE}
        initialRegion={defaultRegion}
        region={region || defaultRegion}
        onMapReady={handleMapReady}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        zoomEnabled={true}
        scrollEnabled={true}
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
    bottom: SPACING.XL + 60,
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
});

export default ProductionSafeMap;