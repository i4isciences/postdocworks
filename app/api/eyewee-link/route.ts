import { NextResponse } from "next/server";
import { requireDoc2PostdocUser } from "../../../lib/doc2postdoc/server";
import { mintLinkToken } from "../../../lib/eyewee-link/token";

// Entry point for "Connect your PostdocWorks account" in eyewee. Visiting this while logged into
// postdocworks mints a short-lived token for the current user and sends them straight back to
// eyewee's callback with it -- postdocworks never shares a password or session cookie with
// eyewee, just a one-time, 5-minute-lived proof of "this is user X."
export async function GET(request: Request) {
  const { user } = await requireDoc2PostdocUser();
  const eyeweeAppUrl = process.env.EYEWEE_APP_URL;

  if (!eyeweeAppUrl) {
    return NextResponse.json({ error: "EYEWEE_APP_URL is not configured on postdocworks." }, { status: 500 });
  }

  if (!user) {
    // Not logged in here -- send them to the Doc2Postdoc app (same origin) to sign in first.
    // Simplest "come back when you're signed in" entry point for now; clicking the eyewee
    // "Connect" link again afterward completes it.
    return NextResponse.redirect(new URL("/doc2postdoc", request.url));
  }

  let token: string;
  try {
    token = mintLinkToken(user.id);
  } catch {
    // Most likely EYEWEE_POSTDOCWORKS_LINK_SECRET missing/misnamed in this app's env -- surface
    // that clearly instead of crashing with a bare 500.
    return NextResponse.json({ error: "EYEWEE_POSTDOCWORKS_LINK_SECRET is not configured on postdocworks." }, { status: 500 });
  }

  const callbackUrl = new URL("/api/postdocworks/callback", eyeweeAppUrl);
  callbackUrl.searchParams.set("token", token);
  return NextResponse.redirect(callbackUrl);
}
