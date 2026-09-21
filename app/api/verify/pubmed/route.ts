import { NextResponse } from "next/server";
import { verifyPubmedLive } from "../../../../lib/credentials/liveVerify";

export async function GET(request: Request) {
  const pmid = new URL(request.url).searchParams.get("pmid")?.trim() || "";
  const result = await verifyPubmedLive(pmid);
  return NextResponse.json(result, { status: result.status === "invalid" ? 400 : 200 });
}
