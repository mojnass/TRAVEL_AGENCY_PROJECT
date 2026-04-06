import { supabase } from './supabase';

export const restaurantService = {
  // Get all restaurants
  async getRestaurants(filters = {}) {
    let query = supabase.from('restaurants').select('*');
    
    if (filters.city) {
      query = query.eq('city', filters.city);
    }
    if (filters.cuisine_type) {
      query = query.eq('cuisine_type', filters.cuisine_type);
    }
    if (filters.price_tier) {
      query = query.eq('price_tier', filters.price_tier);
    }
    if (filters.min_rating) {
      query = query.gte('rating', filters.min_rating);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single restaurant with tables
  async getRestaurantWithTables(restaurantId) {
    const { data, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        restaurant_tables (*)
      `)
      .eq('restaurant_id', restaurantId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get available tables for a restaurant
  async getAvailableTables(restaurantId, capacity = null) {
    let query = supabase
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('is_available', true);
    
    if (capacity) {
      query = query.gte('capacity', capacity);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Search restaurants by location or cuisine
  async searchRestaurants(location, cuisine = null, partySize = 2) {
    let query = supabase
      .from('restaurants')
      .select(`
        *,
        restaurant_tables (
          table_id,
          capacity,
          is_available
        )
      `)
      .or(`city.ilike.%${location}%`)
      .eq('restaurant_tables.is_available', true)
      .gte('restaurant_tables.capacity', partySize);
    
    if (cuisine) {
      query = query.eq('cuisine_type', cuisine);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get restaurants by cuisine type
  async getRestaurantsByCuisine(cuisineType, city = null) {
    let query = supabase
      .from('restaurants')
      .select('*')
      .eq('cuisine_type', cuisineType);
    
    if (city) {
      query = query.eq('city', city);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get restaurants by price tier
  async getRestaurantsByPriceTier(priceTier, city = null) {
    let query = supabase
      .from('restaurants')
      .select('*')
      .eq('price_tier', priceTier);
    
    if (city) {
      query = query.eq('city', city);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Create restaurant (admin only)
  async createRestaurant(restaurantData) {
    const { data, error } = await supabase
      .from('restaurants')
      .insert(restaurantData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update restaurant (admin only)
  async updateRestaurant(restaurantId, updateData) {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('restaurant_id', restaurantId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete restaurant (admin only)
  async deleteRestaurant(restaurantId) {
    const { error } = await supabase
      .from('restaurants')
      .delete()
      .eq('restaurant_id', restaurantId);
    
    if (error) throw error;
  },

  // Add table to restaurant (admin only)
  async addTable(tableData) {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert(tableData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update table availability (admin only)
  async updateTableAvailability(tableId, isAvailable) {
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update({ is_available: isAvailable })
      .eq('table_id', tableId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get top rated restaurants
  async getTopRatedRestaurants(city = null, limit = 10) {
    let query = supabase
      .from('restaurants')
      .select('*')
      .order('rating', { ascending: false })
      .limit(limit);
    
    if (city) {
      query = query.eq('city', city);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};
