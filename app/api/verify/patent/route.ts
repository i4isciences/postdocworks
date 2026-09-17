import { NextResponse } from "next/server";

// USPTO retired the keyless PatentsView/TSDR endpoints in favor of the
// Open Data Portal (ODP), which requires a registered API key:
// https://data.uspto.gov/apis. Once USPTO_ODP_API_KEY is configured, this
// route performs a real lookup; until then it honestly reports "pending"
// rather than fabricating a verified result.
const numberPattern = /^[A-Za-z0-9,./-]{5,20}$/;

export async function GET(request: Request) {
  const number = new URL(request.url).searchParams.get("number")?.trim() || "";
  if (!numberPattern.test(number)) {
    return NextResponse.json({ status: "invalid", message: "Enter a valid US patent number." }, { status: 400 });
  }
  const apiKey = process.env.USPTO_ODP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ status: "pending", message: "Patent numbers are reviewed by our team. Live USPTO verification is not yet configured." });
  }
  try {
    const cleaned = number.replace(/[^0-9A-Za-z]/g, "");
    const response = await fetch(`https://api.uspto.gov/api/v1/patent/applications/${cleaned}`, {
      headers: { Accept: "application/json", "X-API-KEY": apiKey },
      signal: AbortSignal.timeout(6000),
    });
    if (response.status === 404) return NextResponse.json({ status: "not_found", message: "No matching US patent was found." });
    if (!response.ok) return NextResponse.json({ status: "pending", message: "USPTO lookup is temporarily unavailable." });
    const data = (await response.json()) as { patentTitle?: string };
    return NextResponse.json({ status: "valid", title: data.patentTitle });
  } catch {
    return NextResponse.json({ status: "pending", message: "USPTO lookup is temporarily unavailable." });
  }
}
