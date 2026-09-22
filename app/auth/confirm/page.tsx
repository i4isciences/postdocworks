import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ConfirmEmailClient } from "./ConfirmEmailClient";

export const metadata: Metadata = {
  title: "Confirm your email | PostdocWorks",
};

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; next?: string }>;
}) {
  const { token_hash: tokenHash, next } = await searchParams;

  if (!tokenHash) {
    return (
      <VerifyShell>
        <h1>This link is missing a verification code.</h1>
        <p>Return to your credential application and request a new verification email.</p>
      </VerifyShell>
    );
  }

  let kind: "doc2postdoc" | "credential" = "credential";
  try {
    const nextUrl = new URL(next || "", "https://placeholder.local");
    if (nextUrl.searchParams.get("kind") === "doc2postdoc") kind = "doc2postdoc";
  } catch {
    /* next wasn't a valid URL — default kind stands */
  }

  return (
    <VerifyShell>
      <ConfirmEmailClient tokenHash={tokenHash} kind={kind} next={next || "/verify-credential"} />
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
