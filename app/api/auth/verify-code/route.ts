import { NextResponse } from "next/server";
import { createDoc2PostdocServerClient } from "../../../../lib/doc2postdoc/server";
import { markCredentialVerified, markDoc2PostdocSignupVerified } from "../../../../lib/doc2postdoc/verification";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const codePattern = /^\d{6,8}$/;

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: unknown; token?: unknown; kind?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const kind = body.kind === "doc2postdoc" ? "doc2postdoc" : "credential";

  if (!emailPattern.test(email)) return NextResponse.json({ error: "Enter the email address you registered with." }, { status: 400 });
  if (!codePattern.test(token)) return NextResponse.json({ error: "Enter the code exactly as shown in the email." }, { status: 400 });

  const supabase = await createDoc2PostdocServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.user) {
    return NextResponse.json({ error: "That code is invalid or has expired. Request a new email and try again." }, { status: 400 });
  }

  await markCredentialVerified(email, data.user.id);
  if (kind === "doc2postdoc") await markDoc2PostdocSignupVerified(email, data.user.id);

  return NextResponse.json({ success: true });
}
