"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight, Bookmark, Check, MessageCircle, Network, Send, Sparkles } from "lucide-react";

type View = "Home" | "Discover" | "Matches" | "Messages" | "Requests" | "Profile";
type Profile = { id: string; display_name: string; role: string; research_area: string; institution: string; bio: string; connection_count: number };
type Match = { id: string; name: string; field: string; stage: string; score: number; institution: string };
type Post = { id: string; body: string; tags: string[]; author?: { display_name?: string; institution?: string } };
type Connection = { id: string; recipient_id: string; requester_id: string; status: string };

export default function HomeExperience({ profile, matches, posts, connections, onView, onCompose }: { profile: Profile | null; matches: Match[]; posts: Post[]; connections: Connection[]; onView: (view: View) => void; onCompose: () => void }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const name = profile?.display_name || "Member";
  const accepted = profile?.connection_count || connections.filter((connection) => connection.status === "accepted").length;
  const pending = connections.filter((connection) => connection.recipient_id === profile?.id && connection.status === "pending").length;

  async function askEyewee(event?: FormEvent) {
    event?.preventDefault();
    if (!question.trim()) return;
    setAsking(true);
    try {
      const response = await fetch("/api/eyewee", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, profile }) });
      const data = await response.json();
      setAnswer(data.answer || "I’m ready to help you think through the next step.");
    } finally { setAsking(false); }
  }

  return <div className="d2p-home-experience"><div className="d2p-home-header"><div><p className="d2p-eyebrow">Monday · Your professional network</p><h1>Good morning, {name.split(" ")[0]}.</h1><p>Stay close to the people and decisions shaping your next move.</p></div><button className="d2p-gold-button" onClick={onCompose}>Share an update <Send size={15} /></button></div><div className="d2p-home-metrics"><Metric label="Profile strength" value={`${profileStrength(profile)}%`} onClick={() => onView("Profile")} /><Metric label="Connections" value={String(accepted)} onClick={() => onView("Messages")} /><Metric label="Matches" value={String(matches.length)} onClick={() => onView("Matches")} /><Metric label="Requests" value={String(pending)} onClick={() => onView("Requests")} /></div><div className="d2p-home-columns"><aside className="d2p-home-left"><section className="d2p-home-card d2p-identity-card"><div className="d2p-avatar large">{initials(name)}</div><h2>{name}</h2><p>{profile?.role?.replaceAll("_", " ") || "Doc2Postdoc member"}</p><span>{profile?.institution || "Institution not added"}</span><button onClick={() => onView("Profile")}>View profile <ArrowUpRight size={14} /></button></section><section className="d2p-home-card d2p-shortcuts"><p className="d2p-eyebrow">Your workspace</p><button onClick={() => onView("Matches")}><Network size={16} /> Explore matches</button><button onClick={() => onView("Messages")}><MessageCircle size={16} /> Private messages</button><button onClick={() => onView("Requests")}><Check size={16} /> Connection requests</button></section></aside><section className="d2p-home-feed"><button className="d2p-composer-trigger" onClick={onCompose}><span className="d2p-avatar">{initials(name)}</span><span>Share a research decision, question, or transition note...</span><Send size={16} /></button><div className="d2p-feed-heading"><div><p className="d2p-eyebrow">Your network</p><h2>Recent activity</h2></div><button onClick={() => onView("Discover")}>Open feed <ArrowUpRight size={14} /></button></div>{posts.length ? posts.slice(0, 5).map((post) => <article className="d2p-home-post" key={post.id}><div className="d2p-home-post-meta"><span className="d2p-avatar">{initials(post.author?.display_name || "Member")}</span><div><strong>{post.author?.display_name || "Doc2Postdoc member"}</strong><small>{post.author?.institution || "Doc2Postdoc network"}</small></div><span className="d2p-post-time">Today</span></div><p>{post.body}</p><div className="d2p-post-tags">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="d2p-post-actions"><button><MessageCircle size={15} /> Reply</button><button><Bookmark size={15} /> Save</button></div></article>) : <div className="d2p-home-empty"><Sparkles size={19} /><h3>Your network is just getting started.</h3><p>Share the first useful question or decision from your transition.</p><button className="d2p-gold-button" onClick={onCompose}>Write a post</button></div>}</section><aside className="d2p-home-right"><section className="d2p-eyewee-panel"><div className="d2p-eyewee-label"><Sparkles size={16} /> EYEWEE <span>AI career guide</span></div><h2>Ask about the next move.</h2><p>Eyewee works from your profile, goals, and the people already in your network.</p><div className="d2p-eyewee-prompts"><button onClick={() => { setQuestion("Which paths fit my research background?"); void askEyewee(); }}>Find paths <ArrowUpRight size={13} /></button><button onClick={() => { setQuestion("How should I explain my research to industry?"); void askEyewee(); }}>Translate my work <ArrowUpRight size={13} /></button></div><form className="d2p-eyewee-form" onSubmit={askEyewee}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask Eyewee anything" /><button disabled={asking} aria-label="Ask Eyewee"><Send size={15} /></button></form>{answer && <div className="d2p-eyewee-answer"><Sparkles size={14} /><span>{answer}</span></div>}</section><section className="d2p-home-card d2p-next-card"><p className="d2p-eyebrow">Next best action</p><h3>{profile?.research_area ? "Make your research easier to find." : "Complete your profile."}</h3><p>{profile?.research_area ? "A stronger profile gives your matches more signal." : "Add your research area and direction to improve matches."}</p><button onClick={() => onView("Profile")}>{profile?.research_area ? "Review profile" : "Complete profile"} <ArrowUpRight size={14} /></button></section></aside></div></div>;
}

function Metric({ label, value, onClick }: { label: string; value: string; onClick: () => void }) { return <button className="d2p-home-metric" onClick={onClick}><span>{label}</span><strong>{value}</strong><ArrowUpRight size={14} /></button>; }
function initials(value: string) { return value.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function profileStrength(profile: Profile | null) { if (!profile) return 0; return Math.round([profile.display_name, profile.bio, profile.research_area, profile.institution].filter(Boolean).length / 4 * 100); }
