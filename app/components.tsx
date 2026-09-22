"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { CredentialForm } from "./credentials/CredentialForm";

type RegistrationState = "idle" | "submitting" | "success" | "error";

const careerStages = ["Postdoc", "PhD student", "Medical resident / fellow", "Faculty / PI", "Other"];

const formFields = [
  { name: "fullName", label: "Full name", placeholder: "Your name", required: true },
  { name: "email", label: "Email address", placeholder: "you@university.edu", type: "email", required: true },
  { name: "institution", label: "Institution", placeholder: "University, lab, or company", required: true },
  { name: "researchArea", label: "Research area", placeholder: "e.g. Computational biology", required: true },
  { name: "orcid", label: "ORCID iD", placeholder: "0000-0000-0000-0000" },
  { name: "linkedin", label: "LinkedIn profile", placeholder: "https://linkedin.com/in/...", type: "url" },
];

export function HomePage() {
  const [formOpen, setFormOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/doc2postdoc/auth").then((response) => { if (!cancelled) setSignedIn(response.ok); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="home-site">
      <header className="home-nav">
        <a className="home-brand" href="#top" aria-label="PostdocWorks home"><Image src="/postdocworks.svg" alt="PostdocWorks logo" width={190} height={54} priority /><span className="home-brand-copy"><strong>PostdocWorks<sup className="brand-sm-mark">SM</sup></strong><small>You say it — eyewee carries it, guides it, and cracks the toughest problems</small></span></a>
        <nav className="home-nav-links" aria-label="Main navigation">
          <a href="#platform">The platform</a><a href="/doc2postdoc">Doc2Postdoc</a><a href="https://eyewee.vercel.app/" target="_blank" rel="noreferrer">eyewee</a><a href="/careers">Careers</a><a href="/contact">Contact</a>
          {signedIn ? (
            <a className="nav-register register-attention" href="/dashboard">Go to dashboard <ArrowRight size={15} /></a>
          ) : (
            <button className="nav-register register-attention" type="button" onClick={() => setFormOpen(true)}>Register now <ArrowRight size={15} /></button>
          )}
        </nav>
        {signedIn ? (
          <a className="mobile-nav-register" href="/dashboard" aria-label="Go to your dashboard"><ArrowRight size={18} /></a>
        ) : (
          <button className="mobile-nav-register" type="button" onClick={() => setFormOpen(true)} aria-label="Open registration form"><ArrowRight size={18} /></button>
        )}
      </header>
      <section className="home-hero" id="top">
        <span className="hero-early-access">Early access</span>
        <p className="hero-kicker">PostdocWorks</p>
        <h1>Cross the bridge from<br />academia to industry.</h1>
        <p className="hero-lead">Verified profiles, AI-guided matching, and a real path from postdoc to what&apos;s next.</p>
        <div className="hero-cta-row">
          <button className="hero-cta-main register-attention" type="button" onClick={() => document.getElementById("watch")?.scrollIntoView({ behavior: "smooth" })}>Explore now <ArrowRight size={17} /></button>
          <a className="hero-cta" href="#waitlist">Join waitlist <ArrowRight size={17} /></a>
        </div>
      </section>
      <section className="home-showcase" id="watch" aria-label="PostdocWorks product preview">
        <div className="showcase-frame">
          <video className="showcase-video" autoPlay muted loop playsInline src="/postdocworks.mp4" aria-label="PostdocWorks introduction video" />
        </div>
      </section>
      <section className="platform-intro" id="platform"><p className="section-label">One company. Two decisive moves.</p><h2>Research careers deserve better than a handoff.</h2><p className="platform-lead">PostdocWorks turns hard-earned academic experience into momentum, connecting the person doing the work with the people and opportunities ready for it.</p>
        <div className="product-split"><article className="product-panel product-panel-dark"><p className="product-number">01 / Doc2Postdoc</p><h3>The shortest distance between where you are and what&apos;s next.</h3><p>Find the person who has already made your transition. Doc2Postdoc matches PhD researchers with credible postdocs for specific, human guidance when the stakes are highest.</p><a href="/doc2postdoc" className="product-link">Explore Doc2Postdoc <ArrowRight size={16} /></a></article><article className="product-panel product-panel-gold"><p className="product-number">02 / PostdocWorks</p><h3>Your record, finally read as a whole.</h3><p>PostdocWorks gives institutions and researchers a more intelligent way to meet: verified credentials, meaningful context, and a career signal that goes beyond a title.</p><a href="#register" className="product-link">Build your record <ArrowRight size={16} /></a></article></div>
      </section>
      <section className="register-band" id="register"><div><p className="section-label">The first step is yours</p><h2>Make your next move legible.</h2></div><button className="register-round-button register-attention" type="button" onClick={() => setFormOpen(true)}>Register now <ArrowRight size={19} /></button></section>
      <WaitlistBand />
      <footer className="home-footer"><a className="footer-brand" href="#top" aria-label="PostdocWorks home"><Image src="/postdocworks.svg" alt="PostdocWorks logo" width={190} height={54} /><span className="home-brand-copy"><strong>PostdocWorks<sup className="brand-sm-mark">SM</sup></strong><small>You say it — eyewee carries it, guides it, and cracks the toughest problems</small></span></a><span className="footer-powered">Powered by i4iSciences<sup>TM</sup></span><nav className="footer-legal" aria-label="Legal"><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a></nav><a className="footer-contact" href="mailto:hello@postdocworks.io">hello@postdocworks.io</a></footer>
      {formOpen && <CredentialForm onClose={() => setFormOpen(false)} />}
    </main>
  );
}

