import React, { useState } from 'react';
import { X, Calendar, Users, CreditCard, Shield, Plane, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../lib/bookingService';
import { useAuth } from '../context/AuthContext';

export const FlightBookingModal = ({ flight, isOpen, onClose, onBookingSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState({
    passengers: [
      {
        first_name: '',
        last_name: '',
        email: user?.email || '',
        phone: '',
        date_of_birth: '',
        passport_number: '',
        nationality: ''
      }
    ],
    travel_date: '',
    cabin_class: 'economy',
    additional_services: {
      insurance: false,
      extra_baggage: false,
      seat_selection: false
    },
    payment_method: 'credit_card'
  });
  
  const [isBooking, setIsBooking] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const validatePassenger = (passenger) => {
    const errors = {};
    if (!passenger.first_name) errors.first_name = 'First name is required';
    if (!passenger.last_name) errors.last_name = 'Last name is required';
    if (!passenger.email) errors.email = 'Email is required';
    if (!passenger.phone) errors.phone = 'Phone is required';
    if (!passenger.date_of_birth) errors.date_of_birth = 'Date of birth is required';
    return errors;
  };

  const handleNextStep = () => {
    const newErrors = validatePassenger(bookingData.passengers[0]);
    
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
        booking_type: 'flight',
        service_id: flight.offer_id,
        flight_details: {
          airline_code: flight.airline_code,
          flight_number: flight.flight_number,
          origin: flight.origin,
          destination: flight.destination,
          departure_time: flight.departure_time,
          arrival_time: flight.arrival_time,
          duration_minutes: flight.duration_minutes,
          stops: flight.stops
        },
        passengers: bookingData.passengers,
        travel_date: bookingData.travel_date,
        cabin_class: bookingData.cabin_class,
        additional_services: bookingData.additional_services,
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
    let basePrice = flight.price || 0;
    let additionalCost = 0;
    
    if (bookingData.additional_services.insurance) additionalCost += 50;
    if (bookingData.additional_services.extra_baggage) additionalCost += 75;
    if (bookingData.additional_services.seat_selection) additionalCost += 25;
    
    return basePrice + additionalCost;
  };

  const addPassenger = () => {
    setBookingData(prev => ({
      ...prev,
      passengers: [...prev.passengers, {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        passport_number: '',
        nationality: ''
      }]
    }));
  };

  const updatePassenger = (index, field, value) => {
    const newPassengers = [...bookingData.passengers];
    newPassengers[index][field] = value;
    setBookingData(prev => ({ ...prev, passengers: newPassengers }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Book Your Flight</h2>
              <p className="text-slate-600 mt-1">
                {flight.airline_code} {flight.flight_number} • {flight.origin} → {flight.destination}
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
                  {step === 1 ? 'Passengers' : step === 2 ? 'Services' : 'Payment'}
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
          {/* Step 1: Passenger Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Passenger Information</h3>
              
              {bookingData.passengers.map((passenger, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-slate-900">
                      Passenger {index + 1} {index === 0 && '(Primary)'}
                    </h4>
                    {index > 0 && (
                      <button
                        onClick={() => {
                          const newPassengers = bookingData.passengers.filter((_, i) => i !== index);
                          setBookingData(prev => ({ ...prev, passengers: newPassengers }));
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
                        value={passenger.first_name}
                        onChange={(e) => updatePassenger(index, 'first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      {errors[`passenger_${index}_first_name`] && (
                        <p className="text-red-600 text-sm mt-1">{errors[`passenger_${index}_first_name`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={passenger.last_name}
                        onChange={(e) => updatePassenger(index, 'last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      {errors[`passenger_${index}_last_name`] && (
                        <p className="text-red-600 text-sm mt-1">{errors[`passenger_${index}_last_name`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={passenger.email}
                        onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={passenger.phone}
                        onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={passenger.date_of_birth}
                        onChange={(e) => updatePassenger(index, 'date_of_birth', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
                      <input
                        type="text"
                        value={passenger.passport_number}
                        onChange={(e) => updatePassenger(index, 'passport_number', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addPassenger}
                className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                + Add Another Passenger
              </button>
            </div>
          )}

          {/* Step 2: Additional Services */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Additional Services</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Travel Date</label>
                <input
                  type="date"
                  value={bookingData.travel_date}
                  onChange={(e) => setBookingData(prev => ({ ...prev, travel_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cabin Class</label>
                <select
                  value={bookingData.cabin_class}
                  onChange={(e) => setBookingData(prev => ({ ...prev, cabin_class: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="economy">Economy</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="business">Business</option>
                  <option value="first">First Class</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Optional Services</h4>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Travel Insurance</p>
                      <p className="text-sm text-slate-600">Coverage for trip cancellation, medical emergencies</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.insurance}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, insurance: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$50</p>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Extra Baggage</p>
                      <p className="text-sm text-slate-600">Additional checked bag (23kg)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.extra_baggage}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, extra_baggage: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$75</p>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Seat Selection</p>
                      <p className="text-sm text-slate-600">Choose your preferred seat</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.seat_selection}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, seat_selection: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$25</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Payment Information</h3>
              
              <div className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3">Flight Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Flight:</span>
                    <span className="font-medium">{flight.airline_code} {flight.flight_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Route:</span>
                    <span className="font-medium">{flight.origin} → {flight.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Passengers:</span>
                    <span className="font-medium">{bookingData.passengers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Price:</span>
                    <span className="font-medium">${flight.price || 0}</span>
                  </div>
                  {bookingData.additional_services.insurance && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Travel Insurance:</span>
                      <span className="font-medium">+$50</span>
                    </div>
                  )}
                  {bookingData.additional_services.extra_baggage && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Extra Baggage:</span>
                      <span className="font-medium">+$75</span>
                    </div>
                  )}
                  {bookingData.additional_services.seat_selection && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Seat Selection:</span>
                      <span className="font-medium">+$25</span>
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
