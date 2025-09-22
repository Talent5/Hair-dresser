import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking } from '@/types';

const STORAGE_KEYS = {
  BOOKINGS: '@bookings',
  PENDING_ACTIONS: '@pending_actions',
  OFFLINE_QUEUE: '@offline_queue',
  LAST_SYNC: '@last_sync',
};

interface PendingAction {
  id: string;
  type: 'accept' | 'reject' | 'complete' | 'cancel';
  bookingId: string;
  data: any;
  timestamp: number;
}

interface OfflineQueueItem {
  id: string;
  action: string;
  endpoint: string;
  data: any;
  timestamp: number;
}

class OfflineStorageService {
  // Bookings management
  async saveBookings(bookings: Booking[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    } catch (error) {
      console.error('Failed to save bookings:', error);
    }
  }

  async getBookings(): Promise<Booking[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get bookings:', error);
      return [];
    }
  }

  async updateBooking(updatedBooking: Booking): Promise<void> {
    try {
      const bookings = await this.getBookings();
      const index = bookings.findIndex(b => b._id === updatedBooking._id);
      
      if (index !== -1) {
        bookings[index] = updatedBooking;
      } else {
        bookings.push(updatedBooking);
      }
      
      await this.saveBookings(bookings);
    } catch (error) {
      console.error('Failed to update booking:', error);
    }
  }

  async removeBooking(bookingId: string): Promise<void> {
    try {
      const bookings = await this.getBookings();
      const filtered = bookings.filter(b => b._id !== bookingId);
      await this.saveBookings(filtered);
    } catch (error) {
      console.error('Failed to remove booking:', error);
    }
  }

  // Pending actions for offline mode
  async addPendingAction(action: PendingAction): Promise<void> {
    try {
      const pending = await this.getPendingActions();
      pending.push(action);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(pending));
    } catch (error) {
      console.error('Failed to add pending action:', error);
    }
  }

  async getPendingActions(): Promise<PendingAction[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_ACTIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get pending actions:', error);
      return [];
    }
  }

  async removePendingAction(actionId: string): Promise<void> {
    try {
      const pending = await this.getPendingActions();
      const filtered = pending.filter(a => a.id !== actionId);
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove pending action:', error);
    }
  }

  async clearPendingActions(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_ACTIONS, JSON.stringify([]));
    } catch (error) {
      console.error('Failed to clear pending actions:', error);
    }
  }

  // Offline queue for API calls
  async addToOfflineQueue(item: OfflineQueueItem): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      queue.push(item);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
    }
  }

  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  }

  async removeFromOfflineQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getOfflineQueue();
      const filtered = queue.filter(item => item.id !== itemId);
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to remove from offline queue:', error);
    }
  }

  async clearOfflineQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
    }
  }

  // Sync management
  async setLastSync(timestamp: number): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
    } catch (error) {
      console.error('Failed to set last sync:', error);
    }
  }

  async getLastSync(): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return stored ? parseInt(stored) : 0;
    } catch (error) {
      console.error('Failed to get last sync:', error);
      return 0;
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.BOOKINGS,
        STORAGE_KEYS.PENDING_ACTIONS,
        STORAGE_KEYS.OFFLINE_QUEUE,
        STORAGE_KEYS.LAST_SYNC,
      ]);
    } catch (error) {
      console.error('Failed to clear all data:', error);
    }
  }

  async getStorageInfo(): Promise<{
    bookingsCount: number;
    pendingActionsCount: number;
    offlineQueueCount: number;
    lastSync: number;
  }> {
    try {
      const [bookings, pendingActions, offlineQueue, lastSync] = await Promise.all([
        this.getBookings(),
        this.getPendingActions(),
        this.getOfflineQueue(),
        this.getLastSync(),
      ]);

      return {
        bookingsCount: bookings.length,
        pendingActionsCount: pendingActions.length,
        offlineQueueCount: offlineQueue.length,
        lastSync,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        bookingsCount: 0,
        pendingActionsCount: 0,
        offlineQueueCount: 0,
        lastSync: 0,
      };
    }
  }
}

export const offlineStorage = new OfflineStorageService();
export { PendingAction, OfflineQueueItem };