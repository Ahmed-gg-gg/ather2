import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Uses the secret service_role key. Never import this file from a
// client component — it must only ever run on the server.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
