import { NextResponse } from "next/server";

const pmidPattern = /^\d{4,9}$/;

type EsummaryResponse = {
  result?: Record<string, { title?: string; fulljournalname?: string; error?: string } | string[]> & { uids?: string[] };
};

export async function GET(request: Request) {
  const pmid = new URL(request.url).searchParams.get("pmid")?.trim() || "";
  if (!pmidPattern.test(pmid)) {
    return NextResponse.json({ status: "invalid", message: "Enter a valid numeric PubMed ID." }, { status: 400 });
  }
  try {
    const response = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!response.ok) {
      return NextResponse.json({ status: "unavailable", message: "PubMed lookup is temporarily unavailable." });
    }
    const data = (await response.json()) as EsummaryResponse;
    const entry = data.result?.[pmid];
    if (!entry || Array.isArray(entry) || "error" in entry) {
      return NextResponse.json({ status: "not_found", message: "No publication found for this PubMed ID." });
    }
    return NextResponse.json({ status: "valid", title: entry.title, journal: entry.fulljournalname });
  } catch {
    return NextResponse.json({ status: "unavailable", message: "PubMed lookup is temporarily unavailable." });
  }
}
