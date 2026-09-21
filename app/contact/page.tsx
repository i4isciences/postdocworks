import type { Metadata } from "next";
import { ContactPage } from "./ContactPage";

export const metadata: Metadata = {
  title: "Contact | PostdocWorks",
  description: "Get in touch with PostdocWorks — general questions, partnerships, press, and support.",
};

export default function Contact() {
  return <ContactPage />;
}
