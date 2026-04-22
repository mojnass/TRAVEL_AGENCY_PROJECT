import { useState } from 'react';
import { Package, Save, Share2 } from 'lucide-react';
import { bundleService } from '../lib/bundleService';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const BundleCreator = () => {
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const [bundleName, setBundleName] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shareableLink, setShareableLink] = useState('');

  const handleCreateBundle = async () => {
    if (!user) {
      alert('Please log in to create bundles');
      return;
    }

    if (!bundleName || !destination || cartItems.length === 0) {
      alert('Please fill in all fields and add items to your cart');
      return;
    }

    setIsLoading(true);

    try {
      // Calculate bundle pricing
      const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const discountedPrice = totalPrice * 0.9; // 10% discount

      // Create composition data
      const compositionData = {
        items: cartItems.map(item => ({
          type: item.type,
          service_id: item.details.hotel_id || item.details.offer_id || item.details.restaurant_id || item.details.attraction_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total_original_price: totalPrice,
        discounted_price: discountedPrice
      };

      // Create user bundle
      const bundle = await bundleService.createUserBundle(user.id, compositionData);

      setShareableLink(bundle.shareable_link);
      
      // Clear cart after successful bundle creation
      clearCart();
      
      alert('Bundle created successfully!');
      
    } catch (error) {
      console.error('Bundle creation failed:', error);
      alert('Bundle creation failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareBundle = () => {
    if (shareableLink) {
      const fullUrl = `${window.location.origin}/bundle/${shareableLink}`;
      navigator.clipboard.writeText(fullUrl);
      alert('Bundle link copied to clipboard!');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-6 h-6 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">Create Travel Bundle</h3>
        </div>
        <p className="text-slate-600 text-center py-8">
          Add items to your cart to create a custom travel bundle
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-900">Create Travel Bundle</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Bundle Name
          </label>
          <input
            type="text"
            value={bundleName}
            onChange={(e) => setBundleName(e.target.value)}
            placeholder="My Dream Vacation"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Destination
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Paris, France"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={bundleDescription}
            onChange={(e) => setBundleDescription(e.target.value)}
            placeholder="Describe your perfect travel package..."
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <h4 className="font-medium text-slate-900 mb-3">Bundle Items ({cartItems.length})</h4>
          <div className="space-y-2">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <div>
                  <p className="font-medium text-sm text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-600">{item.type} • ${item.price} x {item.quantity}</p>
                </div>
                <p className="font-medium text-sm text-slate-900">
                  ${item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium text-slate-900">Bundle Total:</span>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">
                ${(cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 0.9).toFixed(2)}
              </p>
              <p className="text-xs text-green-600">10% bundle discount applied</p>
            </div>
          </div>

          {shareableLink ? (
            <div className="space-y-2">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium mb-2">Bundle Created!</p>
                <p className="text-xs text-green-600 mb-2">Shareable link: {shareableLink}</p>
                <button
                  onClick={handleShareBundle}
                  className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Copy Share Link
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCreateBundle}
              disabled={isLoading || !bundleName || !destination}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating Bundle...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Bundle
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
