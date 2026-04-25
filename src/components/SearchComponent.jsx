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
  const [isLoading, setIsLoading] = useState(false);

  // Update search type when initialSearchType changes
  useEffect(() => {
    if (initialSearchType) {
      setSearchType(initialSearchType);
    }
  }, [initialSearchType]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!location) return;

    setIsLoading(true);
    onSearchStart?.(); // Call onSearchStart if provided
    try {
      let results = [];

      switch (searchType) {
        case 'hotels':
          results = await hotelService.searchHotels(location, checkIn, checkOut, guests);
          break;
        case 'flights':
          // For flights, we'd need origin/destination, using location as destination
          results = await flightService.searchFlights('NYC', location, checkIn, null, guests);
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

        {(searchType === 'hotels' || searchType === 'flights') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Check-in / Departure
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            {searchType === 'hotels' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Guests
          </label>
          <input
            type="number"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
            min="1"
            max="10"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !location}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Search {searchType.charAt(0).toUpperCase() + searchType.slice(1)}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
