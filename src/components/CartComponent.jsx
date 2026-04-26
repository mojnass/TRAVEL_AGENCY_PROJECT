import React, { useState } from 'react';
import { ShoppingCart, X, Plus, Minus, CreditCard, Package, Download } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../lib/bookingService';
import { paymentService } from '../lib/paymentService';
import { notificationService } from '../lib/notificationService';
import { bundleService } from '../lib/bundleService';
import { itineraryService } from '../lib/itineraryService';

export const CartComponent = () => {
  const { user } = useAuth();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    getTotalItems,
    isLoading,
    setIsLoading
  } = useCart();

  const [isBundleMode, setIsBundleMode] = useState(false);
  const [bundleName, setBundleName] = useState('');
  const [bundleDestination, setBundleDestination] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [showPdfDownload, setShowPdfDownload] = useState(false);

  const getServiceId = (item) => (
    item.details.hotel_id ||
    item.details.offer_id ||
    item.details.restaurant_id ||
    item.details.attraction_id ||
    item.details.spa_id ||
    item.details.bundle_id ||
    item.details.user_bundle_id ||
    item.id
  );

  const handleCheckout = async () => {
    if (!user) {
      alert('Please log in to checkout');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setIsLoading(true);

    try {
      const bookings = await Promise.all(cartItems.map((item) => bookingService.createBooking({
        booking_type: item.type,
        service_id: getServiceId(item),
        total_price: item.price * item.quantity,
        currency: 'USD',
        start_date: new Date().toISOString().split('T')[0],
        status: 'pending',
      })));

      const payment = await paymentService.createPayment({
        booking_id: bookings[0]?.booking_id,
        amount: getTotalPrice(),
        currency: 'USD',
        payment_method: 'credit_card',
        status: 'pending',
      });

      await paymentService.completePayment(payment.payment_id);
      await Promise.all(bookings.map((booking) =>
        notificationService.sendBookingConfirmation(user.id, booking.booking_id)
      ));

      clearCart();
      alert('Checkout successful. Your bookings are now in your dashboard.');
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBundleCheckout = async () => {
    if (!user) {
      alert('Please log in to checkout');
      return;
    }

    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    if (!bundleName || !bundleDestination) {
      alert('Please fill in bundle name and destination');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create composition data
      const compositionData = {
        name: bundleName,
        destination: bundleDestination,
        items: cartItems.map(item => ({
          type: item.type,
          service_id: getServiceId(item),
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total_original_price: getTotalPrice(),
        discounted_price: getTotalPrice() * 0.9 // 10% bundle discount
      };

      // Create user bundle
      const bundle = await bundleService.createUserBundle(user.id, compositionData);

      // Create bookings for all cart items
      const bookingPromises = cartItems.map(item => {
        const bookingData = {
          user_id: user.id,
          booking_type: item.type,
          service_id: getServiceId(item),
          total_price: item.price * item.quantity,
          currency: 'USD',
          start_date: new Date().toISOString().split('T')[0],
          status: 'pending'
        };
        return bookingService.createBooking(bookingData);
      });

      const bookings = await Promise.all(bookingPromises);

      // Link bookings to bundle
      for (const booking of bookings) {
        await bundleService.linkBundleToBooking(bundle.user_bundle_id, booking.booking_id);
      }

      // Create payment record
      const paymentData = {
        booking_id: bookings[0].booking_id,
        user_id: user.id,
        amount: compositionData.discounted_price,
        currency: 'USD',
        payment_method: 'credit_card',
        status: 'pending'
      };

      const payment = await paymentService.createPayment(paymentData);
      
      // Create bundle checkout record
      await itineraryService.createBundleCheckout(bundle.user_bundle_id, payment.payment_id);

      await paymentService.completePayment(payment.payment_id);
      
      // Generate PDF itinerary
      const itinerary = await itineraryService.generateItineraryPDF(bundle.user_bundle_id);
      
      // Update checkout record with PDF info
      await itineraryService.updateBundleCheckout(
        (await itineraryService.getBundleCheckout(bundle.user_bundle_id)).checkout_id,
        itinerary.pdfUrl
      );
      
      // Send notifications
      await Promise.all(bookings.map(booking => 
        notificationService.sendBookingConfirmation(user.id, booking.booking_id)
      ));
      
      // Email itinerary
      await itineraryService.emailItinerary(bundle.user_bundle_id);

      // Clear cart and show success
      clearCart();
      setPdfUrl(itinerary.pdfUrl);
      setShowPdfDownload(true);
      
      alert('Bundle checkout successful! Your itinerary PDF has been generated.');
      
    } catch (error) {
      console.error('Bundle checkout failed:', error);
      alert('Bundle checkout failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShoppingCart className="w-6 h-6 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">Shopping Cart</h3>
        </div>
        <p className="text-slate-600 text-center py-8">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-900">
            Shopping Cart ({getTotalItems()})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBundleMode(!isBundleMode)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              isBundleMode 
                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            {isBundleMode ? 'Bundle Mode' : 'Regular Checkout'}
          </button>
          <button
            onClick={clearCart}
            className="text-slate-400 hover:text-red-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bundle Mode Fields */}
      {isBundleMode && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-purple-900 mb-3">Bundle Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Bundle Name
              </label>
              <input
                type="text"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                placeholder="My Dream Vacation"
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-purple-700 mb-1">
                Destination
              </label>
              <input
                type="text"
                value={bundleDestination}
                onChange={(e) => setBundleDestination(e.target.value)}
                placeholder="Paris, France"
                className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-2">
            Bundle mode includes 10% discount and PDF itinerary generation
          </p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {cartItems.map(item => (
          <div key={item.id} className="flex items-center gap-4 p-3 border border-slate-100 rounded-lg">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-medium text-slate-600">
                {item.type.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 text-sm">{item.name}</h4>
              <p className="text-slate-600 text-sm">${item.price} each</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-6 h-6 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="text-right">
              <p className="font-medium text-slate-900">
                ${item.price * item.quantity}
              </p>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-600 hover:text-red-700 text-xs"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold text-slate-900">Total:</span>
          <div className="text-right">
            {isBundleMode && (
              <>
                <p className="text-sm text-slate-500 line-through">${getTotalPrice()}</p>
                <p className="text-xl font-bold text-purple-600">
                  ${(getTotalPrice() * 0.9).toFixed(2)}
                </p>
                <p className="text-xs text-green-600">10% bundle discount applied</p>
              </>
            )}
            {!isBundleMode && (
              <span className="text-xl font-bold text-blue-600">${getTotalPrice()}</span>
            )}
          </div>
        </div>
        
        {/* PDF Download Section */}
        {showPdfDownload && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">🎉 Itinerary PDF Ready!</p>
                <p className="text-xs text-green-600">Your travel itinerary has been generated</p>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          </div>
        )}
        
        <button
          onClick={isBundleMode ? handleBundleCheckout : handleCheckout}
          disabled={isLoading || (isBundleMode && (!bundleName || !bundleDestination))}
          className={`w-full font-medium py-3 rounded-lg transition flex items-center justify-center gap-2 ${
            isBundleMode 
              ? 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white'
              : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isBundleMode ? 'Creating Bundle...' : 'Processing...'}
            </>
          ) : (
            <>
              {isBundleMode ? (
                <>
                  <Package className="w-4 h-4" />
                  Create Bundle & Checkout
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Checkout
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
