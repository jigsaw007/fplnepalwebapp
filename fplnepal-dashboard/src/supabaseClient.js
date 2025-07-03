import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wnousfrdttwletykxkpr.supabase.co'; // Replace if needed
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indub3VzZnJkdHR3bGV0eWt4a3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEwMDM0NDUsImV4cCI6MjA2NjU3OTQ0NX0.78aS8T7v7-OL362iZFqsmFIaBIAmBXEnZ_u-Qk7JJz0'; // from Supabase Project → Project Settings → API → anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
