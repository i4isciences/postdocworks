import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireDoc2PostdocUser } from "../../lib/doc2postdoc/server";
import { markCredentialVerified, markDoc2PostdocSignupVerified } from "../../lib/doc2postdoc/verification";
import { VerifyCredentialClient } from "./VerifyCredentialClient";

export const metadata: Metadata = {
  title: "Verify your email | PostdocWorks",
};

export default async function VerifyCredentialPage({ searchParams }: { searchParams: Promise<{ error?: string; kind?: string }> }) {
  const { error, kind } = await searchParams;

  if (error) {
    return (
      <VerifyShell>
        <h1>This link is invalid or has expired.</h1>
        <p>Verification links expire after a period of time. Return to your credential application and request a new one.</p>
      </VerifyShell>
    );
  }

  const { user } = await requireDoc2PostdocUser();
  if (!user) {
    return (
      <VerifyShell>
        <h1>This link is missing a verification code.</h1>
        <p>Return to your credential application and request a new verification email.</p>
      </VerifyShell>
    );
  }

  const email = user.email || "";
  await markCredentialVerified(email, user.id);
  if (kind === "doc2postdoc") await markDoc2PostdocSignupVerified(email, user.id);

  return (
    <VerifyShell>
      <VerifyCredentialClient email={email} kind={kind === "doc2postdoc" ? "doc2postdoc" : "credential"} />
    </VerifyShell>
  );
}

function VerifyShell({ children }: { children: ReactNode }) {
  return (
    <main className="verify-shell">
      <div className="verify-card">{children}</div>
    </main>
  );
}
