import { NextResponse } from "next/server";
import { Resend } from "resend";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const interestAreas = new Set(["Engineering", "Design", "Partnerships", "Operations", "Something else"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const areaOfInterest = typeof body.areaOfInterest === "string" ? body.areaOfInterest : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const link = typeof body.link === "string" ? body.link.trim() : "";
    const termsAccepted = body.termsAccepted === true;

    if (!fullName || !emailPattern.test(email) || !interestAreas.has(areaOfInterest) || !message) {
      return NextResponse.json({ error: "Complete the required fields before sending." }, { status: 400 });
    }
    if (!termsAccepted) {
      return NextResponse.json({ error: "You must agree to the Terms of Service and Privacy Policy to continue." }, { status: 400 });
    }

    const recipient = process.env.CAREERS_NOTIFY_EMAIL || process.env.WAITLIST_NOTIFY_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;
    if (!recipient || !apiKey) {
      console.error("Careers submission received but RESEND_API_KEY / CAREERS_NOTIFY_EMAIL are not configured.");
      return NextResponse.json({ error: "Careers submissions are not accepting messages right now. Please email hello@postdocworks.io directly." }, { status: 503 });
    }

    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "PostdocWorks <onboarding@resend.dev>",
      to: recipient,
      replyTo: email,
      subject: `New careers introduction: ${fullName} (${areaOfInterest})`,
      text: [
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Area of interest: ${areaOfInterest}`,
        link ? `Link: ${link}` : null,
        "",
        message,
      ]
        .filter(Boolean)
        .join("\n"),
    });
    if (sendError) throw sendError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Careers submission failed", error);
    return NextResponse.json({ error: "We could not send your introduction. Please try again." }, { status: 500 });
  }
}
