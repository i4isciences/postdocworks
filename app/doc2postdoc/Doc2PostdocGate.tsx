"use client";

import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import Doc2PostdocWorkspace from "./Doc2PostdocWorkspace";
import { Doc2PostdocLanding } from "./Doc2PostdocLanding";

export default function Doc2PostdocGate() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  useEffect(() => {
    fetch("/api/doc2postdoc/auth").then((response) => { setAuthenticated(response.ok); setChecking(false); }).catch(() => setChecking(false));
  }, []);
  if (checking) return <div className="d2p-gate-loading"><LoaderCircle size={22} className="d2p-spin" /> Preparing your private network...</div>;
  if (authenticated) return <Doc2PostdocWorkspace />;
  return <Doc2PostdocLanding />;
}
