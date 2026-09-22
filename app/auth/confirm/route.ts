import { NextResponse } from "next/server";
import { createDoc2PostdocServerClient } from "../../../lib/doc2postdoc/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/verify-credential";

  if (code) {
    const supabase = await createDoc2PostdocServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/verify-credential?error=invalid`);
}
