"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Compass,
  FileText,
  Home,
  MapPin,
  MessageCircle,
  Network,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

type View = "Home" | "Discover" | "Matches" | "Messages" | "Saved" | "Profile";
type Match = { id: string; name: string; title: string; institution: string; location: string; field: string; stage: string; about: string; initials: string; score: number; available: boolean };
type CommunityPost = { id: number; author: string; role: string; time: string; initials: string; text: string; tags: string[] };

const posts: CommunityPost[] = [
  { id: 1, author: "Sofia Chen", role: "Postdoc in Materials Science · MIT", time: "2h", initials: "SC", text: "I just accepted a research scientist role after six years in academia. The most useful part of my transition was learning to describe the problems I solve, not just the techniques I use.", tags: ["Career transition", "Industry"] },
  { id: 2, author: "Daniel Okafor", role: "PhD candidate · University of Chicago", time: "5h", initials: "DO", text: "Looking for postdocs working in computational immunology who are open to sharing what they wish they had known before choosing a lab.", tags: ["Mentorship", "Immunology"] },
];

export default function Doc2PostdocApp() {
  const [view, setView] = useState<View>("Home");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [connected, setConnected] = useState<string[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [showComposer, setShowComposer] = useState(false);
  const [composer, setComposer] = useState("");
  const [toast, setToast] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    fetch("/api/doc2postdoc/auth").then((response) => {
      if (response.ok) {
        setAuthenticated(true);
        fetch("/api/doc2postdoc/matches?limit=20").then(async (matchesResponse) => {
          if (matchesResponse.ok) setMatches((await matchesResponse.json()).matches ?? []);
        });
      } else setAuthOpen(true);
    }).catch(() => setAuthOpen(true));
  }, []);

  async function loadMatches() {
    const response = await fetch("/api/doc2postdoc/matches?limit=20");
    if (!response.ok) { setAuthenticated(false); setAuthOpen(true); return; }
    const data = await response.json();
    setMatches(data.matches ?? []);
  }

  async function submitAuth(event: FormEvent) {
    event.preventDefault(); setAuthLoading(true);
    try {
      const response = await fetch("/api/doc2postdoc/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: authMode, email: authEmail, password: authPassword, displayName: authName }) });
      const data = await response.json();
      if (!response.ok) { setToast(data.error || "Authentication failed."); return; }
      if (data.confirmationRequired) { setToast("Check your email to confirm your account, then sign in."); setAuthMode("signin"); return; }
      setAuthenticated(true); setAuthOpen(false); await loadMatches(); setToast(authMode === "signup" ? "Your Doc2Postdoc profile is ready." : "Welcome back.");
    } finally { setAuthLoading(false); }
  }

  async function requestConnection(match: Match) {
    if (connected.includes(match.id)) return;
    try {
      const response = await fetch("/api/doc2postdoc/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientId: match.id, message: `Hi ${match.name.split(" ")[0]}, I found you through Doc2Postdoc and would value learning from your path.` }) });
      if (!response.ok) throw new Error("Connection request failed");
      setConnected((current) => [...current, match.id]);
      setToast(`Request sent to ${match.name}`);
    } catch { setToast("We couldn't send that request. Try again."); }
  }

  async function refreshMatches() {
    if (!authenticated) { setAuthOpen(true); return; }
    setMatchLoading(true);
    try {
      await loadMatches();
    } finally { setMatchLoading(false); }
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!composer.trim()) return;
    const response = await fetch("/api/doc2postdoc/posts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: composer, tags: ["community"] }) });
    if (!response.ok) { setToast("Sign in before publishing to the network."); return; }
    setShowComposer(false); setComposer(""); setToast("Your post is live in the Doc2Postdoc network.");
  }

  const filteredMatches = matches.filter((match) => `${match.name} ${match.field} ${match.institution}`.toLowerCase().includes(search.toLowerCase()));

  return <main className="d2p-app">
    <header className="d2p-navbar"><div className="d2p-nav-inner"><button className="d2p-brand" onClick={() => setView("Home")}><Image src="/doc2postdoc.png" alt="Doc2Postdoc" width={42} height={42} /><span>Doc2Postdoc<small>by PostdocWorks</small></span></button><nav className="d2p-desktop-nav"><button className={view === "Home" ? "active" : ""} onClick={() => setView("Home")}><Home size={16} /> Home</button><button className={view === "Discover" ? "active" : ""} onClick={() => setView("Discover")}><Compass size={16} /> Discover</button><button className={view === "Matches" ? "active" : ""} onClick={() => setView("Matches")}><Network size={16} /> My matches</button></nav><div className="d2p-nav-tools"><div className="d2p-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people or fields" aria-label="Search people or fields" /></div><button className="d2p-icon" aria-label="Notifications"><Bell size={18} /><i /></button><button className="d2p-user" onClick={() => setProfileOpen(!profileOpen)}><span>JM</span><ChevronDown size={14} /></button></div></div>{profileOpen && <div className="d2p-profile-menu"><strong>Jordan Mitchell</strong><span>PhD candidate · Cell biology</span><button onClick={() => setView("Profile")}>View profile</button><button onClick={() => setProfileOpen(false)}><X size={13} /> Close</button></div>}</header>
    <div className="d2p-layout"><aside className="d2p-sidebar"><div className="d2p-side-profile"><span className="d2p-avatar large">JM</span><strong>Jordan Mitchell</strong><span>PhD candidate</span><button onClick={() => setView("Profile")}>View your profile</button></div><div className="d2p-side-group"><small>YOUR SPACE</small><button className={view === "Messages" ? "active" : ""} onClick={() => setView("Messages")}><MessageCircle size={17} /> Messages <b>2</b></button><button className={view === "Saved" ? "active" : ""} onClick={() => setView("Saved")}><Bookmark size={17} /> Saved people</button><button onClick={() => setShowComposer(true)}><Plus size={17} /> Write a post</button></div><div className="d2p-side-group"><small>POSTDOCWORKS</small><button><BriefcaseBusiness size={17} /> Career paths</button><button><ShieldCheck size={17} /> Verification</button><button><Settings size={17} /> Settings</button></div><div className="d2p-sidebar-bottom"><Image src="/doc2postdoc.png" alt="Doc2Postdoc logo" width={30} height={30} /><span>Where the next step<br />has already been taken.</span></div></aside>
      <section className="d2p-content">{view === "Home" && <HomeView setView={setView} matches={matches} saved={saved} setSaved={setSaved} connected={connected} requestConnection={requestConnection} refreshMatches={refreshMatches} matchLoading={matchLoading} />}{view === "Matches" && <MatchesView matches={filteredMatches} connected={connected} requestConnection={requestConnection} refreshMatches={refreshMatches} matchLoading={matchLoading} />}{view === "Discover" && <DiscoverView posts={posts} showComposer={() => setShowComposer(true)} />}{view !== "Home" && view !== "Matches" && view !== "Discover" && <SimpleView view={view} onHome={() => setView("Home")} />}</section>
    </div>
    {showComposer && <div className="d2p-modal-backdrop" onClick={() => setShowComposer(false)}><form className="d2p-composer-modal" onSubmit={publish} onClick={(event) => event.stopPropagation()}><div className="d2p-modal-head"><h2>Share with your network</h2><button type="button" onClick={() => setShowComposer(false)} aria-label="Close composer"><X size={18} /></button></div><textarea autoFocus value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="What are you working through right now?" /><button className="d2p-gold-button" type="submit">Publish post <Send size={15} /></button></form></div>}
    {authOpen && <div className="d2p-modal-backdrop"><form className="d2p-auth-modal" onSubmit={submitAuth}><Image src="/doc2postdoc.png" alt="Doc2Postdoc" width={58} height={58} /><p className="d2p-eyebrow">Private member network</p><h2>{authMode === "signin" ? "Welcome back." : "Start your next conversation."}</h2><p>Sign in to see real matches and connect securely with postdocs who have made the move.</p>{authMode === "signup" && <input required value={authName} onChange={(event) => setAuthName(event.target.value)} placeholder="Full name" /> }<input required type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="Institutional email" /><input required minLength={8} type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Password (8+ characters)" /><button className="d2p-gold-button" disabled={authLoading} type="submit">{authLoading ? "Connecting..." : authMode === "signin" ? "Sign in" : "Create account"}</button><button className="d2p-auth-switch" type="button" onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}>{authMode === "signin" ? "New to Doc2Postdoc? Create an account" : "Already a member? Sign in"}</button></form></div>}
    {toast && <div className="d2p-toast" role="status"><Check size={16} /> {toast}<button onClick={() => setToast("")}><X size={14} /></button></div>}
    <footer className="d2p-footer"><div><strong>Doc2Postdoc</strong><span>Real peer mentorship for the postdoc transition.</span></div><nav><button onClick={() => setView("Discover")}>Discover</button><button onClick={() => setView("Matches")}>My matches</button><Link href="/">PostdocWorks</Link></nav><span>© 2026 i4iSciences</span></footer>
  </main>;
}

function HomeView({ setView, matches, saved, setSaved, connected, requestConnection, refreshMatches, matchLoading }: { setView: (view: View) => void; matches: Match[]; saved: string[]; setSaved: (ids: string[]) => void; connected: string[]; requestConnection: (match: Match) => void; refreshMatches: () => void; matchLoading: boolean }) {
  return <><div className="d2p-welcome"><div><p className="d2p-eyebrow">Your transition, with context</p><h1>Good morning, Jordan.</h1><p>Find the people who have already made the move you’re considering.</p></div><button className="d2p-gold-button" onClick={() => setView("Matches")}><Sparkles size={16} /> Find my matches</button></div><div className="d2p-profile-banner"><div className="d2p-avatar">JM</div><div><strong>Make your path easier to match</strong><span>Add your research area, career stage, and preferred direction.</span></div><button onClick={() => setView("Profile")}>Complete profile <span>72%</span></button></div><div className="d2p-columns"><section><div className="d2p-section-head"><div><p className="d2p-eyebrow">Your network</p><h2>People who can help</h2></div><button onClick={() => setView("Matches")}>See all <span>→</span></button></div><div className="d2p-match-list">{matches.slice(0, 2).map((match) => <MatchCard key={match.id} match={match} saved={saved.includes(match.id)} connected={connected.includes(match.id)} onSave={() => setSaved(saved.includes(match.id) ? saved.filter((id) => id !== match.id) : [...saved, match.id])} onConnect={() => requestConnection(match)} />)}</div><div className="d2p-section-head feed-head"><div><p className="d2p-eyebrow">From the community</p><h2>What people are navigating</h2></div><button onClick={() => setView("Discover")}>Open feed <span>→</span></button></div><article className="d2p-post"><PostAvatar initials="SC" /><div><div className="d2p-post-meta"><strong>Sofia Chen</strong><span>Postdoc in Materials Science · 2h</span></div><p>I just accepted a research scientist role after six years in academia. The most useful part of my transition was learning to describe the problems I solve, not just the techniques I use.</p><div className="d2p-post-tags"><span>Career transition</span><span>Industry</span></div><div className="d2p-post-actions"><button><MessageCircle size={15} /> 4 responses</button><button><Bookmark size={15} /> Save</button></div></div></article></section><aside className="d2p-right-rail"><div className="d2p-rail-card d2p-match-rail"><div className="d2p-rail-title"><span><Sparkles size={16} /> Matching engine</span><i>Live</i></div><h3>Your next conversation is closer than you think.</h3><p>We match on research specialty, career stage, institution type, and geography.</p><button onClick={refreshMatches}>{matchLoading ? "Finding matches..." : "Refresh recommendations →"}</button></div><div className="d2p-rail-card"><div className="d2p-rail-title"><span><ShieldCheck size={16} /> Trust you can read</span></div><div className="d2p-trust-row"><Check size={15} /><span><strong>Research credibility</strong>Verified academic record</span></div><div className="d2p-trust-row"><Check size={15} /><span><strong>Private by default</strong>Your conversations stay yours</span></div></div></aside></div></>;
}

function MatchesView({ matches, connected, requestConnection, refreshMatches, matchLoading }: { matches: Match[]; connected: string[]; requestConnection: (match: Match) => void; refreshMatches: () => void; matchLoading: boolean }) { return <><div className="d2p-page-heading"><p className="d2p-eyebrow">Matching engine</p><h1>People who have walked your path.</h1><p>Ranked by research area, career stage, institution context, and direction.</p><button className="d2p-outline-button" onClick={refreshMatches}>{matchLoading ? "Refreshing..." : "Refresh matches"}</button></div><div className="d2p-filter-row"><button className="active">All matches</button><button>Industry transition</button><button>Academic path</button><button>By field</button></div><div className="d2p-full-match-grid">{matches.map((match) => <MatchCard key={match.id} match={match} connected={connected.includes(match.id)} onConnect={() => requestConnection(match)} />)}</div></>; }

function DiscoverView({ posts, showComposer }: { posts: CommunityPost[]; showComposer: () => void }) { return <><div className="d2p-page-heading"><p className="d2p-eyebrow">Community feed</p><h1>Learn in public, carefully.</h1><p>Questions, decisions, and lessons from people in the transition.</p><button className="d2p-gold-button" onClick={showComposer}><Plus size={16} /> Write a post</button></div><div className="d2p-discover-feed">{posts.map((post) => <article className="d2p-post" key={post.id}><PostAvatar initials={post.initials} /><div><div className="d2p-post-meta"><strong>{post.author}</strong><span>{post.role} · {post.time}</span></div><p>{post.text}</p><div className="d2p-post-tags">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="d2p-post-actions"><button><MessageCircle size={15} /> Reply</button><button><Bookmark size={15} /> Save</button></div></div></article>)}</div></>; }

function MatchCard({ match, saved, connected, onSave, onConnect }: { match: Match; saved?: boolean; connected: boolean; onSave?: () => void; onConnect: () => void }) { return <article className="d2p-match-card"><div className="d2p-card-top"><PostAvatar initials={match.initials} /><div className="d2p-score"><strong>{match.score}%</strong><span>match</span></div></div><h3>{match.name}</h3><p className="d2p-match-role">{match.title} · {match.institution}</p><p className="d2p-match-location"><MapPin size={13} /> {match.location}</p><div className="d2p-match-tags"><span>{match.field}</span><span>{match.stage}</span></div><p className="d2p-match-about">{match.about}</p><div className="d2p-card-actions"><button className="d2p-connect-button" onClick={onConnect}>{connected ? <><Check size={14} /> Requested</> : <><MessageCircle size={14} /> Connect</>}</button>{onSave && <button className={saved ? "d2p-save-button saved" : "d2p-save-button"} onClick={onSave} aria-label="Save match"><Bookmark size={16} /></button>}</div></article>; }
function PostAvatar({ initials }: { initials: string }) { return <span className="d2p-avatar">{initials}</span>; }
function SimpleView({ view, onHome }: { view: View; onHome: () => void }) { return <div className="d2p-simple-view"><div className="d2p-avatar"><FileText size={19} /></div><p className="d2p-eyebrow">Doc2Postdoc</p><h1>{view === "Profile" ? "Your research profile" : view}</h1><p>This is where your private conversations, saved people, and research credibility record will live.</p><button className="d2p-gold-button" onClick={onHome}>Return to home <Home size={15} /></button></div>; }
