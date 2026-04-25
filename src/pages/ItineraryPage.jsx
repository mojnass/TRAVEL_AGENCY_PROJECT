import React, { useCallback, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Download, Share2, Calendar, MapPin,
  Eye, Search, Filter, FileText, ExternalLink
} from 'lucide-react';
import { itineraryService } from '../lib/itineraryService';
import { useAuth } from '../context/AuthContext';

export const ItineraryPage = () => {
  const { user } = useAuth();
  const [itineraries, setItineraries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadItineraries = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await itineraryService.getUserItineraries(user.id);
      setItineraries(data);
    } catch {
      setError('Failed to load itineraries');
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadItineraries();
  }, [loadItineraries]);

  const handleDownloadPDF = async (userBundleId) => {
    try {
      const pdfUrl = await itineraryService.downloadPDF(userBundleId);
      window.open(pdfUrl, '_blank');
    } catch {
      alert('Failed to download PDF');
    }
  };

  const handleShareBundle = (shareableLink) => {
    const fullUrl = `${window.location.origin}/bundle/${shareableLink}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Bundle link copied to clipboard!');
  };

  const handleViewBundle = (shareableLink) => {
    window.open(`/bundle/${shareableLink}`, '_blank');
  };

  const filteredItineraries = itineraries.filter(itinerary => {
    const matchesSearch = !searchTerm || 
      itinerary.composition_data?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itinerary.composition_data?.destination?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'with_pdf' && itinerary.itinerary_pdf_url) ||
      (filterStatus === 'without_pdf' && !itinerary.itinerary_pdf_url);
    
    return matchesSearch && matchesFilter;
  });

  const calculateSavings = (composition) => {
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
          <p className="text-slate-600">Loading itineraries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Itineraries</h1>
              <p className="text-slate-600">Your travel bundles and PDF itineraries</p>
            </div>
            
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search itineraries..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Itineraries</option>
                <option value="with_pdf">With PDF</option>
                <option value="without_pdf">Without PDF</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Itineraries List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredItineraries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Itineraries Found</h3>
            <p className="text-slate-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first travel bundle to see it here'}
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                <Package className="w-4 h-4" />
                Create Bundle
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredItineraries.map((itinerary) => {
              const composition = itinerary.composition_data;
              const savings = calculateSavings(composition);
              
              return (
                <div key={itinerary.user_bundle_id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                          {composition?.name || 'Travel Bundle'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{composition?.destination || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(itinerary.created_at).toLocaleDateString()}</span>
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
                              <p className="text-lg font-bold text-green-600">
                                ${composition?.discounted_price || 0}
                              </p>
                              <p className="text-xs text-green-600">
                                Save {savings.percentage}% (${savings.amount})
                              </p>
                            </>
                          )}
                          {savings.amount === 0 && (
                            <p className="text-lg font-bold text-slate-900">
                              ${composition?.discounted_price || 0}
                            </p>
                          )}
                        </div>
                        
                        {itinerary.itinerary_pdf_url && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            <FileText className="w-3 h-3" />
                            PDF Ready
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bundle Items */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Bundle Contents</h4>
                      <div className="flex flex-wrap gap-2">
                        {composition?.items?.slice(0, 3).map((item, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full"
                          >
                            {item.type}: {item.name}
                          </span>
                        ))}
                        {composition?.items?.length > 3 && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                            +{composition.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleViewBundle(itinerary.shareable_link)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                      
                      <button
                        onClick={() => handleShareBundle(itinerary.shareable_link)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      
                      <button
                        onClick={() => handleDownloadPDF(itinerary.user_bundle_id)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                      >
                        <Download className="w-4 h-4" />
                        {itinerary.itinerary_pdf_url ? 'Download PDF' : 'Generate PDF'}
                      </button>
                      
                      <button
                        onClick={() => handleViewBundle(itinerary.shareable_link)}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open in New Tab
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
