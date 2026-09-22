"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useState } from "react";

type Status = "idle" | "submitting" | "error";

export function ConfirmEmailClient({
  tokenHash,
  kind,
  next,
}: {
  tokenHash: string;
  kind: "doc2postdoc" | "credential";
  next: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function confirm() {
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/auth/confirm-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token_hash: tokenHash, kind }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "This link is invalid or has expired.");
      window.location.href = next;
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "This link is invalid or has expired.");
    }
  }

  if (status === "error") {
    return (
      <div className="verify-body">
        <h1>This link is invalid or has expired.</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="verify-body">
      <h1>Confirm your email</h1>
      <p>Click below to finish verifying your email address and sign in.</p>
      <button className="verify-submit" type="button" onClick={confirm} disabled={status === "submitting"}>
        {status === "submitting" ? (
          <>
            <LoaderCircle size={16} className="cred-spin" /> Confirming...
          </>
        ) : (
          <>
            Confirm email address <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
