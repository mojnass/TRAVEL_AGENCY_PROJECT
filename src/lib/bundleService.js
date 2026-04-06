import { supabase } from './supabase';

export const bundleService = {
  // Get published bundles
  async getPublishedBundles(filters = {}) {
    let query = supabase
      .from('bundles')
      .select(`
        *,
        bundle_components (*)
      `)
      .eq('status', 'published')
      .lte('valid_from', new Date().toISOString().split('T')[0])
      .gte('valid_until', new Date().toISOString().split('T')[0]);
    
    if (filters.destination) {
      query = query.ilike('destination', `%${filters.destination}%`);
    }
    if (filters.max_price) {
      query = query.lte('discounted_price', filters.max_price);
    }
    
    query = query.order('discounted_price', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single bundle with components
  async getBundleWithComponents(bundleId) {
    const { data, error } = await supabase
      .from('bundles')
      .select(`
        *,
        bundle_components (*)
      `)
      .eq('bundle_id', bundleId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get user's custom bundles
  async getUserBundles(userId) {
    const { data, error } = await supabase
      .from('user_bundles')
      .select(`
        *,
        bundles (*),
        bundle_bookings (
          booking_id,
          bookings (*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create custom user bundle
  async createUserBundle(userId, compositionData, bundleId = null) {
    const bundleData = {
      user_id: userId,
      bundle_id: bundleId,
      composition_data: compositionData,
      shareable_link: this.generateShareableLink()
    };
    
    const { data, error } = await supabase
      .from('user_bundles')
      .insert(bundleData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update user bundle composition
  async updateUserBundle(userBundleId, compositionData) {
    const { data, error } = await supabase
      .from('user_bundles')
      .update({ composition_data: compositionData })
      .eq('user_bundle_id', userBundleId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete user bundle
  async deleteUserBundle(userBundleId) {
    const { error } = await supabase
      .from('user_bundles')
      .delete()
      .eq('user_bundle_id', userBundleId);
    
    if (error) throw error;
  },

  // Link bundle to booking
  async linkBundleToBooking(userBundleId, bookingId) {
    const { data, error } = await supabase
      .from('bundle_bookings')
      .insert({
        user_bundle_id: userBundleId,
        booking_id: bookingId
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get bundle by shareable link
  async getBundleByShareLink(shareableLink) {
    const { data, error } = await supabase
      .from('user_bundles')
      .select(`
        *,
        users (user_id, email, full_name)
      `)
      .eq('shareable_link', shareableLink)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create bundle (admin only)
  async createBundle(bundleData, components) {
    // Create bundle first
    const { data: bundle, error: bundleError } = await supabase
      .from('bundles')
      .insert(bundleData)
      .select()
      .single();
    
    if (bundleError) throw bundleError;
    
    // Add components
    const componentsWithBundleId = components.map(component => ({
      ...component,
      bundle_id: bundle.bundle_id
    }));
    
    const { data: componentsData, error: componentsError } = await supabase
      .from('bundle_components')
      .insert(componentsWithBundleId)
      .select();
    
    if (componentsError) throw componentsError;
    
    return { ...bundle, bundle_components: componentsData };
  },

  // Update bundle (admin only)
  async updateBundle(bundleId, updateData) {
    const { data, error } = await supabase
      .from('bundles')
      .update(updateData)
      .eq('bundle_id', bundleId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete bundle (admin only)
  async deleteBundle(bundleId) {
    const { error } = await supabase
      .from('bundles')
      .delete()
      .eq('bundle_id', bundleId);
    
    if (error) throw error;
  },

  // Add component to bundle (admin only)
  async addBundleComponent(componentData) {
    const { data, error } = await supabase
      .from('bundle_components')
      .insert(componentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update bundle component (admin only)
  async updateBundleComponent(componentId, updateData) {
    const { data, error } = await supabase
      .from('bundle_components')
      .update(updateData)
      .eq('component_id', componentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Remove component from bundle (admin only)
  async removeBundleComponent(componentId) {
    const { error } = await supabase
      .from('bundle_components')
      .delete()
      .eq('component_id', componentId);
    
    if (error) throw error;
  },

  // Publish bundle (admin only)
  async publishBundle(bundleId) {
    return this.updateBundle(bundleId, { status: 'published' });
  },

  // Archive bundle (admin only)
  async archiveBundle(bundleId) {
    return this.updateBundle(bundleId, { status: 'archived' });
  },

  // Get bundles by destination
  async getBundlesByDestination(destination) {
    const { data, error } = await supabase
      .from('bundles')
      .select(`
        *,
        bundle_components (*)
      `)
      .eq('status', 'published')
      .ilike('destination', `%${destination}%`)
      .order('discounted_price', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get bundle bookings
  async getBundleBookings(userBundleId) {
    const { data, error } = await supabase
      .from('bundle_bookings')
      .select(`
        *,
        bookings (*)
      `)
      .eq('user_bundle_id', userBundleId);
    
    if (error) throw error;
    return data;
  },

  // Calculate bundle savings
  calculateBundleSavings(bundle) {
    const originalPrice = bundle.total_original_price || 0;
    const discountedPrice = bundle.discounted_price || 0;
    const savings = originalPrice - discountedPrice;
    const savingsPercentage = originalPrice > 0 ? (savings / originalPrice) * 100 : 0;
    
    return {
      original_price: originalPrice,
      discounted_price: discountedPrice,
      savings_amount: savings,
      savings_percentage: Math.round(savingsPercentage)
    };
  },

  // Generate shareable link
  generateShareableLink() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Validate bundle dates
  validateBundleDates(validFrom, validUntil) {
    const today = new Date();
    const fromDate = new Date(validFrom);
    const untilDate = new Date(validUntil);
    
    return fromDate <= untilDate && 
           today >= fromDate && 
           today <= untilDate;
  },

  // Get all bundles (admin only)
  async getAllBundles(filters = {}) {
    let query = supabase
      .from('bundles')
      .select(`
        *,
        bundle_components (*)
      `);
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.destination) {
      query = query.ilike('destination', `%${filters.destination}%`);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};
