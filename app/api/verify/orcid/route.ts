import { NextResponse } from "next/server";

const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

type OrcidRecord = {
  person?: {
    name?: {
      "given-names"?: { value?: string } | null;
      "family-name"?: { value?: string } | null;
    } | null;
  } | null;
};

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim() || "";
  if (!orcidPattern.test(id)) {
    return NextResponse.json({ status: "invalid", message: "Enter a valid ORCID iD, e.g. 0000-0002-1825-0097." }, { status: 400 });
  }
  try {
    const response = await fetch(`https://pub.orcid.org/v3.0/${id}/record`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (response.status === 404) {
      return NextResponse.json({ status: "not_found", message: "No ORCID record found for this iD." });
    }
    if (!response.ok) {
      return NextResponse.json({ status: "unavailable", message: "ORCID lookup is temporarily unavailable." });
    }
    const record = (await response.json()) as OrcidRecord;
    const given = record.person?.name?.["given-names"]?.value || "";
    const family = record.person?.name?.["family-name"]?.value || "";
    const name = [given, family].filter(Boolean).join(" ");
    return NextResponse.json({ status: "valid", name: name || undefined });
  } catch {
    return NextResponse.json({ status: "unavailable", message: "ORCID lookup is temporarily unavailable." });
  }
}
