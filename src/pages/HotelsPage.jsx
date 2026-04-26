import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, Search, Star, MapPin, Users, ArrowLeft, X, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hotelService } from '../lib/hotelService';
import { bookingService } from '../lib/bookingService';
import { notificationService } from '../lib/notificationService';

export const HotelsPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [starFilter, setStarFilter] = useState('');

  const [hotels, setHotels] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedHotel, setSelectedHotel] = useState(null);
  const [hotelDetail, setHotelDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [bookingStates, setBookingStates] = useState({});
  const [bookingErrors, setBookingErrors] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!location.trim()) return;
    setIsLoading(true);
    setError('');
    setHasSearched(true);
    try {
      let results = await hotelService.searchHotels(location, checkIn, checkOut, guests);
      if (starFilter) {
        results = (results || []).filter(h => h.star_rating === parseInt(starFilter));
      }
      setHotels(results || []);
    } catch (err) {
      setError(err.message || 'Failed to search hotels. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openHotelDetail = async (hotel) => {
    setSelectedHotel(hotel);
    setSelectedRoom(null);
    setDetailLoading(true);
    try {
      const detail = await hotelService.getHotelWithRooms(hotel.hotel_id);
      setHotelDetail(detail);
    } catch {
      setHotelDetail(hotel);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBook = async (hotelId, roomId) => {
    if (!authUser) { navigate('/login'); return; }
    const key = `${hotelId}_${roomId}`;
    setBookingStates(prev => ({ ...prev, [key]: 'loading' }));
    setBookingErrors(prev => ({ ...prev, [key]: '' }));

    const nights = checkIn && checkOut
      ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
      : 1;

    try {
      const booking = await bookingService.createBooking({
        user_id: authUser.id,
        booking_type: 'hotel',
        service_id: hotelId,
        service_name: selectedHotel?.name || 'Hotel Booking',
        total_price: (selectedRoom?.price_per_night || 0) * nights,
        currency: 'USD',
        start_date: checkIn || new Date().toISOString().split('T')[0],
        end_date: checkOut || null,
        status: 'confirmed',
        notes: `Room: ${selectedRoom?.room_type || 'Standard'} | ${nights} night(s) | ${guests} guest(s)`,
      });
      await notificationService.sendBookingConfirmation(authUser.id, booking.booking_id);
      setBookingStates(prev => ({ ...prev, [key]: 'success' }));
      setTimeout(() => setBookingStates(prev => ({ ...prev, [key]: '' })), 4000);
    } catch (err) {
      setBookingErrors(prev => ({ ...prev, [key]: err.message || 'Booking failed' }));
      setBookingStates(prev => ({ ...prev, [key]: 'error' }));
    }
  };

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 1;

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
            <Hotel className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold text-slate-900">Hotels</span>
          </div>
          {authUser ? (
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Your Perfect Stay</h1>
          <p className="text-slate-500 mb-6">Search and book hotels worldwide</p>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="City or destination"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)}
                placeholder="Check-in"
                className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)}
                placeholder="Check-out"
                className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="number" min={1} max={10} value={guests} onChange={e => setGuests(parseInt(e.target.value) || 1)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition">
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </div>
            {/* Star filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">Star Rating:</span>
              {['', '3', '4', '5'].map(s => (
                <button key={s} type="button" onClick={() => setStarFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${starFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'}`}>
                  {s === '' ? 'All' : '⭐'.repeat(parseInt(s))}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-slate-600 text-lg">Searching hotels...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && hasSearched && !error && hotels.length === 0 && (
          <div className="text-center py-20">
            <Hotel className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No hotels found</h3>
            <p className="text-slate-400">Try a different destination or adjust your filters.</p>
          </div>
        )}

        {!isLoading && hotels.length > 0 && (
          <>
            <p className="text-slate-500 mb-6 text-sm">
              <strong className="text-slate-900">{hotels.length}</strong> hotel{hotels.length !== 1 ? 's' : ''} found in <strong className="text-slate-900">{location}</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.map(hotel => (
                <div key={hotel.hotel_id} className="bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-200 transition overflow-hidden">
                  <div className="h-44 bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
                    <Hotel className="w-16 h-16 text-blue-200" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{hotel.name}</h3>
                      <div className="flex gap-px ml-2 flex-shrink-0">
                        {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      {hotel.city}{hotel.country ? `, ${hotel.country}` : ''}
                    </p>
                    {hotel.description && (
                      <p className="text-slate-500 text-sm line-clamp-2 mb-4">{hotel.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold text-blue-600">
                          ${hotel.hotel_rooms?.[0]?.price_per_night ?? '—'}
                        </span>
                        <span className="text-slate-400 text-sm"> /night</span>
                      </div>
                      <button onClick={() => openHotelDetail(hotel)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition">
                        View Rooms
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!hasSearched && (
          <div className="text-center py-20">
            <Hotel className="w-20 h-20 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400">Enter a destination to start searching</h3>
          </div>
        )}
      </div>

      {/* Hotel Detail Modal */}
      {selectedHotel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedHotel(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{selectedHotel.name}</h2>
              <button onClick={() => setSelectedHotel(null)} className="p-2 hover:bg-slate-100 rounded-lg transition">
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
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: selectedHotel.star_rating || 0 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-500 flex items-center gap-1 text-sm mb-4">
                    <MapPin className="w-4 h-4" />
                    {selectedHotel.city}{selectedHotel.country ? `, ${selectedHotel.country}` : ''}
                  </p>
                  {selectedHotel.description && (
                    <p className="text-slate-600 mb-6">{selectedHotel.description}</p>
                  )}

                  <h3 className="font-semibold text-slate-900 mb-3">Available Rooms</h3>
                  {hotelDetail?.hotel_rooms?.filter(r => r.is_available).length > 0 ? (
                    <div className="space-y-3 mb-6">
                      {hotelDetail.hotel_rooms.filter(r => r.is_available).map(room => {
                        const key = `${selectedHotel.hotel_id}_${room.room_id}`;
                        const state = bookingStates[key];
                        const bookErr = bookingErrors[key];
                        return (
                          <div key={room.room_id}
                            onClick={() => setSelectedRoom(room)}
                            className={`p-4 border-2 rounded-xl cursor-pointer transition ${selectedRoom?.room_id === room.room_id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-slate-900">{room.room_type}</p>
                                <p className="text-sm text-slate-500">Up to {room.max_occupancy} guest{room.max_occupancy !== 1 ? 's' : ''}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-blue-600">${room.price_per_night}</p>
                                <p className="text-xs text-slate-400">per night</p>
                              </div>
                            </div>
                            {selectedRoom?.room_id === room.room_id && (
                              <div className="mt-3">
                                {checkIn && checkOut && (
                                  <p className="text-sm text-blue-700 font-medium mb-2">
                                    Total: ${room.price_per_night * nights} for {nights} night{nights !== 1 ? 's' : ''}
                                  </p>
                                )}
                                {state === 'success' ? (
                                  <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                                    <CheckCircle className="w-4 h-4" /> Booking confirmed! Check your dashboard.
                                  </div>
                                ) : (
                                  <>
                                    {bookErr && (
                                      <div className="flex items-center gap-1 text-red-600 text-sm mb-2">
                                        <AlertCircle className="w-4 h-4" /> {bookErr}
                                      </div>
                                    )}
                                    <button
                                      onClick={e => { e.stopPropagation(); handleBook(selectedHotel.hotel_id, room.room_id); }}
                                      disabled={state === 'loading'}
                                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition">
                                      {state === 'loading' ? (
                                        <><Loader className="w-4 h-4 animate-spin" /> Booking...</>
                                      ) : 'Book This Room'}
                                    </button>
                                    {!authUser && (
                                      <p className="text-xs text-center text-slate-400 mt-1">You'll be asked to sign in</p>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm py-4">No rooms available for the selected dates.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
