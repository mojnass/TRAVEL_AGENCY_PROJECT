// This function uses your Vite proxy (/duffel) to talk to Duffel
export const searchFlights = async (origin, destination, departureDate) => {
  console.log('✈️ duffelService.searchFlights called with:', { origin, destination, departureDate });
  
  const token = import.meta.env.VITE_DUFFEL_ACCESS_TOKEN;
  console.log('🔑 Duffel token found:', !!token);

  if (!token) {
    console.error('Duffel token not found in environment variables');
    return [];
  }

  const body = {
    data: {
      slices: [
        {
          origin: origin, // e.g., 'LHR'
          destination: destination, // e.g., 'DXB'
          departure_date: departureDate, // e.g., '2026-06-15'
        },
      ],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy',
    },
  };

  try {
    const response = await fetch('/duffel/air/offer_requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Duffel-Version': 'v1', // Duffel requires this header
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0]?.message || 'Flight search failed');
    }

    const result = await response.json();
    
    // Transform Duffel offers to our app's expected format
    return transformDuffelOffers(result.data.offers);
  } catch (error) {
    console.error('Duffel API Error:', error.message);
    return [];
  }
};

// Transform Duffel offers to our app's expected format
const transformDuffelOffers = (offers) => {
  return offers.map(offer => ({
    offer_id: offer.id,
    airline_code: offer.owner?.iata_code || 'Unknown',
    flight_number: `${offer.owner?.iata_code || 'XX'}${offer.slices?.[0]?.segments?.[0]?.flight_number || '000'}`,
    origin: offer.slices?.[0]?.origin?.iata_code || 'Unknown',
    destination: offer.slices?.[0]?.destination?.iata_code || 'Unknown',
    departure_time: offer.slices?.[0]?.segments?.[0]?.departing_at || '',
    arrival_time: offer.slices?.[0]?.segments?.[0]?.arriving_at || '',
    duration_minutes: calculateDuration(offer.slices?.[0]?.segments?.[0]),
    stops: offer.slices?.[0]?.segments?.length - 1 || 0,
    cabin_class: offer.slices?.[0]?.segments?.[0]?.aircraft?.cabin_class || 'economy',
    price: parseFloat(offer.total_amount) || 0,
    currency: offer.total_currency || 'USD',
    availability: offer.available_seats || 1,
    // Additional Duffel-specific data
    duffel_offer_id: offer.id,
    segments: offer.slices?.[0]?.segments || [],
    owner: offer.owner,
  }));
};

// Calculate flight duration in minutes
const calculateDuration = (segment) => {
  if (!segment?.departing_at || !segment?.arriving_at) return 0;
  
  const departure = new Date(segment.departing_at);
  const arrival = new Date(segment.arriving_at);
  return Math.round((arrival - departure) / (1000 * 60));
};

export const duffelService = {
  searchFlights,
};