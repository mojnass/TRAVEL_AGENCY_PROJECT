import { apiGet, apiPost, apiPut, apiDelete } from './api';

export const hotelService = {
  async getHotels(filters = {}) {
    return apiGet('/api/hotels', filters);
  },

  async getHotelWithRooms(hotelId) {
    return apiGet(`/api/hotels/${hotelId}`);
  },

  async searchHotels(location, checkIn, checkOut, guests = 2) {
    return apiGet('/api/hotels/search', {
      city: location,
      check_in: checkIn,
      check_out: checkOut,
      guests,
    });
  },

  async createHotel(hotelData) {
    return apiPost('/api/hotels', hotelData);
  },

  async updateHotel(hotelId, updateData) {
    return apiPut(`/api/hotels/${hotelId}`, updateData);
  },

  async deleteHotel(hotelId) {
    return apiDelete(`/api/hotels/${hotelId}`);
  },
};
