import React, { useEffect, useState } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { hotelService } from '../lib/hotelService';
import { flightService } from '../lib/flightService';
import { restaurantService } from '../lib/restaurantService';
import { attractionService } from '../lib/attractionService';
import { spaService } from '../lib/spaService';
import { bundleService } from '../lib/bundleService';
import { airports, cities } from '../data/airports.js';

export const SearchComponent = ({ onResults, onSearchStart, initialSearchType, initialParams = {} }) => {
  const [searchType, setSearchType] = useState(initialSearchType || 'hotels');
  const [origin, setOrigin] = useState(initialParams?.location || 'BEY');
  const [destination, setDestination] = useState(initialParams?.destination || '');
  const [location, setLocation] = useState(initialParams?.location || '');
  const [checkIn, setCheckIn] = useState(initialParams?.date || '');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [tripType, setTripType] = useState('one-way');
  const [cabinClass, setCabinClass] = useState('economy');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialSearchType) {
      setSearchType(initialSearchType);
    }
  }, [initialSearchType]);
  
  // Helper to extract airport code from full string like "Dubai International Airport (DXB)"
  const extractAirportCode = (input) => {
    if (!input) return '';
    // Check if input contains parentheses with code
    const match = input.match(/\(([A-Z]{3})\)$/);
    if (match) return match[1];
    // Otherwise check if it's already a valid airport code
    if (airports.some(a => a.code === input.toUpperCase())) return input.toUpperCase();
    // Check if input matches an airport name
    const airport = airports.find(a => 
      input.toLowerCase().includes(a.name.toLowerCase()) ||
      a.name.toLowerCase().includes(input.toLowerCase())
    );
    return airport?.code || input;
  };

  // Pre-fill form with initial parameters from URL
  useEffect(() => {
    if (initialParams) {
      if (initialParams.location) {
        if (initialSearchType === 'flights') {
          // Extract just the airport code from full name like "Dubai International Airport (DXB)"
          const airportCode = extractAirportCode(initialParams.location);
          setOrigin(airportCode);
        } else {
          setLocation(initialParams.location);
        }
      }
      if (initialParams.destination) {
        // Extract just the airport code from full name
        const airportCode = extractAirportCode(initialParams.destination);
        setDestination(airportCode);
      }
      if (initialParams.date) {
        setCheckIn(initialParams.date);
      }
    }
  }, [initialParams, initialSearchType]);

  useEffect(() => {
    setCheckIn('');
    setCheckOut('');
    if (searchType === 'flights') {
      setLocation('');
      // Set default origin and destination if not already set
      setOrigin((current) => current || 'BEY');
      setDestination((current) => current || 'DXB');
    } else {
      setOrigin('');
      setDestination('');
    }
  }, [searchType]);

  const handleSearch = async (event) => {
    event.preventDefault();

    // For flights, set default date to today if not selected
    let searchCheckIn = checkIn;
    if (searchType === 'flights') {
      if (!origin || !destination) {
        alert('Please select both origin and destination airports');
        return;
      }
      if (!searchCheckIn) {
        searchCheckIn = new Date().toISOString().split('T')[0];
        setCheckIn(searchCheckIn);
      }
    }

    if (searchType !== 'flights' && !location) {
      alert('Please enter a location');
      return;
    }

    setIsLoading(true);
    onSearchStart?.();

    try {
      let results = [];

      switch (searchType) {
        case 'hotels':
          results = await hotelService.searchHotels(location, checkIn, checkOut, guests);
          break;
        case 'flights':
          results = await flightService.searchFlights(
            origin,
            destination,
            searchCheckIn,
            tripType === 'round-trip' ? checkOut : null,
            guests,
            cabinClass
          );
          break;
        case 'restaurants':
          results = await restaurantService.searchRestaurants(location, null, guests);
          break;
        case 'attractions':
          results = await attractionService.searchAttractions(location);
          break;
        case 'spa':
          results = await spaService.searchSpaVenues(location);
          break;
        case 'bundles':
          results = await bundleService.getPublishedBundles({ destination: location });
          break;
        default:
          results = [];
      }

      onResults(results, searchType);
    } catch (error) {
      console.error('Search failed:', error);
      // Show actual error message if available, otherwise show generic message
      const errorMessage = error?.message || error;
      const isValidErrorMessage = errorMessage && typeof errorMessage === 'string' && !errorMessage.includes('undefined');
      
      const messages = {
        flights: isValidErrorMessage ? errorMessage : 'No flights found for this route. Please select valid airports (DXB, CDG, or BEY).',
        hotels: 'No hotels found in this city for the selected dates. Try different dates or a nearby city.',
        restaurants: 'No restaurants found in this city. Try a different city or check back later.',
        attractions: 'No attractions found in this city. Try a different city or expand your search.',
        spa: 'No spa services found in this city. Try a different city or check back later.',
        bundles: 'No bundles found for this destination. Try another city.',
      };
      alert(messages[searchType] || errorMessage || 'Search failed. Please try again.');
      onResults([], searchType);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Search Travel Services</h3>

      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Service Type
          </label>
          <select
            value={searchType}
            onChange={(event) => setSearchType(event.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="hotels">Hotels</option>
            <option value="flights">Flights</option>
            <option value="restaurants">Restaurants</option>
            <option value="attractions">Attractions</option>
            <option value="spa">Spa & Wellness</option>
            <option value="bundles">Travel Bundles</option>
          </select>
        </div>

        {searchType === 'flights' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
              {['one-way', 'round-trip'].map((mode) => (
                <button
                  type="button"
                  key={mode}
                  onClick={() => setTripType(mode)}
                  className={`rounded-md px-3 py-2 text-sm font-medium capitalize ${tripType === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
                >
                  {mode.replace('-', ' ')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Origin Airport
                <select
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select origin airport</option>
                  {airports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.code} - {airport.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Destination Airport
                <select
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select destination airport</option>
                  {airports.map((airport) => (
                    <option key={airport.code} value={airport.code}>
                      {airport.code} - {airport.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              City
            </label>
            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select a city</option>
              {cities.map((city) => (
                <option key={`${city.name}-${city.country}`} value={city.name}>
                  {city.name}, {city.country}
                </option>
              ))}
            </select>
          </div>
        )}

        {(searchType === 'hotels' || searchType === 'restaurants' || searchType === 'attractions' || searchType === 'spa' || searchType === 'flights') && (
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-slate-700">
              <Calendar className="w-4 h-4 inline mr-1" />
              {searchType === 'flights' ? 'Departure Date' : 'Check-in / Start Date'}
              <input
                type="date"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
                className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </label>

            {(searchType === 'hotels' || (searchType === 'flights' && tripType === 'round-trip')) && (
              <label className="block text-sm font-medium text-slate-700">
                <Calendar className="w-4 h-4 inline mr-1" />
                {searchType === 'flights' ? 'Return Date' : 'Check-out'}
                <input
                  type="date"
                  value={checkOut}
                  onChange={(event) => setCheckOut(event.target.value)}
                  className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required={searchType === 'flights' && tripType === 'round-trip'}
                />
              </label>
            )}
          </div>
        )}

        {searchType === 'flights' && checkIn && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Fare calendar</p>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 15 }, (_, index) => {
                const date = new Date(checkIn);
                date.setDate(date.getDate() + index - 7);
                const value = date.toISOString().split('T')[0];
                const fare = 280 + Math.abs(index - 7) * 18;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCheckIn(value)}
                    className={`rounded-md border px-2 py-1 text-xs ${checkIn === value ? 'border-blue-600 bg-white text-blue-700' : 'border-blue-100 bg-white/70 text-slate-600'}`}
                  >
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <span className="block font-semibold">${fare}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {searchType === 'flights' && (
          <label className="block text-sm font-medium text-slate-700">
            Cabin Class
            <select
              value={cabinClass}
              onChange={(event) => setCabinClass(event.target.value)}
              className="mt-2 w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </label>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Guests
          </label>
          <input
            type="number"
            value={guests}
            onChange={(event) => setGuests(parseInt(event.target.value, 10) || 1)}
            min="1"
            max="10"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
};
