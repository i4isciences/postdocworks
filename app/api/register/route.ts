import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey, requireSupabaseEnv } from "@/lib/doc2postdoc/env";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const roles = new Set(["phd_student", "postdoc", "faculty", "industry"]);

export async function POST(request: Request) {
  try {
    const formData = request.headers.get("content-type")?.includes("multipart/form-data") ? await request.formData() : null;
    const body = formData ? Object.fromEntries(formData.entries()) : await request.json() as Record<string, unknown>;
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const institution = typeof body.institution === "string" && body.institution.trim() ? body.institution.trim() : "Not provided";
    const researchArea = typeof body.researchArea === "string" && body.researchArea.trim() ? body.researchArea.trim() : "Not provided";
    const role = typeof body.role === "string" ? body.role : "";
    const termsAccepted = body.termsAccepted === true || body.termsAccepted === "true";
    if (!fullName || !emailPattern.test(email) || !roles.has(role)) {
      return NextResponse.json({ error: "Complete the required registration fields." }, { status: 400 });
    }
    if (!termsAccepted) {
      return NextResponse.json({ error: "You must agree to the Terms of Service and Privacy Policy to continue." }, { status: 400 });
    }
    const { url, publishableKey } = requireSupabaseEnv();
    const secretKey = getSupabaseSecretKey();
    const supabase = createClient(url, secretKey || publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const abstractFile = body.abstractFile instanceof File && body.abstractFile.size > 0 ? body.abstractFile : null;
    let abstractFilePath = "";
    if (abstractFile) {
      if (abstractFile.type !== "application/pdf") return NextResponse.json({ error: "Upload a PDF file for the abstract or poster." }, { status: 400 });
      if (abstractFile.size > 10 * 1024 * 1024) return NextResponse.json({ error: "PDF files must be 10 MB or smaller." }, { status: 400 });
      if (!secretKey) return NextResponse.json({ error: "PDF uploads need SUPABASE_SECRET_KEY configured on the server." }, { status: 503 });
      abstractFilePath = `abstracts/${crypto.randomUUID()}.pdf`;
      const upload = await supabase.storage.from("registration-assets").upload(abstractFilePath, abstractFile, { contentType: "application/pdf", upsert: false });
      if (upload.error) throw upload.error;
    }
    const { error } = await supabase.from("registrations").insert({
      full_name: fullName,
      email,
      institution,
      research_area: researchArea,
      orcid: typeof body.orcid === "string" ? body.orcid.trim() : "",
      linkedin: typeof body.linkedin === "string" ? body.linkedin.trim() : "",
      role,
      message: typeof body.message === "string" ? body.message.trim() : "",
      credentials: {
        phone: typeof body.applicantPhone === "string" ? body.applicantPhone.trim() : "",
        pmid: typeof body.pmid === "string" ? body.pmid.trim() : "",
        dissertationLink: typeof body.dissertationLink === "string" ? body.dissertationLink.trim() : "",
        abstractLink: typeof body.abstractLink === "string" ? body.abstractLink.trim() : "",
        scholar: typeof body.scholar === "string" ? body.scholar.trim() : "",
        researchgate: typeof body.researchgate === "string" ? body.researchgate.trim() : "",
        endorserName: typeof body.endorserName === "string" ? body.endorserName.trim() : "",
        endorserEmail: typeof body.endorserEmail === "string" ? body.endorserEmail.trim() : "",
        endorserPhone: typeof body.endorserPhone === "string" ? body.endorserPhone.trim() : "",
        endorserRelationship: typeof body.endorserRelationship === "string" ? body.endorserRelationship : "",
        patents: typeof body.patents === "string" ? JSON.parse(body.patents) : [],
        trademarks: typeof body.trademarks === "string" ? JSON.parse(body.trademarks) : [],
        abstractFileName: abstractFile?.name || "",
        abstractFilePath,
      },
      source: "homepage",
      terms_accepted_at: new Date().toISOString(),
    });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration submission failed", error);
    return NextResponse.json({ error: "We could not save your registration. Please try again." }, { status: 500 });
  }
}
