import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { requireDoc2PostdocUser } from "../../lib/doc2postdoc/server";
import { getSupabaseSecretKey, requireSupabaseEnv } from "../../lib/doc2postdoc/env";
import { VerifyCredentialClient } from "./VerifyCredentialClient";

export const metadata: Metadata = {
  title: "Verify your email | PostdocWorks",
};

function getAdminClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  const secretKey = getSupabaseSecretKey();
  if (!secretKey) return null;
  return createClient(url, secretKey || publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function markCredentialVerified(email: string, userId: string) {
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

async function markDoc2PostdocSignupVerified(email: string, userId: string) {
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

export default async function VerifyCredentialPage({ searchParams }: { searchParams: Promise<{ error?: string; kind?: string }> }) {
  const { error, kind } = await searchParams;

  if (error) {
    return (
      <VerifyShell>
        <h1>This link is invalid or has expired.</h1>
        <p>Verification links expire after a period of time. Return to your credential application and request a new one.</p>
      </VerifyShell>
    );
  }

  const { user } = await requireDoc2PostdocUser();
  if (!user) {
    return (
      <VerifyShell>
        <h1>This link is missing a verification code.</h1>
        <p>Return to your credential application and request a new verification email.</p>
      </VerifyShell>
    );
  }

  const email = user.email || "";
  await markCredentialVerified(email, user.id);
  if (kind === "doc2postdoc") await markDoc2PostdocSignupVerified(email, user.id);

  return (
    <VerifyShell>
      <VerifyCredentialClient email={email} kind={kind === "doc2postdoc" ? "doc2postdoc" : "credential"} />
    </VerifyShell>
  );
}

function VerifyShell({ children }: { children: ReactNode }) {
  return (
    <main className="verify-shell">
      <div className="verify-card">{children}</div>
    </main>
  );
}
