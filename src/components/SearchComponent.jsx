import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { hotelService } from '../lib/hotelService';
import { flightService } from '../lib/flightService';
import { restaurantService } from '../lib/restaurantService';
import { attractionService } from '../lib/attractionService';
import { spaService } from '../lib/spaService';
import { airports, cities } from '../data/airports.js';

export const SearchComponent = ({ onResults, onSearchStart, initialSearchType }) => {
  const [searchType, setSearchType] = useState(initialSearchType || 'hotels');
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update search type when initialSearchType changes
  useEffect(() => {
    if (initialSearchType) {
      setSearchType(initialSearchType);
    }
  }, [initialSearchType]);

  // Reset form fields when search type changes
  useEffect(() => {
    if (searchType === 'flights') {
      setLocation('');
      setCheckIn('');
      setCheckOut('');
    } else {
      setOrigin('');
      setDestination('');
    }
  }, [searchType]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!location && (searchType === 'hotels' || searchType === 'restaurants' || searchType === 'attractions' || searchType === 'spa')) {
      alert('Please enter a location');
      return;
    }
    
    if (searchType === 'flights' && (!origin || !destination || !checkIn)) {
      alert('Please enter origin, destination, and departure date');
      return;
    }
    
    if (searchType === 'hotels' && (!location || !checkIn)) {
      alert('Please enter location and check-in date');
      return;
    }
    
    setIsLoading(true);
    onSearchStart?.(); // Call onSearchStart if provided
    try {
      let results = [];

      switch (searchType) {
        case 'hotels':
          results = await hotelService.searchHotels(location, checkIn, checkOut, guests);
          break;
        case 'flights':
          results = await flightService.searchFlights(origin, destination, checkIn, checkOut, guests);
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
          // For bundles, show a message to build bundles
          results = [];
          alert('Build your own bundle by adding items to your cart from different services!');
          break;
        default:
          results = [];
      }

      onResults(results, searchType);
    } catch (error) {
      console.error('Search failed:', error);
      
      // Better error messages based on search type
      let errorMessage = 'Search failed. Please try again.';
      
      if (searchType === 'flights') {
        if (error.message.includes('No flights found') || results.length === 0) {
          errorMessage = 'No flights found for this route and date. Try different airports or dates.';
        } else if (error.message.includes('origin') || error.message.includes('destination')) {
          errorMessage = 'Invalid airport selection. Please check your origin and destination airports.';
        } else if (error.message.includes('date')) {
          errorMessage = 'Invalid date. Please select a future date for departure.';
        }
      } else if (searchType === 'hotels') {
        errorMessage = 'No hotels found in this city for the selected dates. Try different dates or a nearby city.';
      } else if (searchType === 'restaurants') {
        errorMessage = 'No restaurants found in this city. Try a different city or check back later.';
      } else if (searchType === 'attractions') {
        errorMessage = 'No attractions found in this city. Try a different city or expand your search.';
      } else if (searchType === 'spa') {
        errorMessage = 'No spa services found in this city. Try a different city or check back later.';
      }
      
      alert(errorMessage);
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
            onChange={(e) => setSearchType(e.target.value)}
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

        {/* Location field for non-flight services */}
        {searchType !== 'flights' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              City
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select a city</option>
              {cities.map(city => (
                <option key={city.name} value={city.name}>
                  {city.name}, {city.country}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Flight-specific fields */}
        {searchType === 'flights' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Origin Airport
                </label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select origin airport</option>
                  {airports.map(airport => (
                    <option key={airport.code} value={airport.code}>
                      {airport.code} - {airport.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Destination Airport
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select destination airport</option>
                  {airports.map(airport => (
                    <option key={airport.code} value={airport.code}>
                      {airport.code} - {airport.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Departure Date
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>
        )}

        {/* Hotel/Restaurant/Attraction/Spa fields */}
        {(searchType === 'hotels' || searchType === 'restaurants' || searchType === 'attractions' || searchType === 'spa') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Check-in / Start Date
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            {searchType === 'hotels' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {/* Guests field for applicable services */}
        {(searchType === 'hotels' || searchType === 'restaurants' || searchType === 'attractions' || searchType === 'spa' || searchType === 'flights') && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Number of Guests
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
};
