import { apiGet, apiPost, apiPut, apiDelete } from './api';

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

export const bundleService = {
  async getPublishedBundles(filters = {}) {
    return apiGet('/api/bundles/published', filters);
  },

  async getBundleWithComponents(bundleId) {
    return apiGet(`/api/bundles/${bundleId}`);
  },

  async getUserBundles() {
    const bundles = await apiGet('/api/bundles/mine');
    return bundles.map(normalizeBundle);
  },

  async createUserBundle(_userId, compositionData, bundleId = null) {
    const bundle = await apiPost('/api/bundles/compose', {
      bundle_id: bundleId,
      composition_data: compositionData,
      name: compositionData.name,
      destination: compositionData.destination,
      total_original_price: compositionData.total_original_price,
      discounted_price: compositionData.discounted_price,
    });
    return normalizeBundle(bundle);
  },

  async getBundleByShareLink(shareableLink) {
    const bundle = await apiGet(`/api/bundles/share/${shareableLink}`);
    return normalizeBundle(bundle);
  },

  async createBundle(bundleData) {
    return apiPost('/api/bundles', bundleData);
  },

  async updateBundle(bundleId, updateData) {
    return apiPut(`/api/bundles/${bundleId}`, updateData);
  },

  async deleteBundle(bundleId) {
    return apiDelete(`/api/bundles/${bundleId}`);
  },

  async addBundleComponent(bundleId, componentData) {
    return apiPost(`/api/bundles/${bundleId}/components`, componentData);
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
