import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Search, Star, MapPin, ArrowLeft, X, Loader, AlertCircle, CheckCircle, Clock, Tag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { attractionService } from '../lib/attractionService';
import { bookingService } from '../lib/bookingService';
import { notificationService } from '../lib/notificationService';

const CATEGORIES = ['All', 'Museum', 'Landmark', 'Theme Park', 'Nature', 'Historical Site', 'Entertainment', 'Sports', 'Art Gallery'];

export const AttractionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('All');
  const [visitDate, setVisitDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  const [attractions, setAttractions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [ticketPrices, setTicketPrices] = useState(null);
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
      const results = await attractionService.searchAttractions(
        location,
        category !== 'All' ? category : null
      );
      setAttractions(results || []);
    } catch (err) {
      setError(err.message || 'Failed to search attractions.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (attraction) => {
    setSelectedAttraction(attraction);
    setDetailLoading(true);
    try {
      const [fullAttraction, prices] = await Promise.all([
        attractionService.getAttraction(attraction.attraction_id),
        attractionService.getTicketPrices(attraction.attraction_id),
      ]);
      setSelectedAttraction(fullAttraction || attraction);
      setTicketPrices(prices);
    } catch {
      setTicketPrices(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const calcTotal = (attraction) => {
    const adultPrice = ticketPrices?.adult ?? attraction?.ticket_prices?.adult ?? 0;
    const childPrice = ticketPrices?.child ?? attraction?.ticket_prices?.child ?? 0;
    return (adultPrice * adults) + (childPrice * children);
  };

  const handleBook = async (attractionId) => {
    if (!user) { navigate('/login'); return; }
    setBookingStates(prev => ({ ...prev, [attractionId]: 'loading' }));
    setBookingErrors(prev => ({ ...prev, [attractionId]: '' }));
    try {
      const total = calcTotal(selectedAttraction);
      const booking = await bookingService.createBooking({
        user_id: user.id,
        booking_type: 'attraction',
        service_id: attractionId,
        service_name: selectedAttraction?.name || 'Attraction Ticket',
        total_price: total,
        currency: 'USD',
        start_date: visitDate || new Date().toISOString().split('T')[0],
        status: 'confirmed',
        notes: `${adults} adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''} | ${selectedAttraction?.name}`,
      });
      await notificationService.sendBookingConfirmation(user.id, booking.booking_id);
      setBookingStates(prev => ({ ...prev, [attractionId]: 'success' }));
      setTimeout(() => setBookingStates(prev => ({ ...prev, [attractionId]: '' })), 4000);
    } catch (err) {
      setBookingErrors(prev => ({ ...prev, [attractionId]: err.message || 'Booking failed' }));
      setBookingStates(prev => ({ ...prev, [attractionId]: 'error' }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-5 h-5" />Back to Home
          </button>
          <div className="flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold text-slate-900">Attractions</span>
          </div>
          {user ? (
            <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-blue-600 hover:text-blue-700 transition">My Dashboard</button>
          ) : (
            <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">Sign In</button>
          )}
        </div>
      </nav>

      {/* Search */}
      <div className="bg-white border-b border-slate-200 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Explore Attractions</h1>
          <p className="text-slate-500 mb-6">Discover museums, landmarks, and experiences worldwide</p>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="City or destination" value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
              </div>
              <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <input type="number" min={1} max={20} value={adults} onChange={e => setAdults(parseInt(e.target.value) || 1)}
                    placeholder="Adults"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                  <input type="number" min={0} max={20} value={children} onChange={e => setChildren(parseInt(e.target.value) || 0)}
                    placeholder="Children"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
              <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition">
                <Search className="w-4 h-4" /> Search
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-600">Category:</span>
              {CATEGORIES.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${category === c ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:border-blue-400'}`}>
                  {c}
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
            <span className="ml-3 text-slate-600 text-lg">Discovering attractions...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}
        {!isLoading && hasSearched && !error && attractions.length === 0 && (
          <div className="text-center py-20">
            <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No attractions found</h3>
            <p className="text-slate-400">Try a different city or category.</p>
          </div>
        )}
        {!isLoading && attractions.length > 0 && (
          <>
            <p className="text-slate-500 mb-6 text-sm">
              <strong className="text-slate-900">{attractions.length}</strong> attraction{attractions.length !== 1 ? 's' : ''} found in <strong className="text-slate-900">{location}</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attractions.map(a => (
                <div key={a.attraction_id} className="bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-200 transition overflow-hidden">
                  <div className="h-44 bg-gradient-to-br from-purple-50 to-slate-100 flex items-center justify-center">
                    <Ticket className="w-16 h-16 text-purple-200" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{a.name}</h3>
                      {a.rating && (
                        <span className="flex items-center gap-1 text-sm font-semibold text-yellow-600 ml-2 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />{a.rating}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{a.city}</span>
                      {a.category && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{a.category}</span>}
                    </div>
                    {a.opening_hours && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                        <Clock className="w-3 h-3" />{a.opening_hours}
                      </p>
                    )}
                    {a.description && (
                      <p className="text-slate-500 text-sm line-clamp-2 mb-4">{a.description}</p>
                    )}
                    {a.requires_advance_booking && (
                      <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200 mb-3">
                        Advance booking required
                      </span>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        {a.ticket_prices?.adult != null && (
                          <p className="text-sm text-slate-600">From <strong className="text-blue-600">${a.ticket_prices.adult}</strong>/adult</p>
                        )}
                      </div>
                      <button onClick={() => openDetail(a)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition">
                        Get Tickets
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
            <Ticket className="w-20 h-20 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400">Enter a destination to discover attractions</h3>
          </div>
        )}
      </div>

      {/* Attraction Detail Modal */}
      {selectedAttraction && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAttraction(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{selectedAttraction.name}</h2>
              <button onClick={() => setSelectedAttraction(null)} className="p-2 hover:bg-slate-100 rounded-lg transition">
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
                    {selectedAttraction.category && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">{selectedAttraction.category}</span>
                    )}
                    {selectedAttraction.rating && (
                      <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />{selectedAttraction.rating}
                      </span>
                    )}
                    {selectedAttraction.requires_advance_booking && (
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">Advance Booking Required</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm flex items-center gap-1 mb-1">
                    <MapPin className="w-4 h-4" />{selectedAttraction.city}
                  </p>
                  {selectedAttraction.opening_hours && (
                    <p className="text-slate-500 text-sm flex items-center gap-1 mb-4">
                      <Clock className="w-4 h-4" />{selectedAttraction.opening_hours}
                    </p>
                  )}
                  {selectedAttraction.description && (
                    <p className="text-slate-600 mb-5">{selectedAttraction.description}</p>
                  )}

                  {/* Ticket pricing */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-5">
                    <h3 className="font-semibold text-slate-900 mb-3">Tickets</h3>
                    <div className="space-y-2 mb-4">
                      {(ticketPrices?.adult != null || selectedAttraction.ticket_prices?.adult != null) && (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Adult</p>
                            <p className="text-xs text-slate-400">${ticketPrices?.adult ?? selectedAttraction.ticket_prices?.adult} per person</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-7 h-7 rounded-full border border-slate-300 hover:border-blue-400 flex items-center justify-center text-slate-600 font-bold transition">-</button>
                            <span className="w-6 text-center font-semibold text-slate-900">{adults}</span>
                            <button onClick={() => setAdults(adults + 1)} className="w-7 h-7 rounded-full border border-slate-300 hover:border-blue-400 flex items-center justify-center text-slate-600 font-bold transition">+</button>
                          </div>
                        </div>
                      )}
                      {(ticketPrices?.child != null || selectedAttraction.ticket_prices?.child != null) && (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-slate-700">Child</p>
                            <p className="text-xs text-slate-400">${ticketPrices?.child ?? selectedAttraction.ticket_prices?.child} per child</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-7 h-7 rounded-full border border-slate-300 hover:border-blue-400 flex items-center justify-center text-slate-600 font-bold transition">-</button>
                            <span className="w-6 text-center font-semibold text-slate-900">{children}</span>
                            <button onClick={() => setChildren(children + 1)} className="w-7 h-7 rounded-full border border-slate-300 hover:border-blue-400 flex items-center justify-center text-slate-600 font-bold transition">+</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Visit Date</label>
                      <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                      <p className="text-sm font-medium text-slate-700">Total</p>
                      <p className="text-xl font-bold text-blue-600">${calcTotal(selectedAttraction)}</p>
                    </div>
                  </div>

                  {(() => {
                    const state = bookingStates[selectedAttraction.attraction_id];
                    const bookErr = bookingErrors[selectedAttraction.attraction_id];
                    return state === 'success' ? (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle className="w-5 h-5" /> Tickets booked! Check your dashboard.
                      </div>
                    ) : (
                      <>
                        {bookErr && (
                          <div className="flex items-center gap-1 text-red-600 text-sm mb-3">
                            <AlertCircle className="w-4 h-4" />{bookErr}
                          </div>
                        )}
                        <button onClick={() => handleBook(selectedAttraction.attraction_id)}
                          disabled={state === 'loading'}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition">
                          {state === 'loading' ? (
                            <><Loader className="w-5 h-5 animate-spin" /> Booking...</>
                          ) : 'Book Tickets'}
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
