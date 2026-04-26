import { supabase } from './supabase';

export const attractionService = {
  async getAttractions(filters = {}) {
    let query = supabase.from('attractions').select('*');
    
    if (filters.destination) {
      query = query.ilike('destination', `%${filters.destination}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getAttractionById(attractionId) {
    const { data, error } = await supabase
      .from('attractions')
      .select('*')
      .eq('id', attractionId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async searchAttractions(location, category = null) {
    let query = supabase.from('attractions').select('*');
    
    if (location) {
      query = query.ilike('destination', `%${location}%`);
    }
    
    const { data, error } = await query.limit(20);
    
    if (error) throw error;
    return data || [];
  },

  async createAttraction(attractionData) {
    const { data, error } = await supabase
      .from('attractions')
      .insert([attractionData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAttraction(attractionId, updateData) {
    const { data, error } = await supabase
      .from('attractions')
      .update(updateData)
      .eq('id', attractionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAttraction(attractionId) {
    const { error } = await supabase
      .from('attractions')
      .delete()
      .eq('id', attractionId);
    
    if (error) throw error;
    return true;
  },
};
