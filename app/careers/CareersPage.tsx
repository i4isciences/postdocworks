"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";

type SubmitState = "idle" | "submitting" | "success" | "error";

const interestAreas = ["Engineering", "Design", "Partnerships", "Operations", "Something else"];

const values = [
  {
    number: "01",
    title: "Evidence over pedigree",
    body: "A verified publication, patent, or endorsement should carry more weight than the name on a letterhead. We build that belief into the product and into how we work.",
  },
  {
    number: "02",
    title: "Build for the person, not the persona",
    body: "Every researcher on the platform is mid-transition, not mid-performance. We design for the real, uncertain moment — not a highlight reel.",
  },
  {
    number: "03",
    title: "Move at research speed, ship at startup speed",
    body: "We respect the rigor academia trained into us. We don't respect the pace. Small team, fast decisions, real ownership.",
  },
  {
    number: "04",
    title: "Small team, outsized craft",
    body: "We would rather ship less, and have it be right, than ship more and hope. Every teammate is expected to raise the bar.",
  },
];

const benefits = [
  { title: "Meaningful equity", body: "Every full-time hire holds a real stake in what we build together." },
  { title: "Health coverage", body: "Comprehensive medical coverage for you and your family." },
  { title: "Remote-first, in-person on purpose", body: "Work from anywhere in India, with the team together in person a few times a year." },
  { title: "Learning budget", body: "Support for courses, books, and conferences that sharpen your craft." },
  { title: "Flexible hours", body: "We care about outcomes and thoughtful collaboration, not hours logged." },
  { title: "Founding-team access", body: "Direct, regular time with the founders — no layers between you and the decisions." },
];

const process = [
  { step: "01", title: "Introduction", body: "A 30-minute conversation with the founding team about your background and what you're looking for next." },
  { step: "02", title: "Deep dive", body: "A focused conversation or work sample based on the role — never a whiteboard exercise for its own sake." },
  { step: "03", title: "Team conversation", body: "Meet the people you'd work with closely. We're evaluating fit both ways." },
  { step: "04", title: "Offer", body: "A clear, direct offer — and a real conversation about the role before you decide." },
];

