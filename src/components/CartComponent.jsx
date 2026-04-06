import React from 'react';
import { ShoppingCart, X, Plus, Minus, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../lib/bookingService';
import { paymentService } from '../lib/paymentService';
import { notificationService } from '../lib/notificationService';

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
      // Create bookings for all cart items
      const bookingPromises = cartItems.map(item => {
        const bookingData = {
          user_id: user.id,
          booking_type: item.type,
          service_id: item.details.hotel_id || item.details.offer_id || item.details.restaurant_id || item.details.attraction_id,
          total_price: item.price * item.quantity,
          currency: 'USD',
          start_date: new Date().toISOString().split('T')[0],
          status: 'pending'
        };
        return bookingService.createBooking(bookingData);
      });

      const bookings = await Promise.all(bookingPromises);

      // Create payment record
      const paymentData = {
        booking_id: bookings[0].booking_id, // Main booking
        user_id: user.id,
        amount: getTotalPrice(),
        currency: 'USD',
        payment_method: 'credit_card',
        status: 'pending'
      };

      const payment = await paymentService.createPayment(paymentData);
      
      // Process payment (mock)
      await paymentService.processPayment(paymentData);
      
      // Send notifications
      await Promise.all(bookings.map(booking => 
        notificationService.sendBookingConfirmation(user.id, booking.booking_id)
      ));

      // Clear cart
      clearCart();
      
      alert('Order placed successfully! Check your dashboard for bookings.');
      
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Checkout failed: ' + error.message);
    } finally {
      setIsLoading(false);
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
        <button
          onClick={clearCart}
          className="text-slate-400 hover:text-red-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

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
          <span className="text-xl font-bold text-blue-600">${getTotalPrice()}</span>
        </div>
        
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Checkout
            </>
          )}
        </button>
      </div>
    </div>
  );
};
