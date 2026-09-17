import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../../lib/doc2postdoc/server";

export async function GET() {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to view reputation." }, { status: 401 });
  const { data, error } = await supabase.from("doc2postdoc_mentor_reputation").select("profile_id, completed_mentorships, average_quality_score, last_completed_at").eq("profile_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load reputation." }, { status: 500 });
  return NextResponse.json({ reputation: data || { profile_id: user.id, completed_mentorships: 0, average_quality_score: 0, last_completed_at: null } });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to record mentorship activity." }, { status: 401 });
  const body = await request.json() as { connectionId?: unknown; mentorId?: unknown; menteeId?: unknown; completedAt?: unknown; qualityScore?: unknown; outcome?: unknown };
  const connectionId = typeof body.connectionId === "string" ? body.connectionId : "";
  const mentorId = typeof body.mentorId === "string" ? body.mentorId : "";
  const menteeId = typeof body.menteeId === "string" ? body.menteeId : "";
  const qualityScore = typeof body.qualityScore === "number" ? body.qualityScore : null;
  if (!connectionId || !mentorId || !menteeId || (user.id !== mentorId && user.id !== menteeId)) return NextResponse.json({ error: "A valid participant relationship is required." }, { status: 400 });
  const { data, error } = await supabase.from("doc2postdoc_mentorship_outcomes").upsert({ connection_id: connectionId, mentor_id: mentorId, mentee_id: menteeId, completed_at: body.completedAt || new Date().toISOString(), quality_score: qualityScore, outcome: typeof body.outcome === "string" ? body.outcome.trim() : null }, { onConflict: "connection_id" }).select("*").single();
  if (error) return NextResponse.json({ error: "Unable to record mentorship outcome." }, { status: 400 });
  return NextResponse.json({ outcome: data }, { status: 201 });
}
