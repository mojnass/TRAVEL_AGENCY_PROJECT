import { useMemo, useState } from 'react';
import { AlertCircle, Calendar, CheckCircle, Clock, Download, Loader, MapPin, Users, X } from 'lucide-react';
import { bookingService } from '../lib/bookingService';
import { notificationService } from '../lib/notificationService';
import { createSimplePdfUrl } from '../lib/pdf';

const today = () => new Date().toISOString().split('T')[0];

const serviceIdFor = (item) => (
  item.hotel_id ||
  item.restaurant_id ||
  item.attraction_id ||
  item.spa_id ||
  item.bundle_id ||
  item.user_bundle_id ||
  item.id
);

const priceFor = (item, type) => {
  if (type === 'hotels') return Number(item.price_per_night || item.hotel_rooms?.[0]?.price_per_night || 0);
  if (type === 'attractions') return Number(item.ticket_prices?.adult || item.price || 0);
  if (type === 'spa') return Number(item.spa_services?.[0]?.price || item.price || 0);
  if (type === 'bundles') return Number(item.discounted_price || item.composition_data?.discounted_price || 0);
  return Number(item.price || 0);
};

const singularType = (type) => {
  if (type === 'spa') return 'spa';
  if (type === 'bundles') return 'bundle';
  return type.replace(/s$/, '');
};

export const ServiceBookingModal = ({ item, type, user, onClose, onBooked }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);
  const [voucherUrl, setVoucherUrl] = useState('');
  const [form, setForm] = useState({
    date: today(),
    endDate: '',
    guests: 2,
    time: '19:00',
    notes: '',
    contactName: user?.fullName || '',
  });

  const title = item.name || `${item.airline_code || ''} ${item.flight_number || ''}`.trim() || 'Booking';
  const location = [item.city, item.country].filter(Boolean).join(', ') || item.destination || '';
  const unitPrice = priceFor(item, type);
  const nights = useMemo(() => {
    if (type !== 'hotels' || !form.endDate) return 1;
    const start = new Date(form.date);
    const end = new Date(form.endDate);
    return Math.max(1, Math.ceil((end - start) / 86400000));
  }, [form.date, form.endDate, type]);
  const total = type === 'bundles'
    ? unitPrice
    : unitPrice * (type === 'hotels' ? nights : Math.max(1, Number(form.guests) || 1));

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setError('Please log in to complete this booking.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const booking = await bookingService.createBooking({
        booking_type: singularType(type),
        service_id: serviceIdFor(item),
        total_price: total,
        currency: item.currency || 'USD',
        start_date: form.date,
        end_date: type === 'hotels' ? form.endDate : undefined,
        status: 'confirmed',
        party_size: type === 'bundles' ? 1 : form.guests,
        booking_time: form.time,
        notes: form.notes,
      });

      await notificationService.sendBookingConfirmation(user.id, booking.booking_id);
      if (type === 'hotels') {
        setVoucherUrl(createSimplePdfUrl(`Hotel Voucher ${booking.booking_id}`, [
          `Hotel: ${title}`,
          `Guest: ${form.contactName}`,
          `Check-in: ${form.date}`,
          `Check-out: ${form.endDate}`,
          `Guests: ${form.guests}`,
          `Confirmation: ${booking.booking_id}`,
          `Total: $${total.toFixed(2)}`,
        ]));
      }
      setCreatedBooking(booking);
      onBooked?.(booking);
    } catch (err) {
      setError(err.message || 'Booking failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{createdBooking ? 'Booking Confirmed' : title}</h2>
            {location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" />
                {location}
              </p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {createdBooking ? (
          <div className="p-8 text-center">
            <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-600" />
            <p className="text-slate-600">Booking #{createdBooking.booking_id}</p>
            <p className="mt-2 text-sm text-slate-500">You can manage this booking from your dashboard.</p>
            {voucherUrl && (
              <button onClick={() => window.open(voucherUrl, '_blank')} className="mt-6 mr-3 inline-flex items-center gap-2 rounded-lg border border-blue-200 px-5 py-2.5 font-medium text-blue-700 hover:bg-blue-50">
                <Download className="h-4 w-4" />
                Download Voucher PDF
              </button>
            )}
            <button onClick={onClose} className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {type === 'hotels' && (
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }, (_, index) => (
                    <div key={index} className="aspect-video rounded-lg bg-gradient-to-br from-blue-100 to-slate-200" />
                  ))}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-semibold text-slate-900">Amenities</p>
                    <p className="mt-1 text-slate-600">Pool, Wi-Fi, breakfast, airport pickup</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-semibold text-slate-900">Map</p>
                    <p className="mt-1 text-slate-600">Location pin: {location || 'central area'}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-900">Room type</p>
                  <p className="mt-1 text-slate-600">Deluxe room, king bed, 32m2, max 2 guests, free cancellation, Wi-Fi included.</p>
                </div>
              </div>
            )}

            {type === 'restaurants' && (
              <div className="mb-6 rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">Available time slots</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['18:30', '19:00', '20:00', '21:00'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => update('time', slot)}
                      className={`rounded-lg border px-3 py-1 ${form.time === slot ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                <Calendar className="mr-1 inline h-4 w-4" />
                {type === 'hotels' ? 'Check-in' : 'Date'}
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => update('date', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  required
                />
              </label>

              {type === 'hotels' ? (
                <label className="text-sm font-medium text-slate-700">
                  <Calendar className="mr-1 inline h-4 w-4" />
                  Check-out
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.date}
                    onChange={(event) => update('endDate', event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    required
                  />
                </label>
              ) : (
                <label className="text-sm font-medium text-slate-700">
                  <Clock className="mr-1 inline h-4 w-4" />
                  Time
                  <input
                    type="time"
                    value={form.time}
                    onChange={(event) => update('time', event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </label>
              )}

              {type !== 'bundles' && (
                <label className="text-sm font-medium text-slate-700">
                  <Users className="mr-1 inline h-4 w-4" />
                  {type === 'attractions' ? 'Tickets' : 'Guests'}
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.guests}
                    onChange={(event) => update('guests', event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  />
                </label>
              )}

              <label className="text-sm font-medium text-slate-700">
                Contact name
                <input
                  value={form.contactName}
                  onChange={(event) => update('contactName', event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </label>
            </div>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              Notes
              <textarea
                value={form.notes}
                onChange={(event) => update('notes', event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </label>

            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Unit price</span><span>${unitPrice.toFixed(2)}</span></div>
              {type === 'hotels' && <div className="mt-2 flex justify-between"><span className="text-slate-500">Nights</span><span>{nights}</span></div>}
              {type !== 'hotels' && type !== 'bundles' && <div className="mt-2 flex justify-between"><span className="text-slate-500">Quantity</span><span>{form.guests}</span></div>}
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
                {isLoading && <Loader className="h-4 w-4 animate-spin" />}
                Confirm Booking
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
