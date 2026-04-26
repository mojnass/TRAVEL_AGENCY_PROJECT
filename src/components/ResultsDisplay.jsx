import { useState } from 'react';
import { Hotel, MapPin, Package, Plane, ShoppingCart, Sparkles, Star, Ticket, Utensils } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FlightBookingModal } from './FlightBookingModal';
import { ServiceBookingModal } from './ServiceBookingModal';

const serviceConfig = {
  hotels: { icon: Hotel, bookingType: 'hotel', action: 'Book Now' },
  flights: { icon: Plane, bookingType: 'flight', action: 'Book Flight' },
  restaurants: { icon: Utensils, bookingType: 'restaurant', action: 'Reserve Table' },
  attractions: { icon: Ticket, bookingType: 'attraction', action: 'Get Tickets' },
  spa: { icon: Sparkles, bookingType: 'spa', action: 'Book Spa' },
  bundles: { icon: Package, bookingType: 'bundle', action: 'Select Bundle' },
};

const getServiceId = (result) => (
  result.hotel_id ||
  result.offer_id ||
  result.restaurant_id ||
  result.attraction_id ||
  result.spa_id ||
  result.bundle_id ||
  result.user_bundle_id ||
  result.id
);

const getPrice = (result) => (
  Number(result.price_per_night || result.hotel_rooms?.[0]?.price_per_night || result.spa_services?.[0]?.price || result.discounted_price || result.composition_data?.discounted_price || result.price || 0)
);

