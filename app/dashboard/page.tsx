import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireDoc2PostdocUser } from "../../lib/doc2postdoc/server";
import { DashboardView } from "./DashboardView";

export const metadata: Metadata = {
  title: "Your dashboard | Postdocworks",
};

export default async function DashboardPage() {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) redirect("/");

  const [{ data: profile }, { data: credential }] = await Promise.all([
    supabase
      .from("doc2postdoc_profiles")
      .select("display_name, role, profile_completed_at")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("credential_applications")
      .select("completeness_score, email_verified_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <DashboardView
      email={user.email || ""}
      displayName={profile?.display_name || ""}
      role={profile?.role || ""}
      credentialScore={credential?.completeness_score ?? null}
      credentialVerified={Boolean(credential?.email_verified_at)}
      hasCredentialApplication={Boolean(credential)}
      doc2postdocProfileComplete={Boolean(profile?.profile_completed_at)}
    />
  );
}
