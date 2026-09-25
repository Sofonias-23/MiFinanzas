import { createClient } from '@supabase/supabase-js';

// Misma instancia que usa la app móvil. Esta publishable key puede vivir en cliente;
// la seguridad real de los datos depende de las políticas RLS de Supabase.
const supabaseUrl = 'https://gkswlvmmbavocipwbfhy.supabase.co';
const supabasePublishableKey = 'sb_publishable_u2JGEpaFOoYeJBdDZPbzGQ_J-9p2-NY';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
