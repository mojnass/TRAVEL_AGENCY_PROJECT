import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchComponent } from '../components/SearchComponent';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { CartComponent } from '../components/CartComponent';
import { BundleCreator } from '../components/BundleCreator';
import { Plane } from 'lucide-react';

export const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('hotels'); // Default to hotels
  const [isSearching, setIsSearching] = useState(false);

  // Set search type and parameters from URL on mount
  const [initialParams, setInitialParams] = useState({
    location: '',
    destination: '',
    date: ''
  });
  
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    const locationFromUrl = searchParams.get('location');
    const destinationFromUrl = searchParams.get('destination');
    const dateFromUrl = searchParams.get('date');
    
    if (typeFromUrl) {
      setSearchType(typeFromUrl);
    } else {
      setSearchType('hotels');
    }
    
    // Store initial parameters to pass to SearchComponent
    setInitialParams({
      location: locationFromUrl || '',
      destination: destinationFromUrl || '',
      date: dateFromUrl || ''
    });
  }, [searchParams]);

  const handleResults = (results, type) => {
    setSearchResults(results);
    setSearchType(type);
    setIsSearching(false);
  };

  const handleSearchStart = () => {
    setIsSearching(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-2">
            <Plane className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-900">Patronus</span>
          </div>
          <div className="w-28" /> {/* spacer for centering logo */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* ── Left sidebar ── */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            <SearchComponent
              onResults={handleResults}
              onSearchStart={handleSearchStart}
              initialSearchType={searchType}
              initialParams={initialParams}
            />
            <CartComponent />
            <BundleCreator />
          </div>

          {/* ── Results area ── */}
          <div className="lg:col-span-2">
            {isSearching ? (
              <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <ResultsDisplay results={searchResults} searchType={searchType} />
            ) : (
              <EmptySearch />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptySearch = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-sm">
    <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
      <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-slate-900 mb-2">Start Your Search</h3>
    <p className="text-slate-500 max-w-xs mx-auto">
      Use the search panel on the left to find flights, hotels, restaurants, attractions, and spa services.
    </p>
    <div className="mt-8 grid grid-cols-3 gap-3 max-w-sm mx-auto text-sm text-slate-500">
      {['Flights', 'Hotels', 'Restaurants', 'Attractions', 'Spa', 'Bundles'].map(s => (
        <div key={s} className="bg-slate-50 rounded-lg py-2 px-3 text-center text-xs font-medium text-slate-600">
          {s}
        </div>
      ))}
    </div>
  </div>
);

export default SearchPage;
