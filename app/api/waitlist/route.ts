import { NextResponse } from "next/server";
import { Resend } from "resend";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; source?: unknown; role?: unknown };
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!emailPattern.test(email)) return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
    const source = typeof body.source === "string" ? body.source : "home";
    const role = typeof body.role === "string" ? body.role : "Not specified";
    const recipient = process.env.WAITLIST_NOTIFY_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;
    if (recipient && apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails.send({ from: process.env.RESEND_FROM_EMAIL || "PostdocWorks <onboarding@resend.dev>", to: recipient, replyTo: email, subject: `New PostdocWorks waitlist signup: ${source}`, text: `Email: ${email}\nRole: ${role}\nSource: ${source}` });
    }
    const webhook = process.env.N8N_LEAD_WEBHOOK_URL;
    if (webhook) void fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role, source }) }).catch(() => undefined);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "We could not process that signup. Please try again." }, { status: 500 });
  }
}
