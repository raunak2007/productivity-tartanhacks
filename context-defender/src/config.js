// Application configuration
// Environment variables are loaded from .env

export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
    scopes: "https://www.googleapis.com/auth/calendar.readonly",
  },
  openRouter: {
    apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  },
};

// Make config available globally for non-module scripts
window.APP_CONFIG = config;
