import React, { useState } from 'react';
import { ArrowLeft, useNavigate } from 'react-router-dom';
import { SearchComponent } from '../components/SearchComponent';
import { ResultsDisplay } from '../components/ResultsDisplay';
import { CartComponent } from '../components/CartComponent';
import { BundleCreator } from '../components/BundleCreator';

export const SearchPage = () => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [searchType, setSearchType] = useState('');

  const handleResults = (results, type) => {
    setSearchResults(results);
    setSearchType(type);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-16">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <SearchComponent onResults={handleResults} />
            <CartComponent />
            <BundleCreator />
          </div>
          
          <div className="lg:col-span-2">
            {searchResults.length > 0 ? (
              <ResultsDisplay results={searchResults} searchType={searchType} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Start Your Search</h3>
                <p className="text-slate-600">Use the search panel to find hotels, flights, restaurants, and attractions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
