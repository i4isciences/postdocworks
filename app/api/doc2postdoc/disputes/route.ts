import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../../lib/doc2postdoc/server";

const categories = new Set(["content", "conduct", "ip", "privacy"]);

export async function GET() {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your reports." }, { status: 401 });
  const { data, error } = await supabase.from("doc2postdoc_disputes").select("id, conversation_id, category, description, status, created_at").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load your reports." }, { status: 500 });
  return NextResponse.json({ disputes: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to file a report." }, { status: 401 });
  const body = await request.json() as { conversationId?: unknown; category?: unknown; description?: unknown };
  const conversationId = typeof body.conversationId === "string" && body.conversationId ? body.conversationId : null;
  const category = categories.has(String(body.category)) ? String(body.category) : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!category || description.length < 20) {
    return NextResponse.json({ error: "Choose a category and describe what happened (at least 20 characters)." }, { status: 400 });
  }
  const { data, error } = await supabase.from("doc2postdoc_disputes").insert({ conversation_id: conversationId, reporter_id: user.id, category, description }).select("id, status, created_at").single();
  if (error) return NextResponse.json({ error: "Unable to submit your report." }, { status: 500 });
  return NextResponse.json({ success: true, dispute: data }, { status: 201 });
}
