import { supabase } from './supabase';

// Local storage key for bundles
const BUNDLES_KEY = 'patronus_bundles';

// Get bundles from local storage
const getStoredBundles = () => {
  try {
    const stored = localStorage.getItem(BUNDLES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save bundles to local storage
const saveBundles = (bundles) => {
  try {
    localStorage.setItem(BUNDLES_KEY, JSON.stringify(bundles));
  } catch {
    // Ignore storage errors
  }
};

const normalizeBundle = (bundle) => {
  if (!bundle) return bundle;
  if (typeof bundle.composition_data === 'string') {
    try {
      return { ...bundle, composition_data: JSON.parse(bundle.composition_data) };
    } catch {
      return bundle;
    }
  }
  return bundle;
};

// Sample published bundles
const sampleBundles = [
  {
    bundle_id: 'bundle_dubai_luxury',
    name: 'Dubai Luxury Experience',
    destination: 'Dubai',
    description: '5-star hotel, fine dining, spa treatments, and VIP attractions',
    total_original_price: 6000,
    discounted_price: 4800,
    savings_percentage: 20,
    image_url: null,
    is_published: true,
    composition_data: {
      items: [
        { type: 'hotel', name: 'Burj Al Arab - 3 nights', price: 3600 },
        { type: 'restaurant', name: 'Nobu Dubai', price: 150 },
        { type: 'spa', name: 'Talise Spa - Deep Tissue Massage', price: 200 },
        { type: 'attraction', name: 'Burj Khalifa VIP Access', price: 100 },
      ],
      total_original_price: 4050,
      discounted_price: 3240,
    },
  },
  {
    bundle_id: 'bundle_paris_romance',
    name: 'Paris Romance Package',
    destination: 'Paris',
    description: 'Charming hotel, candlelit dinner, and Seine river cruise',
    total_original_price: 2800,
    discounted_price: 2200,
    savings_percentage: 21,
    image_url: null,
    is_published: true,
    composition_data: {
      items: [
        { type: 'hotel', name: 'The Ritz-Carlton - 2 nights', price: 1700 },
        { type: 'restaurant', name: 'Le Meurice Dinner', price: 250 },
        { type: 'attraction', name: 'Seine River Cruise', price: 80 },
      ],
      total_original_price: 2030,
      discounted_price: 1600,
    },
  },
  {
    bundle_id: 'bundle_beirut_discovery',
    name: 'Beirut Discovery',
    destination: 'Beirut',
    description: 'Cultural exploration with authentic Lebanese experiences',
    total_original_price: 1200,
    discounted_price: 950,
    savings_percentage: 21,
    image_url: null,
    is_published: true,
    composition_data: {
      items: [
        { type: 'hotel', name: 'Hilton Beirut - 2 nights', price: 500 },
        { type: 'restaurant', name: 'Em Sherif Dining', price: 100 },
        { type: 'spa', name: 'Giverny Spa - Turkish Hammam', price: 120 },
        { type: 'attraction', name: 'Jeita Grotto Tour', price: 50 },
      ],
      total_original_price: 770,
      discounted_price: 600,
    },
  },
];

export const bundleService = {
  async getPublishedBundles(filters = {}) {
    // Return sample bundles, optionally filtered by destination
    let bundles = [...sampleBundles];
    
    if (filters.destination) {
      bundles = bundles.filter(b => 
        b.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }
    
    return bundles;
  },

  async getBundleWithComponents(bundleId) {
    // Check in sample bundles first
    const sampleBundle = sampleBundles.find(b => b.bundle_id === bundleId);
    if (sampleBundle) return normalizeBundle(sampleBundle);
    
    // Then check in user bundles
    const allBundles = getStoredBundles();
    const bundle = allBundles.find(b => b.bundle_id === bundleId || b.user_bundle_id === bundleId);
    return normalizeBundle(bundle);
  },

  async getUserBundles(userId) {
    const allBundles = getStoredBundles();
    const userBundles = allBundles.filter(b => b.user_id === userId);
    return userBundles.map(normalizeBundle);
  },

  async createUserBundle(userId, compositionData, bundleId = null) {
    const bundle = {
      user_bundle_id: `user_bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bundle_id: bundleId,
      user_id: userId,
      name: compositionData.name || 'Custom Bundle',
      destination: compositionData.destination || 'Unknown',
      composition_data: compositionData,
      total_original_price: compositionData.total_original_price || 0,
      discounted_price: compositionData.discounted_price || 0,
      status: 'draft',
      created_at: new Date().toISOString(),
    };
    
    const allBundles = getStoredBundles();
    allBundles.push(bundle);
    saveBundles(allBundles);
    
    return normalizeBundle(bundle);
  },

  async getBundleByShareLink(shareableLink) {
    const allBundles = getStoredBundles();
    const bundle = allBundles.find(b => b.shareable_link === shareableLink);
    return normalizeBundle(bundle);
  },

  async createBundle(bundleData) {
    const bundle = {
      bundle_id: `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...bundleData,
      created_at: new Date().toISOString(),
    };
    
    const allBundles = getStoredBundles();
    allBundles.push(bundle);
    saveBundles(allBundles);
    
    return normalizeBundle(bundle);
  },

  async updateBundle(bundleId, updateData) {
    const allBundles = getStoredBundles();
    const index = allBundles.findIndex(b => b.bundle_id === bundleId || b.user_bundle_id === bundleId);
    if (index >= 0) {
      allBundles[index] = { ...allBundles[index], ...updateData, updated_at: new Date().toISOString() };
      saveBundles(allBundles);
      return normalizeBundle(allBundles[index]);
    }
    return null;
  },

  async deleteBundle(bundleId) {
    const allBundles = getStoredBundles();
    const filtered = allBundles.filter(b => b.bundle_id !== bundleId && b.user_bundle_id !== bundleId);
    saveBundles(filtered);
    return true;
  },

  async addBundleComponent(bundleId, componentData) {
    const allBundles = getStoredBundles();
    const bundle = allBundles.find(b => b.bundle_id === bundleId || b.user_bundle_id === bundleId);
    if (bundle) {
      if (!bundle.composition_data) bundle.composition_data = { items: [] };
      if (!bundle.composition_data.items) bundle.composition_data.items = [];
      bundle.composition_data.items.push(componentData);
      saveBundles(allBundles);
    }
    return normalizeBundle(bundle);
  },

  async linkBundleToBooking(userBundleId, bookingId) {
    return { user_bundle_id: userBundleId, booking_id: bookingId };
  },

  calculateBundleSavings(bundle) {
    const originalPrice = Number(bundle.total_original_price || bundle.composition_data?.total_original_price || 0);
    const discountedPrice = Number(bundle.discounted_price || bundle.composition_data?.discounted_price || 0);
    const savings = originalPrice - discountedPrice;
    return {
      original_price: originalPrice,
      discounted_price: discountedPrice,
      savings_amount: savings,
      savings_percentage: originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0,
    };
  },
};
