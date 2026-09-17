import { NextResponse } from "next/server";
import { createDoc2PostdocServerClient } from "../../../../lib/doc2postdoc/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s-]{7,20}$/;
const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const pmidPattern = /^\d{4,9}$/;
const relationships = new Set(["pi", "coauthor", "committee"]);

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function computeScore(fields: {
  fullName: string; email: string;
  orcid: string; pmid: string; dissertationLink: string; abstractLink: string;
  linkedin: string; scholar: string; researchgate: string;
  endorserName: string; endorserEmail: string;
  patents: string[]; trademarks: string[];
}) {
  const hasDetails = Boolean(fields.fullName && fields.email);
  const hasPublication = Boolean(fields.orcid || fields.pmid || fields.dissertationLink || fields.abstractLink);
  const hasLinks = Boolean(fields.linkedin || fields.scholar || fields.researchgate);
  const hasEndorsement = Boolean(fields.endorserName && fields.endorserEmail);
  const hasIp = fields.patents.length > 0 || fields.trademarks.length > 0;
  const complete = [hasDetails, hasPublication, hasLinks, hasEndorsement, hasIp].filter(Boolean).length;
  return Math.round((complete / 5) * 100);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = str(body.fullName);
    const email = str(body.email).toLowerCase();
    const phone = str(body.phone);
    const orcid = str(body.orcid);
    const pmid = str(body.pmid);
    const dissertationLink = str(body.dissertationLink);
    const abstractLink = str(body.abstractLink);
    const linkedin = str(body.linkedin);
    const scholar = str(body.scholar);
    const researchgate = str(body.researchgate);
    const endorserName = str(body.endorserName);
    const endorserEmail = str(body.endorserEmail).toLowerCase();
    const endorserPhone = str(body.endorserPhone);
    const endorserRelationship = relationships.has(str(body.endorserRelationship)) ? str(body.endorserRelationship) : "pi";
    const patents = Array.isArray(body.patents) ? body.patents.filter((p): p is string => typeof p === "string" && p.trim().length >= 5).map((p) => p.trim()) : [];
    const trademarks = Array.isArray(body.trademarks) ? body.trademarks.filter((t): t is string => typeof t === "string" && t.trim().length >= 5).map((t) => t.trim()) : [];
    const termsAccepted = body.termsAccepted === true;

    const errors: string[] = [];
    if (fullName.length < 2) errors.push("Enter your full name.");
    if (!termsAccepted) errors.push("You must agree to the Terms of Service and Privacy Policy to continue.");
    if (!emailPattern.test(email)) errors.push("Enter a valid email address.");
    if (phone && !phonePattern.test(phone)) errors.push("Enter a valid phone number.");
    if (orcid && !orcidPattern.test(orcid)) errors.push("Enter a valid ORCID iD.");
    if (pmid && !pmidPattern.test(pmid)) errors.push("Enter a valid PubMed ID.");
    if (!isValidUrl(dissertationLink)) errors.push("Enter a valid dissertation/thesis link.");
    if (!isValidUrl(abstractLink)) errors.push("Enter a valid abstract/poster link.");
    if (!isValidUrl(linkedin)) errors.push("Enter a valid LinkedIn link.");
    if (!isValidUrl(scholar)) errors.push("Enter a valid Google Scholar link.");
    if (!isValidUrl(researchgate)) errors.push("Enter a valid ResearchGate link.");
    if (Boolean(endorserName) !== Boolean(endorserEmail)) errors.push("Provide both the endorser's name and email, or leave both blank.");
    if (endorserEmail && !emailPattern.test(endorserEmail)) errors.push("Enter a valid endorser email address.");
    if (endorserPhone && !phonePattern.test(endorserPhone)) errors.push("Enter a valid endorser phone number.");
    if (errors.length) return NextResponse.json({ error: errors[0] }, { status: 400 });

    const score = computeScore({ fullName, email, orcid, pmid, dissertationLink, abstractLink, linkedin, scholar, researchgate, endorserName, endorserEmail, patents, trademarks });
    if (score < 60) return NextResponse.json({ error: "Complete at least 60% of your credential sections before continuing." }, { status: 400 });

    const supabase = await createDoc2PostdocServerClient();

    const { error: insertError } = await supabase.from("credential_applications").insert({
      full_name: fullName,
      email,
      phone,
      orcid,
      pmid,
      dissertation_link: dissertationLink,
      abstract_link: abstractLink,
      linkedin,
      scholar,
      researchgate,
      endorser_name: endorserName,
      endorser_email: endorserEmail,
      endorser_phone: endorserPhone,
      endorser_relationship: endorserRelationship,
      patents,
      trademarks,
      completeness_score: score,
      terms_accepted_at: new Date().toISOString(),
    });
    if (insertError) throw insertError;

    const origin = new URL(request.url).origin;
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/verify-credential`, shouldCreateUser: true, data: { display_name: fullName } },
    });
    if (otpError) throw otpError;

    return NextResponse.json({ success: true, score });
  } catch (error) {
    console.error("Credential submission failed", error);
    return NextResponse.json({ error: "We could not save your credentials. Please try again." }, { status: 500 });
  }
}
