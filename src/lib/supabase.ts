import { createClient } from '@supabase/supabase-js';

/**
 * Oquvi - Supabase Client Initialization
 * 
 * Securely initializes the Supabase client using client-safe environment variables.
 * Never import or expose your service_role secret key here.
 */

// Safely extract raw values from Vite or standard Supabase env variables
const rawUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  '';

const rawKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_PUBLISHABLE_KEY ||
  '';

// Sanitize inputs (strip accidental quotes, whitespace, and trailing slashes)
const sanitize = (val: unknown): string => {
  if (typeof val !== 'string') return '';
  return val.trim().replace(/^['"]|['"]$/g, '');
};

const sanitizedUrl = sanitize(rawUrl).replace(/\/+$/, '');
const sanitizedKey = sanitize(rawKey);

/**
 * Validates whether the Supabase URL is properly formatted and non-placeholder.
 */
function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false;
  if (url === 'https://your-project-ref.supabase.co' || url.includes('placeholder')) {
    return false;
  }
  return url.startsWith('https://') || url.startsWith('http://');
}

/**
 * Validates whether the Supabase key is an authentic Publishable/Anon key rather than a placeholder.
 * Authentic Supabase keys are either:
 * 1. Standard JWTs (starting with 'ey' and ~150-250 characters long)
 * 2. Next-gen publishable keys (starting with 'sb_publishable_' or 'sb_anon_')
 */
function isValidSupabaseKey(key: string): boolean {
  if (!key) return false;
  const lower = key.toLowerCase();
  const isPlaceholder =
    lower.includes('placeholder') ||
    lower.includes('your_publishable_key') ||
    lower.includes('your-supabase-anon-key') ||
    lower.includes('your-publishable-key') ||
    lower.includes('your_anon_key') ||
    lower === 'anon' ||
    lower === 'undefined' ||
    lower === 'null';

  if (isPlaceholder) {
    return false;
  }

  // A valid Supabase public key is either a JWT (ey...), a publishable key (sb_...), or a valid key hash
  return key.length >= 25 && (key.startsWith('ey') || key.startsWith('sb_') || key.length >= 40);
}

export const isSupabaseConfigured: boolean = Boolean(
  isValidSupabaseUrl(sanitizedUrl) && isValidSupabaseKey(sanitizedKey)
);

// Fallback values used only when Supabase credentials have not been configured yet
const clientUrl = isSupabaseConfigured ? sanitizedUrl : 'https://placeholder-project.supabase.co';
const clientKey = isSupabaseConfigured ? sanitizedKey : 'placeholder-anon-key';

// Create the Supabase client with session persistence enabled
export const supabase = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});
