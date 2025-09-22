import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import apiService from './api';
import NotificationService from './NotificationService';

interface OfflineAction {
  id: string;
  type: 'accept_booking' | 'reject_booking' | 'complete_booking' | 'update_booking';
  bookingId: string;
  data: any;
  timestamp: string;
  synced: boolean;
}

interface CachedBooking {
  id: string;
  data: any;
  timestamp: string;
  lastSync: string;
}

class OfflineBookingService {
  private pendingActions: OfflineAction[] = [];
  private cachedBookings: Map<string, CachedBooking> = new Map();
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  constructor() {
    this.initNetworkListener();
    this.loadStoredData();
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline && !this.syncInProgress) {
        // Came back online - sync pending actions
        this.syncPendingActions();
      }
    });
  }

  private async loadStoredData() {
    try {
      const [actionsData, bookingsData] = await Promise.all([
        AsyncStorage.getItem('offline_actions'),
        AsyncStorage.getItem('cached_bookings')
      ]);

      if (actionsData) {
        this.pendingActions = JSON.parse(actionsData);
      }

      if (bookingsData) {
        const bookings = JSON.parse(bookingsData);
        this.cachedBookings = new Map(Object.entries(bookings));
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  private async saveOfflineActions() {
    try {
      await AsyncStorage.setItem('offline_actions', JSON.stringify(this.pendingActions));
    } catch (error) {
      console.error('Failed to save offline actions:', error);
    }
  }

  private async saveCachedBookings() {
    try {
      const bookingsObj = Object.fromEntries(this.cachedBookings);
      await AsyncStorage.setItem('cached_bookings', JSON.stringify(bookingsObj));
    } catch (error) {
      console.error('Failed to save cached bookings:', error);
    }
  }

  // Cache booking data for offline access
  async cacheBooking(bookingId: string, bookingData: any) {
    this.cachedBookings.set(bookingId, {
      id: bookingId,
      data: bookingData,
      timestamp: new Date().toISOString(),
      lastSync: new Date().toISOString()
    });
    await this.saveCachedBookings();
  }

  // Get cached booking if offline
  getCachedBooking(bookingId: string): any | null {
    const cached = this.cachedBookings.get(bookingId);
    return cached ? cached.data : null;
  }

  // Get all cached bookings
  getAllCachedBookings(): any[] {
    return Array.from(this.cachedBookings.values()).map(cached => cached.data);
  }

  // Queue action for later sync if offline
  private async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>) {
    const offlineAction: OfflineAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      synced: false
    };

    this.pendingActions.push(offlineAction);
    await this.saveOfflineActions();

    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncPendingActions();
    }
  }

  // Accept booking (works offline)
  async acceptBooking(bookingId: string, notes?: string): Promise<boolean> {
    if (this.isOnline) {
      try {
        await apiService.updateBookingStatus(bookingId, 'accepted', notes);
        
        // Update cached booking if exists
        const cached = this.cachedBookings.get(bookingId);
        if (cached) {
          cached.data.status = 'accepted';
          if (notes) cached.data.stylistNotes = notes;
          await this.saveCachedBookings();
        }

        await NotificationService.notifyBookingUpdate(bookingId, 'accepted', 'Customer');
        return true;
      } catch (error) {
        console.error('Failed to accept booking online:', error);
        // Fall back to offline mode
      }
    }

    // Queue for offline processing
    await this.queueAction({
      type: 'accept_booking',
      bookingId,
      data: { notes }
    });

    // Update local cache optimistically
    const cached = this.cachedBookings.get(bookingId);
    if (cached) {
      cached.data.status = 'accepted';
      if (notes) cached.data.stylistNotes = notes;
      await this.saveCachedBookings();
    }

    await NotificationService.notifyBookingUpdate(bookingId, 'accepted', 'Customer');
    return true;
  }

  // Reject booking (works offline)
  async rejectBooking(bookingId: string, reason?: string): Promise<boolean> {
    if (this.isOnline) {
      try {
        await apiService.updateBookingStatus(bookingId, 'rejected', reason);
        
        // Update cached booking if exists
        const cached = this.cachedBookings.get(bookingId);
        if (cached) {
          cached.data.status = 'rejected';
          if (reason) cached.data.rejectionReason = reason;
          await this.saveCachedBookings();
        }

        await NotificationService.notifyBookingUpdate(bookingId, 'rejected', 'Customer');
        return true;
      } catch (error) {
        console.error('Failed to reject booking online:', error);
        // Fall back to offline mode
      }
    }

    // Queue for offline processing
    await this.queueAction({
      type: 'reject_booking',
      bookingId,
      data: { reason }
    });

    // Update local cache optimistically
    const cached = this.cachedBookings.get(bookingId);
    if (cached) {
      cached.data.status = 'rejected';
      if (reason) cached.data.rejectionReason = reason;
      await this.saveCachedBookings();
    }

    await NotificationService.notifyBookingUpdate(bookingId, 'rejected', 'Customer');
    return true;
  }

  // Complete booking (works offline)
  async completeBooking(bookingId: string, notes?: string): Promise<boolean> {
    if (this.isOnline) {
      try {
        await apiService.updateBookingStatus(bookingId, 'completed', notes);
        
        // Update cached booking if exists
        const cached = this.cachedBookings.get(bookingId);
        if (cached) {
          cached.data.status = 'completed';
          if (notes) cached.data.completionNotes = notes;
          await this.saveCachedBookings();
        }

        await NotificationService.notifyBookingUpdate(bookingId, 'completed', 'Customer');
        return true;
      } catch (error) {
        console.error('Failed to complete booking online:', error);
        // Fall back to offline mode
      }
    }

    // Queue for offline processing
    await this.queueAction({
      type: 'complete_booking',
      bookingId,
      data: { notes }
    });

    // Update local cache optimistically
    const cached = this.cachedBookings.get(bookingId);
    if (cached) {
      cached.data.status = 'completed';
      if (notes) cached.data.completionNotes = notes;
      await this.saveCachedBookings();
    }

    await NotificationService.notifyBookingUpdate(bookingId, 'completed', 'Customer');
    return true;
  }

  // Sync pending actions when back online
  private async syncPendingActions() {
    if (this.syncInProgress || !this.isOnline || this.pendingActions.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`Syncing ${this.pendingActions.length} pending actions...`);

    const unsyncedActions = this.pendingActions.filter(action => !action.synced);
    
    for (const action of unsyncedActions) {
      try {
        switch (action.type) {
          case 'accept_booking':
            await apiService.updateBookingStatus(action.bookingId, 'accepted', action.data.notes);
            break;
          case 'reject_booking':
            await apiService.updateBookingStatus(action.bookingId, 'rejected', action.data.reason);
            break;
          case 'complete_booking':
            await apiService.updateBookingStatus(action.bookingId, 'completed', action.data.notes);
            break;
        }
        
        // Mark as synced
        action.synced = true;
        console.log(`Synced action: ${action.type} for booking ${action.bookingId}`);
        
      } catch (error) {
        console.error(`Failed to sync action ${action.id}:`, error);
        // Keep the action for next sync attempt
      }
    }

    // Remove synced actions older than 24 hours
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    this.pendingActions = this.pendingActions.filter(action => 
      !action.synced || action.timestamp > dayAgo
    );

    await this.saveOfflineActions();
    this.syncInProgress = false;
  }

  // Get pending actions count
  getPendingActionsCount(): number {
    return this.pendingActions.filter(action => !action.synced).length;
  }

  // Check if device is online
  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  // Force sync (for manual refresh)
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncPendingActions();
    }
  }
}

export default new OfflineBookingService();