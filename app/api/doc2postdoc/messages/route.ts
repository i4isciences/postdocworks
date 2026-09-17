import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../../lib/doc2postdoc/server";

export async function GET(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to view messages." }, { status: 401 });
  const conversationId = new URL(request.url).searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ error: "A conversation is required." }, { status: 400 });
  const { data, error } = await supabase.from("doc2postdoc_messages").select("id, conversation_id, sender_id, body, created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Unable to load messages." }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });
  const body = await request.json() as { conversationId?: unknown; body?: unknown };
  const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  const message = typeof body.body === "string" ? body.body.trim() : "";
  if (!conversationId || message.length < 1 || message.length > 5000) return NextResponse.json({ error: "A conversation and message are required." }, { status: 400 });
  const { data, error } = await supabase.from("doc2postdoc_messages").insert({ conversation_id: conversationId, sender_id: user.id, body: message }).select("id, conversation_id, sender_id, body, created_at").single();
  if (error) return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  return NextResponse.json({ success: true, message: data }, { status: 201 });
}