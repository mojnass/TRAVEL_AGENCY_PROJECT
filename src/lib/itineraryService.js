import { supabase } from './supabase';
import { createSimplePdfUrl } from './pdf';

// Local storage key for bundles/itineraries
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

export const itineraryService = {
  async generateItineraryPDF(userBundleId) {
    // Get bundle from local storage
    const bundles = getStoredBundles();
    const bundle = bundles.find((item) => item.user_bundle_id === userBundleId);
    
    const composition = bundle?.composition_data || {};
    const items = composition.items || [];
    const pdfUrl = createSimplePdfUrl(composition.name || `Patronus Itinerary ${userBundleId}`, [
      `Bundle ID: ${userBundleId}`,
      `Destination: ${composition.destination || 'Not specified'}`,
      `Status: ${bundle?.status || 'confirmed'}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Original total: $${composition.total_original_price || 0}`,
      `Discounted total: $${composition.discounted_price || 0}`,
      '',
      'Items:',
      ...items.map((item) => `${item.quantity || 1} x ${item.type} - ${item.name} - $${item.price}`),
    ]);

    return {
      pdfUrl,
      bundle: bundle || { user_bundle_id: userBundleId, status: 'confirmed' },
      generatedAt: new Date().toISOString(),
    };
  },

  async getItineraryPDF(userBundleId) {
    return this.generateItineraryPDF(userBundleId);
  },

  async emailItinerary(userBundleId) {
    return { user_bundle_id: userBundleId, status: 'queued' };
  },

  async createBundleCheckout(userBundleId, paymentId) {
    return { checkout_id: `${userBundleId}-${paymentId}`, user_bundle_id: userBundleId, payment_id: paymentId };
  },

  async updateBundleCheckout(checkoutId, pdfUrl) {
    return { checkout_id: checkoutId, pdf_generated: true, pdf_url: pdfUrl };
  },

  async getBundleCheckout(userBundleId) {
    return { checkout_id: `${userBundleId}-checkout`, user_bundle_id: userBundleId };
  },

  async downloadPDF(userBundleId) {
    const itinerary = await this.generateItineraryPDF(userBundleId);
    return itinerary.pdfUrl;
  },

  async getUserItineraries(userId) {
    // Get bundles from local storage for this user
    const allBundles = getStoredBundles();
    const userBundles = allBundles.filter(b => b.user_id === userId);
    return userBundles;
  },

  // Seed sample itineraries for testing
  async seedItineraries(userId) {
    const existing = await this.getUserItineraries(userId);
    if (existing.length > 0) return; // Don't seed if already has itineraries
    
    const sampleItineraries = [
      {
        user_bundle_id: `bundle_${Date.now()}_1`,
        user_id: userId,
        name: 'Dubai Luxury Package',
        destination: 'Dubai',
        status: 'confirmed',
        created_at: new Date().toISOString(),
        composition_data: {
          name: 'Dubai Luxury Package',
          destination: 'Dubai',
          items: [
            { type: 'Hotel', name: 'Burj Al Arab', price: 1200, quantity: 3 },
            { type: 'Restaurant', name: 'Nobu Dubai', price: 150, quantity: 1 },
            { type: 'Spa', name: 'Talise Spa', price: 200, quantity: 1 },
            { type: 'Attraction', name: 'Burj Khalifa', price: 45, quantity: 2 },
          ],
          total_original_price: 5390,
          discounted_price: 4500,
        },
      },
      {
        user_bundle_id: `bundle_${Date.now()}_2`,
        user_id: userId,
        name: 'Paris Weekend',
        destination: 'Paris',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        composition_data: {
          name: 'Paris Weekend',
          destination: 'Paris',
          items: [
            { type: 'Hotel', name: 'The Ritz-Carlton', price: 850, quantity: 2 },
            { type: 'Restaurant', name: 'Le Meurice', price: 120, quantity: 1 },
          ],
          total_original_price: 1820,
          discounted_price: 1600,
        },
      },
    ];
    
    const allBundles = getStoredBundles();
    allBundles.push(...sampleItineraries);
    saveBundles(allBundles);
  },

  // Create a new bundle/itinerary
  async createItinerary(userId, compositionData) {
    const bundle = {
      user_bundle_id: `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      name: compositionData.name,
      destination: compositionData.destination,
      status: 'pending',
      created_at: new Date().toISOString(),
      composition_data: compositionData,
    };
    
    const allBundles = getStoredBundles();
    allBundles.push(bundle);
    saveBundles(allBundles);
    
    return bundle;
  },

  // Delete an itinerary
  async deleteItinerary(userBundleId) {
    const allBundles = getStoredBundles();
    const filtered = allBundles.filter(b => b.user_bundle_id !== userBundleId);
    saveBundles(filtered);
    return true;
  },
};
