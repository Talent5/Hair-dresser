import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Storage utility for secure and regular data
export class StorageService {
  // For sensitive data (tokens, passwords)
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Fallback to AsyncStorage on web
        await AsyncStorage.setItem(`secure_${key}`, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error storing secure item:', error);
      throw error;
    }
  }

  static async getSecureItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(`secure_${key}`);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('Error retrieving secure item:', error);
      return null;
    }
  }

  static async removeSecureItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(`secure_${key}`);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing secure item:', error);
    }
  }

  // For regular data (user preferences, cache)
  static async setItem(key: string, value: any): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error('Error storing item:', error);
      throw error;
    }
  }

  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error retrieving item:', error);
      return null;
    }
  }

  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}

// Auth token management
export class TokenService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static async setToken(token: string): Promise<void> {
    await StorageService.setSecureItem(this.TOKEN_KEY, token);
  }

  static async getToken(): Promise<string | null> {
    return await StorageService.getSecureItem(this.TOKEN_KEY);
  }

  static async removeToken(): Promise<void> {
    await StorageService.removeSecureItem(this.TOKEN_KEY);
  }

  static async setRefreshToken(token: string): Promise<void> {
    await StorageService.setSecureItem(this.REFRESH_TOKEN_KEY, token);
  }

  static async getRefreshToken(): Promise<string | null> {
    return await StorageService.getSecureItem(this.REFRESH_TOKEN_KEY);
  }

  static async removeRefreshToken(): Promise<void> {
    await StorageService.removeSecureItem(this.REFRESH_TOKEN_KEY);
  }

  static async clearAll(): Promise<void> {
    await Promise.all([
      this.removeToken(),
      this.removeRefreshToken(),
    ]);
  }
}

// User data management
export class UserService {
  private static readonly USER_KEY = 'user_data';
  private static readonly STYLIST_KEY = 'stylist_data';

  static async setUser(user: any): Promise<void> {
    await StorageService.setItem(this.USER_KEY, user);
  }

  static async getUser(): Promise<any | null> {
    return await StorageService.getItem(this.USER_KEY);
  }

  static async removeUser(): Promise<void> {
    await StorageService.removeItem(this.USER_KEY);
  }

  static async setStylist(stylist: any): Promise<void> {
    await StorageService.setItem(this.STYLIST_KEY, stylist);
  }

  static async getStylist(): Promise<any | null> {
    return await StorageService.getItem(this.STYLIST_KEY);
  }

  static async removeStylist(): Promise<void> {
    await StorageService.removeItem(this.STYLIST_KEY);
  }
}

// App settings management
export class SettingsService {
  private static readonly SETTINGS_KEY = 'app_settings';

  static async getSettings(): Promise<any> {
    const settings = await StorageService.getItem(this.SETTINGS_KEY);
    return {
      notifications: true,
      locationSharing: true,
      darkMode: false,
      language: 'en',
      ...settings,
    };
  }

  static async updateSettings(newSettings: any): Promise<void> {
    const currentSettings = await this.getSettings();
    const updatedSettings = { ...currentSettings, ...newSettings };
    await StorageService.setItem(this.SETTINGS_KEY, updatedSettings);
  }

  static async resetSettings(): Promise<void> {
    await StorageService.removeItem(this.SETTINGS_KEY);
  }
}