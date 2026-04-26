import { apiGet, apiPost, apiPatch } from './api';

export const bookingService = {
  async createBooking(bookingData) {
    return apiPost('/api/bookings', bookingData);
  },

  async getUserBookings(_userId, filters = {}) {
    return apiGet('/api/bookings', filters);
  },

  async getBookingDetails(bookingId) {
    return apiGet(`/api/bookings/${bookingId}`);
  },

  async updateBookingStatus(bookingId, newStatus) {
    return apiPatch(`/api/bookings/${bookingId}/status`, { status: newStatus });
  },

  async cancelBooking(bookingId) {
    return this.updateBookingStatus(bookingId, 'cancelled');
  },

  async confirmBooking(bookingId) {
    return this.updateBookingStatus(bookingId, 'confirmed');
  },

  async completeBooking(bookingId) {
    return this.updateBookingStatus(bookingId, 'completed');
  },

  async addPassengers(bookingId, passengers) {
    return Promise.all(passengers.map((passenger) => apiPost(`/api/bookings/${bookingId}/passengers`, passenger)));
  },

  async addExtras(bookingId, extras) {
    return Promise.all(extras.map((extra) => apiPost(`/api/bookings/${bookingId}/extras`, extra)));
  },

  async getAllBookings(filters = {}) {
    return apiGet('/api/bookings', filters);
  },
};
