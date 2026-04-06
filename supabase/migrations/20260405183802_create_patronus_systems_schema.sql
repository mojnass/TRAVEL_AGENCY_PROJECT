/*
  # Patronus Systems - Travel Management Platform Database Schema

  ## Overview
  Complete database schema for a travel agency management system supporting flights, hotels,
  restaurants, attractions, spa services, and bundled travel packages.

  ## 1. User Management Tables
    - `users` - Customer accounts with profile information
    - `user_sessions` - Active login sessions with token management
    - `login_attempts` - Login attempt tracking for security
    - `email_verifications` - Email verification token management
    - `password_resets` - Password reset token management

  ## 2. Service Inventory Tables
    - `hotels` - Hotel property listings
    - `hotel_rooms` - Room types and availability per hotel
    - `restaurants` - Restaurant listings
    - `restaurant_tables` - Table inventory per restaurant
    - `attractions` - Tourist attractions and activities
    - `spa_venues` - Spa and wellness venue listings
    - `spa_services` - Individual spa service offerings

  ## 3. Flight Data Tables
    - `flight_search_cache` - Cached flight search results
    - `flight_offers` - Available flight options
    - `flight_seat_maps` - Aircraft seating configurations

  ## 4. Booking Tables
    - `bookings` - Main booking records for all service types
    - `booking_passengers` - Passenger details per booking
    - `booking_extras` - Add-on services per booking
    - `booking_status_history` - Audit trail of status changes

  ## 5. Bundle Tables
    - `bundles` - Admin-curated travel packages
    - `bundle_components` - Individual services within bundles
    - `user_bundles` - User-composed custom bundles
    - `bundle_bookings` - Links bundles to actual bookings

  ## 6. Payment Tables
    - `payments` - Payment transaction records
    - `invoices` - Generated invoices
    - `refunds` - Refund transactions
    - `payment_methods` - Saved payment methods

  ## 7. Admin Tables
    - `admin_users` - Administrative user accounts
    - `admin_logs` - Admin activity audit trail
    - `promo_codes` - Promotional discount codes
    - `analytics_events` - User behavior tracking

  ## 8. Notification Tables
    - `notifications` - In-app notifications
    - `email_queue` - Email delivery queue
    - `notification_templates` - Reusable notification templates

  ## Security
    - RLS enabled on all tables
    - Policies restrict data access to authenticated users
    - Admin tables restricted to admin role only
    - Audit trails maintained for critical operations
*/

-- =============================================
-- 1. USER MANAGEMENT TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  date_of_birth date,
  nationality text DEFAULT '',
  passport_number text DEFAULT '',
  profile_photo_url text DEFAULT '',
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  attempt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(user_id) ON DELETE CASCADE,
  ip_address text NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  success boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS email_verifications (
  verification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz
);

