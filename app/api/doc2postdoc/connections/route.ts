import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../../lib/doc2postdoc/server";

type ConnectionRequest = { recipientId?: unknown; message?: unknown };

export async function GET() {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to view connection requests." }, { status: 401 });
  const { data, error } = await supabase.from("doc2postdoc_connections").select("id, requester_id, recipient_id, message, status, created_at, updated_at").or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Unable to load connection requests." }, { status: 500 });
  const ids = [...new Set((data ?? []).flatMap((connection) => [connection.requester_id, connection.recipient_id]))];
  const { data: profiles } = await supabase.from("doc2postdoc_profiles").select("id, display_name, role, research_area, institution, geography, bio, avatar_url").in("id", ids);
  const names = new Map((profiles ?? []).map((profile) => [profile.id, { display_name: profile.display_name }]));
  return NextResponse.json({ connections: (data ?? []).map((connection) => ({ ...connection, requester: names.get(connection.requester_id), recipient: names.get(connection.recipient_id) })) });
}

export async function POST(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to send connection requests." }, { status: 401 });
  const body = await request.json() as ConnectionRequest;
  const recipientId = typeof body.recipientId === "string" ? body.recipientId.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!recipientId || message.length < 12) return NextResponse.json({ success: false, error: "A recipient and meaningful message are required." }, { status: 400 });
  const { data, error } = await supabase.from("doc2postdoc_connections").insert({ requester_id: user.id, recipient_id: recipientId, message }).select("id, requester_id, recipient_id, message, status, created_at").single();
  if (error?.code === "23505") return NextResponse.json({ error: "A connection request already exists." }, { status: 409 });
  if (error) return NextResponse.json({ error: "Unable to send connection request." }, { status: 500 });
  return NextResponse.json({ success: true, request: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { supabase, user } = await requireDoc2PostdocUser();
  if (!user) return NextResponse.json({ error: "Sign in to manage connection requests." }, { status: 401 });
  const body = await request.json() as { connectionId?: unknown; status?: unknown };
  const connectionId = typeof body.connectionId === "string" ? body.connectionId : "";
  const status = body.status === "accepted" || body.status === "declined" || body.status === "blocked" ? body.status : "";
  if (!connectionId || !status) return NextResponse.json({ error: "A connection and valid status are required." }, { status: 400 });
  const { data, error } = await supabase.from("doc2postdoc_connections").update({ status }).eq("id", connectionId).eq("recipient_id", user.id).select("id, requester_id, recipient_id, message, status, created_at, updated_at").single();
  if (error?.code === "PGRST116") return NextResponse.json({ error: "Connection request not found." }, { status: 404 });
  if (error) return NextResponse.json({ error: "Unable to update connection request." }, { status: 500 });
  if (status === "accepted") await supabase.from("doc2postdoc_conversations").upsert({ connection_id: connectionId }, { onConflict: "connection_id" });
  return NextResponse.json({ success: true, connection: data });
}