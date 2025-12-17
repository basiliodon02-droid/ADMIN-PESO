
// const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);


// supabaseClient.js
const supabaseUrl = "https://zvqsqntqoyksranhodfh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cXNxbnRxb3lrc3JhbmhvZGZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNjQ3NzMsImV4cCI6MjA3Mzc0MDc3M30.8A7kdHZmMFFNZMBLEhaAegkQOu4fVJ2-RwlMVN7dYSU";


// Only initialize **once** and attach to window
if (!window.supabaseClient) {
  window.supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);
}


console.log("Supabase client initialized:", window.supabaseClient);