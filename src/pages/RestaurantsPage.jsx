import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, Search, Star, MapPin, Users, ArrowLeft, X, Loader, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { restaurantService } from '../lib/restaurantService';
import { bookingService } from '../lib/bookingService';
import { notificationService } from '../lib/notificationService';

const CUISINES = ['All', 'Lebanese', 'Italian', 'French', 'Japanese', 'Indian', 'Chinese', 'Mediterranean', 'American', 'Mexican'];
const PRICE_TIERS = ['All', '$', '$$', '$$$', '$$$$'];

export const RestaurantsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [location, setLocation] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [priceTier, setPriceTier] = useState('All');
  const [partySize, setPartySize] = useState(2);
  const [reservationDate, setReservationDate] = useState('');
  const [reservationTime, setReservationTime] = useState('');

  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantDetail, setRestaurantDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [bookingStates, setBookingStates] = useState({});
  const [bookingErrors, setBookingErrors] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!location.trim()) return;
    setIsLoading(true);
    setError('');
    setHasSearched(true);
    try {
      let results = await restaurantService.searchRestaurants(
        location,
        cuisine !== 'All' ? cuisine : null,
        partySize
      );
      if (priceTier !== 'All') {
        results = (results || []).filter(r => r.price_tier === priceTier);
      }
      setRestaurants(results || []);
    } catch (err) {
      setError(err.message || 'Failed to search restaurants.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setDetailLoading(true);
    try {
      const detail = await restaurantService.getRestaurantWithTables(restaurant.restaurant_id);
      setRestaurantDetail(detail);
    } catch {
      setRestaurantDetail(restaurant);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBook = async (restaurantId) => {
    if (!user) { navigate('/login'); return; }
    setBookingStates(prev => ({ ...prev, [restaurantId]: 'loading' }));
    setBookingErrors(prev => ({ ...prev, [restaurantId]: '' }));
    try {
      const pricePerPerson = selectedRestaurant?.avg_price_per_person || 40;
      const booking = await bookingService.createBooking({
        user_id: user.id,
        booking_type: 'restaurant',
        service_id: restaurantId,
        service_name: selectedRestaurant?.name || 'Restaurant Reservation',
        total_price: pricePerPerson * partySize,
        currency: 'USD',
        start_date: reservationDate || new Date().toISOString().split('T')[0],
        status: 'confirmed',
        notes: `Party of ${partySize}${reservationTime ? ` at ${reservationTime}` : ''} | ${selectedRestaurant?.name}`,
      });
      await notificationService.sendBookingConfirmation(user.id, booking.booking_id);
      setBookingStates(prev => ({ ...prev, [restaurantId]: 'success' }));
      setTimeout(() => setBookingStates(prev => ({ ...prev, [restaurantId]: '' })), 4000);
    } catch (err) {
      setBookingErrors(prev => ({ ...prev, [restaurantId]: err.message || 'Reservation failed' }));
      setBookingStates(prev => ({ ...prev, [restaurantId]: 'error' }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <Utensils className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold text-slate-900">Restaurants</span>
          </div>
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-blue-600 hover:text-blue-700 transition">
              My Dashboard
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Search Section */}
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Reserve a Table</h1>
          <p className="text-slate-500 mb-6">Discover the best restaurants and book instantly</p>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="City or destination" value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
              </div>
              <input type="date" value={reservationDate} onChange={e => setReservationDate(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <input type="time" value={reservationTime} onChange={e => setReservationTime(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="number" min={1} max={20} value={partySize} onChange={e => setPartySize(parseInt(e.target.value) || 1)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition">
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-600">Cuisine:</span>
                {CUISINES.map(c => (
                  <button key={c} type="button" onClick={() => setCuisine(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${cuisine === c ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:border-blue-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Price:</span>
                {PRICE_TIERS.map(p => (
                  <button key={p} type="button" onClick={() => setPriceTier(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${priceTier === p ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:border-blue-400'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-slate-600 text-lg">Finding restaurants...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}
        {!isLoading && hasSearched && !error && restaurants.length === 0 && (
          <div className="text-center py-20">
            <Utensils className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No restaurants found</h3>
            <p className="text-slate-400">Try a different city or adjust your filters.</p>
          </div>
        )}
        {!isLoading && restaurants.length > 0 && (
          <>
            <p className="text-slate-500 mb-6 text-sm">
              <strong className="text-slate-900">{restaurants.length}</strong> restaurant{restaurants.length !== 1 ? 's' : ''} found in <strong className="text-slate-900">{location}</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map(r => (
                <div key={r.restaurant_id} className="bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-200 transition overflow-hidden">
                  <div className="h-44 bg-gradient-to-br from-orange-50 to-slate-100 flex items-center justify-center">
                    <Utensils className="w-16 h-16 text-orange-200" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{r.name}</h3>
                      {r.rating && (
                        <span className="flex items-center gap-1 text-sm font-semibold text-yellow-600 ml-2 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />{r.rating}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                      {r.cuisine_type && <span>{r.cuisine_type}</span>}
                      {r.price_tier && <span className="font-medium text-slate-700">{r.price_tier}</span>}
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{r.city}</span>
                    </div>
                    {r.opening_hours && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                        <Clock className="w-3 h-3" />{r.opening_hours}
                      </p>
                    )}
                    {r.description && (
                      <p className="text-slate-500 text-sm line-clamp-2 mb-4">{r.description}</p>
                    )}
                    <button onClick={() => openDetail(r)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
                      Reserve Table
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {!hasSearched && (
          <div className="text-center py-20">
            <Utensils className="w-20 h-20 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400">Enter a city to find restaurants</h3>
          </div>
        )}
      </div>

      {/* Restaurant Detail Modal */}
      {selectedRestaurant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedRestaurant(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{selectedRestaurant.name}</h2>
              <button onClick={() => setSelectedRestaurant(null)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedRestaurant.cuisine_type && (
                      <span className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">{selectedRestaurant.cuisine_type}</span>
                    )}
                    {selectedRestaurant.price_tier && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">{selectedRestaurant.price_tier}</span>
                    )}
                    {selectedRestaurant.rating && (
                      <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />{selectedRestaurant.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm flex items-center gap-1 mb-1">
                    <MapPin className="w-4 h-4" />{selectedRestaurant.city}
                    {selectedRestaurant.address ? ` · ${selectedRestaurant.address}` : ''}
                  </p>
                  {selectedRestaurant.opening_hours && (
                    <p className="text-slate-500 text-sm flex items-center gap-1 mb-4">
                      <Clock className="w-4 h-4" />{selectedRestaurant.opening_hours}
                    </p>
                  )}
                  {selectedRestaurant.description && (
                    <p className="text-slate-600 mb-6">{selectedRestaurant.description}</p>
                  )}

                  {/* Available tables */}
                  {restaurantDetail?.restaurant_tables?.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-slate-900 mb-3">Available Tables</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {restaurantDetail.restaurant_tables
                          .filter(t => t.is_available && t.capacity >= partySize)
                          .map(table => (
                            <div key={table.table_id}
                              className="p-3 border border-slate-200 rounded-lg text-center bg-green-50 border-green-200">
                              <p className="text-sm font-medium text-slate-800">Table {table.table_id}</p>
                              <p className="text-xs text-slate-500">{table.capacity} seats</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Booking details */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-5">
                    <h3 className="font-semibold text-slate-900 mb-3">Reservation Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                        <input type="date" value={reservationDate} onChange={e => setReservationDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Time</label>
                        <input type="time" value={reservationTime} onChange={e => setReservationTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">Party of <strong>{partySize}</strong></p>
                  </div>

                  {(() => {
                    const state = bookingStates[selectedRestaurant.restaurant_id];
                    const bookErr = bookingErrors[selectedRestaurant.restaurant_id];
                    return state === 'success' ? (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle className="w-5 h-5" /> Reservation confirmed! Check your dashboard.
                      </div>
                    ) : (
                      <>
                        {bookErr && (
                          <div className="flex items-center gap-1 text-red-600 text-sm mb-3">
                            <AlertCircle className="w-4 h-4" />{bookErr}
                          </div>
                        )}
                        <button onClick={() => handleBook(selectedRestaurant.restaurant_id)}
                          disabled={state === 'loading'}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition">
                          {state === 'loading' ? (
                            <><Loader className="w-5 h-5 animate-spin" /> Reserving...</>
                          ) : 'Confirm Reservation'}
                        </button>
                        {!user && <p className="text-xs text-center text-slate-400 mt-2">You'll be asked to sign in</p>}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
