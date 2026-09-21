"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    await fetch("/api/doc2postdoc/auth", { method: "DELETE" });
    window.location.href = "/";
  }

  return (
    <button type="button" className="dash-signout" onClick={signOut} disabled={loading}>
      <LogOut size={14} /> {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
