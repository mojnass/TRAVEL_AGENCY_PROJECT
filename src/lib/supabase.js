import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qruqxvfczdvbshzvjcii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXF4dmZjemR2YnNoenZqY2lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY2MjksImV4cCI6MjA5MDk4MjYyOX0.pAZ2gMZ7rlKcippl_YobUxDsqVZsD5Xm8hDAJuVhdl0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
