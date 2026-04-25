import React, { useState } from 'react';
import { X, Calendar, Users, CreditCard, Shield, Sparkles, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingService } from '../lib/bookingService';
import { useAuth } from '../context/AuthContext';

export const SpaBookingModal = ({ spa, isOpen, onClose, onBookingSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState({
    clients: [
      {
        first_name: '',
        last_name: '',
        email: user?.email || '',
        phone: '',
        age: '',
        gender: '',
        health_conditions: ''
      }
    ],
    appointment_date: '',
    appointment_time: '',
    services: [],
    therapist_preference: 'any',
    additional_services: {
      aromatherapy: false,
      hot_stones: false,
      deep_tissue: false,
      couples_room: false
    },
    payment_method: 'credit_card'
  });
  
  const [isBooking, setIsBooking] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const validateClient = (client) => {
    const errors = {};
    if (!client.first_name) errors.first_name = 'First name is required';
    if (!client.last_name) errors.last_name = 'Last name is required';
    if (!client.email) errors.email = 'Email is required';
    if (!client.phone) errors.phone = 'Phone is required';
    if (!client.age) errors.age = 'Age is required';
    if (!client.gender) errors.gender = 'Gender is required';
    return errors;
  };

  const handleNextStep = () => {
    const newErrors = validateClient(bookingData.clients[0]);
    
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
        booking_type: 'spa',
        service_id: spa.spa_id,
        spa_details: {
          name: spa.name,
          city: spa.city,
          rating: spa.rating,
          services: spa.services
        },
        guests: bookingData.clients,
        appointment_date: bookingData.appointment_date,
        appointment_time: bookingData.appointment_time,
        services: bookingData.services,
        therapist_preference: bookingData.therapist_preference,
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
    let basePrice = 120; // Base spa treatment price
    let additionalCost = 0;
    
    if (bookingData.additional_services.aromatherapy) additionalCost += 25;
    if (bookingData.additional_services.hot_stones) additionalCost += 40;
    if (bookingData.additional_services.deep_tissue) additionalCost += 35;
    if (bookingData.additional_services.couples_room) additionalCost += 60;
    
    return basePrice + additionalCost;
  };

  const addClient = () => {
    setBookingData(prev => ({
      ...prev,
      clients: [...prev.clients, {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        health_conditions: ''
      }]
    }));
  };

  const updateClient = (index, field, value) => {
    const newClients = [...bookingData.clients];
    newClients[index][field] = value;
    setBookingData(prev => ({ ...prev, clients: newClients }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Book Your Spa Treatment</h2>
              <p className="text-slate-600 mt-1">
                {spa.name} • {spa.city}
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
                  {step === 1 ? 'Client Info' : step === 2 ? 'Services' : 'Payment'}
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
          {/* Step 1: Client Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Appointment Information</h3>
              
              {/* Appointment Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={bookingData.appointment_date}
                    onChange={(e) => setBookingData(prev => ({ ...prev, appointment_date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Time</label>
                  <select
                    value={bookingData.appointment_time}
                    onChange={(e) => setBookingData(prev => ({ ...prev, appointment_time: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select time</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="19:00">7:00 PM</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Therapist Preference</label>
                <select
                  value={bookingData.therapist_preference}
                  onChange={(e) => setBookingData(prev => ({ ...prev, therapist_preference: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="any">No Preference</option>
                  <option value="male">Male Therapist</option>
                  <option value="female">Female Therapist</option>
                  <option value="senior">Senior Therapist</option>
                </select>
              </div>
              
              {/* Client Information */}
              <h4 className="font-medium text-slate-900 mt-6">Client Information</h4>
              {bookingData.clients.map((client, index) => (
                <div key={index} className="border border-slate-200 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={client.first_name}
                        onChange={(e) => updateClient(index, 'first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={client.last_name}
                        onChange={(e) => updateClient(index, 'last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={client.email}
                        onChange={(e) => updateClient(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={client.phone}
                        onChange={(e) => updateClient(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                      <input
                        type="number"
                        value={client.age}
                        onChange={(e) => updateClient(index, 'age', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                      <select
                        value={client.gender}
                        onChange={(e) => updateClient(index, 'gender', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Health Conditions</label>
                      <textarea
                        value={client.health_conditions}
                        onChange={(e) => updateClient(index, 'health_conditions', e.target.value)}
                        placeholder="Any health conditions, allergies, or concerns..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={addClient}
                className="w-full py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                + Add Another Client
              </button>
            </div>
          )}

          {/* Step 2: Services */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Treatment Services</h3>
              
              <div className="space-y-3">
                <h4 className="font-medium text-slate-900">Available Services</h4>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Aromatherapy</p>
                      <p className="text-sm text-slate-600">Essential oil massage therapy</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.aromatherapy}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, aromatherapy: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$25</p>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Hot Stone Therapy</p>
                      <p className="text-sm text-slate-600">Heated stone massage treatment</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.hot_stones}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, hot_stones: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$40</p>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Deep Tissue Massage</p>
                      <p className="text-sm text-slate-600">Intensive muscle work</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.deep_tissue}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, deep_tissue: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$35</p>
                  </div>
                </label>
                
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-slate-900">Couples Room</p>
                      <p className="text-sm text-slate-600">Private couples treatment room</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <input
                      type="checkbox"
                      checked={bookingData.additional_services.couples_room}
                      onChange={(e) => setBookingData(prev => ({
                        ...prev,
                        additional_services: { ...prev.additional_services, couples_room: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600"
                    />
                    <p className="text-sm text-slate-600 mt-1">+$60</p>
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
                <h4 className="font-medium text-slate-900 mb-3">Booking Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Spa:</span>
                    <span className="font-medium">{spa.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Date:</span>
                    <span className="font-medium">{bookingData.appointment_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Time:</span>
                    <span className="font-medium">{bookingData.appointment_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Therapist:</span>
                    <span className="font-medium">{bookingData.therapist_preference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Treatment:</span>
                    <span className="font-medium">$120</span>
                  </div>
                  {bookingData.additional_services.aromatherapy && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Aromatherapy:</span>
                      <span className="font-medium">+$25</span>
                    </div>
                  )}
                  {bookingData.additional_services.hot_stones && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Hot Stone Therapy:</span>
                      <span className="font-medium">+$40</span>
                    </div>
                  )}
                  {bookingData.additional_services.deep_tissue && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Deep Tissue:</span>
                      <span className="font-medium">+$35</span>
                    </div>
                  )}
                  {bookingData.additional_services.couples_room && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Couples Room:</span>
                      <span className="font-medium">+$60</span>
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
