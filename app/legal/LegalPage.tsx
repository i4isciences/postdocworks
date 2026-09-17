import Link from "next/link";

type Section = {
  heading: string;
  body?: string[];
  list?: string[];
};

export function LegalPage({
  kicker,
  title,
  intro,
  lastUpdated,
  sections,
}: {
  kicker: string;
  title: string;
  intro: string;
  lastUpdated: string;
  sections: Section[];
}) {
  return (
    <main className="legal-page">
      <header className="legal-nav">
        <Link className="legal-brand" href="/">
          Postdocworks
        </Link>
        <nav className="legal-nav-links" aria-label="Legal navigation">
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
      </header>

      <article className="legal-article">
        <p className="legal-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {lastUpdated}</p>
        <p className="legal-intro">{intro}</p>

        {sections.map((section) => (
          <section className="legal-section" key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body?.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {section.list && (
              <ul>
                {section.list.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <p className="legal-disclaimer">
          This document is provided as a general reference for how Postdocworks operates and is not
          a substitute for independent legal advice. i4iSciences reviews and updates it as the
          Service evolves.
        </p>
      </article>

      <footer className="legal-footer">
        <span>© 2026 i4iSciences LLC</span>
        <div>
          <Link href="/terms">Terms of Service</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <a href="mailto:hello@postdocworks.io">hello@postdocworks.io</a>
        </div>
      </footer>
    </main>
  );
}
