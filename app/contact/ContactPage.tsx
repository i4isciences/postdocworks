"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, ArrowUpRight, Briefcase, Check, HelpCircle, Megaphone, MessageCircle } from "lucide-react";

type SubmitState = "idle" | "submitting" | "success" | "error";

const topics = ["General inquiry", "Partnerships & institutions", "Press & media", "Support", "Something else"];

const paths = [
  {
    icon: MessageCircle,
    title: "General inquiries",
    body: "Questions about PostdocWorks, Doc2Postdoc, or eyewee — we read every one ourselves.",
    action: "Write to us",
    href: "#form",
  },
  {
    icon: Briefcase,
    title: "Partnerships & institutions",
    body: "Universities, research offices, and organizations exploring what PostdocWorks can do for their researchers.",
    action: "Start a conversation",
    href: "#form",
  },
  {
    icon: Megaphone,
    title: "Press & media",
    body: "Reporting on the postdoc transition, research careers, or what we're building. We're glad to talk.",
    action: "Reach our team",
    href: "mailto:hello@postdocworks.io?subject=Press%20inquiry",
  },
  {
    icon: HelpCircle,
    title: "Support",
    body: "Already on the platform and need a hand with your account, credentials, or a match? We've got you.",
    action: "Get support",
    href: "mailto:hello@postdocworks.io?subject=Support%20request",
  },
];

export function ContactPage() {
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
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not send your message. Please try again.");
      setStatus("success");
    } catch (submissionError) {
      setStatus("error");
      setError(submissionError instanceof Error ? submissionError.message : "Please try again.");
    }
  }

  return (
    <main className="home-site contact-page">
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
          <Link href="/careers">Careers</Link>
          <Link href="/contact" aria-current="page">
            Contact
          </Link>
          <a className="nav-register" href="#form">
            Get in touch <ArrowRight size={15} />
          </a>
        </nav>
      </header>

      <section className="contact-hero">
        <p className="section-label">Contact</p>
        <h1>We&apos;d love to hear from you.</h1>
        <p className="contact-hero-lead">
          Whether it&apos;s a question, a partnership, or an idea that could make this better — every message
          here reaches a person on our founding team directly. No ticket number, no queue.
        </p>
        <div className="contact-hero-actions">
          <a className="hero-cta" href="#form">
            Send us a message <ArrowRight size={16} />
          </a>
          <a className="contact-hero-secondary" href="mailto:hello@postdocworks.io">
            hello@postdocworks.io <ArrowUpRight size={15} />
          </a>
        </div>
      </section>

      <section className="contact-paths">
        <p className="section-label">Ways to reach us</p>
        <h2>Tell us what brought you here, and we&apos;ll take it from there.</h2>
        <div className="contact-paths-grid">
          {paths.map((path) => (
            <a className="contact-path-card" href={path.href} key={path.title}>
              <span className="contact-path-icon">
                <path.icon size={20} />
              </span>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
              <span className="contact-path-action">
                {path.action} <ArrowRight size={14} />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="contact-form-section" id="form">
        <div className="contact-form-intro">
          <p className="section-label">Send a message</p>
          <h2>Get in touch.</h2>
          <p className="contact-form-lead">
            Fill this in and it lands directly in our inbox — we typically reply within a couple of business
            days.
          </p>
        </div>
        {status === "success" ? (
          <div className="contact-form-success">
            <span className="success-icon">
              <Check size={23} />
            </span>
            <p className="section-label">Message received</p>
            <h3>Thank you for reaching out.</h3>
            <p>We&apos;ve received your message and will get back to you soon.</p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={submit}>
            <div className="contact-form-grid">
              <label>
                Full name <span>*</span>
                <input name="fullName" type="text" placeholder="Your name" required />
              </label>
              <label>
                Email address <span>*</span>
                <input name="email" type="email" placeholder="you@domain.com" required />
              </label>
            </div>
            <label>
              Topic <span>*</span>
              <select name="topic" required defaultValue="">
                <option value="" disabled>
                  Select one
                </option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Message <span>*</span>
              <textarea name="message" placeholder="How can we help?" rows={5} required />
            </label>
            <div className="consent-row">
              <input
                type="checkbox"
                id="contact-terms"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
              />
              <label htmlFor="contact-terms">
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
              {status === "submitting" ? "Sending..." : "Send message"} <ArrowRight size={16} />
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
