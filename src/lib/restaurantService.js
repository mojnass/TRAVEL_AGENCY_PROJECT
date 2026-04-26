import { apiGet, apiPost, apiPut, apiDelete } from './api';

export const restaurantService = {
  async getRestaurants(filters = {}) {
    return apiGet('/api/restaurants', filters);
  },

  async getRestaurantWithTables(restaurantId) {
    return apiGet(`/api/restaurants/${restaurantId}`);
  },

  async searchRestaurants(location, cuisine = null, partySize = 2) {
    return apiGet('/api/restaurants/search', {
      city: location,
      cuisine_type: cuisine,
      party_size: partySize,
    });
  },

  async createRestaurant(restaurantData) {
    return apiPost('/api/restaurants', restaurantData);
  },

  async updateRestaurant(restaurantId, updateData) {
    return apiPut(`/api/restaurants/${restaurantId}`, updateData);
  },

  async deleteRestaurant(restaurantId) {
    return apiDelete(`/api/restaurants/${restaurantId}`);
  },
};
