// 🧪 SUPABASE CONNECTION TEST SCRIPT
// Run this in your browser console to verify all connections

/* eslint-disable no-unused-vars */
import { supabase } from './src/lib/supabase.js';
import { bundleService } from './src/lib/bundleService.js';
import { paymentService } from './src/lib/paymentService.js';
import { itineraryService } from './src/lib/itineraryService.js';
import { notificationService } from './src/lib/notificationService.js';
import { bookingService } from './src/lib/bookingService.js';

async function testSupabaseConnections() {
  console.log('🔍 TESTING SUPABASE CONNECTIONS...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Basic Supabase Connection
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
    if (error) throw error;
    
    results.passed++;
    results.tests.push('✅ Basic Supabase Connection: OK');
    console.log('✅ Basic Supabase Connection: OK');
  } catch (error) {
    results.failed++;
    results.tests.push('❌ Basic Supabase Connection: FAILED - ' + error.message);
    console.log('❌ Basic Supabase Connection: FAILED -', error.message);
  }

  // Test 2: Bundle Service Connection
  try {
    const bundles = await bundleService.getPublishedBundles({ limit: 1 });
    results.passed++;
    results.tests.push('✅ Bundle Service: OK');
    console.log('✅ Bundle Service: OK');
  } catch (error) {
    results.failed++;
    results.tests.push('❌ Bundle Service: FAILED - ' + error.message);
    console.log('❌ Bundle Service: FAILED -', error.message);
  }

  // Test 3: Payment Service Connection
  try {
    // Test payment methods table
    const { data, error } = await supabase.from('payment_methods').select('count', { count: 'exact' });
    if (error) throw error;
    
    results.passed++;
    results.tests.push('✅ Payment Service: OK');
    console.log('✅ Payment Service: OK');
  } catch (error) {
    results.failed++;
    results.tests.push('❌ Payment Service: FAILED - ' + error.message);
    console.log('❌ Payment Service: FAILED -', error.message);
  }

  // Test 4: Itinerary Service Connection
  try {
    // Test user_bundles table
    const { data, error } = await supabase.from('user_bundles').select('count', { count: 'exact' });
    if (error) throw error;
    
    results.passed++;
    results.tests.push('✅ Itinerary Service: OK');
    console.log('✅ Itinerary Service: OK');
  } catch (error) {
    results.failed++;
    results.tests.push('❌ Itinerary Service: FAILED - ' + error.message);
    console.log('❌ Itinerary Service: FAILED -', error.message);
  }

  // Test 5: Notification Service Connection
  try {
    const { data, error } = await supabase.from('notifications').select('count', { count: 'exact' });
    if (error) throw error;
    
    results.passed++;
    results.tests.push('✅ Notification Service: OK');
    console.log('✅ Notification Service: OK');
  } catch (error) {
    results.failed++;
    results.tests.push('❌ Notification Service: FAILED - ' + error.message);
    console.log('❌ Notification Service: FAILED -', error.message);
  }

  // Test 6: Booking Service Connection
  try {
    const { data, error } = await supabase.from('bookings').select('count', { count: 'exact' });
    if (error) throw error;
    
    results.passed++;
    results.tests.push('✅ Booking Service: OK');
    console.log('✅ Booking Service: OK');
  } catch (error) {
    results.failed++;
    results.tests.push('❌ Booking Service: FAILED - ' + error.message);
    console.log('❌ Booking Service: FAILED -', error.message);
  }

  // Test 7: Check All Required Tables Exist
  const requiredTables = [
    'users', 'bookings', 'payments', 'bundles', 'user_bundles', 
    'bundle_components', 'bundle_bookings', 'bundle_checkouts',
    'notifications', 'email_queue', 'payment_methods'
  ];

  console.log('\n📊 CHECKING REQUIRED TABLES...');
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase.from(table).select('count', { count: 'exact' });
      if (error) throw error;
      console.log(`✅ Table '${table}': EXISTS`);
    } catch (error) {
      console.log(`❌ Table '${table}': MISSING - ${error.message}`);
      results.failed++;
    }
  }

  // Final Results
  console.log('\n🎯 FINAL RESULTS:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  return results;
}

// Run the test
window.testSupabaseConnections = testSupabaseConnections;
console.log('🚀 Test function ready! Run: testSupabaseConnections()');
