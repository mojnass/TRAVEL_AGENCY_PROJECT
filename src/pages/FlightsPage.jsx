import React, { useState } from 'react';
import { ArrowLeft, Search, MapPin, Calendar, Users, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { flightService } from '../lib/flightService';
import { CartComponent } from '../components/CartComponent';
import { BundleCreator } from '../components/BundleCreator';

export const FlightsPage = () => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!origin || !destination || !departureDate) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsSearching(true);
    try {
      console.log('🔍 Flight search called with:', { origin, destination, departureDate, returnDate, passengers });
      const results = await flightService.searchFlights(origin, destination, departureDate, returnDate, passengers);
      console.log('✅ Flight search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Flight search failed:', error);
      alert('Flight search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-900">Flight Search</span>
          </div>
          <div className="w-28" /> {/* spacer for centering logo */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── Left sidebar ── */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Search Flights</h3>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
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
                    <MapPin className="w-4 h-4 inline mr-1" />
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Departure
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Return (Optional)
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Passengers
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition"
                >
                  {isSearching ? 'Searching...' : 'Search Flights'}
                </button>
              </form>
            </div>
            
            <CartComponent />
            <BundleCreator />
          </div>

          {/* ── Results area ── */}
          <div className="lg:col-span-2">
            {isSearching ? (
              <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Searching flights...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  Found {searchResults.length} flights
                </h3>
                {searchResults.map((flight, index) => (
                  <div key={flight.offer_id || index} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg font-bold text-slate-900">{flight.airline_code}</span>
                          <span className="text-slate-600">{flight.flight_number}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <span>{flight.origin}</span>
                          <span>→</span>
                          <span>{flight.destination}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          ${flight.price?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-sm text-slate-600">{flight.currency || 'USD'}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-slate-600">Departure</div>
                        <div className="font-medium">
                          {new Date(flight.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="text-slate-600">
                          {new Date(flight.departure_time).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-600">Arrival</div>
                        <div className="font-medium">
                          {new Date(flight.arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                        <div className="text-slate-600">
                          {new Date(flight.arrival_time).toLocaleDateString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-600">Duration</div>
                        <div className="font-medium">{Math.floor(flight.duration_minutes / 60)}h {flight.duration_minutes % 60}m</div>
                        <div className="text-slate-600">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} stops`}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
                <Plane className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Search for flights</h3>
                <p className="text-slate-600">Enter your travel details above to find available flights</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
