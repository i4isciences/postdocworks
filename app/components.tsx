"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { CredentialForm } from "./credentials/CredentialForm";

type RegistrationState = "idle" | "submitting" | "success" | "error";

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
        <a className="home-brand" href="#top" aria-label="Postdocworks home"><Image src="/postdocworks.jpg" alt="Postdocworks logo" width={190} height={54} priority /><span className="home-brand-copy"><strong>Postdocworks</strong><small>You say it, Eyewee carries it, guides it and cracks the toughest problems</small></span></a>
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
        <p className="hero-kicker">Postdocworks</p>
        <h1>Cross the bridge from<br />academia to industry.</h1>
        <p className="hero-lead">Verified profiles, AI-guided matching, and a real path from postdoc to what&apos;s next.</p>
        <button className="hero-cta-main register-attention" type="button" onClick={() => document.getElementById("watch")?.scrollIntoView({ behavior: "smooth" })}>Explore now <ArrowRight size={17} /></button>
      </section>
      <section className="home-showcase" id="watch" aria-label="Postdocworks product preview">
        <div className="showcase-frame">
          <video className="showcase-video" autoPlay muted loop playsInline src="/postdocworks.mp4" aria-label="Postdocworks introduction video" />
        </div>
      </section>
      <section className="platform-intro" id="platform"><p className="section-label">One company. Two decisive moves.</p><h2>Research careers deserve better than a handoff.</h2><p className="platform-lead">Postdocworks turns hard-earned academic experience into momentum, connecting the person doing the work with the people and opportunities ready for it.</p>
        <div className="product-split"><article className="product-panel product-panel-dark"><p className="product-number">01 / Doc2Postdoc</p><h3>The shortest distance between where you are and what&apos;s next.</h3><p>Find the person who has already made your transition. Doc2Postdoc matches PhD researchers with credible postdocs for specific, human guidance when the stakes are highest.</p><a href="/doc2postdoc" className="product-link">Explore Doc2Postdoc <ArrowRight size={16} /></a></article><article className="product-panel product-panel-gold"><p className="product-number">02 / Postdocworks</p><h3>Your record, finally read as a whole.</h3><p>Postdocworks gives institutions and researchers a more intelligent way to meet: verified credentials, meaningful context, and a career signal that goes beyond a title.</p><a href="#register" className="product-link">Build your record <ArrowRight size={16} /></a></article></div>
      </section>
      <section className="register-band" id="register"><div><p className="section-label">The first step is yours</p><h2>Make your next move legible.</h2></div><button className="register-round-button register-attention" type="button" onClick={() => setFormOpen(true)}>Register now <ArrowRight size={19} /></button></section>
      <footer className="home-footer"><a className="footer-brand" href="#top" aria-label="Postdocworks home"><Image src="/postdocworks.jpg" alt="Postdocworks logo" width={190} height={54} /><span className="home-brand-copy"><strong>Postdocworks</strong><small>You say it, Eyewee carries it, guides it and cracks the toughest problems</small></span></a><span className="footer-powered">Powered by i4iSciences<sup>TM</sup></span><nav className="footer-legal" aria-label="Legal"><a href="/terms">Terms of Service</a><a href="/privacy">Privacy Policy</a></nav><a className="footer-contact" href="mailto:hello@postdocworks.io">hello@postdocworks.io</a></footer>
      {formOpen && <CredentialForm onClose={() => setFormOpen(false)} />}
    </main>
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
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="registration-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title"><button className="modal-close" type="button" onClick={onClose} aria-label="Close registration form"><X size={20} /></button>{state === "success" ? <div className="success-state"><span className="success-icon"><Check size={23} /></span><p className="section-label">Registration received</p><h2>You&apos;re on the way.</h2><p>Thank you for registering with Postdocworks. We&apos;ll be in touch with the next step.</p><button className="modal-submit" type="button" onClick={onClose}>Back to Postdocworks <ArrowRight size={16} /></button></div> : <><p className="section-label">Join the first cohort</p><h2 id="registration-title">Register your record.</h2><p className="modal-intro">A small first step toward a more credible, connected research career.</p><form className="registration-form" onSubmit={submit}><div className="form-grid">{formFields.map((field) => <label key={field.name}>{field.label}{field.required && <span> *</span>}<input name={field.name} type={field.type || "text"} placeholder={field.placeholder} required={field.required} /></label>)}</div><label>How do you see yourself? <span> *</span><select name="role" required defaultValue=""><option value="" disabled>Select one</option><option value="phd_student">PhD student</option><option value="postdoc">Postdoc</option><option value="faculty">Faculty / PI</option><option value="industry">Industry / hiring</option></select></label><label>What are you looking for? <textarea name="message" placeholder="Tell us a little about your next step..." rows={3} /></label><p className="form-note">Your information is used only to help us build a better first experience.</p><div className="consent-row"><input type="checkbox" id="reg-terms" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /><label htmlFor="reg-terms">I agree to the Postdocworks <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.</label></div>{message && <p className="form-error" role="alert">{message}</p>}<button className="modal-submit" disabled={state === "submitting" || !termsAccepted} type="submit">{state === "submitting" ? "Sending..." : "Complete registration"} <ArrowRight size={16} /></button></form></>}</section></div>;
}