export function CareersPage() {
  const [status, setStatus] = useState<SubmitState>("idle");
  const [error, setError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!termsAccepted) {
      setStatus("error");
      setError("You must agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setStatus("submitting");
    setError("");
    const payload = { ...Object.fromEntries(new FormData(event.currentTarget).entries()), termsAccepted };
    try {
      const response = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not send your introduction. Please try again.");
      setStatus("success");
    } catch (submissionError) {
      setStatus("error");
      setError(submissionError instanceof Error ? submissionError.message : "Please try again.");
    }
  }

  return (
    <main className="home-site careers-page">
      <header className="home-nav">
        <Link className="home-brand" href="/" aria-label="PostdocWorks home">
          <Image src="/postdocworks.svg" alt="PostdocWorks logo" width={190} height={54} priority />
          <span className="home-brand-copy">
            <strong>PostdocWorks<sup className="brand-sm-mark">SM</sup></strong>
            <small>You say it — eyewee carries it, guides it, and cracks the toughest problems</small>
          </span>
        </Link>
        <nav className="home-nav-links" aria-label="Main navigation">
          <Link href="/#platform">The platform</Link>
          <a href="https://eyewee.vercel.app/" target="_blank" rel="noreferrer">eyewee</a>
          <Link href="/careers" aria-current="page">
            Careers
          </Link>
          <Link href="/contact">Contact</Link>
          <a className="nav-register" href="#apply">
            Introduce yourself <ArrowRight size={15} />
          </a>
        </nav>
      </header>

      <section className="careers-hero">
        <p className="section-label">Careers at PostdocWorks</p>
        <h1>
          Help build the next
          <br />
          step for researchers.
        </h1>
        <p className="careers-hero-lead">
          We&apos;re a small team building the infrastructure that turns hard-earned academic work into a credible,
          connected career — for every postdoc and PhD who deserves better than a handoff.
        </p>
        <div className="careers-hero-actions">
          <a className="hero-cta" href="#apply">
            Introduce yourself <ArrowRight size={16} />
          </a>
          <a className="careers-hero-secondary" href="#mission">
            Our mission <ArrowUpRight size={15} />
          </a>
        </div>
      </section>

      <section className="careers-stats" aria-label="PostdocWorks at a glance">
        <div>
          <strong>2</strong>
          <span>Products in market</span>
        </div>
        <div>
          <strong>100%</strong>
          <span>Remote-friendly team</span>
        </div>
        <div>
          <strong>Founding</strong>
          <span>Stage — real ownership</span>
        </div>
      </section>

      <section className="careers-mission" id="mission">
        <p className="section-label">Why we exist</p>
        <h2>Research careers deserve better than a handoff.</h2>
        <p className="careers-mission-lead">
          PostdocWorks turns hard-earned academic experience into momentum — connecting the person doing the work
          with the people and opportunities ready for it. Every person who joins us is building that bridge
          directly, not adjacent to it.
        </p>
      </section>

      <section className="careers-values">
        <p className="section-label">How we work</p>
        <div className="careers-values-grid">
          {values.map((value) => (
            <article className="value-card" key={value.number}>
              <p className="value-number">{value.number}</p>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="careers-benefits">
        <p className="section-label">What you get</p>
        <h2>Support built for people doing serious work.</h2>
        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <div className="benefit-item" key={benefit.title}>
              <h3>{benefit.title}</h3>
              <p>{benefit.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="careers-roles" id="open-roles">
        <p className="section-label">Open positions</p>
        <h2>No open roles right now.</h2>
        <p className="careers-roles-note">
          We&apos;re a small, founding team, and we hire deliberately rather than on a schedule. That said, we&apos;d
          genuinely like to know you — the right conversation today can turn into the right offer later. Tell us
          about yourself below and we&apos;ll keep you in mind as PostdocWorks grows.
        </p>
        <a className="careers-hero-secondary" href="#apply">
          Introduce yourself <ArrowUpRight size={15} />
        </a>
      </section>

      <section className="careers-process">
        <p className="section-label">How we hire</p>
        <h2>A process with no theater.</h2>
        <div className="process-grid">
          {process.map((item) => (
            <div className="process-step" key={item.step}>
              <p className="process-number">{item.step}</p>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="careers-apply" id="apply">
        <div className="careers-apply-intro">
          <p className="section-label">Get in touch</p>
          <h2>Introduce yourself.</h2>
          <p className="careers-apply-lead">
            Tell us who you are and what you&apos;re good at. A real person on our founding team reads every note,
            and we&apos;ll reach out when there&apos;s a fit — whether that&apos;s next month or next year.
          </p>
        </div>
        {status === "success" ? (
          <div className="careers-apply-success">
            <span className="success-icon">
              <Check size={23} />
            </span>
            <p className="section-label">Message received</p>
            <h3>Thank you for reaching out.</h3>
            <p>We&apos;ve received your introduction and will be in touch if there&apos;s a fit.</p>
          </div>
        ) : (
          <form className="careers-apply-form" onSubmit={submit}>
            <div className="careers-apply-grid">
              <label>
                Full name <span>*</span>
                <input name="fullName" type="text" placeholder="Your name" required />
              </label>
              <label>
                Email address <span>*</span>
                <input name="email" type="email" placeholder="you@domain.com" required />
              </label>
              <label>
                Area of interest <span>*</span>
                <select name="areaOfInterest" required defaultValue="">
                  <option value="" disabled>
                    Select one
                  </option>
                  {interestAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                LinkedIn, portfolio, or resume link
                <input name="link" type="url" placeholder="https://" />
              </label>
            </div>
            <label>
              Why PostdocWorks? <span>*</span>
              <textarea
                name="message"
                placeholder="A little about your background and the kind of role you're looking for..."
                rows={4}
                required
              />
            </label>
            <p className="form-note">
              Your information is used only to consider you for current and future roles at PostdocWorks.
            </p>
            <div className="consent-row">
              <input
                type="checkbox"
                id="careers-terms"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
              />
              <label htmlFor="careers-terms">
                I agree to the PostdocWorks <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and{" "}
                <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
              </label>
            </div>
            {status === "error" && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="modal-submit" disabled={status === "submitting" || !termsAccepted} type="submit">
              {status === "submitting" ? "Sending..." : "Send introduction"} <ArrowRight size={16} />
            </button>
          </form>
        )}
      </section>

      <footer className="home-footer">
        <Link className="footer-brand" href="/" aria-label="PostdocWorks home">
          <Image src="/postdocworks.svg" alt="PostdocWorks logo" width={190} height={54} />
          <span className="home-brand-copy">
            <strong>PostdocWorks<sup className="brand-sm-mark">SM</sup></strong>
            <small>You say it — eyewee carries it, guides it, and cracks the toughest problems</small>
          </span>
        </Link>
        <span className="footer-powered">
          Powered by i4iSciences<sup>TM</sup>
        </span>
        <nav className="footer-legal" aria-label="Legal">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
        <a className="footer-contact" href="mailto:hello@postdocworks.io">
          hello@postdocworks.io
        </a>
      </footer>
    </main>
  );
}
