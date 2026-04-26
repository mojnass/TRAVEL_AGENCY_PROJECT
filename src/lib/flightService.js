// Available destinations with airports
const availableDestinations = [
  { name: 'Dubai', country: 'UAE', code: 'DXB', airport: 'Dubai International Airport' },
  { name: 'Paris', country: 'France', code: 'CDG', airport: 'Charles de Gaulle Airport' },
  { name: 'Beirut', country: 'Lebanon', code: 'BEY', airport: 'Beirut Rafic Hariri International Airport' },
  { name: 'London', country: 'UK', code: 'LHR', airport: 'Heathrow Airport' },
  { name: 'New York', country: 'USA', code: 'JFK', airport: 'John F. Kennedy International Airport' },
  { name: 'Los Angeles', country: 'USA', code: 'LAX', airport: 'Los Angeles International Airport' },
  { name: 'Tokyo', country: 'Japan', code: 'NRT', airport: 'Narita International Airport' },
  { name: 'Singapore', country: 'Singapore', code: 'SIN', airport: 'Changi Airport' },
  { name: 'Miami', country: 'USA', code: 'MIA', airport: 'Miami International Airport' },
  { name: 'Chicago', country: 'USA', code: 'ORD', airport: "O'Hare International Airport" },
  { name: 'Boston', country: 'USA', code: 'BOS', airport: 'Logan International Airport' },
];

// Generate mock flight results
const generateMockFlights = (origin, destination, departureDate, returnDate, passengerCount, cabinClass) => {
  const airlines = [
    { name: 'Emirates', code: 'EK' },
    { name: 'Air France', code: 'AF' },
    { name: 'MEA', code: 'ME' },
    { name: 'Qatar Airways', code: 'QR' },
    { name: 'British Airways', code: 'BA' },
    { name: 'American Airlines', code: 'AA' },
    { name: 'Delta Airlines', code: 'DL' },
    { name: 'United Airlines', code: 'UA' },
    { name: 'Lufthansa', code: 'LH' },
    { name: 'Singapore Airlines', code: 'SQ' },
  ];
  
  // Calculate base prices by route
  const getBasePrice = (origin, dest) => {
    const majorRoutes = {
      'DXB-CDG': 450, 'CDG-DXB': 480,
      'DXB-BEY': 280, 'BEY-DXB': 300,
      'CDG-BEY': 380, 'BEY-CDG': 400,
      'LHR-JFK': 520, 'JFK-LHR': 550,
      'LAX-JFK': 380, 'JFK-LAX': 400,
      'NRT-SIN': 420, 'SIN-NRT': 440,
      'LHR-CDG': 280, 'CDG-LHR': 290,
      'DXB-LHR': 480, 'LHR-DXB': 500,
    };
    
    const routeKey = `${origin}-${dest}`;
    return majorRoutes[routeKey] || 350 + Math.random() * 200;
  };
  
  const basePrice = getBasePrice(origin, destination);
  
  // Cabin class multiplier
  const classMultipliers = { economy: 1, premium: 1.5, business: 2.5, first: 4 };
  const multiplier = classMultipliers[cabinClass] || 1;
  
  const flights = [];
  
  // Generate 3-6 flight options
  const flightCount = 3 + Math.floor(Math.random() * 4);
  for (let i = 0; i < flightCount; i++) {
    const airline = airlines[i % airlines.length];
    const flightNumber = `${airline.code}${100 + i * 111}`;
    const price = Math.round(basePrice * multiplier * (0.9 + Math.random() * 0.3));
    
    // Generate realistic times
    const depHour = 6 + i * 2;
    const depMinute = Math.random() > 0.5 ? '00' : '30';
    const duration = 180 + Math.random() * 300; // 3-8 hours
    const arrHour = Math.floor((depHour * 60 + parseInt(depMinute) + duration) / 60) % 24;
    const arrMinute = Math.floor(duration % 60);
    
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
      departure_time: `${String(depHour).padStart(2, '0')}:${depMinute}`,
      arrival_time: `${String(arrHour).padStart(2, '0')}:${String(arrMinute).padStart(2, '0')}`,
      duration: `${Math.floor(duration / 60)}h ${Math.floor(duration % 60)}m`,
      duration_minutes: Math.round(duration),
      stops: Math.random() > 0.7 ? 1 : 0,
      price: Math.round(price * passengerCount),
      total_price: Math.round(price * passengerCount),
      cabin_class: cabinClass,
      seats_available: 20 + Math.floor(Math.random() * 80),
      status: 'available',
      // Additional fields for better display
      owner: {
        name: airline.name,
        iata_code: airline.code,
        logo_symbol_url: null
      },
      slices: [{
        origin: { iata_code: origin },
        destination: { iata_code: destination },
        segments: [{
          departing_at: `${departureDate}T${String(depHour).padStart(2, '0')}:${depMinute}:00Z`,
          arriving_at: `${departureDate}T${String(arrHour).padStart(2, '0')}:${String(arrMinute).padStart(2, '0')}:00Z`,
        }]
      }],
    });
  }
  
  return flights.sort((a, b) => a.price - b.price);
};

export const flightService = {
  async searchFlights(origin, destination, departureDate, returnDate = null, passengerCount = 1, cabinClass = 'economy') {
    // Validate inputs
    if (!origin || !destination) {
      throw new Error('Please select both origin and destination airports');
    }
    
    if (!departureDate) {
      throw new Error('Please select a departure date');
    }
    
    // Extract airport codes if full names were passed (e.g., "Dubai International Airport (DXB)")
    const originCode = origin?.includes?.('(') ? origin.match(/\(([A-Z]{3})\)/)?.[1] : origin;
    const destCode = destination?.includes?.('(') ? destination.match(/\(([A-Z]{3})\)/)?.[1] : destination;
    
    // Validate that both airports are in our available destinations
    const validOrigin = availableDestinations.find(d => 
      d.code === originCode || 
      d.code === origin?.toUpperCase() ||
      d.name.toLowerCase() === origin?.toLowerCase()
    );
    const validDest = availableDestinations.find(d => 
      d.code === destCode || 
      d.code === destination?.toUpperCase() ||
      d.name.toLowerCase() === destination?.toLowerCase()
    );
    
    if (!validOrigin || !validDest) {
      const airportList = availableDestinations.map(d => `${d.name} (${d.code})`).join(', ');
      throw new Error(`Flights available between: ${airportList}`);
    }
    
    if (validOrigin.code === validDest.code) {
      throw new Error('Origin and destination cannot be the same airport');
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
