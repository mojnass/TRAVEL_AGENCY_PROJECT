import { apiGet } from './api';
import { bundleService } from './bundleService';
import { createSimplePdfUrl } from './pdf';

export const itineraryService = {
  async generateItineraryPDF(userBundleId) {
    const document = await apiGet(`/api/bundles/${userBundleId}/itinerary`);
    let bundle = null;
    try {
      const bundles = await bundleService.getUserBundles();
      bundle = bundles.find((item) => item.user_bundle_id === userBundleId);
    } catch {
      bundle = null;
    }
    const composition = bundle?.composition_data || {};
    const items = composition.items || [];
    const pdfUrl = createSimplePdfUrl(composition.name || `Patronus Itinerary ${userBundleId}`, [
      `Bundle ID: ${userBundleId}`,
      `Destination: ${composition.destination || 'Not specified'}`,
      `Status: ${document.status}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Original total: $${composition.total_original_price || 0}`,
      `Discounted total: $${composition.discounted_price || 0}`,
      '',
      'Items:',
      ...items.map((item) => `${item.quantity || 1} x ${item.type} - ${item.name} - $${item.price}`),
    ]);

    return {
      pdfUrl,
      bundle: bundle || document,
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

  async getUserItineraries() {
    return bundleService.getUserBundles();
  },
};
