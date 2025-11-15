import { createClient } from '@supabase/supabase-js';

/**
 * Trims whitespace and leading/trailing quotes from a string.
 * This makes the environment variable handling more robust against copy-paste errors.
 * @param {string | undefined} str The string to trim.
 * @returns {string | undefined} The trimmed string.
 */
const trimQuotes = (str) => {
  if (typeof str !== 'string') return str;
  // This regex removes a single quote from the beginning and/or end of the string.
  return str.trim().replace(/^["']|["']$/g, '');
};

const supabaseUrl = trimQuotes(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = trimQuotes(import.meta.env.VITE_SUPABASE_ANON_KEY);

const isValidSupabaseUrl = (url) => {
    return typeof url === 'string' && url.startsWith('https') && url.includes('.supabase.co');
};

let supabase;
let isSupabaseConfigured = false;
let supabaseConfigurationError = null;

if (isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isSupabaseConfigured = true;
  } catch (error) {
    supabaseConfigurationError = `Failed to initialize Supabase client: ${error.message}`;
    console.error(supabaseConfigurationError);
  }
} else {
  let specificError;
  if (!supabaseUrl || !supabaseAnonKey) {
    specificError = "One or more Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing.";
  } else if (!isValidSupabaseUrl(supabaseUrl)) {
    specificError = `The provided Supabase URL is invalid. It must be a full HTTPS URL, starting with 'https://' and ending with '.supabase.co'.`;
  } else {
    specificError = "The Supabase configuration is invalid for an unknown reason.";
  }
  
  supabaseConfigurationError = `${specificError} Please check your .env file, or connect your Supabase project via the Integrations tab for an automatic fix.`;
  
  console.error("Supabase Configuration Error: The details below show the values that caused the failure. Please verify them in your .env file.", {
      "Original URL": import.meta.env.VITE_SUPABASE_URL,
      "Processed URL": supabaseUrl,
      "Is URL Valid?": isValidSupabaseUrl(supabaseUrl),
      "Is Anon Key Present?": !!supabaseAnonKey
  });
}

export { supabase, isSupabaseConfigured, supabaseConfigurationError };
