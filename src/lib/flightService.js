import { apiGet } from './api';

export const flightService = {
  async searchFlights(origin, destination, departureDate, returnDate = null, passengerCount = 1, cabinClass = 'economy') {
    return apiGet('/api/flights/search', {
      origin,
      destination,
      departure_date: departureDate,
      return_date: returnDate,
      passenger_count: passengerCount,
      cabin_class: cabinClass,
    });
  },

  async getFlightOffers(origin, destination, filters = {}) {
    return apiGet('/api/flights', { origin, destination, ...filters });
  },

  async getFlightOffer(offerId) {
    return apiGet(`/api/flights/${offerId}`);
  },

  async getFlightSeatMap(flightNumber) {
    const data = await apiGet('/api/flights/seat-map', { flightNumber });
    return data?.seat_data || {};
  },

  async getTicket(bookingId) {
    return apiGet('/api/flights/ticket', { bookingId });
  },
};
