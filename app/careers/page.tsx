import type { Metadata } from "next";
import { CareersPage } from "./CareersPage";

export const metadata: Metadata = {
  title: "Careers | PostdocWorks",
  description: "Join PostdocWorks. We're building the infrastructure that helps researchers turn hard-earned academic work into a credible, connected career.",
};

export default function Careers() {
  return <CareersPage />;
}
