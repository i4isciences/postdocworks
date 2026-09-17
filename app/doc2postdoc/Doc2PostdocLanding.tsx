"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, GraduationCap, Microscope } from "lucide-react";
import { Doc2PostdocProfileForm } from "./Doc2PostdocProfileForm";

type View = "landing" | "form" | "signin";

const steps = [
  { number: "01", title: "Career-stage matching", body: "Matched across the 12-pillar taxonomy — field, stage, and geography — not just keyword search." },
  { number: "02", title: "Research credibility profile", body: "Your profile carries the same verification standard as the rest of PostdocWorks Navigator." },
  { number: "03", title: "Direct connection", body: "Confidentiality and IP protections built in from the first message onward." },
];

export function Doc2PostdocLanding() {
  const [view, setView] = useState<View>("landing");
  const [role, setRole] = useState<"doc" | "postdoc">("doc");

  if (view === "form") return <Doc2PostdocProfileForm role={role} onBack={() => setView("landing")} />;
  if (view === "signin") return <Doc2PostdocSignIn onBack={() => setView("landing")} />;

  return (
    <main className="d2p-land">
      <header className="d2p-land-nav">
        <div className="d2p-land-brand"><Image src="/doc2postdoc.png" alt="Doc2Postdoc" width={40} height={40} /><span>Doc2Postdoc <small>by PostdocWorks</small></span></div>
        <div className="d2p-land-nav-actions">
          <Link className="d2p-land-nav-link" href="/contact">Contact</Link>
          <button type="button" className="d2p-land-signin-link" onClick={() => setView("signin")}>Sign in</button>
        </div>
      </header>

      <section className="d2p-land-hero">
        <p className="d2p-land-eyebrow">Doc2Postdoc</p>
        <h1>Where the next step<br />has already been taken.</h1>
        <p className="d2p-land-lead">
          Doc2Postdoc pairs every PhD facing the postdoc transition with peers and postdocs who&apos;ve already made
          the same move — by field, career stage, and institution type.
        </p>
      </section>

      <section className="d2p-land-how">
        <p className="d2p-land-eyebrow">How matching works</p>
        <h2>Three steps between &quot;I don&apos;t know anyone who&apos;s done this&quot; and a direct conversation with someone who has.</h2>
        <div className="d2p-land-steps">
          {steps.map((step) => (
            <div className="d2p-land-step" key={step.number}>
              <p className="d2p-land-step-num">{step.number}</p>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="d2p-land-start" id="start">
        <p className="d2p-land-eyebrow">Get started</p>
        <h2>How are you joining Doc2Postdoc?</h2>
        <p className="d2p-land-start-lead">Choose the path that matches where you are right now — both lead to the same match profile.</p>
        <div className="d2p-role-grid">
          <button type="button" className="d2p-role-card register-attention" onClick={() => { setRole("doc"); setView("form"); }}>
            <span className="d2p-role-icon"><GraduationCap size={22} /></span>
            <span className="d2p-role-kicker">I am a</span>
            <strong>PhD student (Doc)</strong>
            <span className="d2p-role-desc">Facing the postdoc transition and want direct, credible guidance from someone who&apos;s made the exact move.</span>
            <span className="d2p-role-cta">Start as a Doc <ArrowRight size={15} /></span>
          </button>
          <button type="button" className="d2p-role-card register-attention" onClick={() => { setRole("postdoc"); setView("form"); }}>
            <span className="d2p-role-icon"><Microscope size={22} /></span>
            <span className="d2p-role-kicker">I am a</span>
            <strong>Postdoc</strong>
            <span className="d2p-role-desc">You&apos;ve made the transition — build your profile and be found by PhDs approaching the same one.</span>
            <span className="d2p-role-cta">Start as a Postdoc <ArrowRight size={15} /></span>
          </button>
        </div>
        <p className="d2p-land-signin-note">Already verifying an email or have an account? <button type="button" onClick={() => setView("signin")}>Sign in</button></p>
      </section>

      <footer className="d2p-land-footer">
        <Link href="/">← Back to PostdocWorks</Link>
        <nav className="d2p-land-footer-legal" aria-label="Legal">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
      </footer>
    </main>
  );
}

function Doc2PostdocSignIn({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/doc2postdoc/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "signin", email, password }) });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Sign in failed.");
      window.location.reload();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="d2p-gate">
      <section className="d2p-gate-panel">
        <div className="d2p-gate-brand"><Image src="/doc2postdoc.png" alt="Doc2Postdoc" width={68} height={68} /><p>Doc2Postdoc <small>by PostdocWorks</small></p></div>
        <div className="d2p-gate-copy">
          <p className="d2p-eyebrow">Welcome back</p>
          <h1>Sign in.</h1>
          <p>Continue to your matches, messages, and research community.</p>
        </div>
        <form className="d2p-gate-form" onSubmit={submit}>
          <label>Email address<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@institution.edu" /></label>
          <label>Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>
          {error && <p className="d2p-gate-error" role="alert">{error}</p>}
          <button className="d2p-gate-submit" type="submit" disabled={loading}>{loading ? "Please wait..." : "Sign in"} <ArrowRight size={16} /></button>
          <p className="d2p-gate-legal">
            By continuing, you agree to our <Link href="/terms">Terms of Service</Link> and{" "}
            <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </form>
        <button className="d2p-gate-switch" type="button" onClick={onBack}>New to Doc2Postdoc? Build your match profile</button>
        <Link className="d2p-gate-back" href="/">Back to PostdocWorks</Link>
      </section>
      <aside className="d2p-gate-aside">
        <p className="d2p-eyebrow">Where the next step has already been taken.</p>
        <h2>Real context for the move you&apos;re considering.</h2>
        <div><span>01</span><p>Find credible peers who understand your field, stage, and direction.</p></div>
        <div><span>02</span><p>Build a private record of the work and choices shaping your next chapter.</p></div>
      </aside>
    </main>
  );
}
