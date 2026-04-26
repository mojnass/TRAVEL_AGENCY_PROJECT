import { supabase } from './supabase';

export const hotelService = {
  async getHotels(filters = {}) {
    let query = supabase.from('hotels').select('*');
    
    if (filters.destination) {
      query = query.ilike('destination', `%${filters.destination}%`);
    }
    if (filters.booking_date) {
      query = query.gte('booking_date', filters.booking_date);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getHotelById(hotelId) {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .eq('id', hotelId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async searchHotels(location, checkIn, checkOut, guests = 2) {
    let query = supabase.from('hotels').select('*');
    
    if (location) {
      query = query.ilike('destination', `%${location}%`);
    }
    if (checkIn) {
      query = query.gte('booking_date', checkIn);
    }
    
    const { data, error } = await query.limit(20);
    
    if (error) throw error;
    return data || [];
  },

  async createHotel(hotelData) {
    const { data, error } = await supabase
      .from('hotels')
      .insert([hotelData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateHotel(hotelId, updateData) {
    const { data, error } = await supabase
      .from('hotels')
      .update(updateData)
      .eq('id', hotelId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteHotel(hotelId) {
    const { error } = await supabase
      .from('hotels')
      .delete()
      .eq('id', hotelId);
    
    if (error) throw error;
    return true;
  },
};
