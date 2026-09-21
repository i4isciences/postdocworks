import type { Metadata } from "next";
import { LegalPage } from "../legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | PostdocWorks",
  description: "How PostdocWorks collects, uses, and protects your information.",
};

const sections = [
  {
    heading: "1. Who we are",
    body: [
      "PostdocWorks, Doc2Postdoc, and eyewee are operated by I4I Sciences LLC dba i4iSciences (\"i4iSciences,\" \"we,\" \"us,\" or \"our\"). This Policy explains what information we collect, why we collect it, and the choices you have.",
    ],
  },
  {
    heading: "2. Information we collect",
    list: [
      "Account information: full name, email address, and career stage, shared across the credential and Doc2Postdoc forms so you only provide it once.",
      "Credential and verification information: ORCID iD, PubMed ID, dissertation/abstract links, professional profile links, faculty endorsement details, and patent or trademark numbers, if you choose to submit them.",
      "Doc2Postdoc profile information: research field, institution, department, city/state/country, languages, hobbies, marital status, dietary preference, network references, and matching preferences, if you choose to build a match profile.",
      "Authentication data: your email address and, if you set one, a securely hashed password, managed through our authentication provider (Supabase Auth). We never see or store your password in plain text.",
      "Communications: messages you send us, and — where the feature is fully live — messages you send within Doc2Postdoc or to eyewee.",
      "Usage data: basic technical information such as pages visited and general device/browser information, used to keep the Service working correctly and securely.",
    ],
  },
  {
    heading: "3. How we use your information",
    list: [
      "To create and maintain your account, and to let you use Verified Credentials and/or Doc2Postdoc independently of each other.",
      "To check submitted identifiers (such as an ORCID iD or PubMed ID) against the relevant public registry, and to display the resulting verification status on your profile.",
      "To power Doc2Postdoc matching — surfacing peers whose field, career stage, or institution/geography overlaps with yours.",
      "To send you account, verification, and (where you've opted in) product emails — for example, a real magic-link email to verify your address.",
      "To maintain the security, integrity, and proper functioning of the Service, and to enforce our Terms of Service.",
    ],
  },
  {
    heading: "4. Third-party verification services",
    body: [
      "When you submit an ORCID iD, we query ORCID's public API to confirm the record exists and to retrieve the associated name. When you submit a PubMed ID, we query the National Library of Medicine's public E-utilities to confirm the publication exists. Where a USPTO integration is configured, patent and trademark numbers may be checked against USPTO systems. We only send the identifier you provided — we do not send your other profile information to these registries.",
      "These are independent third parties with their own privacy practices; we encourage you to review them if you have questions about how they handle a public lookup.",
    ],
  },
  {
    heading: "5. Service providers we use",
    list: [
      "Supabase — hosts our database and handles authentication (including magic-link sign-in and password storage).",
      "Resend — delivers transactional email for the parts of the Service that use it (for example, careers inquiries).",
    ],
    body: [
      "These providers process data on our behalf, under contract, and only for the purposes described here. We do not sell your personal information to anyone.",
    ],
  },
  {
    heading: "6. How long we keep your information",
    body: [
      "We retain your account and profile information for as long as your account is active. If you ask us to delete your account, we will delete or anonymize your personal information within a reasonable time, except where we are required to retain it (for example, to comply with a legal obligation or resolve a dispute).",
    ],
  },
  {
    heading: "7. Your rights and choices",
    list: [
      "Access and correction — you can review and update most of your profile information directly; contact us for anything you can't edit yourself.",
      "Deletion — you can request that we delete your account and associated personal information.",
      "Communication preferences — you can ask to stop receiving non-essential emails at any time.",
    ],
    body: [
      "To exercise any of these rights, contact us at hello@postdocworks.io. We will respond within a reasonable time.",
    ],
  },
  {
    heading: "8. The eyewee wellbeing guardrail",
    body: [
      "eyewee is built with a specific safeguard: mental-health disclosures or crisis-related content are not intended to be stored as part of your profile, badge, or matching data. If such content is ever entered, it is treated as sensitive and excluded from those records — it is not used to score, match, or otherwise evaluate you.",
    ],
  },
  {
    heading: "9. Data security",
    body: [
      "We use industry-standard safeguards to protect your information, including encrypted connections, access controls, and encryption at rest for sensitive credentials such as third-party storage tokens. No system is perfectly secure, and we cannot guarantee absolute security, but we work to protect your information appropriately for its sensitivity.",
    ],
  },
  {
    heading: "10. Cookies and local storage",
    body: [
      "We use the minimum technical storage necessary to keep you signed in and to remember short-lived preferences in your browser. We do not use third-party advertising trackers.",
    ],
  },
  {
    heading: "11. Children's privacy",
    body: [
      "The Service is intended for adults engaged in postdoctoral and academic research careers and is not directed to individuals under 18. We do not knowingly collect personal information from children.",
    ],
  },
  {
    heading: "12. Changes to this Policy",
    body: [
      "We may update this Policy from time to time. If we make a material change, we will update the \"Last updated\" date below and, where appropriate, notify you.",
    ],
  },
  {
    heading: "13. Contact",
    body: [
      "Questions about this Policy, or requests regarding your personal information, can be sent to hello@postdocworks.io.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      kicker="Legal"
      title="Privacy Policy"
      lastUpdated="September 17, 2026"
      sections={sections}
      intro="This Policy explains what information PostdocWorks collects across Verified Credentials, Doc2Postdoc, and eyewee, and how we use, share, and protect it."
    />
  );
}
