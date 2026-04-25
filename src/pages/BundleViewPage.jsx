import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Package, MapPin, Calendar, DollarSign, Users, 
  Download, Share2, Clock, CheckCircle, AlertCircle,
  Plane, Hotel, Utensils, Ticket, Sparkles
} from 'lucide-react';
import { bundleService } from '../lib/bundleService';
import { itineraryService } from '../lib/itineraryService';
import { useAuth } from '../context/AuthContext';

export const BundleViewPage = () => {
  const { shareableLink } = useParams();
  const { user } = useAuth();
  const [bundle, setBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [showGuestCheckout, setShowGuestCheckout] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');

  useEffect(() => {
    loadBundle();
  }, [shareableLink]);

  const loadBundle = async () => {
    try {
      setIsLoading(true);
      const bundleData = await bundleService.getBundleByShareLink(shareableLink);
      setBundle(bundleData);
      
      // Check if PDF exists
      if (bundleData.itinerary_pdf_url) {
        setPdfUrl(bundleData.itinerary_pdf_url);
      }
    } catch (err) {
      setError('Bundle not found or has been removed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
      return;
    }

    try {
      setIsLoading(true);
      const itinerary = await itineraryService.generateItineraryPDF(bundle.user_bundle_id);
      setPdfUrl(itinerary.pdfUrl);
      window.open(itinerary.pdfUrl, '_blank');
    } catch (err) {
      alert('Failed to generate PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareBundle = () => {
    const fullUrl = window.location.href;
    navigator.clipboard.writeText(fullUrl);
    alert('Bundle link copied to clipboard!');
  };

  const handleGuestCheckout = async () => {
    if (!guestEmail) {
      alert('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      
      // Email the bundle to guest
      await itineraryService.emailItinerary(bundle.user_bundle_id, guestEmail);
      
      alert('Bundle details have been sent to your email!');
      setShowGuestCheckout(false);
      setGuestEmail('');
    } catch (err) {
      alert('Failed to send bundle details');
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceIcon = (serviceType) => {
    const icons = {
      flight: <Plane className="w-5 h-5" />,
      hotel: <Hotel className="w-5 h-5" />,
      restaurant: <Utensils className="w-5 h-5" />,
      attraction: <Ticket className="w-5 h-5" />,
      spa: <Sparkles className="w-5 h-5" />
    };
    return icons[serviceType] || <Package className="w-5 h-5" />;
  };

  const calculateSavings = () => {
    const composition = bundle.composition_data;
    if (!composition) return { amount: 0, percentage: 0 };
    
    const original = composition.total_original_price || 0;
    const discounted = composition.discounted_price || 0;
    const savings = original - discounted;
    const percentage = original > 0 ? (savings / original) * 100 : 0;
    
    return { amount: savings, percentage: Math.round(percentage) };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading bundle...</p>
        </div>
      </div>
    );
  }

  if (error || !bundle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Bundle Not Found</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const savings = calculateSavings();
  const composition = bundle.composition_data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              <Package className="w-6 h-6" />
              <span className="font-medium">Patronus Travel</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleShareBundle}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              
              {user ? (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  My Dashboard
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bundle Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Bundle Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {composition?.name || 'Travel Bundle'}
              </h1>
              <div className="flex items-center gap-4 text-slate-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{composition?.destination || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Created by {bundle.users?.full_name || 'Traveler'}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="mb-2">
                {savings.amount > 0 && (
                  <>
                    <p className="text-sm text-slate-500 line-through">
                      ${composition?.total_original_price || 0}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${composition?.discounted_price || 0}
                    </p>
                    <p className="text-sm text-green-600">
                      Save {savings.percentage}% (${savings.amount})
                    </p>
                  </>
                )}
                {savings.amount === 0 && (
                  <p className="text-2xl font-bold text-slate-900">
                    ${composition?.discounted_price || 0}
                  </p>
                )}
              </div>
              
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                {pdfUrl ? 'Download PDF' : 'Generate PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Bundle Items */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Bundle Contents</h2>
          
          <div className="space-y-4">
            {composition?.items?.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                  {getServiceIcon(item.type)}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{item.name}</h3>
                  <p className="text-sm text-slate-600 capitalize">{item.type}</p>
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-slate-900">${item.price}</p>
                  {item.quantity > 1 && (
                    <p className="text-sm text-slate-600">x{item.quantity}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guest Checkout Section */}
        {!user && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Get This Bundle</h2>
                <p className="text-slate-600">Receive the complete itinerary details via email</p>
              </div>
              
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Free Access</span>
              </div>
            </div>
            
            {!showGuestCheckout ? (
              <button
                onClick={() => setShowGuestCheckout(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                Get Bundle Details
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleGuestCheckout}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition"
                  >
                    {isLoading ? 'Sending...' : 'Send Bundle Details'}
                  </button>
                  
                  <button
                    onClick={() => setShowGuestCheckout(false)}
                    className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bundle Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">About This Bundle</h3>
              <p className="text-sm text-blue-700">
                This is a custom travel bundle created by another traveler. 
                You can view the itinerary and download the PDF for reference. 
                To book this bundle, create an account and add similar items to your cart.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
