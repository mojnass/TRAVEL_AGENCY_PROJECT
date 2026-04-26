import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Armchair, CheckCircle, Clock, Download, Loader, Plane, X } from 'lucide-react';
import { bookingService } from '../lib/bookingService';
import { flightService } from '../lib/flightService';
import { notificationService } from '../lib/notificationService';
import { createSimplePdfUrl } from '../lib/pdf';

const passengerTemplate = {
  first_name: '',
  last_name: '',
  nationality: '',
  passport_number: '',
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

export const FlightBookingModal = ({ flight, user, onClose, onBooked }) => {
  const [step, setStep] = useState(1);
  const [seatMap, setSeatMap] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState('');
  const [passenger, setPassenger] = useState(passengerTemplate);
  const [extras, setExtras] = useState({ bag: false, premiumMeal: false });
  const [payment, setPayment] = useState({ card: '', exp: '', cvv: '' });
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const loadSeatMap = async () => {
      try {
        const data = await flightService.getFlightSeatMap(flight.flight_number);
        setSeatMap(data);
      } catch (err) {
        setError(err.message || 'Could not load seat map');
      }
    };
    loadSeatMap();
  }, [flight.flight_number]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const unavailableSeats = useMemo(() => new Set(seatMap?.unavailable || []), [seatMap]);
  const seats = useMemo(() => {
    const rows = seatMap?.rows || 24;
    const layout = (seatMap?.layout || 'ABC-DEF').replace('-', '').split('');
    return Array.from({ length: rows }, (_, rowIndex) =>
      layout.map((letter) => `${rowIndex + 1}${letter}`)
    );
  }, [seatMap]);

  const updatePassenger = (field, value) => {
    setPassenger((current) => ({ ...current, [field]: value }));
  };

  const extrasTotal = (extras.bag ? 45 : 0) + (extras.premiumMeal ? 80 : 0);
  const total = Number(flight.price || 0) + extrasTotal;
  const canContinue = step === 1
    ? passenger.first_name && passenger.last_name && passenger.nationality && passenger.passport_number
    : step === 2
      ? selectedSeat
      : payment.card && payment.exp && payment.cvv;

  const handleConfirm = async () => {
    if (!user) {
      setError('Please log in to book this flight.');
      return;
    }
    if (secondsLeft === 0) {
      setError('This seat hold expired. Close and start again to refresh availability.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (!/^4\d{15}$/.test(payment.card)) {
        throw new Error('Card number is invalid');
      }
      const [month, year] = payment.exp.split('/').map((part) => Number(part));
      const expiry = new Date(2000 + year, month, 0);
      if (!month || !year || expiry < new Date()) {
        throw new Error('Card is expired');
      }
      if (payment.card === '4000000000000002') {
        throw new Error('Payment declined. Please try another card.');
      }

      const created = await bookingService.createBooking({
        booking_type: 'flight',
        service_id: flight.offer_id,
        total_price: total,
        currency: flight.currency || 'USD',
        start_date: flight.departure_date || new Date().toISOString().split('T')[0],
        status: 'confirmed',
        seat_number: selectedSeat,
      });

      await bookingService.addPassengers(created.booking_id, [{
        ...passenger,
        seat_number: selectedSeat,
      }]);
      const selectedExtras = [
        extras.bag ? { name: 'Checked bag', price: 45 } : null,
        extras.premiumMeal ? { name: 'Caviar and champagne meal', price: 80 } : null,
      ].filter(Boolean);
      if (selectedExtras.length > 0) {
        await bookingService.addExtras(created.booking_id, selectedExtras);
      }

      await notificationService.sendBookingConfirmation(user.id, created.booking_id);
      const ticket = await flightService.getTicket(created.booking_id);
      const pdfUrl = createSimplePdfUrl(`Patronus E-Ticket ${created.booking_id}`, [
        `Passenger: ${passenger.first_name} ${passenger.last_name}`,
        `Nationality: ${passenger.nationality}`,
        `Passport: ${passenger.passport_number}`,
        `Flight: ${flight.airline_code || ''} ${flight.flight_number || ''}`,
        `Route: ${flight.origin || ''} to ${flight.destination || ''}`,
        `Seat: ${selectedSeat}`,
        `Extras: ${selectedExtras.map((extra) => extra.name).join(', ') || 'None'}`,
        `Total paid: $${total.toFixed(2)}`,
        `Booking ID: ${created.booking_id}`,
        `QR: PATRONUS:${created.booking_id}:${selectedSeat}`,
        `Ticket status: ${ticket.status}`,
        `Issued: ${new Date().toLocaleString()}`,
      ]);

      setBooking(created);
      setTicketUrl(pdfUrl);
      setStep(3);
      onBooked?.(created);
    } catch (err) {
      setError(err.message || 'Flight booking failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <Plane className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-900">Flight Checkout</h2>
              <p className="text-sm text-slate-500">{flight.airline_code} {flight.flight_number} - {flight.origin} to {flight.destination}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-100 px-6 py-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>1 Passenger</span>
            <span className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>2 Seat & Extras</span>
            <span className={`rounded-full px-3 py-1 ${step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>3 Payment</span>
            <span className={`rounded-full px-3 py-1 ${step === 4 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>4 Ticket</span>
            <span className={`ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-1 font-medium ${secondsLeft < 120 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
              <Clock className="h-4 w-4" />
              Hold {formatTime(secondsLeft)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="p-6">
          {step === 1 && (
            <div className="max-w-2xl">
              <h3 className="mb-4 font-semibold text-slate-900">Passenger details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ['first_name', 'First name'],
                  ['last_name', 'Last name'],
                  ['nationality', 'Nationality'],
                  ['passport_number', 'Passport number'],
                ].map(([field, label]) => (
                  <label key={field} className="text-sm font-medium text-slate-700">
                    {label}
                    <input
                      value={passenger[field]}
                      onChange={(event) => updatePassenger(field, event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
              <div>
                <h3 className="mb-3 font-semibold text-slate-900">Choose a seat</h3>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Front</div>
                  <div className="space-y-2">
                    {seats.map((row, index) => (
                      <div key={index} className="grid grid-cols-[2rem_repeat(3,2.25rem)_1rem_repeat(3,2.25rem)] items-center justify-center gap-1">
                        <span className="text-right text-xs text-slate-400">{index + 1}</span>
                        {row.map((seat, seatIndex) => {
                          const unavailable = unavailableSeats.has(seat);
                          const selected = selectedSeat === seat;
                          return (
                            <button
                              key={seat}
                              type="button"
                              onClick={() => !unavailable && setSelectedSeat(seat)}
                              disabled={unavailable}
                              className={`flex h-9 w-9 items-center justify-center rounded-md border text-xs font-semibold transition ${
                                selected
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : unavailable
                                    ? 'border-slate-200 bg-slate-100 text-slate-300'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50'
                              } ${seatIndex === 3 ? 'col-start-6' : ''}`}
                            >
                              <Armchair className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <aside className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">Fare summary</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Base fare</span><span>${flight.price || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Seat</span><span>{selectedSeat || 'None'}</span></div>
                  <label className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Checked bag</span>
                    <input type="checkbox" checked={extras.bag} onChange={(e) => setExtras((current) => ({ ...current, bag: e.target.checked }))} />
                  </label>
                  <label className="flex items-center justify-between gap-3">
                    <span className="text-slate-500">Caviar meal</span>
                    <input type="checkbox" checked={extras.premiumMeal} onChange={(e) => setExtras((current) => ({ ...current, premiumMeal: e.target.checked }))} />
                  </label>
                  <div className="border-t border-slate-100 pt-3 flex justify-between font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
              </aside>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
              <div>
                <h3 className="mb-4 font-semibold text-slate-900">Payment</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2 text-sm font-medium text-slate-700">
                    Card number
                    <input value={payment.card} onChange={(e) => setPayment((current) => ({ ...current, card: e.target.value }))} placeholder="4111111111111111" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Expiry MM/YY
                    <input value={payment.exp} onChange={(e) => setPayment((current) => ({ ...current, exp: e.target.value }))} placeholder="12/28" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    CVV
                    <input value={payment.cvv} onChange={(e) => setPayment((current) => ({ ...current, cvv: e.target.value }))} placeholder="123" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
                  </label>
                </div>
              </div>
              <aside className="rounded-xl border border-slate-200 p-4 text-sm">
                <h3 className="font-semibold text-slate-900">Review</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between"><span>Fare</span><span>${Number(flight.price || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Extras</span><span>${extrasTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Seat</span><span>{selectedSeat}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
              </aside>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-600" />
              <h3 className="text-xl font-bold text-slate-900">Flight booked</h3>
              <p className="mt-2 text-slate-600">Booking #{booking?.booking_id}</p>
              <button
                onClick={() => window.open(ticketUrl, '_blank')}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                Download E-Ticket PDF
              </button>
            </div>
          )}
        </div>

        {step < 4 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <button
              onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={() => (step < 3 ? setStep(step + 1) : handleConfirm())}
              disabled={!canContinue || isLoading || secondsLeft === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {isLoading && <Loader className="h-4 w-4 animate-spin" />}
              {step < 3 ? 'Continue' : 'Pay & Confirm'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
