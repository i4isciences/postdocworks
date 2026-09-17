import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../../../lib/doc2postdoc/server";

const tables = new Set(["experience", "education", "certifications", "achievements"]);
function tableFor(section: string) { return `doc2postdoc_${section}`; }

export async function POST(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  const body = await request.json() as { section?: unknown; item?: Record<string, unknown> };
  const section = typeof body.section === "string" ? body.section : "";
  if (!tables.has(section) || !body.item) return NextResponse.json({ error: "A valid profile section is required." }, { status: 400 });
  const item = { ...body.item };
  delete item.id; delete item.profile_id; delete item.created_at; delete item.updated_at;
  const { data, error } = await supabase.from(tableFor(section)).insert({ ...item, profile_id: user.id }).select("*").single();
  if (error) return NextResponse.json({ error: "Unable to add profile entry." }, { status: 400 });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  const body = await request.json() as { section?: unknown; id?: unknown; item?: Record<string, unknown> };
  const section = typeof body.section === "string" ? body.section : "";
  const id = typeof body.id === "string" ? body.id : "";
  if (!tables.has(section) || !id || !body.item) return NextResponse.json({ error: "A valid profile entry is required." }, { status: 400 });
  const item = { ...body.item };
  delete item.id; delete item.profile_id; delete item.created_at; delete item.updated_at;
  const { data, error } = await supabase.from(tableFor(section)).update(item).eq("id", id).eq("profile_id", user.id).select("*").single();
  if (error) return NextResponse.json({ error: "Unable to update profile entry." }, { status: 400 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  const body = await request.json() as { section?: unknown; id?: unknown };
  const section = typeof body.section === "string" ? body.section : "";
  const id = typeof body.id === "string" ? body.id : "";
  if (!tables.has(section) || !id) return NextResponse.json({ error: "A valid profile entry is required." }, { status: 400 });
  const { error } = await supabase.from(tableFor(section)).delete().eq("id", id).eq("profile_id", user.id);
  if (error) return NextResponse.json({ error: "Unable to delete profile entry." }, { status: 400 });
  return NextResponse.json({ success: true });
}