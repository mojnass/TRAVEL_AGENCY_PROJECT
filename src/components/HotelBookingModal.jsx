import React, { useState } from 'react';
import { X, Calendar, Users, CreditCard, Shield, Hotel, Clock, MapPin, Wifi, Car, Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../lib/bookingService';
import { useAuth } from '../context/AuthContext';

export const HotelBookingModal = ({ hotel, isOpen, onClose, onBookingSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState({
    guests: [
      {
        first_name: '',
        last_name: '',
        email: user?.email || '',
        phone: '',
        age: ''
      }
    ],
    check_in: '',
    check_out: '',
    room_type: 'standard',
    additional_services: {
      breakfast: false,
      airport_transfer: false,
      spa_access: false,
      late_checkout: false
    },
    payment_method: 'credit_card',
    special_requests: ''
  });
  
  const [isBooking, setIsBooking] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const validateGuest = (guest) => {
    const errors = {};
    if (!guest.first_name) errors.first_name = 'First name is required';
    if (!guest.last_name) errors.last_name = 'Last name is required';
    if (!guest.email) errors.email = 'Email is required';
    if (!guest.phone) errors.phone = 'Phone is required';
    if (!guest.age) errors.age = 'Age is required';
    return errors;
  };

  const handleNextStep = () => {
    const newErrors = validateGuest(bookingData.guests[0]);
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    setCurrentStep(currentStep + 1);
  };

  const handleBooking = async () => {
    if (!user) {
      alert('Please log in to make a booking');
      return;
    }

    setIsBooking(true);
    setErrors({});

    try {
      const bookingPayload = {
        user_id: user.id,
        booking_type: 'hotel',
        service_id: hotel.hotel_id,
        hotel_details: {
          name: hotel.name,
          city: hotel.city,
          rating: hotel.rating,
          amenities: hotel.amenities
        },
        guests: bookingData.guests,
        check_in: bookingData.check_in,
        check_out: bookingData.check_out,
        room_type: bookingData.room_type,
        additional_services: bookingData.additional_services,
        special_requests: bookingData.special_requests,
        total_price: calculateTotalPrice(),
        currency: 'USD',
        status: 'pending',
        payment_method: bookingData.payment_method
      };

      const booking = await bookingService.createBooking(bookingPayload);
      
      setIsBooking(false);
      onBookingSuccess(booking);
      onClose();
      
      // Navigate to booking confirmation page
      navigate(`/booking-confirmation/${booking.booking_id}`);
      
    } catch (error) {
      setIsBooking(false);
      setErrors({ booking: error.message });
    }
  };

  const calculateTotalPrice = () => {
    const nights = calculateNights();
    let basePrice = hotel.price_per_night || 0;
    let additionalCost = 0;
    
    if (bookingData.additional_services.breakfast) additionalCost += 15 * nights;
    if (bookingData.additional_services.airport_transfer) additionalCost += 50;
    if (bookingData.additional_services.spa_access) additionalCost += 25 * nights;
    if (bookingData.additional_services.late_checkout) additionalCost += 30;
    
    return (basePrice * nights) + additionalCost;
  };

  const calculateNights = () => {
    if (!bookingData.check_in || !bookingData.check_out) return 1;
    const checkIn = new Date(bookingData.check_in);
    const checkOut = new Date(bookingData.check_out);
    return Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
  };

  const addGuest = () => {
    setBookingData(prev => ({
      ...prev,
      guests: [...prev.guests, {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        age: ''
      }]
    }));
  };

  const updateGuest = (index, field, value) => {
    const newGuests = [...bookingData.guests];
    newGuests[index][field] = value;
    setBookingData(prev => ({ ...prev, guests: newGuests }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Book Your Hotel</h2>
              <p className="text-slate-600 mt-1">
                {hotel.name} • {hotel.city}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {step}
                </div>
                <span className={`ml-2 text-sm ${
                  currentStep >= step ? 'text-blue-600 font-medium' : 'text-slate-600'
                }`}>
                  {step === 1 ? 'Guests' : step === 2 ? 'Services' : 'Payment'}
                </span>
                {step < 3 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Guest Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Guest Information</h3>
              
              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check-in Date</label>
                  <input
                    type="date"
                    value={bookingData.check_in}
                    onChange={(e) => setBookingData(prev => ({ ...prev, check_in: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Check-out Date</label>
                  <input
                    type="date"
                    value={bookingData.check_out}
                    onChange={(e) => setBookingData(prev => ({ ...prev, check_out: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Room Type</label>
                <select
                  value={bookingData.room_type}
                  onChange={(e) => setBookingData(prev => ({ ...prev, room_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="standard">Standard Room</option>
                  <option value="deluxe">Deluxe Room</option>
                  <option value="suite">Suite</option>
                  <option value="presidential">Presidential Suite</option>
                </select>
              </div>
              
              {/* Guest Information */}
              {bookingData.guests.map((guest, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-slate-900">
                      Guest {index + 1} {index === 0 && '(Primary)'}
                    </h4>
                    {index > 0 && (
                      <button
                        onClick={() => {
                          const newGuests = bookingData.guests.filter((_, i) => i !== index);
                          setBookingData(prev => ({ ...prev, guests: newGuests }));
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={guest.first_name}
                        onChange={(e) => updateGuest(index, 'first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={guest.last_name}
                        onChange={(e) => updateGuest(index, 'last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={guest.email}
                        onChange={(e) => updateGuest(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={guest.phone}
                        onChange={(e) => updateGuest(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                      <input
                        type="number"
                        value={guest.age}
                        onChange={(e) => updateGuest(index, 'age', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addGuest}
                className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                + Add Another Guest
              </button>
            </div>
          )}

          {/* Step 2: Additional Services */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Additional Services</h3>
              
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Optional Services</h4>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Coffee className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Breakfast Included</p>
                      <p className="text-sm text-slate-600">Daily continental breakfast</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.breakfast}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, breakfast: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$15/night</p>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Car className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Airport Transfer</p>
                      <p className="text-sm text-slate-600">Round-trip airport shuttle</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.airport_transfer}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, airport_transfer: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$50</p>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Spa Access</p>
                      <p className="text-sm text-slate-600">Full spa facility access</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.spa_access}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, spa_access: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$25/night</p>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Late Checkout</p>
                      <p className="text-sm text-slate-600">Checkout until 2 PM</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.late_checkout}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, late_checkout: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$30</p>
                  </div>
                </label>
              </div>
              
              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Special Requests</label>
                <textarea
                  value={bookingData.special_requests}
                  onChange={(e) => setBookingData(prev => ({ ...prev, special_requests: e.target.value }))}
                  placeholder="Any special requests or preferences..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Payment Information</h3>
              
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Hotel:</span>
                    <span className="font-medium">{hotel.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Room Type:</span>
                    <span className="font-medium">{bookingData.room_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Nights:</span>
                    <span className="font-medium">{calculateNights()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Guests:</span>
                    <span className="font-medium">{bookingData.guests.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Room Rate:</span>
                    <span className="font-medium">${hotel.price_per_night || 0}/night</span>
                  </div>
                  {bookingData.additional_services.breakfast && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Breakfast:</span>
                      <span className="font-medium">+$15/night</span>
                    </div>
                  )}
                  {bookingData.additional_services.airport_transfer && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Airport Transfer:</span>
                      <span className="font-medium">+$50</span>
                    </div>
                  )}
                  {bookingData.additional_services.spa_access && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Spa Access:</span>
                      <span className="font-medium">+$25/night</span>
                    </div>
                  )}
                  {bookingData.additional_services.late_checkout && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Late Checkout:</span>
                      <span className="font-medium">+$30</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-900">Total:</span>
                      <span className="font-bold text-blue-600 text-lg">${calculateTotalPrice()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select
                  value={bookingData.payment_method}
                  onChange={(e) => setBookingData(prev => ({ ...prev, payment_method: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Secure Payment</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Your payment information is encrypted and secure. We never store your credit card details.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {errors.booking && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{errors.booking}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 transition"
                >
                  Back
                </button>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleBooking}
                  disabled={isBooking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition flex items-center gap-2"
                >
                  {isBooking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Complete Booking - $${calculateTotalPrice()}`
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
