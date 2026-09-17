import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../../lib/doc2postdoc/server";

export async function GET() {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to view credibility." }, { status: 401 });
  const [{ data: profile }, { data: input }] = await Promise.all([
    supabase.from("doc2postdoc_profiles").select("credibility_score, credibility_profile, credibility_scored_at").eq("id", user.id).single(),
    supabase.from("doc2postdoc_credibility_inputs").select("*").eq("profile_id", user.id).maybeSingle(),
  ]);
  return NextResponse.json({ profile, input });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to update credibility inputs." }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const allowed = ["academic_record_score", "publications_count", "citation_count", "publication_impact_score", "endorsement_count", "endorsement_score", "trajectory_score", "platform_activity_score", "evidence"];
  const input: Record<string, unknown> = {};
  allowed.forEach((key) => { if (body[key] !== undefined) input[key] = body[key]; });
  const { error } = await supabase.from("doc2postdoc_credibility_inputs").upsert({ profile_id: user.id, ...input }, { onConflict: "profile_id" });
  if (error) return NextResponse.json({ error: "Unable to save credibility evidence." }, { status: 400 });
  const { data, error: scoreError } = await supabase.rpc("score_my_doc2postdoc_credibility");
  if (scoreError) return NextResponse.json({ error: "Unable to score credibility." }, { status: 500 });
  return NextResponse.json({ score: data?.[0] || null });
}
