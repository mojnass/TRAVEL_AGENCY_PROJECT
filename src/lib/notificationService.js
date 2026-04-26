import { apiGet, apiPost, apiPatch } from './api';

export const notificationService = {
  async getUserNotifications(_userId, filters = {}) {
    const notifications = await apiGet('/api/notifications');
    return filters.limit ? notifications.slice(0, filters.limit) : notifications;
  },

  async getUnreadCount() {
    const data = await apiGet('/api/notifications/unread-count');
    return data?.unread_count || 0;
  },

  async createNotification(_userId, type, title, content = '') {
    return apiPost('/api/notifications', { type, title, content });
  },

  async markAsRead(notificationId) {
    return apiPatch(`/api/notifications/${notificationId}/read`);
  },

  async markAllAsRead(_userId) {
    const notifications = await apiGet('/api/notifications');
    return Promise.all(
      notifications
        .filter((notification) => !notification.is_read)
        .map((notification) => this.markAsRead(notification.notification_id))
    );
  },

  async sendBookingConfirmation(userId, bookingId) {
    return this.createNotification(
      userId,
      'booking_confirmation',
      'Booking Created',
      `Your booking ${bookingId} was created successfully.`
    );
  },

  async sendPaymentConfirmation(userId, paymentId, amount) {
    return this.createNotification(
      userId,
      'payment_confirmation',
      'Payment Successful',
      `Your payment ${paymentId} for $${amount} was completed.`
    );
  },

  async sendBookingCancellation(userId, bookingId) {
    return this.createNotification(
      userId,
      'booking_cancellation',
      'Booking Cancelled',
      `Your booking ${bookingId} has been cancelled.`
    );
  },
};
