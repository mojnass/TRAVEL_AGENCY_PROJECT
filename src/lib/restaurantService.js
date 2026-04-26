import { supabase } from './supabase';

export const restaurantService = {
  async getRestaurants(filters = {}) {
    let query = supabase.from('restaurants').select('*');
    
    if (filters.destination) {
      query = query.ilike('destination', `%${filters.destination}%`);
    }
    if (filters.cuisine_type) {
      query = query.ilike('cuisine_type', `%${filters.cuisine_type}%`);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getRestaurantById(restaurantId) {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async searchRestaurants(location, cuisine = null, partySize = 2) {
    let query = supabase.from('restaurants').select('*');
    
    if (location) {
      query = query.ilike('destination', `%${location}%`);
    }
    if (cuisine) {
      query = query.ilike('cuisine_type', `%${cuisine}%`);
    }
    
    const { data, error } = await query.limit(20);
    
    if (error) throw error;
    return data || [];
  },

  async createRestaurant(restaurantData) {
    const { data, error } = await supabase
      .from('restaurants')
      .insert([restaurantData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateRestaurant(restaurantId, updateData) {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', restaurantId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteRestaurant(restaurantId) {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('id', restaurantId);
    
    if (error) throw error;
    return true;
  },
};
