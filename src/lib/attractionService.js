import { apiGet, apiPost, apiPut, apiDelete } from './api';

export const attractionService = {
  async getAttractions(filters = {}) {
    return apiGet('/api/attractions', filters);
  },

  async getAttraction(attractionId) {
    return apiGet(`/api/attractions/${attractionId}`);
  },

  async searchAttractions(location, category = null) {
    return apiGet('/api/attractions/search', { city: location, category });
  },

  async createAttraction(attractionData) {
    return apiPost('/api/attractions', attractionData);
  },

  async updateAttraction(attractionId, updateData) {
    return apiPut(`/api/attractions/${attractionId}`, updateData);
  },

  async deleteAttraction(attractionId) {
    return apiDelete(`/api/attractions/${attractionId}`);
  },
};
