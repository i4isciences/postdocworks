import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, Check, Clock, Sparkles } from "lucide-react";
import { SignOutButton } from "./SignOutButton";

export function DashboardView({
  email,
  displayName,
  role,
  credentialScore,
  credentialVerified,
  hasCredentialApplication,
  doc2postdocProfileComplete,
}: {
  email: string;
  displayName: string;
  role: string;
  credentialScore: number | null;
  credentialVerified: boolean;
  hasCredentialApplication: boolean;
  doc2postdocProfileComplete: boolean;
}) {
  const name = displayName || email.split("@")[0];
  const roleLabel = role === "postdoc" ? "Postdoc" : role === "phd_student" ? "PhD student" : "";

  return (
    <main className="dash-site">
      <header className="dash-nav">
        <Link className="dash-brand" href="/dashboard" aria-label="Postdocworks dashboard">
          <Image src="/postdocworks.jpg" alt="Postdocworks logo" width={48} height={48} priority />
          <span className="dash-brand-copy"><strong>Postdocworks</strong><small>You say it, Eyewee carries it, guides it and cracks the toughest problems</small></span>
        </Link>
        <nav className="dash-nav-links" aria-label="Main navigation">
          <Link href="/dashboard" className="dash-nav-active">Dashboard</Link>
          <Link href="/doc2postdoc">Doc2Postdoc</Link>
          <a href="https://eyewee.vercel.app/" target="_blank" rel="noreferrer">eyewee</a>
          <Link href="/careers">Careers</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="dash-nav-account">
          <span className="dash-nav-email">{email}</span>
          <SignOutButton />
        </div>
      </header>

      <section className="dash-hero">
        <p className="dash-eyebrow">Welcome back, {name}{roleLabel ? ` · ${roleLabel}` : ""}</p>
        <h1>Verified credentials, AI guidance, and the peers who&apos;ve already made the move.</h1>
        <p className="dash-hero-lead">
          One sign-in for everything eyewee does for postdocs — credential verification, AI guidance,
          and Doc2Postdoc peer matching all live behind this single account.
        </p>
      </section>

      <section className="dash-explain">
        <div className="dash-explain-text">
          <p className="dash-eyebrow">PostdocWorks</p>
          <h2>PostdocWorks is eyewee — built for every postdoc-related step.</h2>
          <p>
            Finishing a PhD rarely comes with a clear next step. PostdocWorks is eyewee&apos;s dedicated
            home for postdoctoral researchers: one AI-guided platform that verifies who you are, reads
            and organizes your research work, and connects your credentials to real opportunities and
            real people — not another job board you shout into.
          </p>
          <ul className="dash-check-list">
            <li><Check size={15} /> Real verification — ORCID and PubMed checked live, not self-reported.</li>
            <li><Check size={15} /> AI guidance from eyewee, across your whole postdoc-to-industry transition.</li>
            <li><Check size={15} /> One account — the same sign-in already covers Doc2Postdoc, no separate registration.</li>
          </ul>
        </div>

        <div className="dash-status-card">
          <div className="dash-status-head">
            {credentialVerified ? <BadgeCheck size={20} className="dash-status-icon verified" /> : <Clock size={20} className="dash-status-icon pending" />}
            <div>
              <p className="dash-status-title">Your credential record</p>
              <p className="dash-status-sub">
                {!hasCredentialApplication
                  ? "You haven't submitted your credentials yet."
                  : credentialVerified
                    ? `Verified · ${credentialScore ?? 0}% complete`
                    : "Awaiting email verification."}
              </p>
            </div>
          </div>
          {hasCredentialApplication && (
            <div className="dash-score-track"><div className="dash-score-fill" style={{ width: `${Math.max(0, Math.min(100, credentialScore ?? 0))}%` }} /></div>
          )}
          <Link href="/careers" className="dash-platform-link">See open roles <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="dash-explain dash-explain-reverse">
        <div className="dash-status-card dash-status-card-plain">
          <p className="dash-platform-kicker">Doc2Postdoc</p>
          <h3>{doc2postdocProfileComplete ? "Your peer network" : "Finish your match profile"}</h3>
          <p className="dash-card-body">
            {doc2postdocProfileComplete
              ? "Matched by field, career stage, and geography — pick up where you left off."
              : "A few details on field, stage, and location are all that's left before you can be matched."}
          </p>
          <Link href="/doc2postdoc" className="dash-platform-link">
            {doc2postdocProfileComplete ? "Open Doc2Postdoc" : "Finish your profile"} <ArrowRight size={15} />
          </Link>
        </div>

        <div className="dash-explain-text">
          <p className="dash-eyebrow">Doc2Postdoc</p>
          <h2>The peer who&apos;s already made your exact move.</h2>
          <p>
            Doc2Postdoc pairs PhD students facing the postdoc transition with postdocs who&apos;ve already
            been through it — matched on the same field taxonomy, career stage, and geography eyewee
            uses everywhere else, so the connection is relevant from the first message.
          </p>
          <ul className="dash-check-list">
            <li><Check size={15} /> Matched by field, career stage, and geography — not keyword search.</li>
            <li><Check size={15} /> Direct, one-to-one connection — no cold broadcast to strangers.</li>
            <li><Check size={15} /> Your Doc2Postdoc profile lives on this same PostdocWorks account.</li>
          </ul>
        </div>
      </section>

      <section className="dash-eyewee">
        <Sparkles size={22} className="dash-eyewee-icon" />
        <p className="dash-eyebrow">eyewee</p>
        <h2>Your AI research companion, everywhere.</h2>
        <p className="dash-eyewee-lead">
          eyewee is the AI underneath all of PostdocWorks — the same guidance engine, just focused
          entirely on your postdoc journey here.
        </p>
        <a href="https://eyewee.vercel.app/" target="_blank" rel="noreferrer" className="dash-eyewee-cta">
          Open eyewee <ArrowUpRight size={16} />
        </a>
      </section>

      <footer className="home-footer dash-footer">
        <Link className="footer-brand" href="/" aria-label="Postdocworks home">
          <Image src="/postdocworks.jpg" alt="Postdocworks logo" width={190} height={54} />
          <span className="home-brand-copy"><strong>Postdocworks</strong><small>You say it, Eyewee carries it, guides it and cracks the toughest problems</small></span>
        </Link>
        <span className="footer-powered">Powered by i4iSciences<sup>TM</sup></span>
        <nav className="footer-legal" aria-label="Legal">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
        <a className="footer-contact" href="mailto:hello@postdocworks.io">hello@postdocworks.io</a>
      </footer>
    </main>
  );
}
