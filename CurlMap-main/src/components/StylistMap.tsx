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

// Conditional import for react-native-maps
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

// Define types locally to avoid importing from react-native-maps
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
import { 
  LocationCoordinates, 
  StylistSearchResult,
  SearchFilters 
} from '../../types';
import { 
  COLORS, 
  SPACING, 
  MAP_CONFIG, 
  BORDER_RADIUS,
  BOOKING_CONFIG 
} from '../../constants';
import { LocationService } from '../../utils/location';

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

const StylistMap: React.FC<StylistMapProps> = ({
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
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status === 'granted' ? 'granted' : 'denied');
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
    setRegion(newRegion);
    onRegionChange?.(newRegion);
  };

  const renderStylistMarker = (stylist: StylistSearchResult) => {
    const isSelected = selectedStylist?._id === stylist._id;
    
    return (
      <ExpoMarker
        key={stylist._id}
        coordinate={{
          latitude: stylist.user?.location?.coordinates?.[1] || 0,
          longitude: stylist.user?.location?.coordinates?.[0] || 0,
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
              ⭐ {(typeof stylist.rating === 'number' ? stylist.rating : stylist.rating?.average || 0).toFixed(1)} • {LocationService.formatDistance(stylist.distance)}
            </Text>
          </View>
        )}
      </ExpoMarker>
    );
  };

  const renderUserLocationMarker = () => {
    if (!userLocation) return null;

    return (
      <ExpoMarker
        coordinate={userLocation}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.userMarker}>
          <View style={styles.userMarkerInner} />
        </View>
      </ExpoMarker>
    );
  };

  const renderSearchRadius = () => {
    if (!userLocation) return null;

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
        initialRegion={region || {
          latitude: -17.8292, // Harare, Zimbabwe default
          longitude: 31.0522,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        region={region || undefined}
        onMapReady={handleMapReady}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={false} // We'll use custom marker
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        loadingEnabled={true}
        loadingIndicatorColor={COLORS.PRIMARY}
        loadingBackgroundColor={COLORS.WHITE}
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
});

export default StylistMap;