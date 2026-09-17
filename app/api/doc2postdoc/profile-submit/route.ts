import { NextResponse } from "next/server";
import { createDoc2PostdocServerClient } from "../../../../lib/doc2postdoc/server";
import { DOC2POSTDOC_PILLAR_NAMES, fieldsForPillar } from "../../../../lib/doc2postdoc/taxonomy";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const signupRoles = new Set(["doc", "postdoc"]);
const matchRadii = new Set(["Campus", "Department", "City", "State", "Country", "Continent", "Global"]);

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fullName = str(body.fullName);
    const email = str(body.email).toLowerCase();
    const signupRole = signupRoles.has(str(body.signupRole)) ? str(body.signupRole) : "";
    const careerStage = str(body.careerStage);
    const pillar = str(body.pillar);
    const pillarField = str(body.pillarField);
    const specialization = str(body.specialization);
    const secondaryPillar = str(body.secondaryPillar);
    const primaryField = str(body.primaryField) || specialization || pillarField;
    const credibilityNotes = str(body.credibilityNotes);
    const academicMemberships = str(body.academicMemberships);
    const socialMemberships = str(body.socialMemberships);
    const institution = str(body.institution);
    const department = str(body.department);
    const city = str(body.city);
    const stateProvince = str(body.state);
    const country = str(body.country);
    const usaRegion = str(body.usaRegion);
    const languages = str(body.languages);
    const hobbies = str(body.hobbies);
    const maritalStatus = str(body.maritalStatus);
    const dietary = str(body.dietary);
    const peerField = str(body.peerField);
    const professionalConnection = str(body.connection);
    const matchRadius = matchRadii.has(str(body.matchRadius)) ? str(body.matchRadius) : "Campus";
    const broadcastOptIn = body.broadcastOptIn === true;
    const termsAccepted = body.termsAccepted === true;

    const errors: string[] = [];
    if (fullName.length < 2) errors.push("Enter your full name.");
    if (!emailPattern.test(email)) errors.push("Enter a valid email address.");
    if (!signupRole) errors.push("Select whether you're signing up as a PhD student or a postdoc.");
    if (!careerStage) errors.push("Select your career stage.");
    if (!pillar || !DOC2POSTDOC_PILLAR_NAMES.includes(pillar)) errors.push("Choose your pillar.");
    if (!pillarField || !fieldsForPillar(pillar).includes(pillarField)) errors.push("Choose a field within your pillar.");
    if (secondaryPillar && !DOC2POSTDOC_PILLAR_NAMES.includes(secondaryPillar)) errors.push("Choose a valid secondary pillar.");
    if (!termsAccepted) errors.push("You must agree to the Terms of Service and Privacy Policy to continue.");
    if (errors.length) return NextResponse.json({ error: errors[0] }, { status: 400 });

    const supabase = await createDoc2PostdocServerClient();

    const { error: insertError } = await supabase.from("doc2postdoc_signups").insert({
      full_name: fullName,
      email,
      signup_role: signupRole,
      career_stage: careerStage,
      primary_field: primaryField,
      pillar,
      pillar_field: pillarField,
      specialization,
      secondary_pillar: secondaryPillar,
      credibility_notes: credibilityNotes,
      academic_memberships: academicMemberships,
      social_memberships: socialMemberships,
      institution,
      department,
      city,
      state_province: stateProvince,
      country,
      usa_region: usaRegion,
      languages,
      hobbies,
      marital_status: maritalStatus,
      dietary,
      peer_field: peerField,
      professional_connection: professionalConnection,
      match_radius: matchRadius,
      broadcast_opt_in: broadcastOptIn,
      terms_accepted_at: new Date().toISOString(),
    });
    if (insertError) throw insertError;

    const origin = new URL(request.url).origin;
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/verify-credential?kind=doc2postdoc`, shouldCreateUser: true, data: { display_name: fullName } },
    });
    if (otpError) throw otpError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Doc2Postdoc profile submission failed", error);
    return NextResponse.json({ error: "We could not save your profile. Please try again." }, { status: 500 });
  }
}
