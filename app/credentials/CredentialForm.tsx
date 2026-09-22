"use client";

import Image from "next/image";
import { IBM_Plex_Sans, Lora } from "next/font/google";
import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Check, Lock, LoaderCircle, X } from "lucide-react";

const lora = Lora({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-lora" });
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+()\d\s-]{7,20}$/;
const orcidPattern = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const pmidPattern = /^\d{4,9}$/;

const RING_CIRCUMFERENCE = 188.5;
const PASS_THRESHOLD = 60;

type Relationship = "pi" | "coauthor" | "committee";
type Row = { id: number; value: string };
type CheckStatus = { status: "idle" | "checking" | "valid" | "invalid" | "not_found" | "personal" | "institutional" | "unverified_domain" | "unavailable"; message?: string; name?: string; title?: string; domain?: string };
type SubmitStatus = "idle" | "submitting" | "sent" | "error";
type PasswordStatus = "idle" | "submitting" | "success" | "error";
type AuthState = { checking: boolean; authenticated: boolean; email: string };

function isValidUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

let rowIdCounter = 2;

export function CredentialForm({ onClose, doc2postdocRole }: { onClose: () => void; doc2postdocRole?: "doc" | "postdoc" }) {
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [orcid, setOrcid] = useState("");
  const [pmid, setPmid] = useState("");
  const [dissertationLink, setDissertationLink] = useState("");
  const [abstractLink, setAbstractLink] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [scholar, setScholar] = useState("");
  const [researchgate, setResearchgate] = useState("");
  const [endorserName, setEndorserName] = useState("");
  const [endorserEmail, setEndorserEmail] = useState("");
  const [endorserPhone, setEndorserPhone] = useState("");
  const [endorserRelationship, setEndorserRelationship] = useState<Relationship>("pi");
  const [patents, setPatents] = useState<Row[]>([{ id: 0, value: "" }]);
  const [trademarks, setTrademarks] = useState<Row[]>([{ id: 1, value: "" }]);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const [orcidCheck, setOrcidCheck] = useState<CheckStatus>({ status: "idle" });
  const [pmidCheck, setPmidCheck] = useState<CheckStatus>({ status: "idle" });
  const [endorserDomainCheck, setEndorserDomainCheck] = useState<CheckStatus>({ status: "idle" });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitError, setSubmitError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [authState, setAuthState] = useState<AuthState>({ checking: false, authenticated: false, email: "" });
  const [otpCode, setOtpCode] = useState("");
  const [otpStatus, setOtpStatus] = useState<SubmitStatus>("idle");
  const [otpError, setOtpError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus>("idle");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSet, setPasswordSet] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (submitStatus !== "sent" || authState.authenticated) return;
    let cancelled = false;
    async function poll() {
      const response = await fetch("/api/doc2postdoc/auth").catch(() => null);
      if (cancelled || !response) return;
      if (response.ok) {
        const data = (await response.json()) as { user?: { email?: string } };
        setAuthState({ checking: false, authenticated: true, email: data.user?.email || applicantEmail });
      }
    }
    const interval = setInterval(poll, 4000);
    poll();
    return () => { cancelled = true; clearInterval(interval); };
  }, [submitStatus, authState.authenticated, applicantEmail]);

  function touch(name: string) { setTouched((prev) => new Set(prev).add(name)); }
  function showError(name: string, condition: boolean) { return touched.has(name) && condition; }

  function addRow(kind: "patent" | "trademark") {
    const row = { id: rowIdCounter++, value: "" };
    (kind === "patent" ? setPatents : setTrademarks)((rows) => [...rows, row]);
  }
  function removeRow(kind: "patent" | "trademark", id: number) {
    (kind === "patent" ? setPatents : setTrademarks)((rows) => rows.filter((row) => row.id !== id));
  }
  function updateRow(kind: "patent" | "trademark", id: number, value: string) {
    (kind === "patent" ? setPatents : setTrademarks)((rows) => rows.map((row) => (row.id === id ? { ...row, value } : row)));
  }

  async function checkOrcid(value: string) {
    if (!orcidPattern.test(value)) { setOrcidCheck({ status: "idle" }); return; }
    setOrcidCheck({ status: "checking" });
    try {
      const response = await fetch(`/api/verify/orcid?id=${encodeURIComponent(value)}`);
      setOrcidCheck(await response.json());
    } catch {
      setOrcidCheck({ status: "unavailable", message: "ORCID lookup is temporarily unavailable." });
    }
  }

  async function checkPmid(value: string) {
    if (!pmidPattern.test(value)) { setPmidCheck({ status: "idle" }); return; }
    setPmidCheck({ status: "checking" });
    try {
      const response = await fetch(`/api/verify/pubmed?pmid=${encodeURIComponent(value)}`);
      setPmidCheck(await response.json());
    } catch {
      setPmidCheck({ status: "unavailable", message: "PubMed lookup is temporarily unavailable." });
    }
  }

  async function checkEndorserDomain(value: string) {
    if (!emailPattern.test(value)) { setEndorserDomainCheck({ status: "idle" }); return; }
    setEndorserDomainCheck({ status: "checking" });
    try {
      const response = await fetch(`/api/verify/endorser-domain?email=${encodeURIComponent(value)}`);
      setEndorserDomainCheck(await response.json());
    } catch {
      setEndorserDomainCheck({ status: "unavailable" });
    }
  }

  const orcidValid = Boolean(orcid) && orcidPattern.test(orcid) && orcidCheck.status === "valid";
  const pmidValid = Boolean(pmid) && pmidPattern.test(pmid) && pmidCheck.status === "valid";
  const orcidOk = !orcid || orcidValid;
  const pmidOk = !pmid || pmidValid;
  const hasDetails = applicantName.trim().length >= 2 && emailPattern.test(applicantEmail);
  const hasPublication = orcidValid && pmidValid;
  const hasLinks = [linkedin, scholar, researchgate].some((value) => value && isValidUrl(value));
  const hasEndorsement = endorserName.trim().length > 1 && emailPattern.test(endorserEmail);
  const hasIp = patents.some((row) => row.value.trim().length >= 5) || trademarks.some((row) => row.value.trim().length >= 5);
  const sectionsComplete = [hasDetails, hasPublication, hasLinks, hasEndorsement, hasIp].filter(Boolean).length;
  const percent = Math.round((sectionsComplete / 5) * 100);
  const qualified = percent >= PASS_THRESHOLD && orcidOk && pmidOk;
  const ringOffset = RING_CIRCUMFERENCE * (1 - percent / 100);
  const missingSections = [
    !hasDetails && "Your Details",
    !hasPublication && "Publications (add a verifiable ORCID iD and PubMed ID to count this section)",
    !hasLinks && "Professional links",
    !hasEndorsement && "Faculty Endorsement",
    !hasIp && "Patents & Trademarks",
  ].filter((label): label is string => Boolean(label));
  const hasShortPatent = patents.some((row) => { const len = row.value.trim().length; return len > 0 && len < 5; });
  const hasShortTrademark = trademarks.some((row) => { const len = row.value.trim().length; return len > 0 && len < 5; });

  function reviewCredentials() {
    setTouched(new Set(["applicantName", "applicantEmail", "applicantPhone", "orcid", "pmid", "dissertationLink", "abstractLink", "linkedin", "scholar", "researchgate", "endorserName", "endorserEmail", "endorserPhone", "patents", "trademarks"]));
    setPreviewOpen(true);
  }

  async function confirmAndSend() {
    if (!qualified || !termsAccepted) return;
    setSubmitStatus("submitting");
    setSubmitError("");
    try {
      const response = await fetch("/api/credentials/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: applicantName, email: applicantEmail, phone: applicantPhone,
          orcid, pmid, dissertationLink, abstractLink,
          linkedin, scholar, researchgate,
          endorserName, endorserEmail, endorserPhone, endorserRelationship,
          patents: patents.map((row) => row.value), trademarks: trademarks.map((row) => row.value),
          termsAccepted, doc2postdocRole,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not save your credentials.");
      setSubmitStatus("sent");
    } catch (error) {
      setSubmitStatus("error");
      setSubmitError(error instanceof Error ? error.message : "Please try again.");
    }
  }

  async function resendEmail() {
    setResending(true);
    setResendMessage("");
    try {
      const response = await fetch("/api/doc2postdoc/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "magiclink", email: applicantEmail, displayName: applicantName }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not resend the email.");
      setResendMessage("Verification email sent again.");
    } catch (error) {
      setResendMessage(error instanceof Error ? error.message : "We could not resend the email.");
    } finally {
      setResending(false);
    }
  }

  async function submitOtpCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOtpStatus("submitting");
    setOtpError("");
    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: applicantEmail, token: otpCode, kind: doc2postdocRole ? "doc2postdoc" : undefined }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "That code is invalid or has expired.");
      setOtpStatus("sent");
      setAuthState({ checking: false, authenticated: true, email: applicantEmail });
    } catch (error) {
      setOtpStatus("error");
      setOtpError(error instanceof Error ? error.message : "That code is invalid or has expired.");
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) { setPasswordStatus("error"); setPasswordError("Choose a password with at least 8 characters."); return; }
    if (password !== confirmPassword) { setPasswordStatus("error"); setPasswordError("Passwords do not match."); return; }
    setPasswordStatus("submitting");
    setPasswordError("");
    try {
      const response = await fetch("/api/doc2postdoc/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setPassword", password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not set your password.");
      setPasswordStatus("success");
      setPasswordSet(true);
    } catch (error) {
      setPasswordStatus("error");
      setPasswordError(error instanceof Error ? error.message : "We could not set your password.");
    }
  }

  const relationshipLabels: Record<Relationship, string> = { pi: "Primary PI", coauthor: "Co-author", committee: "Thesis Committee" };
  const previewRows: { label: string; value: string; chip: "required" | "verified" | "unverified" | "reference" }[] = [];
  if (applicantName) previewRows.push({ label: "Full name", value: applicantName, chip: "required" });
  if (applicantEmail) previewRows.push({ label: "Email", value: applicantEmail, chip: "required" });
  if (applicantPhone) previewRows.push({ label: "Phone", value: applicantPhone, chip: "required" });
  if (endorserName) previewRows.push({ label: "Faculty endorser", value: `${endorserName} (${relationshipLabels[endorserRelationship]})`, chip: "verified" });
  if (endorserPhone) previewRows.push({ label: "Endorser phone", value: endorserPhone, chip: "reference" });
  if (orcid) previewRows.push({ label: "ORCID iD", value: orcid, chip: orcidValid ? "verified" : "unverified" });
  if (pmid) previewRows.push({ label: "PubMed ID", value: pmid, chip: pmidValid ? "verified" : "unverified" });
  if (dissertationLink) previewRows.push({ label: "Dissertation link", value: dissertationLink, chip: "reference" });
  if (abstractLink) previewRows.push({ label: "Abstract/poster link", value: abstractLink, chip: "reference" });
  patents.forEach((row) => { if (row.value.trim()) previewRows.push({ label: "Patent", value: row.value.trim(), chip: "verified" }); });
  trademarks.forEach((row) => { if (row.value.trim()) previewRows.push({ label: "Trademark", value: row.value.trim(), chip: "verified" }); });
  if (linkedin) previewRows.push({ label: "LinkedIn", value: linkedin, chip: "reference" });
  if (scholar) previewRows.push({ label: "Google Scholar", value: scholar, chip: "reference" });
  if (researchgate) previewRows.push({ label: "ResearchGate", value: researchgate, chip: "reference" });

  return (
    <div className={`${lora.variable} ${plexSans.variable} cred-backdrop`}>
      <section className="cred-document" role="dialog" aria-modal="true" aria-labelledby="cred-title">
        <header className="cred-doc-header">
          <button className="cred-close" type="button" onClick={onClose} aria-label="Close registration form"><X size={19} /></button>
          <div className="cred-wordmark">
            <Image className="cred-wordmark-logo" src="/postdocworks.svg" alt="PostdocWorks logo" width={40} height={37} priority />
            <div>
              <p className="cred-brand">Postdoc<span className="cred-brand-works">Works</span><sup className="cred-sm-mark">SM</sup></p>
              <p className="cred-doc-title" id="cred-title">Verified Credentials</p>
              {doc2postdocRole && (
                <p className="cred-doc2postdoc-kicker">
                  Signing up for Doc2Postdoc as a {doc2postdocRole === "doc" ? "PhD student (Doc)" : "Postdoc"}
                </p>
              )}
            </div>
          </div>
          <div className="cred-side-stack">
            <div className="cred-progress-ring" aria-label="Credential completeness">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle className="cred-ring-track" cx="38" cy="38" r="30" />
                <circle
                  className={`cred-ring-fill${qualified ? " qualified" : ""}`}
                  cx="38" cy="38" r="30"
                  style={{ strokeDasharray: RING_CIRCUMFERENCE, strokeDashoffset: ringOffset }}
                />
              </svg>
              <span className="cred-ring-text">{percent}<span className="cred-ring-percent">%</span></span>
            </div>
            <span className="cred-ring-caption">of 100</span>
            <EyeMark />
            <span className="cred-required-tag">60% is required</span>
          </div>
          <p className="cred-doc-sub">Verified fields are checked live against ORCID and PubMed. Patent/trademark and reference fields are self-reported — see the legend below.</p>
        </header>

        <form onSubmit={(event) => event.preventDefault()}>
          <section className="cred-block">
            <div className="cred-block-head">
              <div className="cred-block-title"><span className="cred-block-num">1</span><h2>Your Details</h2></div>
              <span className="cred-chip cred-chip-required">Required</span>
            </div>
            <FieldWrap label="Full name" error={showError("applicantName", applicantName.trim().length > 0 && applicantName.trim().length < 2)}>
              <input type="text" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} onBlur={() => touch("applicantName")} placeholder="e.g. Priya Raman" />
            </FieldWrap>
            <FieldWrap label="Email address" error={showError("applicantEmail", Boolean(applicantEmail) && !emailPattern.test(applicantEmail))} errorText="Enter a valid email address.">
              <input type="email" value={applicantEmail} onChange={(e) => setApplicantEmail(e.target.value)} onBlur={() => touch("applicantEmail")} placeholder="you@university.edu" />
            </FieldWrap>
            <FieldWrap label="Phone number" optional error={showError("applicantPhone", Boolean(applicantPhone) && !phonePattern.test(applicantPhone))} errorText="Enter a valid phone number.">
              <input type="tel" value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} onBlur={() => touch("applicantPhone")} placeholder="+1 (314) 555-0100" />
            </FieldWrap>
          </section>

          <section className="cred-block">
            <div className="cred-block-head">
              <div className="cred-block-title"><span className="cred-block-num">2</span><h2>Publications</h2></div>
              <span className="cred-chip cred-chip-verified">Verified</span>
            </div>
            <FieldWrap
              label="ORCID iD"
              error={showError("orcid", Boolean(orcid) && (!orcidPattern.test(orcid) || (orcidCheck.status !== "checking" && orcidCheck.status !== "valid" && orcidCheck.status !== "idle")))}
              errorText={!orcidPattern.test(orcid) ? "Enter a valid ORCID iD, e.g. 0000-0002-1825-0097." : "This ORCID iD could not be verified — double-check it and try again."}
            >
              <input type="text" value={orcid} onChange={(e) => setOrcid(e.target.value)} onBlur={() => { touch("orcid"); void checkOrcid(orcid); }} placeholder="0000-0000-0000-0000" />
              <CheckHint check={orcidCheck} validLabel={(c) => `Verified${c.name ? ` — ${c.name}` : ""}`} />
              <p className="cred-hint">If you have one, it's checked live against the ORCID Public API — it must be found there to count as verified.</p>
            </FieldWrap>
            <FieldWrap
              label="PubMed ID (PMID) of one publication"
              error={showError("pmid", Boolean(pmid) && (!pmidPattern.test(pmid) || (pmidCheck.status !== "checking" && pmidCheck.status !== "valid" && pmidCheck.status !== "idle")))}
              errorText={!pmidPattern.test(pmid) ? "Enter a valid numeric PubMed ID." : "This PubMed ID could not be verified — double-check it and try again."}
            >
              <input type="text" value={pmid} onChange={(e) => setPmid(e.target.value)} onBlur={() => { touch("pmid"); void checkPmid(pmid); }} placeholder="e.g. 34567890" />
              <CheckHint check={pmidCheck} validLabel={(c) => `Verified${c.title ? ` — ${c.title.slice(0, 60)}${c.title.length > 60 ? "…" : ""}` : ""}`} />
              <p className="cred-hint">If you have one, it's looked up live via PubMed E-utilities — the publication must be found there to count as verified.</p>
            </FieldWrap>
            <FieldWrap label="Dissertation / thesis repository link" optional error={showError("dissertationLink", Boolean(dissertationLink) && !isValidUrl(dissertationLink))} errorText="Enter a valid link." hint="Self-reported and displayed on your profile, not checked against an external registry.">
              <input type="url" value={dissertationLink} onChange={(e) => setDissertationLink(e.target.value)} onBlur={() => touch("dissertationLink")} placeholder="https://repository.university.edu/handle/..." />
            </FieldWrap>
            <FieldWrap label="Conference abstract / poster link" optional error={showError("abstractLink", Boolean(abstractLink) && !isValidUrl(abstractLink))} errorText="Enter a valid link.">
              <input type="url" value={abstractLink} onChange={(e) => setAbstractLink(e.target.value)} onBlur={() => touch("abstractLink")} placeholder="https://conference.org/abstracts/..." />
            </FieldWrap>
            <FieldWrap label="Abstract / poster PDF" optional hint="Direct PDF upload isn't available on this form — it's handled only through our customer care chatbot, for special circumstances. Use the link field above for standard submissions.">
              <input type="file" accept="application/pdf" disabled />
            </FieldWrap>
          </section>

          <section className="cred-block">
            <div className="cred-block-head">
              <div className="cred-block-title"><span className="cred-block-num">3</span><h2>Professional links</h2></div>
              <span className="cred-chip cred-chip-reference">Reference only</span>
            </div>
            <FieldWrap label="LinkedIn profile" optional error={showError("linkedin", Boolean(linkedin) && !isValidUrl(linkedin))} errorText="Enter a valid link.">
              <input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} onBlur={() => touch("linkedin")} placeholder="https://linkedin.com/in/..." />
            </FieldWrap>
            <FieldWrap label="Google Scholar profile" optional error={showError("scholar", Boolean(scholar) && !isValidUrl(scholar))} errorText="Enter a valid link.">
              <input type="url" value={scholar} onChange={(e) => setScholar(e.target.value)} onBlur={() => touch("scholar")} placeholder="https://scholar.google.com/citations?..." />
            </FieldWrap>
            <FieldWrap label="ResearchGate profile" optional error={showError("researchgate", Boolean(researchgate) && !isValidUrl(researchgate))} errorText="Enter a valid link.">
              <input type="url" value={researchgate} onChange={(e) => setResearchgate(e.target.value)} onBlur={() => touch("researchgate")} placeholder="https://researchgate.net/profile/..." />
            </FieldWrap>
            <p className="cred-hint">Self-reported, shown on your profile. Never pulled from or checked against these sites.</p>
          </section>

          <section className="cred-block">
            <div className="cred-block-head">
              <div className="cred-block-title"><span className="cred-block-num">4</span><h2>Faculty Endorsement</h2></div>
              <span className="cred-chip cred-chip-verified">Verified</span>
            </div>
            <FieldWrap label="Endorser's full name" optional={!endorserEmail} error={showError("endorserName", Boolean(endorserEmail) && !endorserName.trim())} errorText="Enter your endorser's name.">
              <input type="text" value={endorserName} onChange={(e) => setEndorserName(e.target.value)} onBlur={() => touch("endorserName")} placeholder="e.g. Dr. Jane Smith" />
            </FieldWrap>
            <FieldWrap label="Endorser's institutional email" optional={!endorserName} error={showError("endorserEmail", Boolean(endorserName) && !emailPattern.test(endorserEmail))} errorText="Enter a valid email address.">
              <input type="email" value={endorserEmail} onChange={(e) => setEndorserEmail(e.target.value)} onBlur={() => { touch("endorserEmail"); void checkEndorserDomain(endorserEmail); }} placeholder="name@university.edu" />
              <CheckHint
                check={endorserDomainCheck}
                validLabel={() => "Looks institutional"}
                statusMap={{ personal: "This looks like a personal email address, not an institutional one.", unverified_domain: "Domain noted — institutional status not confirmed." }}
              />
              <p className="cred-hint">Domain-matched to confirm institutional affiliation.</p>
            </FieldWrap>
            <FieldWrap label="Endorser's phone number" optional error={showError("endorserPhone", Boolean(endorserPhone) && !phonePattern.test(endorserPhone))} errorText="Enter a valid phone number.">
              <input type="tel" value={endorserPhone} onChange={(e) => setEndorserPhone(e.target.value)} onBlur={() => touch("endorserPhone")} placeholder="+1 (314) 555-0100" />
            </FieldWrap>
            <div className="cred-field">
              <label>Relationship to you</label>
              <div className="cred-radio-group">
                {(["pi", "coauthor", "committee"] as Relationship[]).map((value) => (
                  <label className="cred-radio-row" key={value}>
                    <input type="radio" name="endorserRelationship" checked={endorserRelationship === value} onChange={() => setEndorserRelationship(value)} />
                    {value === "pi" ? "Primary PI" : value === "coauthor" ? "Co-authored a publication with me" : "Served on my thesis/dissertation committee"}
                  </label>
                ))}
              </div>
              <p className="cred-hint">Co-authorship is cross-checked against ORCID/PubMed; PI and committee relationships are confirmed by email domain.</p>
            </div>
          </section>

          <section className="cred-block">
            <div className="cred-block-head">
              <div className="cred-block-title"><span className="cred-block-num">5</span><h2>Patents &amp; Trademarks</h2></div>
              <span className="cred-chip cred-chip-verified">Verified · US only</span>
            </div>
            <RepeatGroup label="Patents" rows={patents} placeholder="e.g. US10,123,456" fieldLabel="US Patent Number" onAdd={() => addRow("patent")} onRemove={(id) => removeRow("patent", id)} onChange={(id, value) => updateRow("patent", id, value)} addLabel="+ Add another patent" hint="Reviewed by our team; USPTO live verification activates once configured." />
            <RepeatGroup label="Trademarks" rows={trademarks} placeholder="e.g. 90123456" fieldLabel="US Trademark Serial or Registration No." onAdd={() => addRow("trademark")} onRemove={(id) => removeRow("trademark", id)} onChange={(id, value) => updateRow("trademark", id, value)} addLabel="+ Add another trademark" hint="Checked against USPTO TSDR by serial or registration number once configured." />
          </section>

          <button type="button" className="cred-submit-btn" onClick={reviewCredentials}>Review credentials</button>
        </form>

        {previewOpen && (
          <div className="cred-preview">
            <h3>Preview</h3>
            {previewRows.length === 0 ? <p>Nothing entered yet.</p> : previewRows.map((row, index) => (
              <div className="cred-preview-row" key={`${row.label}-${index}`}>
                <span className="cred-preview-label">{row.label}</span>
                <span className="cred-preview-value">{row.value}</span>
                <span className={`cred-chip cred-chip-${row.chip}`}>{row.chip === "required" ? "Required" : row.chip === "verified" ? "Verified" : row.chip === "unverified" ? "Not verified" : "Reference only"}</span>
              </div>
            ))}
          </div>
        )}

        <div className="cred-activation">
          <p className="cred-activation-title">Confirm &amp; verify your email</p>
          <p className="cred-hint">Review your credentials above first, then confirm to receive a verification email at the address you gave in Your Details.</p>
          <div className="consent-row">
            <input
              type="checkbox"
              id="cred-terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              disabled={submitStatus === "submitting" || submitStatus === "sent"}
            />
            <label htmlFor="cred-terms">
              I agree to the PostdocWorks{" "}
              <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and{" "}
              <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
            </label>
          </div>
          <button
            type="button"
            className="cred-submit-btn"
            disabled={!previewOpen || !qualified || !termsAccepted || submitStatus === "submitting" || submitStatus === "sent"}
            onClick={confirmAndSend}
          >
            {submitStatus === "submitting" ? "Sending..." : submitStatus === "sent" ? "Verification email sent ✓" : "Confirm & send verification email"}
          </button>
          {previewOpen && !qualified && (
            <p className="cred-gate-hint">
              You&apos;ve completed {percent}% — at least 60% (3 of 5 sections) is required. Still needed: {missingSections.join(", ")}.
              {(hasShortPatent || hasShortTrademark) && " A patent or trademark number you entered looks incomplete, so it isn't counted yet."}
            </p>
          )}
          {previewOpen && (!orcidOk || !pmidOk) && (
            <p className="cred-gate-hint">
              {!orcidOk && !pmidOk
                ? "The ORCID iD and PubMed ID you entered couldn't be verified — fix them or clear the fields to continue."
                : !orcidOk
                ? "The ORCID iD you entered couldn't be verified — fix it or clear the field to continue."
                : "The PubMed ID you entered couldn't be verified — fix it or clear the field to continue."}
            </p>
          )}
          {submitStatus === "error" && <p className="cred-error">{submitError}</p>}

          {submitStatus === "sent" && !authState.authenticated && (
            <div className="cred-email-sent-box">
              <p className="cred-hint">Verification email sent to {applicantEmail}. Click the link inside to activate your login — this page updates automatically once you do.</p>
              <button type="button" className="cred-resend-btn" onClick={resendEmail} disabled={resending}>
                {resending ? "Resending..." : "Resend verification email"}
              </button>
              {resendMessage && <p className="cred-hint">{resendMessage}</p>}
              <form className="cred-otp-form" onSubmit={submitOtpCode}>
                <FieldWrap label="Link not working? Enter the code from the email instead">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 123456"
                    maxLength={8}
                  />
                </FieldWrap>
                {otpStatus === "error" && <p className="cred-error">{otpError}</p>}
                <button type="submit" className="cred-resend-btn" disabled={otpStatus === "submitting" || otpCode.length < 6}>
                  {otpStatus === "submitting" ? "Verifying..." : "Verify code"}
                </button>
              </form>
              <p className="cred-waiting"><LoaderCircle size={14} className="cred-spin" /> Waiting for verification…</p>
            </div>
          )}

          {!authState.authenticated ? (
            <div className="cred-login-locked">
              <Lock size={28} className="cred-lock-icon" />
              <p className="cred-login-title cred-login-title-center">Login</p>
              <p className="cred-hint">Frozen until you verify your email above.</p>
            </div>
          ) : (
            <div className="cred-login-active">
              <p className="cred-login-title"><Check size={16} /> Email verified — welcome</p>
              {!passwordSet ? (
                <form onSubmit={submitPassword}>
                  <FieldWrap label="Email"><input type="email" value={authState.email} disabled /></FieldWrap>
                  <FieldWrap label="Create a password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></FieldWrap>
                  <FieldWrap label="Confirm password"><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" /></FieldWrap>
                  {passwordStatus === "error" && <p className="cred-error">{passwordError}</p>}
                  <button type="submit" className="cred-submit-btn" disabled={passwordStatus === "submitting"}>{passwordStatus === "submitting" ? "Saving..." : "Set password & continue"}</button>
                </form>
              ) : (
                <a className="cred-submit-btn cred-submit-link" href="/dashboard">Log in to your dashboard</a>
              )}
            </div>
          )}
        </div>

        <footer className="cred-legend">
          <div className="cred-legend-item"><span className="cred-chip cred-chip-required">Required</span> your own identity and contact info</div>
          <div className="cred-legend-item"><span className="cred-chip cred-chip-verified">Verified</span> optional, but checked live against the source when provided</div>
          <div className="cred-legend-item"><span className="cred-chip cred-chip-unverified">Not verified</span> a value was entered but couldn&apos;t be confirmed against the source</div>
          <div className="cred-legend-item"><span className="cred-chip cred-chip-reference">Reference only</span> self-reported, displayed but not checked</div>
          <p className="cred-legend-note">Patent and trademark numbers cover US filings only and are reviewed by our team; live USPTO verification activates once our integration key is configured.</p>
        </footer>
      </section>
    </div>
  );
}

