import { supabase } from './supabase';

export const spaService = {
  async getSpaVenues(filters = {}) {
    let query = supabase.from('spa_services').select('*');
    
    if (filters.destination) {
      query = query.ilike('destination', `%${filters.destination}%`);
    }
    if (filters.treatment_type) {
      query = query.ilike('treatment_type', `%${filters.treatment_type}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getSpaVenueById(spaId) {
    const { data, error } = await supabase
      .from('spa_services')
      .select('*')
      .eq('id', spaId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async searchSpaVenues(location, type = null) {
    let query = supabase.from('spa_services').select('*');
    
    if (location) {
      query = query.ilike('destination', `%${location}%`);
    }
    if (type) {
      query = query.ilike('treatment_type', `%${type}%`);
    }
    
    const { data, error } = await query.limit(20);
    
    if (error) throw error;
    return data || [];
  },

  async createSpaVenue(spaData) {
    const { data, error } = await supabase
      .from('spa_services')
      .insert([spaData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateSpaVenue(spaId, updateData) {
    const { data, error } = await supabase
      .from('spa_services')
      .update(updateData)
      .eq('id', spaId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteSpaVenue(spaId) {
    const { error } = await supabase
      .from('spa_services')
      .delete()
      .eq('id', spaId);
    
    if (error) throw error;
    return true;
  },
};
