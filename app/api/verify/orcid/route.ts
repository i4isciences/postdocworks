import { NextResponse } from "next/server";
import { verifyOrcidLive } from "../../../../lib/credentials/liveVerify";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim() || "";
  const result = await verifyOrcidLive(id);
  return NextResponse.json(result, { status: result.status === "invalid" ? 400 : 200 });
}
