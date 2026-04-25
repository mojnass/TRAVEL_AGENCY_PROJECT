import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Plane, Calendar, Users, MapPin, Clock, ArrowLeft, Download, Mail } from 'lucide-react';
import { bookingService } from '../lib/bookingService';
import { useAuth } from '../context/AuthContext';

export const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchBooking = async () => {
      try {
        const bookingData = await bookingService.getBookingById(bookingId);
        setBooking(bookingData);
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const handleDownloadTicket = () => {
    // Generate PDF ticket
    const ticketData = {
      booking_id: booking.booking_id,
      flight_details: booking.flight_details,
      passengers: booking.passengers,
      total_price: booking.total_price
    };
    
    // This would integrate with a PDF generation library
    console.log('Downloading ticket:', ticketData);
    alert('Ticket download feature coming soon!');
  };

  const handleEmailConfirmation = () => {
    // Send email confirmation
    console.log('Sending email confirmation for booking:', booking.booking_id);
    alert('Email confirmation sent!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Booking not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-slate-900">Booking Confirmation</h1>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-lg font-semibold text-green-900">Booking Confirmed!</h2>
              <p className="text-green-700">Your flight has been successfully booked. Confirmation details have been sent to your email.</p>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Booking Details</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Booking ID</p>
                  <p className="font-medium text-slate-900">{booking.booking_id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Booking Date</p>
                  <p className="font-medium text-slate-900">{new Date(booking.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Status</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {booking.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-600">Total Amount</p>
                  <p className="text-xl font-bold text-blue-600">${booking.total_price}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">Payment Method</p>
                  <p className="font-medium text-slate-900">{booking.payment_method?.replace('_', ' ') || 'Credit Card'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flight Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Flight Information
          </h3>
          
          {booking.flight_details && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-900">
                    {booking.flight_details.airline_code} {booking.flight_details.flight_number}
                  </p>
                  <p className="text-sm text-slate-600">
                    {booking.flight_details.origin} → {booking.flight_details.destination}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">Duration</p>
                  <p className="font-medium text-slate-900">{booking.flight_details.duration_minutes} min</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Departure</p>
                    <p className="font-medium text-slate-900">
                      {new Date(booking.flight_details.departure_time).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <div>
                    <p className="text-sm text-slate-600">Arrival</p>
                    <p className="font-medium text-slate-900">
                      {new Date(booking.flight_details.arrival_time).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-600" />
                <div>
                  <p className="text-sm text-slate-600">Route</p>
                  <p className="font-medium text-slate-900">
                    {booking.flight_details.origin} → {booking.flight_details.destination}
                    {booking.flight_details.stops > 0 && ` (${booking.flight_details.stops} stops)`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Passenger Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Passenger Information
          </h3>
          
          <div className="space-y-4">
            {booking.passengers?.map((passenger, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900">
                  {passenger.first_name} {passenger.last_name}
                  {index === 0 && ' (Primary)'}
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-2 text-sm">
                  <div>
                    <p className="text-slate-600">Email: {passenger.email}</p>
                    <p className="text-slate-600">Phone: {passenger.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-600">Date of Birth: {passenger.date_of_birth}</p>
                    <p className="text-slate-600">Passport: {passenger.passport_number}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Services */}
        {booking.additional_services && Object.values(booking.additional_services).some(v => v) && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Services</h3>
            <div className="space-y-2">
              {booking.additional_services.insurance && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Travel Insurance</span>
                  <span className="font-medium text-slate-900">+$50</span>
                </div>
              )}
              {booking.additional_services.extra_baggage && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Extra Baggage</span>
                  <span className="font-medium text-slate-900">+$75</span>
                </div>
              )}
              {booking.additional_services.seat_selection && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Seat Selection</span>
                  <span className="font-medium text-slate-900">+$25</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleDownloadTicket}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Download Ticket
          </button>
          
          <button
            onClick={handleEmailConfirmation}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
          >
            <Mail className="w-4 h-4" />
            Email Confirmation
          </button>
        </div>

        {/* Important Information */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium text-amber-900 mb-2">Important Information</h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• Please arrive at the airport at least 2 hours before domestic flights and 3 hours before international flights</li>
            <li>• Bring a valid government-issued ID and passport for international flights</li>
            <li>• Check-in online 24 hours before your flight</li>
            <li>• Review baggage allowance and restrictions</li>
            <li>• Keep your booking confirmation and ID handy for check-in</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
