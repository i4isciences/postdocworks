"use client";

import { Inter, Source_Serif_4 } from "next/font/google";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock } from "lucide-react";
import { DOC2POSTDOC_PILLAR_NAMES, fieldsForPillar, DOC2POSTDOC_PILLARS } from "../../lib/doc2postdoc/taxonomy";

const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-source-serif" });
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter" });

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type SubmitStatus = "form" | "submitting" | "sent" | "error";
type PasswordStatus = "idle" | "submitting" | "success" | "error";
type AuthState = { authenticated: boolean; email: string };

function usaLikely(country: string) {
  const value = country.trim().toLowerCase();
  return value.includes("united states") || value === "usa" || value === "us";
}

export function Doc2PostdocProfileForm({ role, onBack }: { role: "doc" | "postdoc"; onBack: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [careerStage, setCareerStage] = useState(role === "doc" ? "PhD student" : "Postdoc");
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

  const [status, setStatus] = useState<SubmitStatus>("form");
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [authState, setAuthState] = useState<AuthState>({ authenticated: false, email: "" });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus>("idle");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSet, setPasswordSet] = useState(false);

  useEffect(() => {
    if (status !== "sent" || authState.authenticated) return;
    let cancelled = false;
    async function poll() {
      const response = await fetch("/api/doc2postdoc/auth").catch(() => null);
      if (cancelled || !response) return;
      if (response.ok) {
        const data = (await response.json()) as { user?: { email?: string } };
        setAuthState({ authenticated: true, email: data.user?.email || email });
      }
    }
    const interval = setInterval(poll, 4000);
    poll();
    return () => { cancelled = true; clearInterval(interval); };
  }, [status, authState.authenticated, email]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fullName.trim().length < 2 || !emailPattern.test(email) || !careerStage) {
      setError("Complete your name, email, and career stage to continue.");
      setStatus("error");
      return;
    }
    if (!pillar || !pillarField) {
      setError("Choose your pillar and field so we can match you accurately.");
      setStatus("error");
      return;
    }
    if (!termsAccepted) {
      setError("You must agree to the Terms of Service and Privacy Policy to continue.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/doc2postdoc/profile-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, email, signupRole: role, careerStage,
          primaryField: specialization.trim() || pillarField || "", pillar, pillarField, specialization, secondaryPillar,
          credibilityNotes,
          academicMemberships, socialMemberships, institution, department, city, state, country, usaRegion,
          languages, hobbies, maritalStatus, dietary, peerField, connection, matchRadius, broadcastOptIn,
          termsAccepted,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not save your profile.");
      setStatus("sent");
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "Please try again.");
    }
  }

  async function resendEmail() {
    setResending(true);
    setResendMessage("");
    try {
      const response = await fetch("/api/doc2postdoc/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "magiclink", email, displayName: fullName }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not resend the email.");
      setResendMessage("Verification email sent again.");
    } catch (resendError) {
      setResendMessage(resendError instanceof Error ? resendError.message : "We could not resend the email.");
    } finally {
      setResending(false);
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
    } catch (passwordSubmitError) {
      setPasswordStatus("error");
      setPasswordError(passwordSubmitError instanceof Error ? passwordSubmitError.message : "We could not set your password.");
    }
  }

  const showUsaRegion = usaLikely(country);
  const formLocked = status === "submitting" || status === "sent";

  return (
    <div className={`${sourceSerif.variable} ${inter.variable} d2p-pf-body`}>
      <div className="d2p-pf-wrap">
        <header className="d2p-pf-header">
          <button type="button" className="d2p-pf-back" onClick={onBack}><ArrowLeft size={14} /> Back</button>
          <div className="d2p-pf-kicker">Doc2Postdoc · Signing up as a {role === "doc" ? "PhD student (Doc)" : "Postdoc"}</div>
          <h1>Build your match profile</h1>
          <p>These details power your peer matches — the closer your field, stage, and circumstances line up with another doc, the sooner eyewee can connect you.</p>
        </header>

        <form onSubmit={submit}>
          <section className="d2p-pf-card">
            <div className="d2p-pf-section-head"><span className="d2p-pf-section-num">1</span><h2>About you</h2></div>
            <p className="d2p-pf-section-sub">Required</p>

            <div className="d2p-pf-row2">
              <div className="d2p-pf-field">
                <label htmlFor="fullName">Full name <span className="d2p-pf-req">*</span></label>
                <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={formLocked} required />
              </div>
              <div className="d2p-pf-field">
                <label htmlFor="email">Email address <span className="d2p-pf-req">*</span></label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={formLocked} required />
              </div>
            </div>

            <div className="d2p-pf-field">
              <label htmlFor="careerStage">Career stage <span className="d2p-pf-req">*</span></label>
              <select id="careerStage" value={careerStage} onChange={(e) => setCareerStage(e.target.value)} disabled={formLocked} required>
                <option value="">Select one</option>
                <option>PhD student</option>
                <option>Postdoc</option>
                <option>Medical resident</option>
                <option>Fellow</option>
                <option>PI</option>
                <option>Student (other)</option>
              </select>
            </div>
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
              <p className="d2p-pf-hint">Placeholder for the full Research Credibility Profile — structure pending.</p>
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
            <p className="d2p-pf-section-sub">Required — used for the geographic match ladder</p>

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
            <p className="d2p-pf-section-sub">Controls how far eyewee looks for a match</p>

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
            <div className="consent-row d2p-pf-consent">
              <input
                type="checkbox"
                id="d2p-pf-terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={formLocked}
              />
              <label htmlFor="d2p-pf-terms">
                I agree to the Postdocworks <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and{" "}
                <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
              </label>
            </div>
            <button type="submit" className="d2p-pf-submit" disabled={formLocked || !termsAccepted}>
              {status === "submitting" ? "Saving..." : status === "sent" ? "Profile saved ✓" : "Save profile"}
            </button>
            <p className="d2p-pf-foot-note">You can update any of this later from your Navigator profile.</p>
            {status === "error" && <p className="d2p-pf-error">{error}</p>}
          </div>
        </form>

        <section className="d2p-pf-card d2p-pf-activation">
          <div className="d2p-pf-section-head"><span className="d2p-pf-section-num">7</span><h2>Confirm &amp; verify your email</h2></div>
          <p className="d2p-pf-section-sub">Unlocks your Doc2Postdoc login</p>
          <p className="d2p-pf-hint">Save your profile above first — we&apos;ll send a real verification email to the address you gave in About you.</p>

          {status === "sent" && !authState.authenticated && (
            <div className="d2p-pf-sent-box">
              <p className="d2p-pf-hint">Verification email sent to {email}. Click the link inside to activate your login — this page updates automatically once you do.</p>
              <button type="button" className="d2p-pf-resend" onClick={resendEmail} disabled={resending}>
                {resending ? "Resending..." : "Resend verification email"}
              </button>
              {resendMessage && <p className="d2p-pf-hint">{resendMessage}</p>}
            </div>
          )}

          {!authState.authenticated ? (
            <div className="d2p-pf-login-locked">
              <Lock size={26} className="d2p-pf-lock-icon" />
              <p className="d2p-pf-login-title d2p-pf-login-title-center">Login</p>
              <p className="d2p-pf-hint">Frozen until you verify your email above.</p>
            </div>
          ) : (
            <div className="d2p-pf-login-active">
              <p className="d2p-pf-login-title"><Check size={16} /> Email verified — welcome</p>
              {!passwordSet ? (
                <form onSubmit={submitPassword}>
                  <div className="d2p-pf-field"><label>Email</label><input type="email" value={authState.email} disabled /></div>
                  <div className="d2p-pf-field"><label>Create a password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></div>
                  <div className="d2p-pf-field"><label>Confirm password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" /></div>
                  {passwordStatus === "error" && <p className="d2p-pf-error">{passwordError}</p>}
                  <button type="submit" className="d2p-pf-submit" disabled={passwordStatus === "submitting"}>{passwordStatus === "submitting" ? "Saving..." : "Set password & continue"}</button>
                </form>
              ) : (
                <a className="d2p-pf-submit d2p-pf-submit-link" href="/doc2postdoc">Log in to your dashboard <ArrowRight size={15} /></a>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
