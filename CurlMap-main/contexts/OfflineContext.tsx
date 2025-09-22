import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { offlineStorage, PendingAction, OfflineQueueItem } from '@/services/offlineStorage';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface OfflineContextType {
  isOnline: boolean;
  isLoading: boolean;
  pendingActionsCount: number;
  offlineQueueCount: number;
  syncPendingActions: () => Promise<void>;
  addPendingAction: (action: PendingAction) => Promise<void>;
  addToOfflineQueue: (item: OfflineQueueItem) => Promise<void>;
  clearOfflineData: () => Promise<void>;
  lastSyncTime: number;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActionsCount, setPendingActionsCount] = useState(0);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(0);
  const { user } = useAuth();

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !isOnline;
      const isNowOnline = !!state.isConnected;
      
      setIsOnline(isNowOnline);
      
      // Auto-sync when coming back online
      if (wasOffline && isNowOnline && user) {
        console.log('Network restored, syncing pending actions...');
        syncPendingActions();
      }
    });

    return unsubscribe;
  }, [isOnline, user]);

  // Load initial counts
  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const info = await offlineStorage.getStorageInfo();
      setPendingActionsCount(info.pendingActionsCount);
      setOfflineQueueCount(info.offlineQueueCount);
      setLastSyncTime(info.lastSync);
    } catch (error) {
      console.error('Failed to load counts:', error);
    }
  };

  const addPendingAction = async (action: PendingAction) => {
    try {
      await offlineStorage.addPendingAction(action);
      setPendingActionsCount(prev => prev + 1);
      
      // Also add to offline queue for API sync
      const queueItem: OfflineQueueItem = {
        id: `action_${action.id}`,
        action: action.type,
        endpoint: `/api/bookings/${action.bookingId}/${action.type}`,
        data: action.data,
        timestamp: action.timestamp,
      };
      
      await offlineStorage.addToOfflineQueue(queueItem);
      setOfflineQueueCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to add pending action:', error);
      throw error;
    }
  };

  const addToOfflineQueue = async (item: OfflineQueueItem) => {
    try {
      await offlineStorage.addToOfflineQueue(item);
      setOfflineQueueCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to add to offline queue:', error);
      throw error;
    }
  };

  const syncPendingActions = async () => {
    if (!isOnline || isLoading) return;

    setIsLoading(true);
    try {
      const pendingActions = await offlineStorage.getPendingActions();
      const offlineQueue = await offlineStorage.getOfflineQueue();

      console.log(`Syncing ${pendingActions.length} pending actions and ${offlineQueue.length} queue items...`);

      // Process pending actions
      for (const action of pendingActions) {
        try {
          await processPendingAction(action);
          await offlineStorage.removePendingAction(action.id);
          setPendingActionsCount(prev => Math.max(0, prev - 1));
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          // Keep action in queue for retry
        }
      }

      // Process offline queue
      for (const item of offlineQueue) {
        try {
          await processOfflineQueueItem(item);
          await offlineStorage.removeFromOfflineQueue(item.id);
          setOfflineQueueCount(prev => Math.max(0, prev - 1));
        } catch (error) {
          console.error(`Failed to sync queue item ${item.id}:`, error);
          // Keep item in queue for retry
        }
      }

      // Update last sync time
      const now = Date.now();
      await offlineStorage.setLastSync(now);
      setLastSyncTime(now);

      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processPendingAction = async (action: PendingAction) => {
    switch (action.type) {
      case 'accept':
        await apiService.updateBookingStatus(action.bookingId, 'accepted');
        break;
      case 'reject':
        await apiService.updateBookingStatus(action.bookingId, 'rejected', action.data?.reason);
        break;
      case 'complete':
        await apiService.updateBookingStatus(action.bookingId, 'completed');
        break;
      case 'cancel':
        await apiService.cancelBooking(action.bookingId, action.data?.reason || 'other');
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  };

  const processOfflineQueueItem = async (item: OfflineQueueItem) => {
    // For now, we'll handle booking actions through the pending actions system
    // This method can be used for other API calls that don't have specific service methods
    switch (item.action) {
      case 'accept':
      case 'reject':
      case 'complete':
      case 'cancel':
        // These are handled by processPendingAction, so we can skip them here
        console.log(`Skipping ${item.action} action - handled by pending actions`);
        break;
      default:
        console.log(`Processing offline queue item: ${item.action}`);
        // Add other API calls here as needed
        break;
    }
  };

  const clearOfflineData = async () => {
    try {
      await offlineStorage.clearAllData();
      setPendingActionsCount(0);
      setOfflineQueueCount(0);
      setLastSyncTime(0);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  };

  const value: OfflineContextType = {
    isOnline,
    isLoading,
    pendingActionsCount,
    offlineQueueCount,
    syncPendingActions,
    addPendingAction,
    addToOfflineQueue,
    clearOfflineData,
    lastSyncTime,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};