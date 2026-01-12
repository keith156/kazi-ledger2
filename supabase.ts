
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Configuration
 * Project credentials provided for cloud sync and authentication.
 */
const supabaseUrl = (process.env as any).SUPABASE_URL || 'https://brrgoanuhpiqxqvqgfnp.supabase.co';
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || 'sb_publishable_N3W_61uZa920EiehknsfTw_Fzw5aWCC';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Initialize the Supabase client.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
