"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LockOpen } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

export function VerifyCredentialClient({ email, kind = "credential" }: { email: string; kind?: "credential" | "doc2postdoc" }) {
  if (kind === "doc2postdoc") {
    return (
      <div className="verify-body">
        <span className="verify-lock">
          <LockOpen size={24} />
        </span>
        <span className="verify-kicker">Email verified</span>
        <h1>You&apos;re verified.</h1>
        <p className="verify-email">{email}</p>
        <p>Your account is confirmed and unlocked. You can log in now and pick up your Doc2Postdoc match profile whenever you&apos;re ready.</p>
        <Link className="verify-submit" href="/dashboard">
          Log in to your dashboard <ArrowRight size={16} />
        </Link>
      </div>
    );
  }
  return <VerifyCredentialPasswordSetup email={email} />;
}

function VerifyCredentialPasswordSetup({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) { setError("Choose a password with at least 8 characters."); setStatus("error"); return; }
    if (password !== confirm) { setError("Passwords do not match."); setStatus("error"); return; }
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/doc2postdoc/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setPassword", password }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not set your password.");
      setStatus("success");
    } catch (submitError) {
      setStatus("error");
      setError(submitError instanceof Error ? submitError.message : "We could not set your password.");
    }
  }

  return (
    <div className="verify-body">
      <span className="verify-check">
        <CheckCircle2 size={22} />
      </span>
      <h1>Email verified</h1>
      <p className="verify-email">{email}</p>
      {status === "success" ? (
        <>
          <p>Your password is set. You&apos;re signed in and ready to continue.</p>
          <Link className="verify-submit" href="/dashboard">
            Go to your dashboard <ArrowRight size={16} />
          </Link>
        </>
      ) : (
        <>
          <p>You&apos;re signed in on this device. Set a password so you can log in again from anywhere.</p>
          <form className="verify-form" onSubmit={submit}>
            <label>
              Create a password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required minLength={8} />
            </label>
            <label>
              Confirm password
              <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Re-enter your password" required minLength={8} />
            </label>
            {status === "error" && <p className="verify-error">{error}</p>}
            <button className="verify-submit" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Saving..." : "Set password & continue"} <ArrowRight size={16} />
            </button>
            <p className="verify-legal">
              By continuing, you agree to our <Link href="/terms">Terms of Service</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </form>
          <Link className="verify-skip" href="/dashboard">
            Skip for now — go to your dashboard
          </Link>
        </>
      )}
    </div>
  );
}
