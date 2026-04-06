import React, { useState } from 'react';
import { Hotel, Plane, Utensils, Ticket, Star, MapPin, Loader, AlertCircle, ShoppingCart } from 'lucide-react';
import { bookingService } from '../lib/bookingService';
import { notificationService } from '../lib/notificationService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const ResultsDisplay = ({ results, searchType }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [bookingStates, setBookingStates] = useState({});
  const [errors, setErrors] = useState({});

  const handleBooking = async (result, type) => {
    if (!user) {
      alert('Please log in to make a booking');
      return;
    }

    const bookingId = `${type}_${result.hotel_id || result.offer_id || result.restaurant_id || result.attraction_id}`;
    setBookingStates(prev => ({ ...prev, [bookingId]: 'loading' }));
    setErrors(prev => ({ ...prev, [bookingId]: '' }));

    try {
      let bookingData = {
        user_id: user.id,
        booking_type: type.slice(0, -1), // Remove 's' from plural
        service_id: result.hotel_id || result.offer_id || result.restaurant_id || result.attraction_id,
        total_price: result.price_per_night || result.price || 0,
        currency: 'USD',
        start_date: new Date().toISOString().split('T')[0],
        status: 'pending'
      };

      // Create the booking
      const booking = await bookingService.createBooking(bookingData);
      
      // Send notification
      await notificationService.sendBookingConfirmation(user.id, booking.booking_id);
      
      setBookingStates(prev => ({ ...prev, [bookingId]: 'success' }));
      
      // Show success message
      setTimeout(() => {
        setBookingStates(prev => ({ ...prev, [bookingId]: '' }));
      }, 3000);
      
    } catch (error) {
      setErrors(prev => ({ ...prev, [bookingId]: error.message }));
      setBookingStates(prev => ({ ...prev, [bookingId]: 'error' }));
    }
  };
  const getIcon = (type) => {
    const icons = {
      hotels: Hotel,
      flights: Plane,
      restaurants: Utensils,
      attractions: Ticket
    };
    const Icon = icons[type] || Hotel;
    return <Icon className="w-5 h-5" />;
  };

  const renderResult = (result) => {
    switch (searchType) {
      case 'hotels':
        return (
          <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-slate-900">{result.name}</h4>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {result.city}, {result.country}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{result.star_rating || 'N/A'}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-3 line-clamp-2">{result.description}</p>
            <div className="flex justify-between items-center">
              <p className="text-lg font-bold text-blue-600">
                ${result.price_per_night || 0}/night
              </p>
              <div className="flex items-center gap-2">
                {(() => {
                  const bookingId = `hotels_${result.hotel_id}`;
                  const state = bookingStates[bookingId];
                  const error = errors[bookingId];
                  
                  return (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addToCart(result, 'hotels')}
                          className="px-3 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm rounded-lg transition flex items-center gap-1"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleBooking(result, 'hotels')}
                          disabled={state === 'loading'}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition flex items-center gap-2"
                        >
                          {state === 'loading' ? (
                            <>
                              <Loader className="w-3 h-3 animate-spin" />
                              Booking...
                            </>
                          ) : state === 'success' ? (
                            '✓ Booked!'
                          ) : (
                            'Book Now'
                          )}
                        </button>
                      </div>
                      {error && (
                        <div className="flex items-center gap-1 text-red-600 text-xs">
                          <AlertCircle className="w-3 h-3" />
                          {error}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );

      case 'flights':
        return (
          <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-slate-900">
                  {result.airline_code} {result.flight_number}
                </h4>
                <p className="text-sm text-slate-600">
                  {result.origin} → {result.destination}
                </p>
              </div>
              <span className="text-sm text-slate-600">
                {result.stops || 0} stops
              </span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">Duration: {result.duration_minutes} min</p>
                <p className="text-lg font-bold text-blue-600">
                  ${result.price || 0}
                </p>
              </div>
              {(() => {
                const bookingId = `flights_${result.offer_id}`;
                const state = bookingStates[bookingId];
                const error = errors[bookingId];
                
                return (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleBooking(result, 'flights')}
                      disabled={state === 'loading'}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition flex items-center gap-2"
                    >
                      {state === 'loading' ? (
                        <>
                          <Loader className="w-3 h-3 animate-spin" />
                          Booking...
                        </>
                      ) : state === 'success' ? (
                        '✓ Booked!'
                      ) : (
                        'Book Flight'
                      )}
                    </button>
                    {error && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );

      case 'restaurants':
        return (
          <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-slate-900">{result.name}</h4>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {result.city}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{result.rating || '0'}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-3">{result.cuisine_type} • {result.price_tier}</p>
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">Available tables</p>
              {(() => {
                const bookingId = `restaurants_${result.restaurant_id}`;
                const state = bookingStates[bookingId];
                const error = errors[bookingId];
                
                return (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleBooking(result, 'restaurants')}
                      disabled={state === 'loading'}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition flex items-center gap-2"
                    >
                      {state === 'loading' ? (
                        <>
                          <Loader className="w-3 h-3 animate-spin" />
                          Booking...
                        </>
                      ) : state === 'success' ? (
                        '✓ Reserved!'
                      ) : (
                        'Reserve Table'
                      )}
                    </button>
                    {error && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );

      case 'attractions':
        return (
          <div className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-slate-900">{result.name}</h4>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {result.city}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{result.rating || '0'}</span>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-3">{result.category}</p>
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">
                {result.requires_advance_booking ? 'Booking required' : 'Walk-in available'}
              </p>
              {(() => {
                const bookingId = `attractions_${result.attraction_id}`;
                const state = bookingStates[bookingId];
                const error = errors[bookingId];
                
                return (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleBooking(result, 'attractions')}
                      disabled={state === 'loading'}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm rounded-lg transition flex items-center gap-2"
                    >
                      {state === 'loading' ? (
                        <>
                          <Loader className="w-3 h-3 animate-spin" />
                          Booking...
                        </>
                      ) : state === 'success' ? (
                        '✓ Tickets!'
                      ) : (
                        'Get Tickets'
                      )}
                    </button>
                    {error && (
                      <div className="flex items-center gap-1 text-red-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        {error}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-slate-400 mb-2">
          {getIcon(searchType)}
        </div>
        <p className="text-slate-600">No {searchType} found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
        {getIcon(searchType)}
        {results.length} {searchType.charAt(0).toUpperCase() + searchType.slice(1)} Found
      </h3>
      {results.map((result, index) => (
        <div key={index}>
          {renderResult(result)}
        </div>
      ))}
    </div>
  );
};
