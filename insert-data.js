// Data insertion script - run this in browser console
import { insertSampleData } from './src/data/sampleData.js';
import { supabase } from './src/lib/supabase.js';

console.log('🌱 Starting data insertion...');

// Insert sample data
insertSampleData(supabase).then(() => {
  console.log('✅ Data insertion complete!');
  console.log('🏨 Hotels:', 5, 'sample hotels added');
  console.log('🍽️ Restaurants:', 5, 'sample restaurants added');
  console.log('🎫 Attractions:', 5, 'sample attractions added');
  console.log('💆 Spa Services:', 5, 'sample spa services added');
  console.log('🎉 Your database now has sample data to test with!');
});
