
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Configuration
 * Project credentials provided for cloud sync and authentication.
 */
const getEnv = (key: string) => {
    return (window as any).process?.env?.[key] || '';
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://brrgoanuhpiqxqvqgfnp.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'sb_publishable_N3W_61uZa920EiehknsfTw_Fzw5aWCC';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

/**
 * Initialize the Supabase client.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);