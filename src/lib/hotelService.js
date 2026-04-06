import { supabase } from './supabase';

export const hotelService = {
  // Get all hotels
  async getHotels(filters = {}) {
    let query = supabase.from('hotels').select('*');
    
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.country) {
      query = query.eq('country', filters.country);
    }
    if (filters.star_rating) {
      query = query.eq('star_rating', filters.star_rating);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single hotel with rooms
  async getHotelWithRooms(hotelId) {
    const { data, error } = await supabase
      .from('hotels')
      .select(`
        *,
        hotel_rooms (*)
      `)
      .eq('hotel_id', hotelId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get available rooms for a hotel
  async getAvailableRooms(hotelId, filters = {}) {
    let query = supabase
      .from('hotel_rooms')
      .select('*')
      .eq('hotel_id', hotelId)
      .eq('is_available', true);
    
    if (filters.max_occupancy) {
      query = query.gte('max_occupancy', filters.max_occupancy);
    }
    if (filters.max_price) {
      query = query.lte('price_per_night', filters.max_price);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Search hotels by location
  async searchHotels(location, checkIn, checkOut, guests = 2) {
    const { data, error } = await supabase
      .from('hotels')
      .select(`
        *,
        hotel_rooms (
          room_id,
          room_type,
          max_occupancy,
          price_per_night,
          is_available
        )
      `)
      .or(`city.ilike.%${location}%,country.ilike.%${location}%`)
      .eq('hotel_rooms.is_available', true)
      .gte('hotel_rooms.max_occupancy', guests);
    
    if (error) throw error;
    return data;
  },

  // Create hotel (admin only)
  async createHotel(hotelData) {
    const { data, error } = await supabase
      .from('hotels')
      .insert(hotelData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update hotel (admin only)
  async updateHotel(hotelId, updateData) {
    const { data, error } = await supabase
      .from('hotels')
      .update(updateData)
      .eq('hotel_id', hotelId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete hotel (admin only)
  async deleteHotel(hotelId) {
    const { error } = await supabase
      .from('hotels')
      .delete()
      .eq('hotel_id', hotelId);
    
    if (error) throw error;
  },

  // Add room to hotel (admin only)
  async addRoom(roomData) {
    const { data, error } = await supabase
      .from('hotel_rooms')
      .insert(roomData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update room availability (admin only)
  async updateRoomAvailability(roomId, isAvailable) {
    const { data, error } = await supabase
      .from('hotel_rooms')
      .update({ is_available: isAvailable })
      .eq('room_id', roomId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
