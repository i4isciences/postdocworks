"use client";

import { Inter, Source_Serif_4 } from "next/font/google";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { DOC2POSTDOC_PILLAR_NAMES, fieldsForPillar, DOC2POSTDOC_PILLARS } from "../../lib/doc2postdoc/taxonomy";

const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-source-serif" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

type LoadStatus = "loading" | "ready" | "load-error";
type SubmitStatus = "form" | "submitting" | "error";

type KnownProfile = {
  display_name: string;
  email: string;
  role: string;
  career_stage_label: string;
  pillar: string;
  pillar_field: string;
  specialization: string;
  secondary_pillar: string;
  about: string;
  academic_memberships: string;
  social_memberships: string;
  institution: string;
  department: string;
  geography: string;
  usa_region: string;
  languages: string;
  hobbies: string;
  marital_status: string;
  dietary: string;
  peer_field: string;
  professional_connection: string;
  match_radius: string;
  broadcast_opt_in: boolean;
  mentor_available: boolean;
};

const DOC_STAGES = ["PhD student", "Student (other)"];
const POSTDOC_STAGES = ["Postdoc", "Medical resident", "Fellow", "PI"];

function usaLikely(country: string) {
  const value = country.trim().toLowerCase();
  return value.includes("united states") || value === "usa" || value === "us";
}

function splitGeography(geography: string) {
  const parts = geography.split(",").map((part) => part.trim()).filter(Boolean);
  return { city: parts[0] || "", state: parts[1] || "", country: parts[2] || "" };
}

