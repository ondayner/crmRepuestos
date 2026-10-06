import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://wblqunkdddabzrxtbyia.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndibHF1bmtkZGRhYnpyeHRieWlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5NTg3NzUsImV4cCI6MjEwNjUzNDc3NX0.6liFdq6bImupPwhpCVPGXYvW-03p2RnKrrn1eqVpT3E';

export const supabase = createClient(supabaseUrl, supabaseKey);