import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../../lib/doc2postdoc/server";
import { DOC2POSTDOC_PILLAR_NAMES, fieldsForPillar } from "../../../../lib/doc2postdoc/taxonomy";

const roles = new Set(["phd_student", "postdoc", "faculty", "industry"]);
const stages = new Set(["phd_finishing", "postdoc_search", "postdoc_early", "postdoc_late", "industry_transition", "faculty_track", "industry"]);

export async function GET() {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });
  const [{ data, error }, { count: connectionCount }] = await Promise.all([
    supabase.from("doc2postdoc_profiles").select("*").eq("id", user.id).single(),
    supabase.from("doc2postdoc_connections").select("id", { count: "exact", head: true }).or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).eq("status", "accepted"),
  ]);
  if (error) return NextResponse.json({ error: "Unable to load your profile." }, { status: 500 });
  const [experience, education, certifications, achievements] = await Promise.all([
    supabase.from("doc2postdoc_experience").select("*").eq("profile_id", user.id).order("started_on", { ascending: false }),
    supabase.from("doc2postdoc_education").select("*").eq("profile_id", user.id).order("started_on", { ascending: false }),
    supabase.from("doc2postdoc_certifications").select("*").eq("profile_id", user.id).order("issued_on", { ascending: false }),
    supabase.from("doc2postdoc_achievements").select("*").eq("profile_id", user.id).order("achieved_on", { ascending: false }),
  ]);
  return NextResponse.json({ profile: { ...data, connection_count: connectionCount ?? 0, experience: experience.data ?? [], education: education.data ?? [], certifications: certifications.data ?? [], achievements: achievements.data ?? [] } });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  const input = await request.json() as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  const textFields = ["display_name", "research_area", "institution", "institution_type", "geography", "bio", "about", "specialization"];
  textFields.forEach((field) => { if (typeof input[field] === "string") update[field] = input[field].trim(); });
  if (typeof input.role === "string" && roles.has(input.role)) update.role = input.role;
  if (typeof input.career_stage === "string" && stages.has(input.career_stage)) update.career_stage = input.career_stage;
  if (typeof input.pillar === "string" && DOC2POSTDOC_PILLAR_NAMES.includes(input.pillar)) update.pillar = input.pillar;
  if (typeof input.secondary_pillar === "string" && (input.secondary_pillar === "" || DOC2POSTDOC_PILLAR_NAMES.includes(input.secondary_pillar))) update.secondary_pillar = input.secondary_pillar;
  if (typeof input.pillar_field === "string") {
    const pillarForField = typeof input.pillar === "string" ? input.pillar : undefined;
    const validFields = pillarForField ? fieldsForPillar(pillarForField) : null;
    if (input.pillar_field === "" || !validFields || validFields.includes(input.pillar_field)) update.pillar_field = input.pillar_field;
  }
  if (Array.isArray(input.specialties)) update.specialties = input.specialties.filter((value): value is string => typeof value === "string").slice(0, 20);
  if (Array.isArray(input.interests)) update.interests = input.interests.filter((value): value is string => typeof value === "string").slice(0, 20);
  if (typeof input.is_mentor === "boolean") update.is_mentor = input.is_mentor;
  if (typeof input.mentor_available === "boolean") update.mentor_available = input.mentor_available;
  if (!Object.keys(update).length) return NextResponse.json({ error: "No valid profile fields supplied." }, { status: 400 });
  const { data, error } = await supabase.from("doc2postdoc_profiles").update(update).eq("id", user.id).select("*").single();
  if (error) return NextResponse.json({ error: "Unable to update your profile." }, { status: 500 });
  return NextResponse.json({ success: true, profile: data });
}
