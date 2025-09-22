import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface BookingNotification {
  id: string;
  type: 'new_booking' | 'booking_update' | 'booking_cancelled' | 'chat_message';
  title: string;
  message: string;
  bookingId: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

class NotificationService {
  private notifications: BookingNotification[] = [];
  private listeners: ((notifications: BookingNotification[]) => void)[] = [];
  private isOnline: boolean = true;

  constructor() {
    this.initNetworkListener();
    this.loadStoredNotifications();
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (wasOffline && this.isOnline) {
        // Came back online - sync pending notifications
        this.syncPendingNotifications();
      }
    });
  }

  private async loadStoredNotifications() {
    try {
      const stored = await AsyncStorage.getItem('booking_notifications');
      if (stored) {
        this.notifications = JSON.parse(stored);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load stored notifications:', error);
    }
  }

  private async saveNotifications() {
    try {
      await AsyncStorage.setItem('booking_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  async addNotification(notification: Omit<BookingNotification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: BookingNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    await this.saveNotifications();
    this.notifyListeners();

    // Show immediate alert for important notifications
    if (notification.type === 'new_booking' || notification.type === 'booking_cancelled') {
      Alert.alert(notification.title, notification.message);
    }
  }

  async markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
      this.notifyListeners();
    }
  }

  async markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    await this.saveNotifications();
    this.notifyListeners();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  subscribe(listener: (notifications: BookingNotification[]) => void) {
    this.listeners.push(listener);
    // Immediately call with current notifications
    listener([...this.notifications]);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private async syncPendingNotifications() {
    // In a real app, this would sync with the server
    console.log('Syncing pending notifications after coming back online');
  }

  // Helper methods for specific booking events
  async notifyNewBooking(bookingId: string, customerName: string, serviceName: string) {
    await this.addNotification({
      type: 'new_booking',
      title: 'New Booking Request',
      message: `${customerName} wants to book ${serviceName}`,
      bookingId,
      data: { customerName, serviceName }
    });
  }

  async notifyBookingUpdate(bookingId: string, status: string, customerName: string) {
    const statusMessages = {
      accepted: `You accepted ${customerName}'s booking`,
      rejected: `You declined ${customerName}'s booking`,
      completed: `Booking with ${customerName} completed`,
      cancelled: `${customerName} cancelled their booking`
    };

    await this.addNotification({
      type: 'booking_update',
      title: 'Booking Updated',
      message: statusMessages[status as keyof typeof statusMessages] || `Booking status changed to ${status}`,
      bookingId,
      data: { status, customerName }
    });
  }

  async notifyChatMessage(bookingId: string, senderName: string, message: string) {
    await this.addNotification({
      type: 'chat_message',
      title: `Message from ${senderName}`,
      message: message.length > 50 ? message.substring(0, 50) + '...' : message,
      bookingId,
      data: { senderName, fullMessage: message }
    });
  }

  isNetworkOnline(): boolean {
    return this.isOnline;
  }
}

export default new NotificationService();