import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createDoc2PostdocServerClient } from "../../../../lib/doc2postdoc/server";
import { markCredentialVerified, markDoc2PostdocSignupVerified } from "../../../../lib/doc2postdoc/verification";

export async function POST(request: Request) {
  const body = (await request.json()) as { token_hash?: unknown; type?: unknown; kind?: unknown };
  const tokenHash = typeof body.token_hash === "string" ? body.token_hash : "";
  const type = typeof body.type === "string" ? (body.type as EmailOtpType) : null;
  const kind = body.kind === "doc2postdoc" ? "doc2postdoc" : "credential";

  if (!tokenHash || !type) {
    return NextResponse.json({ error: "This link is missing a verification code." }, { status: 400 });
  }

  const supabase = await createDoc2PostdocServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error || !data.user) {
    return NextResponse.json({ error: "This link is invalid or has expired. Request a new one and try again." }, { status: 400 });
  }

  const email = data.user.email || "";
  await markCredentialVerified(email, data.user.id);
  if (kind === "doc2postdoc") await markDoc2PostdocSignupVerified(email, data.user.id);

  return NextResponse.json({ success: true });
}