function WaitlistBand() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [careerStage, setCareerStage] = useState("Postdoc");
  const [researchField, setResearchField] = useState("");
  const [institution, setInstitution] = useState("");
  const [city, setCity] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [state, setState] = useState<RegistrationState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fullName.trim() || !email.trim()) { setState("error"); setMessage("Please add your name and email so we know where to send your invite."); return; }
    if (!consentGiven) { setState("error"); setMessage("Please accept the Terms of Service and Privacy Policy to continue."); return; }
    setState("submitting"); setMessage("");
    try {
      const response = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fullName, email, careerStage, researchField, institution, city, consentGiven, source: "postdocworks-home" }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "We could not process that signup.");
      setState("success");
    } catch (error) {
      setState("error"); setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }

  if (state === "success") {
    return <section className="home-waitlist" id="waitlist"><div className="home-waitlist-inner success-state"><span className="success-icon"><Check size={23} /></span><p className="section-label">You&apos;re on the list</p><h2>We&apos;ll be in touch.</h2><p>We&apos;ll email you the moment eyewee and Doc2Postdoc open in your field and metro. No spam — one email, when it&apos;s your turn.</p></div></section>;
  }

  return (
    <section className="home-waitlist" id="waitlist">
      <div className="home-waitlist-inner">
        <p className="section-label">Be first in your field</p>
        <h2>Join the eyewee &amp; Doc2Postdoc waitlist.</h2>
        <p>We&apos;re opening Doc2Postdoc metro by metro, field by field — Chicago and St. Louis first. Join now and you&apos;re matched the moment your field opens, ahead of general signups.</p>
        <form className="registration-form" onSubmit={submit}>
          <div className="form-grid">
            <label>Full name<input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Jane Doe" required /></label>
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jane@university.edu" required /></label>
          </div>
          <label>Career stage<select value={careerStage} onChange={(event) => setCareerStage(event.target.value)}>{careerStages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label>
          <div className="form-grid">
            <label>Research field<input value={researchField} onChange={(event) => setResearchField(event.target.value)} placeholder="e.g. HBV virology" /></label>
            <label>Institution<input value={institution} onChange={(event) => setInstitution(event.target.value)} placeholder="University or lab" /></label>
          </div>
          <label>City / metro area<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="e.g. Chicago, IL" /></label>
          <div className="consent-row"><input type="checkbox" id="wl-terms" checked={consentGiven} onChange={(event) => setConsentGiven(event.target.checked)} /><label htmlFor="wl-terms">I agree to the PostdocWorks <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</label></div>
          {message && <p className="form-error" role="alert">{message}</p>}
          <button className="modal-submit" disabled={state === "submitting"} type="submit">{state === "submitting" ? "Joining..." : "Join the waitlist"} <ArrowRight size={16} /></button>
        </form>
      </div>
    </section>
  );
}

export function RegistrationModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<RegistrationState>("idle");
  const [message, setMessage] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!termsAccepted) { setState("error"); setMessage("You must agree to the Terms of Service and Privacy Policy to continue."); return; }
    setState("submitting"); setMessage("");
    const payload = { ...Object.fromEntries(new FormData(event.currentTarget).entries()), termsAccepted };
    try { const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error || "We could not complete your registration."); setState("success"); }
    catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Please try again."); }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="registration-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title"><button className="modal-close" type="button" onClick={onClose} aria-label="Close registration form"><X size={20} /></button>{state === "success" ? <div className="success-state"><span className="success-icon"><Check size={23} /></span><p className="section-label">Registration received</p><h2>You&apos;re on the way.</h2><p>Thank you for registering with PostdocWorks. We&apos;ll be in touch with the next step.</p><button className="modal-submit" type="button" onClick={onClose}>Back to PostdocWorks <ArrowRight size={16} /></button></div> : <><p className="section-label">Join the first cohort</p><h2 id="registration-title">Register your record.</h2><p className="modal-intro">A small first step toward a more credible, connected research career.</p><form className="registration-form" onSubmit={submit}><div className="form-grid">{formFields.map((field) => <label key={field.name}>{field.label}{field.required && <span> *</span>}<input name={field.name} type={field.type || "text"} placeholder={field.placeholder} required={field.required} /></label>)}</div><label>How do you see yourself? <span> *</span><select name="role" required defaultValue=""><option value="" disabled>Select one</option><option value="phd_student">PhD student</option><option value="postdoc">Postdoc</option><option value="faculty">Faculty / PI</option><option value="industry">Industry / hiring</option></select></label><label>What are you looking for? <textarea name="message" placeholder="Tell us a little about your next step..." rows={3} /></label><p className="form-note">Your information is used only to help us build a better first experience.</p><div className="consent-row"><input type="checkbox" id="reg-terms" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><label htmlFor="reg-terms">I agree to the PostdocWorks <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</label></div>{message && <p className="form-error" role="alert">{message}</p>}<button className="modal-submit" disabled={state === "submitting" || !termsAccepted} type="submit">{state === "submitting" ? "Sending..." : "Complete registration"} <ArrowRight size={16} /></button></form></>}</section></div>;
}
