import { supabase } from './supabase';

// Local storage key for notifications
const NOTIFICATIONS_KEY = 'patronus_notifications';

// Get notifications from local storage
const getStoredNotifications = () => {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save notifications to local storage
const saveNotifications = (notifications) => {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch {
    // Ignore storage errors
  }
};

export const notificationService = {
  async getUserNotifications(userId, filters = {}) {
    // Get stored notifications for this user
    const allNotifications = getStoredNotifications();
    const userNotifications = allNotifications.filter(n => n.user_id === userId);
    
    // Sort by created_at descending
    userNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return filters.limit ? userNotifications.slice(0, filters.limit) : userNotifications;
  },

  async getUnreadCount(userId) {
    const notifications = await this.getUserNotifications(userId);
    return notifications.filter(n => !n.is_read).length;
  },

  async createNotification(userId, type, title, content = '') {
    const notification = {
      notification_id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      type,
      title,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    
    const allNotifications = getStoredNotifications();
    allNotifications.push(notification);
    saveNotifications(allNotifications);
    
    return notification;
  },

  async markAsRead(notificationId) {
    const allNotifications = getStoredNotifications();
    const notification = allNotifications.find(n => n.notification_id === notificationId);
    if (notification) {
      notification.is_read = true;
      saveNotifications(allNotifications);
    }
    return notification;
  },

  async markAllAsRead(userId) {
    const allNotifications = getStoredNotifications();
    allNotifications.forEach(n => {
      if (n.user_id === userId && !n.is_read) {
        n.is_read = true;
      }
    });
    saveNotifications(allNotifications);
    return true;
  },

  async sendBookingConfirmation(userId, bookingId) {
    return this.createNotification(
      userId,
      'booking_confirmation',
      'Booking Created',
      `Your booking #${bookingId} was created successfully.`
    );
  },

  async sendPaymentConfirmation(userId, paymentId, amount) {
    return this.createNotification(
      userId,
      'payment_confirmation',
      'Payment Successful',
      `Your payment #${paymentId} for $${amount} was completed.`
    );
  },

  async sendBookingCancellation(userId, bookingId) {
    return this.createNotification(
      userId,
      'booking_cancellation',
      'Booking Cancelled',
      `Your booking #${bookingId} has been cancelled.`
    );
  },

  // Seed initial notifications for testing
  async seedNotifications(userId) {
    const existing = await this.getUserNotifications(userId);
    if (existing.length > 0) return; // Don't seed if already has notifications
    
    const sampleNotifications = [
      {
        notification_id: `notif_seed_1`,
        user_id: userId,
        type: 'welcome',
        title: 'Welcome to Patronus!',
        content: 'Start exploring flights, hotels, restaurants, and more.',
        is_read: false,
        created_at: new Date().toISOString(),
      },
      {
        notification_id: `notif_seed_2`,
        user_id: userId,
        type: 'tip',
        title: 'Travel Tip',
        content: 'Create bundles to save up to 20% on your bookings!',
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      },
    ];
    
    const allNotifications = getStoredNotifications();
    allNotifications.push(...sampleNotifications);
    saveNotifications(allNotifications);
  },
};
