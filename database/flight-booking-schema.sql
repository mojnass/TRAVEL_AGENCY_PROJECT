-- Enhanced Flight Booking System SQL Schema for Supabase

-- Update existing bookings table to support enhanced flight data
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS flight_details JSONB,
ADD COLUMN IF NOT EXISTS additional_services JSONB,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS cabin_class TEXT DEFAULT 'economy';

-- Create booking_passengers table for flight passenger details
CREATE TABLE IF NOT EXISTS booking_passengers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  passenger_index INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  passport_number TEXT,
  nationality TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster passenger queries
CREATE INDEX IF NOT EXISTS idx_booking_passengers_booking_id ON booking_passengers(booking_id);

-- Create booking_extras table for additional services
CREATE TABLE IF NOT EXISTS booking_extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id TEXT NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- 'insurance', 'extra_baggage', 'seat_selection'
  service_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster extras queries
CREATE INDEX IF NOT EXISTS idx_booking_extras_booking_id ON booking_extras(booking_id);

-- Update existing booking_status_history table if needed
ALTER TABLE booking_status_history 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- Create flight_search_cache table for caching Duffel API results
CREATE TABLE IF NOT EXISTS flight_search_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  passenger_count INTEGER DEFAULT 1,
  cabin_class TEXT DEFAULT 'economy',
  search_results JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for flight cache
CREATE INDEX IF NOT EXISTS idx_flight_cache_origin_destination ON flight_search_cache(origin, destination);
CREATE INDEX IF NOT EXISTS idx_flight_cache_departure_date ON flight_search_cache(departure_date);
CREATE INDEX IF NOT EXISTS idx_flight_cache_expires_at ON flight_search_cache(expires_at);

-- Function to automatically clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM flight_search_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean up cache (optional)
-- This would require setting up pg_cron extension in Supabase

-- Insert sample data for testing (optional)
-- This would be populated by the sample data insertion script

-- Row Level Security (RLS) policies
ALTER TABLE booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_extras ENABLE ROW LEVEL SECURITY;

-- Policy for booking_passengers
CREATE POLICY "Users can view their own booking passengers" ON booking_passengers
FOR SELECT USING (
  booking_id IN (
    SELECT booking_id FROM bookings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own booking passengers" ON booking_passengers
FOR INSERT WITH CHECK (
  booking_id IN (
    SELECT booking_id FROM bookings WHERE user_id = auth.uid()
  )
);

-- Policy for booking_extras
CREATE POLICY "Users can view their own booking extras" ON booking_extras
FOR SELECT USING (
  booking_id IN (
    SELECT booking_id FROM bookings WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own booking extras" ON booking_extras
FOR INSERT WITH CHECK (
  booking_id IN (
    SELECT booking_id FROM bookings WHERE user_id = auth.uid()
  )
);

-- Grant necessary permissions
GRANT ALL ON booking_passengers TO authenticated;
GRANT ALL ON booking_extras TO authenticated;
GRANT ALL ON flight_search_cache TO authenticated;

-- Comments for documentation
COMMENT ON TABLE booking_passengers IS 'Stores passenger information for flight bookings';
COMMENT ON TABLE booking_extras IS 'Stores additional services and extras for bookings';
COMMENT ON TABLE flight_search_cache IS 'Caches flight search results from Duffel API';