function FieldWrap({ label, optional, error, errorText, hint, children }: { label: string; optional?: boolean; error?: boolean; errorText?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="cred-field">
      <label>{label} {optional && <span className="cred-optional-tag">— optional</span>}</label>
      {children}
      {error && errorText && <p className="cred-field-error">{errorText}</p>}
      {hint && <p className="cred-hint">{hint}</p>}
    </div>
  );
}

function CheckHint({ check, validLabel, statusMap }: { check: CheckStatus; validLabel: (check: CheckStatus) => string; statusMap?: Partial<Record<string, string>> }) {
  if (check.status === "idle") return null;
  if (check.status === "checking") return <p className="cred-check-hint checking"><LoaderCircle size={12} className="cred-spin" /> Checking...</p>;
  if (check.status === "valid" || check.status === "institutional") return <p className="cred-check-hint valid"><Check size={12} /> {validLabel(check)}</p>;
  const message = statusMap?.[check.status] || check.message || "Not found.";
  return <p className="cred-check-hint invalid">{message}</p>;
}

function RepeatGroup({ label, rows, placeholder, fieldLabel, onAdd, onRemove, onChange, addLabel, hint }: {
  label: string; rows: Row[]; placeholder: string; fieldLabel: string;
  onAdd: () => void; onRemove: (id: number) => void; onChange: (id: number, value: string) => void;
  addLabel: string; hint: string;
}) {
  return (
    <div className="cred-subgroup">
      <p className="cred-subgroup-label">{label}</p>
      {rows.map((row) => {
        const trimmed = row.value.trim();
        const tooShort = trimmed.length > 0 && trimmed.length < 5;
        return (
          <div className="cred-field cred-repeat-row" key={row.id}>
            <div className="cred-repeat-input">
              <label>{fieldLabel}</label>
              <input type="text" value={row.value} onChange={(e) => onChange(row.id, e.target.value)} placeholder={placeholder} />
              {tooShort && <p className="cred-field-error">That doesn&apos;t look like a complete number yet, so it won&apos;t count toward your score.</p>}
            </div>
            {rows.length > 1 && <button type="button" className="cred-remove-row" aria-label="Remove row" onClick={() => onRemove(row.id)}>×</button>}
          </div>
        );
      })}
      <button type="button" className="cred-add-row" onClick={onAdd}>{addLabel}</button>
      <p className="cred-hint">{hint}</p>
    </div>
  );
}

function EyeMark() {
  return (
    <div className="cred-eye-mark" aria-hidden="true">
      <svg viewBox="0 0 70 64" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#F4A725" strokeWidth="1.4" strokeLinecap="round" opacity="0.85">
          <line x1="16" y1="26" x2="6" y2="10" />
          <line x1="24" y1="19" x2="20" y2="2" />
          <line x1="34" y1="17" x2="34" y2="0" />
          <line x1="44" y1="19" x2="48" y2="2" />
          <line x1="52" y1="26" x2="62" y2="10" />
        </g>
        <path d="M8 40 Q34 20 60 40 Q34 58 8 40 Z" stroke="#F4A725" strokeWidth="1.6" fill="none" />
        <circle cx="34" cy="40" r="6.5" fill="#F4A725" />
      </svg>
    </div>
  );
}
