import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// La publishable key es segura para usar en el cliente. La protección real
// de los datos se hace con RLS en Supabase. Nunca uses aquí una service_role key.
const supabaseUrl = 'https://gkswlvmmbavocipwbfhy.supabase.co';
const supabasePublishableKey = 'sb_publishable_u2JGEpaFOoYeJBdDZPbzGQ_J-9p2-NY';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
