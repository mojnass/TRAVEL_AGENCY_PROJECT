import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: string;
          email: string;
          full_name: string;
          phone: string;
          date_of_birth: string | null;
          nationality: string;
          passport_number: string;
          profile_photo_url: string;
          is_verified: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      bookings: {
        Row: {
          booking_id: string;
          user_id: string;
          booking_type: string;
          service_id: string | null;
          status: string;
          total_price: number;
          currency: string;
          booking_date: string;
          start_date: string;
          end_date: string | null;
          cancellation_policy: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};
