import type { Metadata } from "next";
import { LegalPage } from "../legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service | Postdocworks",
  description: "The terms that govern your use of Postdocworks, Doc2Postdoc, and eyewee.",
};

const sections = [
  {
    heading: "1. Acceptance of these Terms",
    body: [
      "These Terms of Service (\"Terms\") govern your access to and use of Postdocworks, including Doc2Postdoc and eyewee (together, the \"Service\"), operated by i4iSciences LLC (\"i4iSciences,\" \"we,\" \"us,\" or \"our\").",
      "By creating an account, submitting a credential application, completing a Doc2Postdoc match profile, or otherwise using the Service, you agree to be bound by these Terms and by our Privacy Policy. If you do not agree, do not use the Service.",
    ],
  },
  {
    heading: "2. What the Service does",
    body: [
      "Postdocworks helps postdoctoral researchers and PhD students turn academic experience into a credible, connected career. The Service currently includes three parts:",
    ],
    list: [
      "Verified Credentials — a form that checks fields such as ORCID and PubMed identifiers against public third-party registries, and records faculty endorsements and other self-reported information, in order to issue verification badges.",
      "Doc2Postdoc — a peer-matching feature that connects PhD students with postdocs who have made a comparable transition, based on research field, career stage, and institution or geography.",
      "eyewee — an AI-assisted guide inside the platform. Some eyewee surfaces are illustrative previews and are not yet connected to a live, freely-conversing model; we will make clear in the product when a given eyewee feature is fully live.",
    ],
  },
  {
    heading: "3. Accounts and eligibility",
    body: [
      "You must provide accurate, current information when creating an account or submitting a form, and keep your email address and password (once set) secure. You are responsible for activity that occurs under your account.",
      "The Service is intended for individuals engaged in or supporting academic and postdoctoral research careers. You must be at least 18 years old to create an account.",
      "One Postdocworks account is shared across Verified Credentials and Doc2Postdoc — your name, email, and career stage are stored once and used by both, rather than collected twice.",
    ],
  },
  {
    heading: "4. Verification data and third-party sources",
    body: [
      "Certain fields you submit (for example an ORCID iD or a PubMed ID) are checked against public, third-party registries such as ORCID and PubMed/NCBI, and, where configured, USPTO systems for patents and trademarks. We do not control those registries and cannot guarantee their accuracy, availability, or completeness.",
      "Fields we label \"Reference only\" (such as LinkedIn, Google Scholar, or ResearchGate links) are self-reported and displayed on your profile without independent verification.",
      "A verification badge reflects that a specific check passed at a specific time. It is not a guarantee of a person's current standing, employment, or conduct, and should not be relied on as the sole basis for any decision.",
    ],
  },
  {
    heading: "5. Doc2Postdoc conduct and confidentiality",
    body: [
      "Conversations between a matched pair are private by default and are not shared with other members or reviewed by us except where necessary to investigate a violation of these Terms, respond to a legal request, or protect the safety of any person.",
      "Sharing a draft, idea, or document with a match does not transfer ownership of that work. The original author retains their intellectual property rights; nothing in a Doc2Postdoc conversation implies a license, assignment, or co-authorship claim.",
      "You agree to engage with matches professionally and in good faith, and not to use information shared in confidence for any purpose the sharing party did not intend.",
    ],
  },
  {
    heading: "6. eyewee and AI-generated content",
    body: [
      "eyewee is an AI-assisted feature, not a person, and not a substitute for professional, legal, financial, immigration, medical, or mental-health advice. eyewee can make mistakes; you are responsible for independently verifying anything important before you rely on it.",
      "eyewee is built with a wellbeing guardrail: it is not designed to solicit, store, or act on mental-health disclosures or crisis-related content as part of your profile, badge, or matching data. If you are in crisis, please contact a local emergency service or crisis line directly rather than eyewee.",
    ],
  },
  {
    heading: "7. Your content and our intellectual property",
    body: [
      "You retain ownership of the content you submit (your profile information, credentials, messages, and posts). By submitting content, you grant i4iSciences a limited license to store, process, and display it as necessary to operate the Service — for example, showing your profile to a Doc2Postdoc match.",
      "The Postdocworks, Doc2Postdoc, and eyewee names, logos, and the underlying platform, design, and software are the property of i4iSciences LLC and may not be copied, reused, or represented as your own.",
    ],
  },
  {
    heading: "8. Prohibited conduct",
    list: [
      "Submitting false, misleading, or fraudulent credential, identity, or endorsement information.",
      "Impersonating another person or misrepresenting your affiliation with an institution.",
      "Harassing, threatening, or discriminating against another member, including a Doc2Postdoc match.",
      "Attempting to access another user's account or data without authorization.",
      "Using the Service to scrape, resell, or redistribute other members' data.",
      "Interfering with the security or normal operation of the Service.",
    ],
  },
  {
    heading: "9. Suspension and termination",
    body: [
      "We may suspend or terminate your access to the Service, including revoking a verification badge, if we reasonably believe you have violated these Terms, provided false information, or put another member at risk. You may stop using the Service and request deletion of your account at any time by contacting us.",
    ],
  },
  {
    heading: "10. Disclaimers and limitation of liability",
    body: [
      "The Service is provided \"as is\" and \"as available.\" To the fullest extent permitted by law, i4iSciences disclaims all warranties, express or implied, including fitness for a particular purpose, and does not guarantee that a badge, match, or eyewee response will be accurate, uninterrupted, or error-free.",
      "To the fullest extent permitted by law, i4iSciences will not be liable for indirect, incidental, special, consequential, or punitive damages, or for any loss of data, opportunity, or goodwill, arising from your use of the Service.",
    ],
  },
  {
    heading: "11. Disputes",
    body: [
      "Disputes between matched members over shared content or conduct are handled under our Appeals & Dispute process rather than a separate parallel process. Contact us using the details below to raise a dispute.",
    ],
  },
  {
    heading: "12. Changes to these Terms",
    body: [
      "We may update these Terms from time to time. If we make a material change, we will update the \"Last updated\" date below and, where appropriate, notify you. Continued use of the Service after a change takes effect constitutes acceptance of the updated Terms.",
    ],
  },
  {
    heading: "13. Contact",
    body: [
      "Questions about these Terms can be sent to hello@postdocworks.io.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Terms of Service"
      lastUpdated="September 17, 2026"
      sections={sections}
      intro="These Terms explain what you're agreeing to when you use Postdocworks, Doc2Postdoc, and eyewee. Please read them alongside our Privacy Policy."
    />
  );
}
