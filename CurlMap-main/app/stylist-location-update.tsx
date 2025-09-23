import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';

// Conditional import for react-native-maps - only on native platforms
let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  try {
    const maps = require('react-native-maps');
    MapView = maps.default || maps.MapView;
    Marker = maps.Marker;
  } catch (error) {
    console.warn('react-native-maps not available:', error);
  }
}

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type LocationCoordinates = {
  latitude: number;
  longitude: number;
};

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Default location (Harare, Zimbabwe)
const DEFAULT_LOCATION = {
  latitude: -17.8292,
  longitude: 31.0522,
};

export default function StylistLocationUpdate() {
  const router = useRouter();
  const { user } = useAuth();
  
  const mapRef = useRef<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationCoordinates | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  useEffect(() => {
    checkLocationPermission();
    loadCurrentStylistLocation();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setLocationPermission(status === 'granted' ? 'granted' : 'denied');
  };

  const loadCurrentStylistLocation = () => {
    // Load stylist's current saved location from user profile
    if (user?.location?.coordinates) {
      const latitude = user.location.coordinates[1];
      const longitude = user.location.coordinates[0];
      const location = { latitude, longitude };
      
      setSelectedLocation(location);
      setRegion({
        latitude,
        longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
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
          'Please enable location access to use current location.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    if (locationPermission !== 'granted') {
      await requestLocationPermission();
      return;
    }

    setIsLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(coords);
      setSelectedLocation(coords);
      
      const newRegion = {
        ...coords,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
  };

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map first.');
      return;
    }

    Alert.alert(
      'Update Location',
      'Are you sure you want to update your business location? This will be visible to clients looking for stylists.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Update', 
          onPress: async () => {
            setIsSaving(true);
            try {
              // Call API to update the stylist's location
              await apiService.updateStylistLocation({
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude
              });
              
              Alert.alert('Success', 'Your location has been updated successfully!', [
                { text: 'OK', onPress: () => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/stylist-dashboard' as any);
                  }
                }}
              ]);
            } catch (error) {
              console.error('Error updating location:', error);
              Alert.alert('Error', 'Failed to update location. Please try again.');
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  const renderMap = () => {
    if (Platform.OS === 'web' || !MapView) {
      return (
        <View style={styles.webMapPlaceholder}>
          <Ionicons name="map-outline" size={64} color={COLORS.GRAY_400} />
          <Text style={styles.webMapTitle}>Map Not Available</Text>
          <Text style={styles.webMapText}>
            Location update is not available on web platform.
          </Text>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={null} // Use platform default (OpenStreetMap on Android, Apple Maps on iOS)
        initialRegion={region || {
          latitude: -17.8292, // Harare, Zimbabwe default
          longitude: 31.0522,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleMapPress}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        mapType="standard"
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            draggable
            onDragEnd={(event) => setSelectedLocation(event.nativeEvent.coordinate)}
          >
            <View style={styles.customMarker}>
              <Ionicons name="business" size={24} color={COLORS.WHITE} />
            </View>
          </Marker>
        )}
        
        {currentLocation && currentLocation !== selectedLocation && (
          <Marker
            coordinate={currentLocation}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.currentLocationMarker}>
              <View style={styles.currentLocationInner} />
            </View>
          </Marker>
        )}
      </MapView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/stylist-dashboard' as any);
          }
        }} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Location</Text>
        <TouchableOpacity 
          onPress={handleSaveLocation} 
          style={[styles.headerButton, styles.saveButton]}
          disabled={isSaving || !selectedLocation}
        >
          <Text style={[
            styles.saveButtonText,
            (!selectedLocation || isSaving) && styles.saveButtonDisabled
          ]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Tap on the map to set your business location. This will be visible to clients.
        </Text>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {renderMap()}
        
        {/* Loading overlay */}
        {(isLoading || isSaving) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={styles.loadingText}>
              {isLoading ? 'Getting location...' : 'Saving location...'}
            </Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={getCurrentLocation}
          disabled={isLoading}
        >
          <Ionicons name="locate" size={20} color={COLORS.PRIMARY} />
          <Text style={styles.controlButtonText}>Use Current Location</Text>
        </TouchableOpacity>

        {selectedLocation && (
          <View style={styles.selectedLocationInfo}>
            <Ionicons name="location" size={16} color={COLORS.SUCCESS} />
            <Text style={styles.selectedLocationText}>
              Location selected: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>

      {/* My Location Button (Floating) */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={getCurrentLocation}
        disabled={isLoading}
      >
        <Ionicons 
          name="locate" 
          size={24} 
          color={isLoading ? COLORS.GRAY_400 : COLORS.PRIMARY} 
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerButton: {
    padding: SPACING.SM,
  },
  headerTitle: {
    fontSize: FONT_SIZES.LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: BORDER_RADIUS.MD,
    paddingHorizontal: SPACING.MD,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.WHITE,
  },
  saveButtonDisabled: {
    color: COLORS.GRAY_400,
  },
  instructionsContainer: {
    backgroundColor: COLORS.INFO_LIGHT,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  instructionsText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.INFO,
    textAlign: 'center',
    lineHeight: 20,
  },
  mapContainer: {
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
    backgroundColor: COLORS.GRAY_100,
    padding: SPACING.XL,
  },
  webMapTitle: {
    fontSize: FONT_SIZES.XL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },
  webMapText: {
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 22,
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.WHITE,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  currentLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.WHITE,
    borderWidth: 3,
    borderColor: COLORS.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentLocationInner: {
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
    fontSize: FONT_SIZES.MD,
    color: COLORS.TEXT_SECONDARY,
  },
  controlsContainer: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY_LIGHT,
    paddingVertical: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    marginBottom: SPACING.MD,
  },
  controlButtonText: {
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
    color: COLORS.PRIMARY,
    marginLeft: SPACING.SM,
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.SM,
  },
  selectedLocationText: {
    fontSize: FONT_SIZES.SM,
    color: COLORS.SUCCESS,
    marginLeft: SPACING.SM,
  },
  myLocationButton: {
    position: 'absolute',
    bottom: 100,
    right: SPACING.LG,
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
});