import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createDoc2PostdocServerClient } from "../../../lib/doc2postdoc/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/verify-credential";

  if (tokenHash && type) {
    const supabase = await createDoc2PostdocServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(next.startsWith("http") ? next : `${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/verify-credential?error=invalid`);
}
