import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const personalDomains = new Set([
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "aol.com", "protonmail.com", "live.com", "msn.com", "mail.com", "yandex.com",
]);

const academicHints = [".edu", ".ac.", ".edu.", "university", "univ."];

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase() || "";
  if (!emailPattern.test(email)) {
    return NextResponse.json({ status: "invalid", message: "Enter a valid institutional email address." }, { status: 400 });
  }
  const domain = email.split("@")[1] || "";
  if (personalDomains.has(domain)) {
    return NextResponse.json({ status: "personal", domain, message: "This looks like a personal email provider, not an institutional address." });
  }
  const looksAcademic = academicHints.some((hint) => domain.includes(hint));
  return NextResponse.json({ status: looksAcademic ? "institutional" : "unverified_domain", domain });
}