CREATE TABLE IF NOT EXISTS password_resets (
  reset_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

-- =============================================
-- 2. SERVICE INVENTORY TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS hotels (
  hotel_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  star_rating integer CHECK (star_rating BETWEEN 1 AND 5),
  description text DEFAULT '',
  address text NOT NULL,
  city text NOT NULL,
  country text NOT NULL,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  thumbnail_url text DEFAULT '',
  amenities jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hotel_rooms (
  room_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(hotel_id) ON DELETE CASCADE,
  room_type text NOT NULL,
  bed_configuration text DEFAULT '',
  max_occupancy integer NOT NULL DEFAULT 2,
  room_size numeric(10, 2),
  amenities jsonb DEFAULT '[]'::jsonb,
  price_per_night numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  is_available boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS restaurants (
  restaurant_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cuisine_type text DEFAULT '',
  price_tier text CHECK (price_tier IN ('$', '$$', '$$$', '$$$$')),
  description text DEFAULT '',
  address text NOT NULL,
  city text NOT NULL,
  phone text DEFAULT '',
  website text DEFAULT '',
  opening_hours jsonb DEFAULT '{}'::jsonb,
  thumbnail_url text DEFAULT '',
  rating numeric(3, 2) CHECK (rating BETWEEN 0 AND 5) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  table_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(restaurant_id) ON DELETE CASCADE,
  capacity integer NOT NULL DEFAULT 2,
  is_available boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS attractions (
  attraction_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  address text NOT NULL,
  city text NOT NULL,
  opening_hours jsonb DEFAULT '{}'::jsonb,
  ticket_prices jsonb DEFAULT '{}'::jsonb,
  thumbnail_url text DEFAULT '',
  rating numeric(3, 2) CHECK (rating BETWEEN 0 AND 5) DEFAULT 0,
  requires_advance_booking boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS spa_venues (
  spa_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text DEFAULT '',
  address text NOT NULL,
  city text NOT NULL,
  phone text DEFAULT '',
  opening_hours jsonb DEFAULT '{}'::jsonb,
  thumbnail_url text DEFAULT '',
  rating numeric(3, 2) CHECK (rating BETWEEN 0 AND 5) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS spa_services (
  service_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spa_id uuid NOT NULL REFERENCES spa_venues(spa_id) ON DELETE CASCADE,
  service_name text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  price numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  description text DEFAULT ''
);

-- =============================================
-- 3. FLIGHT DATA TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS flight_search_cache (
  cache_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin text NOT NULL,
  destination text NOT NULL,
  departure_date date NOT NULL,
  return_date date,
  passenger_count integer NOT NULL DEFAULT 1,
  cabin_class text NOT NULL,
  search_results jsonb DEFAULT '[]'::jsonb,
  cached_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS flight_offers (
  offer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_code text NOT NULL,
  flight_number text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  departure_time timestamptz NOT NULL,
  arrival_time timestamptz NOT NULL,
  duration_minutes integer NOT NULL,
  stops integer DEFAULT 0,
  cabin_class text NOT NULL,
  price numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  availability integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS flight_seat_maps (
  seat_map_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number text NOT NULL,
  date date NOT NULL,
  seat_data jsonb DEFAULT '{}'::jsonb
);

-- =============================================
-- 4. BOOKING TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS bookings (
  booking_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  booking_type text NOT NULL CHECK (booking_type IN ('flight', 'hotel', 'restaurant', 'attraction', 'spa', 'bundle')),
  service_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_price numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  booking_date timestamptz DEFAULT now(),
  start_date date NOT NULL,
  end_date date,
  cancellation_policy text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS booking_passengers (
  passenger_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  title text DEFAULT '',
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  nationality text DEFAULT '',
  passport_number text DEFAULT ''
);

CREATE TABLE IF NOT EXISTS booking_extras (
  extra_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  extra_type text NOT NULL,
  description text DEFAULT '',
  price numeric(10, 2) NOT NULL DEFAULT 0,
  quantity integer DEFAULT 1
);

CREATE TABLE IF NOT EXISTS booking_status_history (
  history_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  status text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid REFERENCES users(user_id)
);

-- =============================================
-- 5. BUNDLE TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS bundles (
  bundle_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination text NOT NULL,
  cover_image_url text DEFAULT '',
  short_description text DEFAULT '',
  long_description text DEFAULT '',
  valid_from date NOT NULL,
  valid_until date NOT NULL,
  total_original_price numeric(10, 2) NOT NULL,
  discounted_price numeric(10, 2) NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by uuid REFERENCES users(user_id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_bundle_dates CHECK (valid_until >= valid_from)
);

CREATE TABLE IF NOT EXISTS bundle_components (
  component_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid NOT NULL REFERENCES bundles(bundle_id) ON DELETE CASCADE,
  service_type text NOT NULL CHECK (service_type IN ('flight', 'hotel', 'restaurant', 'attraction', 'spa')),
  service_id uuid NOT NULL,
  display_label text DEFAULT '',
  retail_price numeric(10, 2) NOT NULL,
  is_mandatory boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_bundles (
  user_bundle_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  bundle_id uuid REFERENCES bundles(bundle_id) ON DELETE SET NULL,
  composition_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  shareable_link text UNIQUE
);

CREATE TABLE IF NOT EXISTS bundle_bookings (
  bundle_booking_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_bundle_id uuid NOT NULL REFERENCES user_bundles(user_bundle_id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- =============================================
-- 6. PAYMENT TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS payments (
  payment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_method text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text UNIQUE,
  paid_at timestamptz,
  refunded_at timestamptz
);

CREATE TABLE IF NOT EXISTS invoices (
  invoice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  invoice_pdf_url text DEFAULT '',
  issued_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refunds (
  refund_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  reason text DEFAULT '',
  refunded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_methods (
  method_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('credit_card', 'debit_card', 'paypal')),
  details jsonb DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 7. ADMIN TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS admin_users (
  admin_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  last_login timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_logs (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES admin_users(admin_id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_codes (
  promo_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric(10, 2) NOT NULL,
  valid_from date NOT NULL,
  valid_until date NOT NULL,
  max_uses integer DEFAULT 0,
  max_uses_per_user integer DEFAULT 1,
  applicable_service_types jsonb DEFAULT '[]'::jsonb,
  min_booking_value numeric(10, 2) DEFAULT 0,
  created_by uuid REFERENCES admin_users(admin_id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_promo_dates CHECK (valid_until >= valid_from)
);

CREATE TABLE IF NOT EXISTS analytics_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES users(user_id) ON DELETE SET NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 8. NOTIFICATION TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
  notification_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  content text DEFAULT '',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_queue (
  email_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_templates (
  template_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text UNIQUE NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON bookings(start_date);
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_attractions_city ON attractions(city);
CREATE INDEX IF NOT EXISTS idx_spa_venues_city ON spa_venues(city);
CREATE INDEX IF NOT EXISTS idx_flight_offers_origin_dest ON flight_offers(origin, destination);
CREATE INDEX IF NOT EXISTS idx_bundles_status ON bundles(status);
CREATE INDEX IF NOT EXISTS idx_bundles_destination ON bundles(destination);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE spa_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flight_seat_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - USER MANAGEMENT
-- =============================================

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - SERVICE INVENTORY (PUBLIC READ)
-- =============================================

CREATE POLICY "Anyone can view hotels"
  ON hotels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view hotel rooms"
  ON hotel_rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view restaurant tables"
  ON restaurant_tables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view attractions"
  ON attractions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view spa venues"
  ON spa_venues FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view spa services"
  ON spa_services FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES - FLIGHT DATA
-- =============================================

CREATE POLICY "Users can view flight search cache"
  ON flight_search_cache FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view flight offers"
  ON flight_offers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view flight seat maps"
  ON flight_seat_maps FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- RLS POLICIES - BOOKINGS
-- =============================================

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own booking passengers"
  ON booking_passengers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.booking_id = booking_passengers.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own booking passengers"
  ON booking_passengers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.booking_id = booking_passengers.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own booking extras"
  ON booking_extras FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.booking_id = booking_extras.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own booking history"
  ON booking_status_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.booking_id = booking_status_history.booking_id
      AND bookings.user_id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES - BUNDLES
-- =============================================

CREATE POLICY "Anyone can view published bundles"
  ON bundles FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "Anyone can view bundle components"
  ON bundle_components FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.bundle_id = bundle_components.bundle_id
      AND bundles.status = 'published'
    )
  );

CREATE POLICY "Users can view own user bundles"
  ON user_bundles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own user bundles"
  ON user_bundles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bundle bookings"
  ON bundle_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_bundles
      WHERE user_bundles.user_bundle_id = bundle_bookings.user_bundle_id
      AND user_bundles.user_id = auth.uid()
    )
  );

-- =============================================
-- RLS POLICIES - PAYMENTS
-- =============================================

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.payment_id = invoices.payment_id
      AND payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own refunds"
  ON refunds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.payment_id = refunds.payment_id
      AND payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES - NOTIFICATIONS
-- =============================================

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotels_updated_at
  BEFORE UPDATE ON hotels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();