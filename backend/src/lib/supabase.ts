import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";

/**
 * Cliente con service role: bypassa RLS. Solo para uso en el servidor
 * (verificación de tokens, operaciones administrativas, Storage).
 * Nunca exponer SUPABASE_SERVICE_ROLE_KEY al frontend.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
