import type { Metadata } from "next";
import { ContactPage } from "./ContactPage";

export const metadata: Metadata = {
  title: "Contact | Postdocworks",
  description: "Get in touch with Postdocworks — general questions, partnerships, press, and support.",
};

export default function Contact() {
  return <ContactPage />;
}
