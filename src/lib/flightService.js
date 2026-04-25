import { supabase } from './supabase';
import { duffelService } from './duffel';

export const flightService = {
  // Search for flights using Duffel API with caching
  async searchFlights(origin, destination, departureDate, returnDate = null, passengerCount = 1, cabinClass = 'economy') {
    console.log('🛫 flightService.searchFlights called with:', { origin, destination, departureDate, returnDate, passengerCount, cabinClass });
    
    try {
      // Check cache first
      const { data: cachedData } = await supabase
        .from('flight_search_cache')
        .select('*')
        .eq('origin', origin)
        .eq('destination', destination)
        .eq('departure_date', departureDate)
        .eq('passenger_count', passengerCount)
        .eq('cabin_class', cabinClass)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (cachedData) {
        console.log('Using cached flight results');
        return cachedData.search_results;
      }
      
      // Use Duffel API for real flight search
      console.log('Searching flights with Duffel API...');
      const flightResults = await duffelService.searchFlights(origin, destination, departureDate, returnDate, passengerCount);
      
      // Cache the results for 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await supabase
        .from('flight_search_cache')
        .upsert({
          origin,
          destination,
          departure_date: departureDate,
          return_date: returnDate,
          passenger_count: passengerCount,
          cabin_class: cabinClass,
          search_results: flightResults,
          cached_at: new Date().toISOString(),
          expires_at: expiresAt
        });
      
      return flightResults;
    } catch (error) {
      console.error('Flight search error:', error);
      // Fallback to mock data if Duffel fails
      return this.getMockFlights(origin, destination);
    }
  },

  // Get mock flights as fallback
  async getMockFlights(origin, destination) {
    return [
      {
        offer_id: 'mock_1',
        airline_code: 'AA',
        flight_number: 'AA123',
        origin: origin,
        destination: destination,
        departure_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        arrival_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 300,
        stops: 0,
        cabin_class: 'economy',
        price: 450.00,
        currency: 'USD',
        availability: 10,
      },
      {
        offer_id: 'mock_2',
        airline_code: 'UA',
        flight_number: 'UA456',
        origin: origin,
        destination: destination,
        departure_time: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(),
        arrival_time: new Date(Date.now() + 25 * 60 * 60 * 1000 + 4.5 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 270,
        stops: 1,
        cabin_class: 'economy',
        price: 380.00,
        currency: 'USD',
        availability: 8,
      }
    ];
  },

  // Get flight offers by route
  async getFlightOffers(origin, destination, filters = {}) {
    let query = supabase.from('flight_offers').select('*');
    
    query = query.eq('origin', origin).eq('destination', destination);
    
    if (filters.cabin_class) {
      query = query.eq('cabin_class', filters.cabin_class);
    }
    if (filters.max_stops !== undefined) {
      query = query.lte('stops', filters.max_stops);
    }
    if (filters.min_availability) {
      query = query.gte('availability', filters.min_availability);
    }
    if (filters.airline_code) {
      query = query.eq('airline_code', filters.airline_code);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single flight offer
  async getFlightOffer(offerId) {
    const { data, error } = await supabase
      .from('flight_offers')
      .select('*')
      .eq('offer_id', offerId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get flight seat map
  async getFlightSeatMap(flightNumber, date) {
    const { data, error } = await supabase
      .from('flight_seat_maps')
      .select('seat_data')
      .eq('flight_number', flightNumber)
      .eq('date', date)
      .single();
    
    if (error) throw error;
    return data?.seat_data || {};
  },

  // Get flights by airline
  async getFlightsByAirline(airlineCode, filters = {}) {
    let query = supabase
      .from('flight_offers')
      .select('*')
      .eq('airline_code', airlineCode);
    
    if (filters.cabin_class) {
      query = query.eq('cabin_class', filters.cabin_class);
    }
    if (filters.max_price) {
      query = query.lte('price', filters.max_price);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get direct flights only
  async getDirectFlights(origin, destination, cabinClass = 'economy') {
    const { data, error } = await supabase
      .from('flight_offers')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .eq('cabin_class', cabinClass)
      .eq('stops', 0);
    
    if (error) throw error;
    return data;
  },

  // Get flights by price range
  async getFlightsByPriceRange(origin, destination, minPrice, maxPrice, cabinClass = 'economy') {
    const { data, error } = await supabase
      .from('flight_offers')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .eq('cabin_class', cabinClass)
      .gte('price', minPrice)
      .lte('price', maxPrice);
    
    if (error) throw error;
    return data;
  },

  // Create flight offer (admin only)
  async createFlightOffer(flightData) {
    const { data, error } = await supabase
      .from('flight_offers')
      .insert(flightData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update flight offer (admin only)
  async updateFlightOffer(offerId, updateData) {
    const { data, error } = await supabase
      .from('flight_offers')
      .update(updateData)
      .eq('offer_id', offerId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete flight offer (admin only)
  async deleteFlightOffer(offerId) {
    const { error } = await supabase
      .from('flight_offers')
      .delete()
      .eq('offer_id', offerId);
    
    if (error) throw error;
  },

  // Update seat map (admin only)
  async updateSeatMap(flightNumber, date, seatData) {
    const { data, error } = await supabase
      .from('flight_seat_maps')
      .upsert({
        flight_number: flightNumber,
        date: date,
        seat_data: seatData
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Clear expired cache (admin only)
  async clearExpiredCache() {
    const { error } = await supabase
      .from('flight_search_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());
    
    if (error) throw error;
  },

  // Get popular routes (based on search cache)
  async getPopularRoutes(limit = 10) {
    const { data, error } = await supabase
      .from('flight_search_cache')
      .select('origin, destination')
      .gte('cached_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
};
