import { NextResponse } from "next/server";

// See app/api/verify/patent/route.ts — USPTO's public TSDR trademark status
// lookup has moved behind the keyed Open Data Portal. Without
// USPTO_ODP_API_KEY configured, this route reports "pending" honestly
// instead of claiming a verification it did not perform.
const numberPattern = /^\d{6,9}$/;

export async function GET(request: Request) {
  const number = new URL(request.url).searchParams.get("number")?.trim() || "";
  if (!numberPattern.test(number)) {
    return NextResponse.json({ status: "invalid", message: "Enter a valid USPTO serial or registration number (6-9 digits)." }, { status: 400 });
  }
  const apiKey = process.env.USPTO_ODP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ status: "pending", message: "Trademark numbers are reviewed by our team. Live USPTO verification is not yet configured." });
  }
  try {
    const response = await fetch(`https://api.uspto.gov/trademark/v1.0/status/${number}`, {
      headers: { Accept: "application/json", "X-API-KEY": apiKey },
      signal: AbortSignal.timeout(6000),
    });
    if (response.status === 404) return NextResponse.json({ status: "not_found", message: "No matching US trademark was found." });
    if (!response.ok) return NextResponse.json({ status: "pending", message: "USPTO lookup is temporarily unavailable." });
    const data = (await response.json()) as { markLiteralElements?: string };
    return NextResponse.json({ status: "valid", mark: data.markLiteralElements });
  } catch {
    return NextResponse.json({ status: "pending", message: "USPTO lookup is temporarily unavailable." });
  }
}
