import { supabase } from './supabase';

// Local storage key for bookings
const BOOKINGS_KEY = 'patronus_bookings';

// Get bookings from local storage
const getStoredBookings = () => {
  try {
    const stored = localStorage.getItem(BOOKINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save bookings to local storage
const saveBookings = (bookings) => {
  try {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
  } catch {
    // Ignore storage errors
  }
};

export const bookingService = {
  async createBooking(bookingData) {
    const booking = {
      booking_id: `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...bookingData,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };
    
    const allBookings = getStoredBookings();
    allBookings.push(booking);
    saveBookings(allBookings);
    
    return booking;
  },

  async getUserBookings(userId, filters = {}) {
    const allBookings = getStoredBookings();
    let userBookings = allBookings.filter(b => b.user_id === userId);
    
    // Apply filters
    if (filters.booking_type) {
      userBookings = userBookings.filter(b => b.booking_type === filters.booking_type);
    }
    if (filters.status) {
      userBookings = userBookings.filter(b => b.status === filters.status);
    }
    
    return userBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async getBookingDetails(bookingId) {
    const allBookings = getStoredBookings();
    return allBookings.find(b => b.booking_id === bookingId);
  },

  async updateBookingStatus(bookingId, newStatus) {
    const allBookings = getStoredBookings();
    const booking = allBookings.find(b => b.booking_id === bookingId);
    if (booking) {
      booking.status = newStatus;
      booking.updated_at = new Date().toISOString();
      saveBookings(allBookings);
    }
    return booking;
  },

  async cancelBooking(bookingId, _userId) {
    return this.updateBookingStatus(bookingId, 'cancelled');
  },

  async confirmBooking(bookingId) {
    return this.updateBookingStatus(bookingId, 'confirmed');
  },

  async completeBooking(bookingId) {
    return this.updateBookingStatus(bookingId, 'completed');
  },

  async addPassengers(bookingId, passengers) {
    const allBookings = getStoredBookings();
    const booking = allBookings.find(b => b.booking_id === bookingId);
    if (booking) {
      booking.passengers = [...(booking.passengers || []), ...passengers];
      saveBookings(allBookings);
    }
    return booking;
  },

  async addExtras(bookingId, extras) {
    const allBookings = getStoredBookings();
    const booking = allBookings.find(b => b.booking_id === bookingId);
    if (booking) {
      booking.extras = [...(booking.extras || []), ...extras];
      saveBookings(allBookings);
    }
    return booking;
  },

  async getAllBookings(filters = {}) {
    return getStoredBookings();
  },

  // Seed sample bookings for testing
  async seedBookings(userId) {
    const existing = await this.getUserBookings(userId);
    if (existing.length > 0) return; // Don't seed if already has bookings
    
    const sampleBookings = [
      {
        booking_id: `book_${Date.now()}_1`,
        user_id: userId,
        booking_type: 'hotel',
        service_name: 'Burj Al Arab',
        destination: 'Dubai',
        start_date: '2026-06-15',
        end_date: '2026-06-18',
        total_price: 3600,
        status: 'confirmed',
        created_at: new Date().toISOString(),
      },
      {
        booking_id: `book_${Date.now()}_2`,
        user_id: userId,
        booking_type: 'restaurant',
        service_name: 'Le Meurice',
        destination: 'Paris',
        start_date: '2026-07-21',
        total_price: 120,
        status: 'pending',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
    
    const allBookings = getStoredBookings();
    allBookings.push(...sampleBookings);
    saveBookings(allBookings);
  },
};
