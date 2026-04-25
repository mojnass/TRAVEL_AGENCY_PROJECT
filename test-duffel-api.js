// Test Duffel API integration
import { searchFlights } from './src/lib/duffel.js';

console.log('🧪 Testing Duffel API Integration...');

// Test with sample data
const testFlightSearch = async () => {
  try {
    console.log('🔍 Searching for flights: NYC -> LAX on 2026-06-15');
    const results = await searchFlights('NYC', 'LAX', '2026-06-15');
    
    if (results.length > 0) {
      console.log('✅ Success! Found', results.length, 'flights');
      console.log('📋 Sample flight:', results[0]);
    } else {
      console.log('⚠️ No flights found, but API call worked');
    }
  } catch (error) {
    console.error('❌ Error testing Duffel API:', error.message);
  }
};

testFlightSearch();
