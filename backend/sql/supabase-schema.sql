create extension if not exists "pgcrypto";

create table if not exists app_users (
  user_id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  full_name text not null,
  roles text not null default 'USER',
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists flight_offers (
  offer_id text primary key default gen_random_uuid()::text,
  origin text,
  destination text,
  airline_code text,
  flight_number text,
  cabin_class text,
  stops integer,
  availability integer,
  price numeric(12, 2),
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists flight_search_cache (
  cache_id text primary key default gen_random_uuid()::text,
  origin text,
  destination text,
  departure_date date,
  return_date date,
  passenger_count integer,
  cabin_class text,
  search_results jsonb,
  cached_at timestamptz default now(),
  expires_at timestamptz
);

alter table flight_search_cache
  alter column origin drop not null,
  alter column destination drop not null,
  alter column departure_date drop not null,
  alter column return_date drop not null,
  alter column passenger_count drop not null,
  alter column cabin_class drop not null,
  alter column search_results drop not null,
  alter column cached_at drop not null,
  alter column expires_at drop not null;

create table if not exists hotels (
  hotel_id text primary key default gen_random_uuid()::text,
  name text,
  city text,
  country text,
  star_rating integer,
  rating numeric(3, 2),
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists hotel_rooms (
  room_id text primary key default gen_random_uuid()::text,
  hotel_id text references hotels(hotel_id) on delete cascade,
  room_type text,
  max_occupancy integer,
  price_per_night numeric(12, 2),
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists restaurants (
  restaurant_id text primary key default gen_random_uuid()::text,
  name text,
  city text,
  cuisine_type text,
  price_tier text,
  rating numeric(3, 2),
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists restaurant_tables (
  table_id text primary key default gen_random_uuid()::text,
  restaurant_id text references restaurants(restaurant_id) on delete cascade,
  capacity integer,
  is_available boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists attractions (
  attraction_id text primary key default gen_random_uuid()::text,
  name text,
  city text,
  category text,
  requires_advance_booking boolean default false,
  rating numeric(3, 2),
  ticket_prices jsonb,
  opening_hours jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists spa_venues (
  spa_id text primary key default gen_random_uuid()::text,
  name text,
  city text,
  type text,
  rating numeric(3, 2),
  opening_hours jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists spa_services (
  service_id text primary key default gen_random_uuid()::text,
  spa_id text references spa_venues(spa_id) on delete cascade,
  service_name text,
  duration_minutes integer,
  price numeric(12, 2),
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists bundles (
  bundle_id text primary key default gen_random_uuid()::text,
  title text,
  destination text,
  status text default 'draft',
  total_original_price numeric(12, 2),
  discounted_price numeric(12, 2),
  valid_from date,
  valid_until date,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists bundle_components (
  component_id text primary key default gen_random_uuid()::text,
  bundle_id text references bundles(bundle_id) on delete cascade,
  component_type text,
  component_ref text,
  quantity integer default 1,
  price numeric(12, 2),
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists user_bundles (
  user_bundle_id text primary key default gen_random_uuid()::text,
  user_email text,
  bundle_id text references bundles(bundle_id) on delete set null,
  composition_data jsonb,
  shareable_link text unique,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists bookings (
  booking_id text primary key default gen_random_uuid()::text,
  user_email text,
  booking_type text,
  reference_id text,
  status text default 'pending',
  start_date date,
  end_date date,
  total_price numeric(12, 2),
  details jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists booking_passengers (
  passenger_id text primary key default gen_random_uuid()::text,
  booking_id text references bookings(booking_id) on delete cascade,
  full_name text,
  email text,
  phone text,
  details jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists booking_extras (
  extra_id text primary key default gen_random_uuid()::text,
  booking_id text references bookings(booking_id) on delete cascade,
  extra_type text,
  description text,
  price numeric(12, 2),
  details jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists booking_status_history (
  history_id text primary key default gen_random_uuid()::text,
  booking_id text references bookings(booking_id) on delete cascade,
  status text,
  changed_by text,
  changed_at timestamptz default now()
);

create table if not exists bundle_bookings (
  bundle_booking_id text primary key default gen_random_uuid()::text,
  user_bundle_id text references user_bundles(user_bundle_id) on delete cascade,
  booking_id text references bookings(booking_id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists payments (
  payment_id text primary key default gen_random_uuid()::text,
  user_email text,
  booking_id text references bookings(booking_id) on delete set null,
  amount numeric(12, 2),
  payment_method text,
  status text default 'pending',
  transaction_id text,
  paid_at timestamptz,
  refunded_at timestamptz,
  details jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz
);

create table if not exists invoices (
  invoice_id text primary key default gen_random_uuid()::text,
  payment_id text references payments(payment_id) on delete cascade,
  invoice_number text unique,
  issued_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists refunds (
  refund_id text primary key default gen_random_uuid()::text,
  payment_id text references payments(payment_id) on delete cascade,
  amount numeric(12, 2),
  reason text,
  refunded_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists notifications (
  notification_id text primary key default gen_random_uuid()::text,
  user_email text,
  type text,
  title text,
  content text,
  is_read boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz
);
