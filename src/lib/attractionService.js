import { supabase } from './supabase';

export const attractionService = {
  // Get all attractions
  async getAttractions(filters = {}) {
    let query = supabase.from('attractions').select('*');
    
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.min_rating) {
      query = query.gte('rating', filters.min_rating);
    }
    if (filters.requires_booking !== undefined) {
      query = query.eq('requires_advance_booking', filters.requires_booking);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single attraction
  async getAttraction(attractionId) {
    const { data, error } = await supabase
      .from('attractions')
      .select('*')
      .eq('attraction_id', attractionId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Search attractions by location
  async searchAttractions(location, category = null) {
    let query = supabase
      .from('attractions')
      .select('*')
      .or(`city.ilike.%${location}%`);
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get attractions by category
  async getAttractionsByCategory(category, city = null) {
    let query = supabase
      .from('attractions')
      .select('*')
      .eq('category', category);
    
    if (city) {
      query = query.eq('city', city);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get attractions that require advance booking
  async getAttractionsRequiringBooking(city = null) {
    let query = supabase
      .from('attractions')
      .select('*')
      .eq('requires_advance_booking', true);
    
    if (city) {
      query = query.eq('city', city);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get top rated attractions
  async getTopRatedAttractions(city = null, limit = 10) {
    let query = supabase
      .from('attractions')
      .select('*')
      .order('rating', { ascending: false })
      .limit(limit);
    
    if (city) {
      query = query.eq('city', city);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get attraction categories
  async getAttractionCategories() {
    const { data, error } = await supabase
      .from('attractions')
      .select('category')
      .not('category', 'is', null);
    
    if (error) throw error;
    
    // Get unique categories
    const categories = [...new Set(data?.map(item => item.category) || [])];
    return categories;
  },

  // Create attraction (admin only)
  async createAttraction(attractionData) {
    const { data, error } = await supabase
      .from('attractions')
      .insert(attractionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update attraction (admin only)
  async updateAttraction(attractionId, updateData) {
    const { data, error } = await supabase
      .from('attractions')
      .update(updateData)
      .eq('attraction_id', attractionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete attraction (admin only)
  async deleteAttraction(attractionId) {
    const { error } = await supabase
      .from('attractions')
      .delete()
      .eq('attraction_id', attractionId);
    
    if (error) throw error;
  },

  // Get ticket prices for attraction
  async getTicketPrices(attractionId) {
    const { data, error } = await supabase
      .from('attractions')
      .select('ticket_prices')
      .eq('attraction_id', attractionId)
      .single();
    
    if (error) throw error;
    return data?.ticket_prices || {};
  },

  // Get opening hours for attraction
  async getOpeningHours(attractionId) {
    const { data, error } = await supabase
      .from('attractions')
      .select('opening_hours')
      .eq('attraction_id', attractionId)
      .single();
    
    if (error) throw error;
    return data?.opening_hours || {};
  }
};
