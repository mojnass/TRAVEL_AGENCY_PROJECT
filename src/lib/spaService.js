import { supabase } from './supabase';

export const spaService = {
  // Get all spa venues
  async getSpaVenues(filters = {}) {
    let query = supabase.from('spa_venues').select('*');
    
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.min_rating) {
      query = query.gte('rating', filters.min_rating);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single spa venue with services
  async getSpaVenueWithServices(spaId) {
    const { data, error } = await supabase
      .from('spa_venues')
      .select(`
        *,
        spa_services (*)
      `)
      .eq('spa_id', spaId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get services for a specific spa venue
  async getSpaServices(spaId, filters = {}) {
    let query = supabase
      .from('spa_services')
      .select('*')
      .eq('spa_id', spaId);
    
    if (filters.max_duration) {
      query = query.lte('duration_minutes', filters.max_duration);
    }
    if (filters.max_price) {
      query = query.lte('price', filters.max_price);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Search spa venues by location
  async searchSpaVenues(location, type = null) {
    let query = supabase
      .from('spa_venues')
      .select(`
        *,
        spa_services (
          service_id,
          service_name,
          duration_minutes,
          price
        )
      `)
      .or(`city.ilike.%${location}%`);
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get spa venues by type
  async getSpaVenuesByType(type, city = null) {
    let query = supabase
      .from('spa_venues')
      .select('*')
      .eq('type', type);
    
    if (city) {
      query = query.eq('city', city);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get top rated spa venues
  async getTopRatedSpaVenues(city = null, limit = 10) {
    let query = supabase
      .from('spa_venues')
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

  // Get spa venue types
  async getSpaVenueTypes() {
    const { data, error } = await supabase
      .from('spa_venues')
      .select('type')
      .not('type', 'is', null);
    
    if (error) throw error;
    
    // Get unique types
    const types = [...new Set(data?.map(item => item.type) || [])];
    return types;
  },

  // Create spa venue (admin only)
  async createSpaVenue(spaData) {
    const { data, error } = await supabase
      .from('spa_venues')
      .insert(spaData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update spa venue (admin only)
  async updateSpaVenue(spaId, updateData) {
    const { data, error } = await supabase
      .from('spa_venues')
      .update(updateData)
      .eq('spa_id', spaId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete spa venue (admin only)
  async deleteSpaVenue(spaId) {
    const { error } = await supabase
      .from('spa_venues')
      .delete()
      .eq('spa_id', spaId);
    
    if (error) throw error;
  },

  // Add service to spa venue (admin only)
  async addSpaService(serviceData) {
    const { data, error } = await supabase
      .from('spa_services')
      .insert(serviceData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update spa service (admin only)
  async updateSpaService(serviceId, updateData) {
    const { data, error } = await supabase
      .from('spa_services')
      .update(updateData)
      .eq('service_id', serviceId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete spa service (admin only)
  async deleteSpaService(serviceId) {
    const { error } = await supabase
      .from('spa_services')
      .delete()
      .eq('service_id', serviceId);
    
    if (error) throw error;
  },

  // Get opening hours for spa venue
  async getSpaOpeningHours(spaId) {
    const { data, error } = await supabase
      .from('spa_venues')
      .select('opening_hours')
      .eq('spa_id', spaId)
      .single();
    
    if (error) throw error;
    return data?.opening_hours || {};
  }
};
