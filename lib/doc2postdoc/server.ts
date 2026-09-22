import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireSupabaseEnv } from "./env";

/**
 * A plain (non-PKCE) client for sending magic-link / signup OTP emails.
 * `@supabase/ssr`'s server client hardcodes flowType "pkce", which makes
 * signInWithOtp issue a `pkce_`-prefixed token that our token_hash-based
 * /auth/confirm and /api/auth/verify-code routes cannot redeem (they use
 * verifyOtp, not exchangeCodeForSession). Sending the email doesn't need
 * cookies, so this client sidesteps PKCE entirely for that one call.
 */
export function createDoc2PostdocEmailClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  return createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function createDoc2PostdocServerClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = requireSupabaseEnv();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Components cannot mutate cookies. */ }
      },
    },
  });
}

export async function requireDoc2PostdocUser() {
  const supabase = await createDoc2PostdocServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase, user: null };
  return { supabase, user };
}
