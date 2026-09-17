import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), "app", "doc2postdoc", ".env"), override: false });

export function requireSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) throw new Error("Doc2Postdoc Supabase configuration is missing.");
  return { url, publishableKey };
}

export function getSupabaseSecretKey() {
  return process.env.SUPABASE_SECRET_KEY;
}
