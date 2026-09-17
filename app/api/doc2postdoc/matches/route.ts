import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../../lib/doc2postdoc/server";

type MatchRow = { id: string; display_name: string; role: string; career_stage: string; research_area: string; specialties: string[]; institution: string; geography: string; bio: string; credibility_score: number; verified_badges: string[]; completed_mentorships: number; match_score: number };

export async function GET(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to view matches." }, { status: 401 });
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 20), 1), 50);
  const { data, error } = await supabase.rpc("find_doc2postdoc_matches", { match_user: user.id, result_limit: limit });
  if (error) return NextResponse.json({ error: "Unable to calculate matches." }, { status: 500 });
  const matches = (data as MatchRow[] ?? []).map((match) => ({ ...match, name: match.display_name, title: match.role.replaceAll("_", " "), location: match.geography, field: match.research_area, stage: match.career_stage, about: match.bio, initials: match.display_name.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(), score: match.match_score, available: true }));
  return NextResponse.json({ matches, generatedAt: new Date().toISOString() });
}