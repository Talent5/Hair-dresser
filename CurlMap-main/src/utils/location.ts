import * as Location from 'expo-location';
import { LocationCoordinates, LocationState } from '../types';
import { LOCATION_CONFIG, ERROR_MESSAGES } from '../constants';

export class LocationService {
  private static instance: LocationService;
  private currentLocation: LocationCoordinates | null = null;
  private permissionStatus: 'granted' | 'denied' | 'undetermined' = 'undetermined';

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions from the user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.permissionStatus = status === 'granted' ? 'granted' : 'denied';
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      this.permissionStatus = 'denied';
      return false;
    }
  }

  /**
   * Get current location of the user
   */
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      // Check permissions first
      if (this.permissionStatus !== 'granted') {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
        }
      }

      // Get location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: LOCATION_CONFIG.TIMEOUT,
        distanceInterval: LOCATION_CONFIG.DISTANCE_FILTER,
      });

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      return this.currentLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  /**
   * Watch user location changes
   */
  async watchLocation(
    onLocationUpdate: (location: LocationCoordinates) => void,
    onError?: (error: Error) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      if (this.permissionStatus !== 'granted') {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          throw new Error(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
        }
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: LOCATION_CONFIG.DISTANCE_FILTER,
        },
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          this.currentLocation = coords;
          onLocationUpdate(coords);
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      if (onError) onError(error as Error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  static calculateDistance(
    coord1: LocationCoordinates,
    coord2: LocationCoordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    const lat1 = this.toRadians(coord1.latitude);
    const lat2 = this.toRadians(coord2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return parseFloat(distance.toFixed(2));
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  async getAddressFromCoordinates(
    coordinates: LocationCoordinates
  ): Promise<string | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      if (results.length > 0) {
        const address = results[0];
        return `${address.street || ''} ${address.streetNumber || ''}, ${
          address.city || ''
        }, ${address.region || ''}`.trim();
      }

      return null;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return null;
    }
  }

  /**
   * Get coordinates from address (geocoding)
   */
  async getCoordinatesFromAddress(
    address: string
  ): Promise<LocationCoordinates | null> {
    try {
      const results = await Location.geocodeAsync(address);

      if (results.length > 0) {
        return {
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting coordinates from address:', error);
      return null;
    }
  }

  /**
   * Check if a coordinate is within a certain radius of another coordinate
   */
  static isWithinRadius(
    center: LocationCoordinates,
    point: LocationCoordinates,
    radiusKm: number
  ): boolean {
    const distance = this.calculateDistance(center, point);
    return distance <= radiusKm;
  }

  /**
   * Get current cached location
   */
  getCachedLocation(): LocationCoordinates | null {
    return this.currentLocation;
  }

  /**
   * Get permission status
   */
  getPermissionStatus(): 'granted' | 'denied' | 'undetermined' {
    return this.permissionStatus;
  }

  /**
   * Get region bounds for a given center point and radius
   */
  static getRegionBounds(
    center: LocationCoordinates,
    radiusKm: number
  ): {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } {
    const latitudeDelta = (radiusKm / 111) * 2; // Approximate conversion
    const longitudeDelta = (radiusKm / (111 * Math.cos(center.latitude * (Math.PI / 180)))) * 2;

    return {
      latitude: center.latitude,
      longitude: center.longitude,
      latitudeDelta,
      longitudeDelta,
    };
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m`;
    } else if (distanceKm < 10) {
      return `${distanceKm.toFixed(1)}km`;
    } else {
      return `${Math.round(distanceKm)}km`;
    }
  }

  /**
   * Sort locations by distance from a reference point
   */
  static sortByDistance<T extends { location: { coordinates: [number, number] } }>(
    items: T[],
    referencePoint: LocationCoordinates
  ): (T & { distance: number })[] {
    return items
      .map((item) => ({
        ...item,
        distance: this.calculateDistance(referencePoint, {
          latitude: item.location?.coordinates?.[1] || 0,
          longitude: item.location?.coordinates?.[0] || 0,
        }),
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Filter locations within radius
   */
  static filterByRadius<T extends { location: { coordinates: [number, number] } }>(
    items: T[],
    center: LocationCoordinates,
    radiusKm: number
  ): T[] {
    return items.filter((item) =>
      this.isWithinRadius(center, {
        latitude: item.location?.coordinates?.[1] || 0,
        longitude: item.location?.coordinates?.[0] || 0,
      }, radiusKm)
    );
  }
}