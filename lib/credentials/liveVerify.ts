const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const pmidPattern = /^\d{4,9}$/;

export type LiveCheckStatus = "invalid" | "valid" | "not_found" | "unavailable";
export type LiveCheckResult = { status: LiveCheckStatus; message?: string; name?: string; title?: string; journal?: string };

type OrcidRecord = {
  person?: {
    name?: {
      "given-names"?: { value?: string } | null;
      "family-name"?: { value?: string } | null;
    } | null;
  } | null;
};

export async function verifyOrcidLive(id: string): Promise<LiveCheckResult> {
  if (!orcidPattern.test(id)) {
    return { status: "invalid", message: "Enter a valid ORCID iD, e.g. 0000-0002-1825-0097." };
  }
  try {
    const response = await fetch(`https://pub.orcid.org/v3.0/${id}/record`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (response.status === 404) return { status: "not_found", message: "No ORCID record found for this iD." };
    if (!response.ok) return { status: "unavailable", message: "ORCID lookup is temporarily unavailable." };
    const record = (await response.json()) as OrcidRecord;
    const given = record.person?.name?.["given-names"]?.value || "";
    const family = record.person?.name?.["family-name"]?.value || "";
    const name = [given, family].filter(Boolean).join(" ");
    return { status: "valid", name: name || undefined };
  } catch {
    return { status: "unavailable", message: "ORCID lookup is temporarily unavailable." };
  }
}

type EsummaryResponse = {
  result?: Record<string, { title?: string; fulljournalname?: string; error?: string } | string[]> & { uids?: string[] };
};

export async function verifyPubmedLive(pmid: string): Promise<LiveCheckResult> {
  if (!pmidPattern.test(pmid)) {
    return { status: "invalid", message: "Enter a valid numeric PubMed ID." };
  }
  try {
    const response = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!response.ok) return { status: "unavailable", message: "PubMed lookup is temporarily unavailable." };
    const data = (await response.json()) as EsummaryResponse;
    const entry = data.result?.[pmid];
    if (!entry || Array.isArray(entry) || "error" in entry) return { status: "not_found", message: "No publication found for this PubMed ID." };
    return { status: "valid", title: entry.title, journal: entry.fulljournalname };
  } catch {
    return { status: "unavailable", message: "PubMed lookup is temporarily unavailable." };
  }
}
