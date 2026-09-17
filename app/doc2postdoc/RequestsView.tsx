"use client";

import { Check, MapPin, MessageCircle, X } from "lucide-react";

type Connection = { id: string; requester_id: string; recipient_id: string; message: string; status: "pending" | "accepted" | "declined" | "blocked"; created_at: string; requester?: Requester; recipient?: Requester };
type Requester = { display_name?: string; role?: string; research_area?: string; institution?: string; geography?: string; bio?: string; avatar_url?: string | null };

export default function RequestsView({ connections, userId, onRefresh }: { connections: Connection[]; userId: string; onRefresh: () => Promise<void> }) {
  const incoming = connections.filter((connection) => connection.recipient_id === userId && connection.status === "pending");
  async function respond(connectionId: string, status: "accepted" | "declined") {
    await fetch("/api/doc2postdoc/connections", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connectionId, status }) });
    await onRefresh();
  }
  return <div className="d2p-requests-page"><div className="d2p-page-heading"><p className="d2p-eyebrow">Your network</p><h1>Connection requests</h1><p>People who want to connect around the postdoc transition.</p></div><div className="d2p-request-count">{incoming.length} pending request{incoming.length === 1 ? "" : "s"}</div>{incoming.length ? <div className="d2p-request-list">{incoming.map((connection) => <article className="d2p-request-card" key={connection.id}><span className="d2p-avatar request-avatar">{initials(connection.requester?.display_name || "Member")}</span><div className="d2p-request-person"><h2>{connection.requester?.display_name || "Doc2Postdoc member"}</h2><p>{connection.requester?.role?.replaceAll("_", " ") || "Researcher"} · {connection.requester?.research_area || "Research area not added"}</p><span><MapPin size={12} /> {connection.requester?.institution || "Institution not added"}{connection.requester?.geography ? ` · ${connection.requester.geography}` : ""}</span><blockquote>“{connection.message}”</blockquote><div className="d2p-request-actions"><button className="d2p-gold-button" onClick={() => respond(connection.id, "accepted")}><Check size={15} /> Accept</button><button className="d2p-request-decline" onClick={() => respond(connection.id, "declined")}><X size={15} /> Decline</button><button className="d2p-request-message"><MessageCircle size={15} /> Message</button></div></div></article>)}</div> : <div className="d2p-empty"><Check size={20} /><h2>You’re all caught up.</h2><p>New connection requests will appear here.</p></div>}</div>;
}

function initials(value: string) { return value.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
