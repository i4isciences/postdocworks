import { NextResponse } from "next/server";
import { Resend } from "resend";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const topics = new Set(["General inquiry", "Partnerships & institutions", "Press & media", "Support", "Something else"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const topic = typeof body.topic === "string" ? body.topic : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const termsAccepted = body.termsAccepted === true;

    if (!fullName || !emailPattern.test(email) || !topics.has(topic) || !message) {
      return NextResponse.json({ error: "Complete the required fields before sending." }, { status: 400 });
    }
    if (!termsAccepted) {
      return NextResponse.json({ error: "You must agree to the Terms of Service and Privacy Policy to continue." }, { status: 400 });
    }

    const recipient = process.env.CONTACT_NOTIFY_EMAIL || process.env.CAREERS_NOTIFY_EMAIL || process.env.WAITLIST_NOTIFY_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;
    if (!recipient || !apiKey) {
      console.error("Contact submission received but RESEND_API_KEY / CONTACT_NOTIFY_EMAIL are not configured.");
      return NextResponse.json({ error: "We can't accept messages right now. Please email hello@postdocworks.io directly." }, { status: 503 });
    }

    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "PostdocWorks <onboarding@resend.dev>",
      to: recipient,
      replyTo: email,
      subject: `New contact message: ${fullName} (${topic})`,
      text: [`Name: ${fullName}`, `Email: ${email}`, `Topic: ${topic}`, "", message].join("\n"),
    });
    if (sendError) throw sendError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact submission failed", error);
    return NextResponse.json({ error: "We could not send your message. Please try again." }, { status: 500 });
  }
}
