"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import Doc2PostdocWorkspace from "./Doc2PostdocWorkspace";
import { Doc2PostdocLanding } from "./Doc2PostdocLanding";
import { Doc2PostdocProfileForm } from "./Doc2PostdocProfileForm";

type Stage = "checking" | "signed-out" | "needs-profile" | "ready";

export default function Doc2PostdocGate() {
  const [stage, setStage] = useState<Stage>("checking");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const authResponse = await fetch("/api/doc2postdoc/auth").catch(() => null);
      if (cancelled) return;
      if (!authResponse || !authResponse.ok) { setStage("signed-out"); return; }
      const profileResponse = await fetch("/api/doc2postdoc/profile").catch(() => null);
      if (cancelled) return;
      if (!profileResponse || !profileResponse.ok) { setStage("signed-out"); return; }
      const data = (await profileResponse.json()) as { profile?: { profile_completed_at?: string | null } };
      setStage(data.profile?.profile_completed_at ? "ready" : "needs-profile");
    }
    check();
    return () => { cancelled = true; };
  }, []);

  if (stage === "checking") return <div className="d2p-gate-loading"><LoaderCircle size={22} className="d2p-spin" /> Preparing your private network...</div>;
  if (stage === "ready") return <Doc2PostdocWorkspace />;
  if (stage === "needs-profile") return <Doc2PostdocProfileForm onComplete={() => setStage("ready")} />;
  return <Doc2PostdocLanding />;
}
