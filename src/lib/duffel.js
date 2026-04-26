// Flight search is proxied through the backend at /duffel to avoid exposing the
// Duffel access token on the client. Set DUFFEL_ACCESS_TOKEN on the server only.
export const searchFlights = async (origin, destination, departureDate) => {
  const body = {
    data: {
      slices: [
        {
          origin,
          destination,
          departure_date: departureDate,
        },
      ],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy',
    },
  };

  try {
    // Step 1: Create offer request
    console.log('Creating offer request:', origin, '→', destination, 'on', departureDate);
    
    const response = await fetch('/duffel/air/offer_requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2',
        // Authorization header is injected by the server-side proxy, NOT here.
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Duffel error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        throw new Error(`Server error: ${response.status}`);
      }
      throw new Error(errorData.errors?.[0]?.message || errorData.message || 'Flight search failed');
    }

    const result = await response.json();
    console.log('Offer request created:', result.data?.id);
    
    // Step 2: Wait a moment for offers to be generated
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 3: Fetch the offers
    const offerRequestId = result.data?.id;
    if (!offerRequestId) {
      throw new Error('No offer request ID returned');
    }
    
    const offersResponse = await fetch(`/duffel/air/offers?offer_request_id=${offerRequestId}`);
    
    if (!offersResponse.ok) {
      const errorText = await offersResponse.text();
      console.error('Failed to fetch offers:', errorText);
      // If offers fetch fails, return empty array - we still have the offer request
      return [];
    }
    
    const offersResult = await offersResponse.json();
    console.log('Found', offersResult.data?.length || 0, 'offers');
    
    // Transform Duffel offers to our app's expected format
    return transformDuffelOffers(offersResult.data || []);
  } catch (error) {
    console.error('Duffel API Error:', error.message);
    throw error; // Re-throw so the UI can show the error
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