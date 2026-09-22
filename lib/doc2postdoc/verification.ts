import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey, requireSupabaseEnv } from "./env";

function getAdminClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  const secretKey = getSupabaseSecretKey();
  if (!secretKey) return null;
  return createClient(url, secretKey || publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function markCredentialVerified(email: string, userId: string) {
  try {
    const admin = getAdminClient();
    if (!admin) return;
    const { data: rows } = await admin
      .from("credential_applications")
      .select("id")
      .eq("email", email)
      .is("email_verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1);
    const rowId = rows?.[0]?.id;
    if (rowId) {
      await admin
        .from("credential_applications")
        .update({ email_verified_at: new Date().toISOString(), user_id: userId })
        .eq("id", rowId);
    }
  } catch (error) {
    console.error("Could not mark credential application as verified", error);
  }
}

export async function markDoc2PostdocSignupVerified(email: string, userId: string) {
  try {
    const admin = getAdminClient();
    if (!admin) return;
    const { data: rows } = await admin
      .from("doc2postdoc_signups")
      .select("*")
      .eq("email", email)
      .is("email_verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1);
    const signup = rows?.[0];
    if (!signup) return;
    await admin
      .from("doc2postdoc_signups")
      .update({ email_verified_at: new Date().toISOString(), user_id: userId })
      .eq("id", signup.id);
    await admin
      .from("doc2postdoc_profiles")
      .update({
        display_name: signup.full_name,
        email: signup.email,
        role: signup.signup_role === "doc" ? "phd_student" : "postdoc",
        research_area: signup.primary_field,
        pillar: signup.pillar,
        pillar_field: signup.pillar_field,
        career_stage_label: signup.career_stage,
        is_mentor: signup.signup_role === "postdoc" && Boolean(signup.mentor_available),
        mentor_available: signup.signup_role === "postdoc" && Boolean(signup.mentor_available),
      })
      .eq("id", userId);
  } catch (error) {
    console.error("Could not mark doc2postdoc signup as verified", error);
  }
}