export function Doc2PostdocProfileForm({ onComplete }: { onComplete: () => void }) {
  const [loadStatus, setLoadStatus] = useState<LoadStatus>("loading");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("");
  const [careerStageLabel, setCareerStageLabel] = useState("");

  const [pillar, setPillar] = useState("");
  const [pillarField, setPillarField] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [secondaryPillar, setSecondaryPillar] = useState("");
  const [credibilityNotes, setCredibilityNotes] = useState("");
  const [academicMemberships, setAcademicMemberships] = useState("");
  const [socialMemberships, setSocialMemberships] = useState("");
  const [institution, setInstitution] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [usaRegion, setUsaRegion] = useState("");
  const [languages, setLanguages] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [dietary, setDietary] = useState("");
  const [peerField, setPeerField] = useState("");
  const [connection, setConnection] = useState("");
  const [matchRadius, setMatchRadius] = useState("Campus");
  const [broadcastOptIn, setBroadcastOptIn] = useState(false);
  const [mentorAvailable, setMentorAvailable] = useState(false);

  const [status, setStatus] = useState<SubmitStatus>("form");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/doc2postdoc/profile");
        if (!response.ok) throw new Error();
        const data = (await response.json()) as { profile: KnownProfile };
        if (cancelled) return;
        const p = data.profile;
        const geo = splitGeography(p.geography || "");
        setDisplayName(p.display_name || "");
        setRole(p.role || "");
        setCareerStageLabel(p.career_stage_label || "");
        setPillar(p.pillar || "");
        setPillarField(p.pillar_field || "");
        setSpecialization(p.specialization || "");
        setSecondaryPillar(p.secondary_pillar || "");
        setCredibilityNotes(p.about || "");
        setAcademicMemberships(p.academic_memberships || "");
        setSocialMemberships(p.social_memberships || "");
        setInstitution(p.institution || "");
        setDepartment(p.department || "");
        setCity(geo.city);
        setState(geo.state);
        setCountry(geo.country);
        setUsaRegion(p.usa_region || "");
        setLanguages(p.languages || "");
        setHobbies(p.hobbies || "");
        setMaritalStatus(p.marital_status || "");
        setDietary(p.dietary || "");
        setPeerField(p.peer_field || "");
        setConnection(p.professional_connection || "");
        setMatchRadius(p.match_radius || "Campus");
        setBroadcastOptIn(Boolean(p.broadcast_opt_in));
        setMentorAvailable(Boolean(p.mentor_available));
        if (!p.career_stage_label) setCareerStageLabel(p.role === "postdoc" ? POSTDOC_STAGES[0] : DOC_STAGES[0]);
        setLoadStatus("ready");
      } catch {
        if (!cancelled) setLoadStatus("load-error");
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function signOut() {
    await fetch("/api/doc2postdoc/auth", { method: "DELETE" });
    window.location.href = "/doc2postdoc";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!careerStageLabel) {
      setError("Choose your career stage so we can match you accurately.");
      setStatus("error");
      return;
    }
    if (!pillar || !pillarField) {
      setError("Choose your pillar and field so we can match you accurately.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/doc2postdoc/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          career_stage_label: careerStageLabel,
          pillar, pillar_field: pillarField, specialization, secondary_pillar: secondaryPillar,
          about: credibilityNotes, academic_memberships: academicMemberships, social_memberships: socialMemberships,
          institution, department, geography: [city, state, country].filter(Boolean).join(", "), usa_region: usaRegion,
          languages, hobbies, marital_status: maritalStatus, dietary, peer_field: peerField,
          professional_connection: connection, match_radius: matchRadius, broadcast_opt_in: broadcastOptIn,
          research_area: specialization.trim() || pillarField,
          ...(role === "postdoc" ? { is_mentor: mentorAvailable, mentor_available: mentorAvailable } : {}),
          complete_profile: true,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not save your profile.");
      onComplete();
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Please try again.");
    }
  }

  const showUsaRegion = usaLikely(country);
  const formLocked = status === "submitting";

  if (loadStatus === "loading") {
    return <div className="d2p-gate-loading">Loading your account...</div>;
  }
  if (loadStatus === "load-error") {
    return (
      <div className="d2p-gate-loading">
        We couldn&apos;t load your account. <button type="button" className="d2p-pf-back" onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  }

  return (
    <div className={`${sourceSerif.variable} ${inter.variable} d2p-pf-body`}>
      <div className="d2p-pf-wrap">
        <header className="d2p-pf-header">
          <div className="d2p-pf-kicker">
            Doc2Postdoc · Signed in as {displayName || "you"} ({role === "phd_student" ? "PhD student (Doc)" : "Postdoc"}) ·{" "}
            <button type="button" className="d2p-pf-back" onClick={signOut} style={{ display: "inline", padding: 0 }}>Not you? Sign out</button>
          </div>
          <h1>Finish your match profile</h1>
          <p>Your account is verified. These details power your peer matches — the closer your field, stage, and circumstances line up with another member, the sooner Doc2Postdoc can connect you.</p>
        </header>

        <form onSubmit={submit}>
          <section className="d2p-pf-card">
            <div className="d2p-pf-section-head"><span className="d2p-pf-section-num">1</span><h2>About you</h2></div>
            <div className="d2p-pf-row2">
              <div className="d2p-pf-field"><label>Name</label><input type="text" value={displayName} disabled /></div>
              <div className="d2p-pf-field">
                <label htmlFor="careerStageLabel">Career stage <span className="d2p-pf-req">*</span></label>
                <select id="careerStageLabel" value={careerStageLabel} onChange={(e) => setCareerStageLabel(e.target.value)} disabled={formLocked} required>
                  {(role === "postdoc" ? POSTDOC_STAGES : DOC_STAGES).map((stage) => <option key={stage}>{stage}</option>)}
                </select>
              </div>
            </div>
            {role === "postdoc" && (
              <div className="d2p-pf-check-row">
                <input type="checkbox" id="mentorAvailable" checked={mentorAvailable} onChange={(e) => setMentorAvailable(e.target.checked)} disabled={formLocked} />
                <div>
                  <label htmlFor="mentorAvailable">Available to mentor a PhD student</label>
                  <p className="d2p-pf-hint">Turn this off if you&apos;d rather browse first — you can change it anytime from your profile.</p>
                </div>
              </div>
            )}
          </section>

          <section className="d2p-pf-card">
            <div className="d2p-pf-section-head"><span className="d2p-pf-section-num">2</span><h2>Field &amp; research</h2></div>
            <p className="d2p-pf-section-sub">Required</p>

            <div className="d2p-pf-row2">
              <div className="d2p-pf-field">
                <label htmlFor="pillar">Pillar <span className="d2p-pf-req">*</span></label>
                <select id="pillar" value={pillar} onChange={(e) => { setPillar(e.target.value); setPillarField(""); }} disabled={formLocked} required>
                  <option value="">Select one</option>
                  {DOC2POSTDOC_PILLAR_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </div>
              <div className="d2p-pf-field">
                <label htmlFor="pillarField">Field <span className="d2p-pf-req">*</span></label>
                <select id="pillarField" value={pillarField} onChange={(e) => setPillarField(e.target.value)} disabled={formLocked || !pillar} required>
                  <option value="">{pillar ? "Select one" : "Choose a pillar first"}</option>
                  {fieldsForPillar(pillar).map((field) => <option key={field} value={field}>{field}</option>)}
                </select>
              </div>
            </div>

            <div className="d2p-pf-field">
              <label htmlFor="specialization">Specialization <span className="d2p-pf-optional">— optional</span></label>
              <input type="text" id="specialization" value={specialization} onChange={(e) => setSpecialization(e.target.value)} disabled={formLocked} placeholder="e.g. HBV persistence mechanisms" />
              <p className="d2p-pf-hint">Your specific niche within the field above — this stays free text, it&apos;s not a fixed list.</p>
            </div>

            <div className="d2p-pf-field">
              <label htmlFor="secondaryPillar">Secondary pillar <span className="d2p-pf-optional">— optional, for interdisciplinary work</span></label>
              <select id="secondaryPillar" value={secondaryPillar} onChange={(e) => setSecondaryPillar(e.target.value)} disabled={formLocked}>
                <option value="">None</option>
                {DOC2POSTDOC_PILLAR_NAMES.filter((name) => name !== pillar).map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              {DOC2POSTDOC_PILLARS.find((p) => p.name === pillar)?.crossTagHint && (
                <p className="d2p-pf-hint">{DOC2POSTDOC_PILLARS.find((p) => p.name === pillar)?.crossTagHint}</p>
              )}
            </div>

            <div className="d2p-pf-field">
              <label htmlFor="credibilityNotes">Research credibility notes</label>
              <textarea id="credibilityNotes" value={credibilityNotes} onChange={(e) => setCredibilityNotes(e.target.value)} disabled={formLocked} placeholder="Brief note on your current research focus" />
            </div>

            <div className="d2p-pf-field">
              <label htmlFor="academicMemberships">Academic memberships</label>
              <input type="text" id="academicMemberships" value={academicMemberships} onChange={(e) => setAcademicMemberships(e.target.value)} disabled={formLocked} placeholder="Comma-separated" />
            </div>

            <div className="d2p-pf-field">
              <label htmlFor="socialMemberships">Social memberships</label>
              <input type="text" id="socialMemberships" value={socialMemberships} onChange={(e) => setSocialMemberships(e.target.value)} disabled={formLocked} placeholder="Comma-separated" />
            </div>
          </section>

          <section className="d2p-pf-card">
            <div className="d2p-pf-section-head"><span className="d2p-pf-section-num">3</span><h2>Location &amp; institution</h2></div>
            <p className="d2p-pf-section-sub">Used for the geographic match ladder</p>

            <div className="d2p-pf-row2">
              <div className="d2p-pf-field">
                <label htmlFor="institution">Institution / campus</label>
                <input type="text" id="institution" value={institution} onChange={(e) => setInstitution(e.target.value)} disabled={formLocked} />
              </div>
              <div className="d2p-pf-field">
                <label htmlFor="department">Department</label>
                <input type="text" id="department" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={formLocked} />
              </div>
            </div>

            <div className="d2p-pf-row2">
              <div className="d2p-pf-field">
                <label htmlFor="city">City</label>
                <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} disabled={formLocked} />
              </div>
              <div className="d2p-pf-field">
                <label htmlFor="state">State / province</label>
                <input type="text" id="state" value={state} onChange={(e) => setState(e.target.value)} disabled={formLocked} />
              </div>
            </div>

            <div className="d2p-pf-field">
              <label htmlFor="country">Country</label>
              <input type="text" id="country" value={country} onChange={(e) => setCountry(e.target.value)} disabled={formLocked} />
            </div>

            {showUsaRegion && (
              <div className="d2p-pf-field">
                <label htmlFor="usaRegion">US region</label>
                <select id="usaRegion" value={usaRegion} onChange={(e) => setUsaRegion(e.target.value)} disabled={formLocked}>
                  <option value="">Select one</option>
                  <option>Northeast</option>
                  <option>Midwest</option>
                  <option>South</option>
                  <option>West</option>
                </select>
              </div>
            )}
          </section>

          <section className="d2p-pf-card">
            <div className="d2p-pf-section-head"><span className="d2p-pf-section-num">4</span><h2>Personal &amp; lifestyle</h2></div>
            <p className="d2p-pf-section-sub">Reference — shown to matches, not verified</p>

            <div className="d2p-pf-field">
              <label htmlFor="languages">Languages spoken</label>
              <input type="text" id="languages" value={languages} onChange={(e) => setLanguages(e.target.value)} disabled={formLocked} placeholder="e.g. Hindi, Tamil, English" />
            </div>

            <div className="d2p-pf-field">
              <label htmlFor="hobbies">Hobbies &amp; interests outside academia</label>
              <textarea id="hobbies" value={hobbies} onChange={(e) => setHobbies(e.target.value)} disabled={formLocked} />
            </div>

            <div className="d2p-pf-row2">
              <div className="d2p-pf-field">
                <label htmlFor="maritalStatus">Marital status</label>
                <select id="maritalStatus" value={maritalStatus} onChange={(e) => setMaritalStatus(e.target.value)} disabled={formLocked}>
                  <option value="">Prefer not to say</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Looking</option>
                </select>
              </div>
              <div className="d2p-pf-field">
                <label htmlFor="dietary">Dietary preference</label>
                <select id="dietary" value={dietary} onChange={(e) => setDietary(e.target.value)} disabled={formLocked}>
                  <option value="">Prefer not to say</option>
                  <option>Vegetarian</option>
                  <option>Non-vegetarian</option>
                </select>
              </div>
            </div>
          </section>

          <section className="d2p-pf-card">
            <div className="d2p-pf-section-head"><span className="d2p-pf-section-num">5</span><h2>Your network</h2></div>
            <p className="d2p-pf-section-sub">Reference — seeds your first matches</p>

            <div className="d2p-pf-field">
              <label htmlFor="peerField">Peer in your field</label>
              <input type="text" id="peerField" value={peerField} onChange={(e) => setPeerField(e.target.value)} disabled={formLocked} placeholder="Name of a fellow researcher in your field" />
            </div>

            <div className="d2p-pf-field">
              <label htmlFor="connection">Professional connection</label>
              <input type="text" id="connection" value={connection} onChange={(e) => setConnection(e.target.value)} disabled={formLocked} placeholder="Name of one other contact in your network" />
            </div>
          </section>

          <section className="d2p-pf-card">
            <div className="d2p-pf-section-head"><span className="d2p-pf-section-num">6</span><h2>Matching preferences</h2></div>
            <p className="d2p-pf-section-sub">Controls how far Doc2Postdoc looks for a match</p>

            <div className="d2p-pf-field">
              <label htmlFor="matchRadius">Preferred match radius</label>
              <select id="matchRadius" value={matchRadius} onChange={(e) => setMatchRadius(e.target.value)} disabled={formLocked}>
                <option>Campus</option>
                <option>Department</option>
                <option>City</option>
                <option>State</option>
                <option>Country</option>
                <option>Continent</option>
                <option>Global</option>
              </select>
            </div>

            <div className="d2p-pf-check-row">
              <input type="checkbox" id="broadcastOptIn" checked={broadcastOptIn} onChange={(e) => setBroadcastOptIn(e.target.checked)} disabled={formLocked} />
              <div>
                <label htmlFor="broadcastOptIn">Available for wider broadcast</label>
                <p className="d2p-pf-hint">If none of your direct connections respond to a Ring the Bell request, opt in to reach the wider matched pool in your pillar and geography.</p>
              </div>
            </div>
          </section>

          <div className="d2p-pf-actions">
            <button type="submit" className="d2p-pf-submit" disabled={formLocked}>
              {status === "submitting" ? "Saving..." : "Save & continue to Doc2Postdoc"} <ArrowRight size={15} />
            </button>
            <p className="d2p-pf-foot-note">You can update any of this later from your Navigator profile.</p>
            {status === "error" && <p className="d2p-pf-error">{error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
