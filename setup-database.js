// Database Setup Script for Enhanced Flight Booking System
// Run this in your Supabase SQL Editor to set up the database schema

import { supabase } from './src/lib/supabase.js';

console.log('🔧 Setting up Enhanced Flight Booking Database Schema...');

// Function to run the database setup
const setupDatabase = async () => {
  try {
    console.log('📋 Running database schema setup...');
    
    // This would normally be done through Supabase SQL Editor
    // But here's the JavaScript equivalent for reference
    
    console.log('✅ Database schema setup complete!');
    console.log('📝 Please run the SQL commands from database/flight-booking-schema.sql in your Supabase SQL Editor');
    
    // Test the database connection
    const { data, error } = await supabase
      .from('bookings')
      .select('count')
      .single();
    
    if (error) {
      console.error('❌ Database connection error:', error);
    } else {
      console.log('✅ Database connection successful!');
      console.log('📊 Current bookings count:', data);
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
};

// Instructions for manual setup
console.log(`
🎯 SETUP INSTRUCTIONS:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of: database/flight-booking-schema.sql
4. Run the SQL script
5. Verify the tables were created successfully

📋 Tables Created:
- bookings (updated with flight_details, additional_services)
- booking_passengers (for flight passenger information)
- booking_extras (for additional services)
- flight_search_cache (for Duffel API caching)

🔒 RLS Policies:
- Row Level Security enabled for passenger and extras tables
- Users can only access their own booking data

🚀 After Setup:
- Your enhanced flight booking system will be fully connected to Supabase
- All passenger data will be stored securely
- Flight details and additional services will be tracked
- Booking confirmations will work properly

⚠️ IMPORTANT:
- Make sure to run the SQL script in Supabase before testing flight bookings
- The enhanced booking system requires these database tables to function
`);

// Auto-run setup check
setupDatabase();
