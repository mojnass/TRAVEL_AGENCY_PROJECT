import { supabase } from './supabase';

// Available destinations with airports
const availableDestinations = [
  { name: 'Dubai', country: 'UAE', code: 'DXB', airport: 'Dubai International Airport' },
  { name: 'Paris', country: 'France', code: 'CDG', airport: 'Charles de Gaulle Airport' },
  { name: 'Beirut', country: 'Lebanon', code: 'BEY', airport: 'Beirut Rafic Hariri International Airport' },
];

// Generate mock flight results
const generateMockFlights = (origin, destination, departureDate, returnDate, passengerCount, cabinClass) => {
  const airlines = [
    { name: 'Emirates', code: 'EK' },
    { name: 'Air France', code: 'AF' },
    { name: 'MEA', code: 'ME' },
    { name: 'Qatar Airways', code: 'QR' },
  ];
  
  const basePrices = {
    'DXB-CDG': 450, 'CDG-DXB': 480,
    'DXB-BEY': 280, 'BEY-DXB': 300,
    'CDG-BEY': 380, 'BEY-CDG': 400,
    'BEY-DXB': 300, 'DXB-BEY': 280,
  };
  
  const routeKey = `${origin}-${destination}`;
  const basePrice = basePrices[routeKey] || 350;
  
  // Cabin class multiplier
  const classMultipliers = { economy: 1, premium: 1.5, business: 2.5, first: 4 };
  const multiplier = classMultipliers[cabinClass] || 1;
  
  const flights = [];
  
  // Generate 3-5 flight options
  for (let i = 0; i < 4; i++) {
    const airline = airlines[i % airlines.length];
    const flightNumber = `${airline.code}${100 + i * 111}`;
    const price = Math.round(basePrice * multiplier * (0.9 + Math.random() * 0.3));
    
    flights.push({
      flight_id: `flight_${Date.now()}_${i}`,
      offer_id: `offer_${Date.now()}_${i}`,
      airline: airline.name,
      airline_code: airline.code,
      flight_number: flightNumber,
      origin: origin,
      origin_airport: availableDestinations.find(d => d.code === origin)?.airport || origin,
      destination: destination,
      destination_airport: availableDestinations.find(d => d.code === destination)?.airport || destination,
      departure_date: departureDate,
      departure_time: `${8 + i * 3}:${i % 2 === 0 ? '00' : '30'}`,
      arrival_time: `${11 + i * 3}:${i % 2 === 0 ? '15' : '45'}`,
      duration: '3h 15m',
      duration_minutes: 195,
      stops: 0,
      price: price * passengerCount,
      total_price: price * passengerCount,
      cabin_class: cabinClass,
      seats_available: 20 + Math.floor(Math.random() * 80),
      status: 'available',
    });
  }
  
  return flights.sort((a, b) => a.price - b.price);
};

export const flightService = {
  async searchFlights(origin, destination, departureDate, returnDate = null, passengerCount = 1, cabinClass = 'economy') {
    // Extract airport codes if full names were passed
    const originCode = origin.includes('(') ? origin.match(/\(([^)]+)\)/)?.[1] : origin;
    const destCode = destination.includes('(') ? destination.match(/\(([^)]+)\)/)?.[1] : destination;
    
    // Validate that both airports are in our available destinations
    const validOrigin = availableDestinations.find(d => 
      d.code === originCode || d.name.toLowerCase() === origin.toLowerCase()
    );
    const validDest = availableDestinations.find(d => 
      d.code === destCode || d.name.toLowerCase() === destination.toLowerCase()
    );
    
    if (!validOrigin || !validDest) {
      throw new Error('Flights only available between Dubai (DXB), Paris (CDG), and Beirut (BEY)');
    }
    
    if (validOrigin.code === validDest.code) {
      throw new Error('Origin and destination cannot be the same');
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return generateMockFlights(validOrigin.code, validDest.code, departureDate, returnDate, passengerCount, cabinClass);
  },

  async getFlightOffers(origin, destination, filters = {}) {
    return this.searchFlights(origin, destination, new Date().toISOString().split('T')[0]);
  },

  async getFlightOffer(offerId) {
    // Return a mock flight
    return {
      flight_id: offerId,
      airline: 'Emirates',
      flight_number: 'EK201',
      origin: { code: 'DXB', name: 'Dubai International Airport' },
      destination: { code: 'CDG', name: 'Charles de Gaulle Airport' },
      price: 450,
      status: 'available',
    };
  },

  async getFlightSeatMap(flightNumber) {
    // Return mock seat map
    return {
      rows: Array.from({ length: 20 }, (_, i) => ({
        row: i + 1,
        seats: ['A', 'B', 'C', 'D', 'E', 'F'].map(letter => ({
          seat: `${i + 1}${letter}`,
          available: Math.random() > 0.3,
          type: i < 4 ? 'business' : 'economy',
        })),
      })),
    };
  },

  async getTicket(bookingId) {
    return {
      ticket_id: `TKT_${bookingId}`,
      passenger_name: 'John Doe',
      flight_number: 'EK201',
      seat: '12A',
      status: 'confirmed',
    };
  },
};
