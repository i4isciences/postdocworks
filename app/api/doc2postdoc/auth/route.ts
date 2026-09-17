import { NextResponse } from "next/server";
import { createDoc2PostdocServerClient } from "../../../../lib/doc2postdoc/server";

export async function GET() {
  const supabase = await createDoc2PostdocServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { id: user.id, email: user.email } });
}

export async function POST(request: Request) {
  const body = await request.json() as { action?: unknown; email?: unknown; password?: unknown; displayName?: unknown };
  const knownActions = new Set(["signup", "signin", "setPassword", "magiclink"]);
  const action = knownActions.has(body.action as string) ? (body.action as "signup" | "signin" | "setPassword" | "magiclink") : "signin";
  const password = typeof body.password === "string" ? body.password : "";

  if (action === "setPassword") {
    if (password.length < 8) return NextResponse.json({ error: "Choose a password with at least 8 characters." }, { status: 400 });
    const supabase = await createDoc2PostdocServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Verify your email before setting a password." }, { status: 401 });
    const result = await supabase.auth.updateUser({ password });
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
    return NextResponse.json({ success: true, user: result.data.user });
  }

  if (action === "magiclink") {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (!email) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    const supabase = await createDoc2PostdocServerClient();
    const origin = new URL(request.url).origin;
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${origin}/verify-credential`, shouldCreateUser: true, data: { display_name: displayName } } });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (!email || password.length < 8) return NextResponse.json({ error: "Enter a valid email and a password with at least 8 characters." }, { status: 400 });
  const supabase = await createDoc2PostdocServerClient();
  const result = action === "signup"
    ? await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } })
    : await supabase.auth.signInWithPassword({ email, password });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 401 });
  return NextResponse.json({ success: true, user: result.data.user, session: result.data.session, confirmationRequired: action === "signup" && !result.data.session });
}

export async function DELETE() {
  const supabase = await createDoc2PostdocServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) return NextResponse.json({ error: "Unable to sign out." }, { status: 500 });
  return NextResponse.json({ success: true });
}