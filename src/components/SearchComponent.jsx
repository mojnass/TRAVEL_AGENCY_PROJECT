import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
import { hotelService } from '../lib/hotelService';
import { flightService } from '../lib/flightService';
import { restaurantService } from '../lib/restaurantService';
import { attractionService } from '../lib/attractionService';
import { spaService } from '../lib/spaService';

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
      console.log('🎯 SearchComponent searchType set to:', initialSearchType);
    }
  }, [initialSearchType]);

  // Log current search type for debugging
  useEffect(() => {
    console.log('🔍 SearchComponent current searchType:', searchType);
    console.log('🔍 Should show flight fields:', searchType === 'flights');
    console.log('🔍 InitialSearchType received:', initialSearchType);
  }, [searchType, initialSearchType]);

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
          console.log('🔍 Flight search called with:', { origin, destination, checkIn, guests });
          results = await flightService.searchFlights(origin, destination, checkIn, checkOut, guests);
          console.log('✅ Flight search results:', results);
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
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or destination"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        )}

        {/* Flight-specific fields */}
        {searchType === 'flights' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Origin
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="Departure city (e.g., NYC)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Arrival city (e.g., DXB)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
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
