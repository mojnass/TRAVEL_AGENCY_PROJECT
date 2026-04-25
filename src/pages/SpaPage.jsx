import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, Star, MapPin, ArrowLeft, X, Loader, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { spaService } from '../lib/spaService';
import { bookingService } from '../lib/bookingService';
import { notificationService } from '../lib/notificationService';

const SPA_TYPES = ['All', 'Day Spa', 'Medical Spa', 'Resort Spa', 'Hammam', 'Wellness Center', 'Beauty Salon'];

export const SpaPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [location, setLocation] = useState('');
  const [spaType, setSpaType] = useState('All');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');

  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venueDetail, setVenueDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [bookingStates, setBookingStates] = useState({});
  const [bookingErrors, setBookingErrors] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!location.trim()) return;
    setIsLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const results = await spaService.searchSpaVenues(
        location,
        spaType !== 'All' ? spaType : null
      );
      setVenues(results || []);
    } catch (err) {
      setError(err.message || 'Failed to search spa venues.');
    } finally {
      setIsLoading(false);
    }
  };

  const openDetail = async (venue) => {
    setSelectedVenue(venue);
    setSelectedService(null);
    setDetailLoading(true);
    try {
      const detail = await spaService.getSpaVenueWithServices(venue.spa_id);
      setVenueDetail(detail);
    } catch {
      setVenueDetail(venue);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBook = async (spaId) => {
    if (!user) { navigate('/login'); return; }
    if (!selectedService) {
      setBookingErrors(prev => ({ ...prev, [spaId]: 'Please select a service first.' }));
      return;
    }
    const key = `${spaId}_${selectedService.service_id}`;
    setBookingStates(prev => ({ ...prev, [key]: 'loading' }));
    setBookingErrors(prev => ({ ...prev, [spaId]: '' }));
    try {
      const booking = await bookingService.createBooking({
        user_id: user.id,
        booking_type: 'spa',
        service_id: spaId,
        service_name: `${selectedVenue?.name} — ${selectedService.service_name}`,
        total_price: selectedService.price,
        currency: 'USD',
        start_date: appointmentDate || new Date().toISOString().split('T')[0],
        status: 'confirmed',
        notes: `${selectedService.service_name} (${selectedService.duration_minutes} min)${appointmentTime ? ` at ${appointmentTime}` : ''} | ${selectedVenue?.name}`,
      });
      await notificationService.sendBookingConfirmation(user.id, booking.booking_id);
      setBookingStates(prev => ({ ...prev, [key]: 'success' }));
      setTimeout(() => setBookingStates(prev => ({ ...prev, [key]: '' })), 4000);
    } catch (err) {
      setBookingErrors(prev => ({ ...prev, [spaId]: err.message || 'Booking failed' }));
      setBookingStates(prev => ({ ...prev, [key]: 'error' }));
    }
  };

  const bookKey = selectedService ? `${selectedVenue?.spa_id}_${selectedService.service_id}` : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition">
            <ArrowLeft className="w-5 h-5" />Back to Home
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold text-slate-900">Spa & Wellness</span>
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Spa & Wellness</h1>
          <p className="text-slate-500 mb-6">Relax and recharge with the best spa experiences</p>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative md:col-span-1">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="City or destination" value={location} onChange={e => setLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required />
              </div>
              <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition">
                <Search className="w-4 h-4" /> Search
              </button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-600">Type:</span>
              {SPA_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setSpaType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${spaType === t ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:border-blue-400'}`}>
                  {t}
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
            <span className="ml-3 text-slate-600 text-lg">Finding spa venues...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}
        {!isLoading && hasSearched && !error && venues.length === 0 && (
          <div className="text-center py-20">
            <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No spa venues found</h3>
            <p className="text-slate-400">Try a different city or venue type.</p>
          </div>
        )}
        {!isLoading && venues.length > 0 && (
          <>
            <p className="text-slate-500 mb-6 text-sm">
              <strong className="text-slate-900">{venues.length}</strong> spa venue{venues.length !== 1 ? 's' : ''} found in <strong className="text-slate-900">{location}</strong>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venues.map(v => (
                <div key={v.spa_id} className="bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-blue-200 transition overflow-hidden">
                  <div className="h-44 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-pink-200" />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">{v.name}</h3>
                      {v.rating && (
                        <span className="flex items-center gap-1 text-sm font-semibold text-yellow-600 ml-2 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />{v.rating}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
                      {v.type && <span className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded-full text-xs font-medium">{v.type}</span>}
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{v.city}</span>
                    </div>
                    {v.opening_hours && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mb-2">
                        <Clock className="w-3 h-3" />{v.opening_hours}
                      </p>
                    )}
                    {v.description && (
                      <p className="text-slate-500 text-sm line-clamp-2 mb-4">{v.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        {v.spa_services && v.spa_services.length > 0 && (
                          <p className="text-sm text-slate-500">From <strong className="text-blue-600">${Math.min(...v.spa_services.map(s => s.price))}</strong></p>
                        )}
                      </div>
                      <button onClick={() => openDetail(v)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition">
                        Book Now
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
            <Sparkles className="w-20 h-20 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400">Enter a city to find spa & wellness venues</h3>
          </div>
        )}
      </div>

      {/* Spa Detail Modal */}
      {selectedVenue && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedVenue(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{selectedVenue.name}</h2>
              <button onClick={() => setSelectedVenue(null)} className="p-2 hover:bg-slate-100 rounded-lg transition">
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
                    {selectedVenue.type && (
                      <span className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm font-medium">{selectedVenue.type}</span>
                    )}
                    {selectedVenue.rating && (
                      <span className="px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />{selectedVenue.rating}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm flex items-center gap-1 mb-1">
                    <MapPin className="w-4 h-4" />{selectedVenue.city}
                    {selectedVenue.address ? ` · ${selectedVenue.address}` : ''}
                  </p>
                  {selectedVenue.opening_hours && (
                    <p className="text-slate-500 text-sm flex items-center gap-1 mb-4">
                      <Clock className="w-4 h-4" />{selectedVenue.opening_hours}
                    </p>
                  )}
                  {selectedVenue.description && (
                    <p className="text-slate-600 mb-5">{selectedVenue.description}</p>
                  )}

                  {/* Services */}
                  <h3 className="font-semibold text-slate-900 mb-3">Select a Service</h3>
                  {venueDetail?.spa_services?.length > 0 ? (
                    <div className="space-y-3 mb-5">
                      {venueDetail.spa_services.map(service => (
                        <div key={service.service_id}
                          onClick={() => setSelectedService(service)}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition ${selectedService?.service_id === service.service_id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{service.service_name}</p>
                              <p className="text-sm text-slate-500">{service.duration_minutes} minutes</p>
                              {service.description && <p className="text-xs text-slate-400 mt-0.5">{service.description}</p>}
                            </div>
                            <p className="text-xl font-bold text-blue-600 ml-4">${service.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm mb-5">No services listed — contact the venue directly.</p>
                  )}

                  {/* Appointment details */}
                  <div className="bg-slate-50 rounded-xl p-4 mb-5">
                    <h3 className="font-semibold text-slate-900 mb-3">Appointment</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                        <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Time</label>
                        <input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>
                    {selectedService && (
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
                        <p className="text-sm font-medium text-slate-700">{selectedService.service_name}</p>
                        <p className="text-xl font-bold text-blue-600">${selectedService.price}</p>
                      </div>
                    )}
                  </div>

                  {(() => {
                    const state = bookKey ? bookingStates[bookKey] : null;
                    const bookErr = bookingErrors[selectedVenue.spa_id];
                    return state === 'success' ? (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle className="w-5 h-5" /> Appointment booked! Check your dashboard.
                      </div>
                    ) : (
                      <>
                        {bookErr && (
                          <div className="flex items-center gap-1 text-red-600 text-sm mb-3">
                            <AlertCircle className="w-4 h-4" />{bookErr}
                          </div>
                        )}
                        <button onClick={() => handleBook(selectedVenue.spa_id)}
                          disabled={state === 'loading'}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition">
                          {state === 'loading' ? (
                            <><Loader className="w-5 h-5 animate-spin" /> Booking...</>
                          ) : 'Confirm Appointment'}
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
