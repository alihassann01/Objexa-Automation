
// Initialize Supabase client
const SUPABASE_URL = 'https://vtlblicmwoaohjgbjpix.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0bGJsaWNtd29hb2hqZ2JqcGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODQ3MjEsImV4cCI6MjA4NTQ2MDcyMX0.E3gGxIhO3rvhoL61DhvnEjX-2BYA_oXAnHi3klgLDpI';

// Check if supabase global exists (loaded from CDN)
window.supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

if (!window.supabaseClient) {
    console.error('Supabase SDK not loaded.');
}
