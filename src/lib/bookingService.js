import { supabase } from './supabase';

export const bookingService = {
  // Create new booking
  async createBooking(bookingData) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Add status history
    await this.addBookingStatusHistory(data.booking_id, 'pending', data.user_id);
    
    return data;
  },

  // Get user's bookings
  async getUserBookings(userId, filters = {}) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        booking_passengers (*),
        booking_extras (*),
        booking_status_history (*)
      `)
      .eq('user_id', userId);
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.booking_type) {
      query = query.eq('booking_type', filters.booking_type);
    }
    if (filters.start_date) {
      query = query.gte('start_date', filters.start_date);
    }
    if (filters.end_date) {
      query = query.lte('start_date', filters.end_date);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single booking with all details
  async getBookingDetails(bookingId) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_passengers (*),
        booking_extras (*),
        booking_status_history (*)
      `)
      .eq('booking_id', bookingId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update booking status
  async updateBookingStatus(bookingId, newStatus, userId) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: newStatus })
      .eq('booking_id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Add to status history
    await this.addBookingStatusHistory(bookingId, newStatus, userId);
    
    return data;
  },

  // Cancel booking
  async cancelBooking(bookingId, userId) {
    return this.updateBookingStatus(bookingId, 'cancelled', userId);
  },

  // Confirm booking
  async confirmBooking(bookingId, userId) {
    return this.updateBookingStatus(bookingId, 'confirmed', userId);
  },

  // Complete booking
  async completeBooking(bookingId, userId) {
    return this.updateBookingStatus(bookingId, 'completed', userId);
  },

  // Add passengers to booking
  async addPassengers(bookingId, passengers) {
    const passengersWithBookingId = passengers.map(passenger => ({
      ...passenger,
      booking_id: bookingId
    }));
    
    const { data, error } = await supabase
      .from('booking_passengers')
      .insert(passengersWithBookingId)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Update passenger details
  async updatePassenger(passengerId, updateData) {
    const { data, error } = await supabase
      .from('booking_passengers')
      .update(updateData)
      .eq('passenger_id', passengerId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Add extras to booking
  async addExtras(bookingId, extras) {
    const extrasWithBookingId = extras.map(extra => ({
      ...extra,
      booking_id: bookingId
    }));
    
    const { data, error } = await supabase
      .from('booking_extras')
      .insert(extrasWithBookingId)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Update booking extra
  async updateExtra(extraId, updateData) {
    const { data, error } = await supabase
      .from('booking_extras')
      .update(updateData)
      .eq('extra_id', extraId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Add booking status history entry
  async addBookingStatusHistory(bookingId, status, changedBy) {
    const { data, error } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        status: status,
        changed_by: changedBy
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get booking status history
  async getBookingStatusHistory(bookingId) {
    const { data, error } = await supabase
      .from('booking_status_history')
      .select('*')
      .eq('booking_id', bookingId)
      .order('changed_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get bookings by type
  async getBookingsByType(bookingType, userId = null) {
    let query = supabase
      .from('bookings')
      .select('*')
      .eq('booking_type', bookingType);
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get upcoming bookings
  async getUpcomingBookings(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .gte('start_date', today)
      .neq('status', 'cancelled')
      .order('start_date', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get past bookings
  async getPastBookings(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .lt('start_date', today)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get booking statistics for user
  async getUserBookingStats(userId) {
    const { data, error } = await supabase
      .from('bookings')
      .select('status, booking_type, total_price')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const stats = {
      total_bookings: data?.length || 0,
      total_spent: data?.reduce((sum, booking) => sum + booking.total_price, 0) || 0,
      by_status: {},
      by_type: {}
    };
    
    data?.forEach(booking => {
      stats.by_status[booking.status] = (stats.by_status[booking.status] || 0) + 1;
      stats.by_type[booking.booking_type] = (stats.by_type[booking.booking_type] || 0) + 1;
    });
    
    return stats;
  },

  // Delete booking (admin only)
  async deleteBooking(bookingId) {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('booking_id', bookingId);
    
    if (error) throw error;
  },

  // Get all bookings (admin only)
  async getAllBookings(filters = {}) {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        booking_passengers (*),
        booking_extras (*)
      `);
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.booking_type) {
      query = query.eq('booking_type', filters.booking_type);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};
