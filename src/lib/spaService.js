import { apiGet, apiPost, apiPut, apiDelete } from './api';

export const spaService = {
  async getSpaVenues(filters = {}) {
    return apiGet('/api/spa', filters);
  },

  async getSpaVenueWithServices(spaId) {
    return apiGet(`/api/spa/${spaId}`);
  },

  async searchSpaVenues(location, type = null) {
    return apiGet('/api/spa/search', { city: location, type });
  },

  async createSpaVenue(spaData) {
    return apiPost('/api/spa', spaData);
  },

  async updateSpaVenue(spaId, updateData) {
    return apiPut(`/api/spa/${spaId}`, updateData);
  },

  async deleteSpaVenue(spaId) {
    return apiDelete(`/api/spa/${spaId}`);
  },
};