export const ResultsDisplay = ({ results, searchType }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [flightCheckout, setFlightCheckout] = useState(null);
  const [serviceCheckout, setServiceCheckout] = useState(null);
  const [flightFilters, setFlightFilters] = useState({
    maxPrice: '',
    stops: 'any',
    airline: '',
    departureWindow: 'any',
    arrivalWindow: 'any',
    sort: 'best',
  });
  const [serviceFilters, setServiceFilters] = useState({
    minStars: '',
    amenity: '',
    cuisine: '',
  });

  const config = serviceConfig[searchType] || serviceConfig.hotels;
  const HeaderIcon = config.icon;

  const renderSummary = (result) => {
    if (searchType === 'flights') {
      return {
        title: `${result.airline_code || ''} ${result.flight_number || ''}`.trim() || 'Flight offer',
        location: `${result.origin || 'Origin'} to ${result.destination || 'Destination'}`,
        meta: `${result.stops || 0} stops`,
        description: `Duration: ${result.duration_minutes || 'TBD'} min`,
        priceLabel: `$${getPrice(result)}`,
      };
    }

    if (searchType === 'hotels') {
      return {
        title: result.name,
        location: [result.city, result.country].filter(Boolean).join(', '),
        meta: result.star_rating ? `${result.star_rating} stars` : 'Hotel',
        description: result.description,
        priceLabel: `$${getPrice(result)}/night`,
      };
    }

    if (searchType === 'restaurants') {
      return {
        title: result.name,
        location: result.city,
        meta: result.rating || '0',
        description: `${result.cuisine_type || 'Restaurant'} - ${result.price_tier || 'Any budget'}`,
        priceLabel: 'Available tables',
      };
    }

    if (searchType === 'attractions') {
      const adultPrice = result.ticket_prices?.adult || result.price || 0;
      return {
        title: result.name,
        location: result.city,
        meta: result.rating || '0',
        description: result.category || (result.requires_advance_booking ? 'Advance booking required' : 'Walk-in available'),
        priceLabel: adultPrice ? `$${adultPrice}` : 'Tickets available',
      };
    }

    if (searchType === 'bundles') {
      const composition = result.composition_data || {};
      const itemCount = composition.items?.length || result.bundle_components?.length || 0;
      return {
        title: result.name || composition.name || 'Travel Bundle',
        location: result.destination || composition.destination || 'Multiple destinations',
        meta: `${itemCount} items`,
        description: result.description || composition.description || 'Curated package with bundled savings',
        priceLabel: `$${getPrice(result)}`,
      };
    }

    return {
      title: result.name,
      location: result.city,
      meta: result.rating || '0',
      description: result.type || 'Wellness venue',
      priceLabel: `$${getPrice(result)}`,
    };
  };

  const renderResult = (result) => {
    const summary = renderSummary(result);
    const Icon = config.icon;

    return (
      <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition bg-white">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div>
            <h4 className="font-semibold text-slate-900">{summary.title}</h4>
            <p className="text-sm text-slate-600 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {summary.location || 'Location TBD'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-600">
            {searchType === 'flights' ? <Plane className="w-4 h-4 text-blue-600" /> : <Star className="w-4 h-4 text-yellow-500 fill-current" />}
            <span>{summary.meta}</span>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{summary.description}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-bold text-blue-600">{summary.priceLabel}</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => addToCart(result, searchType)}
                className="px-3 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm rounded-lg transition flex items-center gap-1"
              >
                <ShoppingCart className="w-3 h-3" />
                Add to Cart
              </button>
              <button
                onClick={() => (searchType === 'flights' ? setFlightCheckout(result) : setServiceCheckout(result))}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition flex items-center gap-2"
              >
                <Icon className="w-3 h-3" />
                {config.action}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filterByWindow = (value, windowName) => {
    if (windowName === 'any') return true;
    const hour = Number(String(value || '12:00').slice(0, 2));
    if (windowName === 'morning') return hour >= 6 && hour < 12;
    if (windowName === 'afternoon') return hour >= 12 && hour < 18;
    if (windowName === 'evening') return hour >= 18 && hour < 24;
    return true;
  };

  const visibleResults = searchType === 'flights'
    ? results
      .filter((result) => !flightFilters.maxPrice || getPrice(result) <= Number(flightFilters.maxPrice))
      .filter((result) => flightFilters.stops === 'any' || Number(result.stops || 0) === 0)
      .filter((result) => !flightFilters.airline || String(result.airline_code || '').toLowerCase().includes(flightFilters.airline.toLowerCase()))
      .filter((result) => filterByWindow(result.departure_time, flightFilters.departureWindow))
      .filter((result) => filterByWindow(result.arrival_time, flightFilters.arrivalWindow))
      .slice()
      .sort((a, b) => {
        if (flightFilters.sort === 'price') return getPrice(a) - getPrice(b);
        if (flightFilters.sort === 'duration') return Number(a.duration_minutes || 9999) - Number(b.duration_minutes || 9999);
        if (flightFilters.sort === 'departure') return String(a.departure_time || '23:59').localeCompare(String(b.departure_time || '23:59'));
        return (getPrice(a) + Number(a.duration_minutes || 0) + Number(a.stops || 0) * 80) - (getPrice(b) + Number(b.duration_minutes || 0) + Number(b.stops || 0) * 80);
      })
    : searchType === 'hotels'
      ? results
        .filter((result) => !serviceFilters.minStars || Number(result.star_rating || 0) >= Number(serviceFilters.minStars))
        .filter((result) => !serviceFilters.amenity || String(result.amenities || result.description || '').toLowerCase().includes(serviceFilters.amenity.toLowerCase()))
      : searchType === 'restaurants'
        ? results.filter((result) => !serviceFilters.cuisine || String(result.cuisine_type || '').toLowerCase().includes(serviceFilters.cuisine.toLowerCase()))
        : results;

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <HeaderIcon className="w-5 h-5 mx-auto text-slate-400 mb-2" />
        <p className="text-slate-600">No {searchType} found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        <HeaderIcon className="w-5 h-5" />
        {visibleResults.length} {searchType.charAt(0).toUpperCase() + searchType.slice(1)} Found
      </h3>
      {searchType === 'flights' && (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
          <input
            type="number"
            placeholder="Max price"
            value={flightFilters.maxPrice}
            onChange={(e) => setFlightFilters((current) => ({ ...current, maxPrice: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={flightFilters.stops}
            onChange={(e) => setFlightFilters((current) => ({ ...current, stops: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="any">Any stops</option>
            <option value="direct">Non-stop only</option>
          </select>
          <input
            placeholder="Airline code"
            value={flightFilters.airline}
            onChange={(e) => setFlightFilters((current) => ({ ...current, airline: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select
            value={flightFilters.departureWindow}
            onChange={(e) => setFlightFilters((current) => ({ ...current, departureWindow: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="any">Any departure</option>
            <option value="morning">Morning 06-12</option>
            <option value="afternoon">Afternoon 12-18</option>
            <option value="evening">Evening 18-24</option>
          </select>
          <select
            value={flightFilters.arrivalWindow}
            onChange={(e) => setFlightFilters((current) => ({ ...current, arrivalWindow: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="any">Any arrival</option>
            <option value="morning">Morning 06-12</option>
            <option value="afternoon">Afternoon 12-18</option>
            <option value="evening">Evening 18-24</option>
          </select>
          <select
            value={flightFilters.sort}
            onChange={(e) => setFlightFilters((current) => ({ ...current, sort: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="best">Best score</option>
            <option value="price">Cheapest</option>
            <option value="duration">Fastest</option>
            <option value="departure">Earliest departure</option>
          </select>
        </div>
      )}
      {searchType === 'hotels' && (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
          <select
            value={serviceFilters.minStars}
            onChange={(e) => setServiceFilters((current) => ({ ...current, minStars: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Any star rating</option>
            <option value="4">4 to 5 stars</option>
            <option value="5">5 stars</option>
          </select>
          <input
            placeholder="Amenity: Pool, Wi-Fi"
            value={serviceFilters.amenity}
            onChange={(e) => setServiceFilters((current) => ({ ...current, amenity: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      )}
      {searchType === 'restaurants' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <input
            placeholder="Filter cuisine type"
            value={serviceFilters.cuisine}
            onChange={(e) => setServiceFilters((current) => ({ ...current, cuisine: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      )}
      {visibleResults.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No results found. Adjust your search criteria or remove filters.
        </div>
      )}
      {visibleResults.map((result, index) => (
        <div key={getServiceId(result) || index}>{renderResult(result)}</div>
      ))}
      {flightCheckout && (
        <FlightBookingModal
          flight={flightCheckout}
          user={user}
          onClose={() => setFlightCheckout(null)}
          onBooked={() => setFlightCheckout(null)}
        />
      )}
      {serviceCheckout && (
        <ServiceBookingModal
          item={serviceCheckout}
          type={searchType}
          user={user}
          onClose={() => setServiceCheckout(null)}
          onBooked={() => undefined}
        />
      )}
    </div>
  );
};
