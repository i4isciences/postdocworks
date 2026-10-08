import "server-only";

import { createHmac } from "node:crypto";

// Lets a postdoc who is already logged into postdocworks connect their real account to eyewee
// (a separate app, same Supabase project) without eyewee ever seeing a postdocworks password or
// session cookie. This mints a short-lived, signed token carrying only the user id; eyewee
// verifies it with the same shared secret (EYEWEE_POSTDOCWORKS_LINK_SECRET, must match exactly in
// both apps' env) and never talks to postdocworks' auth system directly. Read-only on eyewee's
// side -- see eyewee's lib/eyewee/postdocworks/profile.ts.
const TOKEN_TTL_SECONDS = 300; // 5 minutes -- just long enough for the redirect round trip

function getSecret(): string {
  const secret = process.env.EYEWEE_POSTDOCWORKS_LINK_SECRET;
  if (!secret) throw new Error("EYEWEE_POSTDOCWORKS_LINK_SECRET is not set.");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function mintLinkToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + TOKEN_TTL_SECONDS * 1000 });
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}
