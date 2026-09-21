import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey, requireSupabaseEnv } from "@/lib/doc2postdoc/env";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CAREER_STAGES = new Set(["Postdoc", "PhD student", "Medical resident / fellow", "Faculty / PI", "Other"]);

// Same waitlist as eyewee.io's -- both front doors write into the one shared
// `eyewee_waitlist` table (see eyewee/supabase/migrations/202609210001_eyewee_waitlist.sql) so
// there's a single early-access list, not two.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fullName?: unknown;
      email?: unknown;
      careerStage?: unknown;
      researchField?: unknown;
      institution?: unknown;
      city?: unknown;
      consentGiven?: unknown;
      source?: unknown;
    };

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const careerStage = typeof body.careerStage === "string" && CAREER_STAGES.has(body.careerStage) ? body.careerStage : "Postdoc";
    const researchField = typeof body.researchField === "string" ? body.researchField.trim() : "";
    const institution = typeof body.institution === "string" ? body.institution.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const consentGiven = body.consentGiven === true;
    const source = typeof body.source === "string" ? body.source : "postdocworks-home";

    if (fullName.length < 2 || !emailPattern.test(email)) {
      return NextResponse.json({ success: false, error: "Please add your name and email so we know where to send your invite." }, { status: 400 });
    }
    if (!consentGiven) {
      return NextResponse.json({ success: false, error: "Please accept the Terms of Service and Privacy Policy to continue." }, { status: 400 });
    }

    const { url, publishableKey } = requireSupabaseEnv();
    const secretKey = getSupabaseSecretKey();
    const supabase = createClient(url, secretKey || publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.from("eyewee_waitlist").insert({
      full_name: fullName,
      email,
      career_stage: careerStage,
      research_field: researchField,
      institution,
      city,
      consent_given: consentGiven,
      consented_at: new Date().toISOString(),
    });
    if (error) throw error;

    const recipient = process.env.WAITLIST_NOTIFY_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;
    if (recipient && apiKey) {
      const resend = new Resend(apiKey);
      await resend.emails
        .send({
          from: process.env.RESEND_FROM_EMAIL || "PostdocWorks <onboarding@resend.dev>",
          to: recipient,
          replyTo: email,
          subject: `New PostdocWorks waitlist signup: ${source}`,
          text: `Name: ${fullName}\nEmail: ${email}\nCareer stage: ${careerStage}\nResearch field: ${researchField}\nInstitution: ${institution}\nCity: ${city}\nSource: ${source}`,
        })
        .catch(() => undefined);
    }
    const webhook = process.env.N8N_LEAD_WEBHOOK_URL;
    if (webhook) {
      void fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, careerStage, researchField, institution, city, source }),
      }).catch(() => undefined);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Waitlist submission failed", error);
    return NextResponse.json({ success: false, error: "We could not process that signup. Please try again." }, { status: 500 });
  }
}
