"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Bell, Bookmark, Check, ChevronDown, Compass, FileText, Home, MapPin, MessageCircle, Network, Plus, Search, Send, Settings, ShieldCheck, Upload, X } from "lucide-react";
import ProfileEditor from "./ProfileEditor";
import RequestsView from "./RequestsView";
import HomeExperience from "./HomeExperience";

type View = "Home" | "Discover" | "Matches" | "Messages" | "Requests" | "Profile";
type Match = { id: string; name: string; title: string; institution: string; location: string; field: string; stage: string; about: string; initials: string; score: number; completed_mentorships?: number; pillar?: string; pillar_field?: string };
type Post = { id: string; body: string; tags: string[]; media_urls?: string[]; created_at: string; author?: { display_name?: string; role?: string; institution?: string } };
type ProfileEntry = { id: string; [key: string]: string | string[] | boolean | null };
type Profile = { id: string; display_name: string; role: string; career_stage: string; research_area: string; specialties: string[]; interests: string[]; institution: string; institution_type: string; geography: string; bio: string; about: string; avatar_url: string | null; is_mentor: boolean; mentor_available: boolean; connection_count: number; experience: ProfileEntry[]; education: ProfileEntry[]; certifications: ProfileEntry[]; achievements: ProfileEntry[] };
type ConnectionProfile = { display_name?: string; role?: string; research_area?: string; institution?: string; geography?: string; bio?: string; avatar_url?: string | null };
type Connection = { id: string; requester_id: string; recipient_id: string; message: string; status: "pending" | "accepted" | "declined" | "blocked"; created_at: string; requester?: ConnectionProfile; recipient?: ConnectionProfile };
type Conversation = { id: string; connection_id: string };
type Message = { id: string; sender_id: string; body: string; created_at: string };

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data as T;
}

export default function Doc2PostdocWorkspace() {
  const [view, setView] = useState<View>("Home");
  const [search, setSearch] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composer, setComposer] = useState("");
  const [composerMedia, setComposerMedia] = useState<File | null>(null);
  const [toast, setToast] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  async function loadWorkspace() {
    const [profileData, matchData, postData, connectionData, conversationData] = await Promise.all([
      request<{ profile: Profile }>("/api/doc2postdoc/profile"),
      request<{ matches: Match[] }>("/api/doc2postdoc/matches?limit=20"),
      request<{ posts: Post[] }>("/api/doc2postdoc/posts"),
      request<{ connections: Connection[] }>("/api/doc2postdoc/connections"),
      request<{ conversations: Conversation[] }>("/api/doc2postdoc/conversations"),
    ]);
    setProfile(profileData.profile); setMatches(matchData.matches); setPosts(postData.posts); setConnections(connectionData.connections); setConversations(conversationData.conversations);
  }

  async function refreshProfile() {
    const data = await request<{ profile: Profile }>("/api/doc2postdoc/profile");
    setProfile(data.profile);
  }

  useEffect(() => {
    request<{ user: { id: string } }>("/api/doc2postdoc/auth").then(loadWorkspace).catch(() => { window.location.href = "/doc2postdoc"; });
  }, []);

  useEffect(() => {
    if (!profile) return;
    const sidebar = document.querySelector<HTMLElement>(".d2p-side-profile");
    const avatar = sidebar?.querySelector<HTMLElement>(".d2p-avatar.large");
    if (avatar) {
      avatar.textContent = profile.avatar_url ? "" : initials(profile.display_name || "Member");
      avatar.style.backgroundImage = profile.avatar_url ? `url(${profile.avatar_url})` : "";
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
    }
    const role = sidebar?.querySelector<HTMLElement>("span:not(.d2p-avatar):not(.d2p-side-bio)");
    if (role) role.textContent = profile.role.replaceAll("_", " ");
    let bio = sidebar?.querySelector<HTMLElement>(".d2p-side-bio");
    if (sidebar && profile.bio) {
      if (!bio) { bio = document.createElement("span"); bio.className = "d2p-side-bio"; sidebar.insertBefore(bio, sidebar.querySelector("button")); }
      bio.textContent = profile.bio;
    } else bio?.remove();
  }, [profile]);

  async function signOut() {
    await fetch("/api/doc2postdoc/auth", { method: "DELETE" });
    window.location.href = "/doc2postdoc";
  }

  async function connect(match: Match) {
    try { await request("/api/doc2postdoc/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientId: match.id, message: `Hi ${match.name.split(" ")[0]}, I found you through Doc2Postdoc and would value learning from your path.` }) }); await loadWorkspace(); setToast(`Request sent to ${match.name}.`); } catch (error) { setToast(error instanceof Error ? error.message : "Unable to send request."); }
  }

  async function publish(event: FormEvent) {
    event.preventDefault(); if (!composer.trim()) return;
    try { const form = new FormData(); form.append("body", composer); if (composerMedia) form.append("media", composerMedia); await request("/api/doc2postdoc/posts", { method: "POST", body: form }); setComposer(""); setComposerMedia(null); setComposerOpen(false); await loadWorkspace(); setToast("Post published."); } catch (error) { setToast(error instanceof Error ? error.message : "Unable to publish post."); }
  }

  const filteredMatches = matches.filter((match) => `${match.name} ${match.field} ${match.institution}`.toLowerCase().includes(search.toLowerCase()));
  const name = profile?.display_name || "Member";

  return <main className="d2p-app">
    <header className="d2p-navbar"><div className="d2p-nav-inner"><button className="d2p-brand" onClick={() => setView("Home")}><Image src="/doc2postdoc.png" alt="Doc2Postdoc" width={42} height={42} /><span>Doc2Postdoc<small>by PostdocWorks</small></span></button><nav className="d2p-desktop-nav"><NavButton active={view === "Home"} onClick={() => setView("Home")} icon={<Home size={16} />}>Home</NavButton><NavButton active={view === "Discover"} onClick={() => setView("Discover")} icon={<Compass size={16} />}>Discover</NavButton><NavButton active={view === "Matches"} onClick={() => setView("Matches")} icon={<Network size={16} />}>My matches</NavButton></nav><div className="d2p-nav-tools"><div className="d2p-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people or fields" aria-label="Search people or fields" /></div><button className={view === "Requests" ? "d2p-icon active" : "d2p-icon"} onClick={() => setView("Requests")} aria-label="Connection requests"><Bell size={18} />{connections.filter((connection) => connection.recipient_id === profile?.id && connection.status === "pending").length > 0 && <i />}</button><button className="d2p-user" onClick={() => setProfileMenuOpen((open) => !open)} aria-expanded={profileMenuOpen}><span>{initials(name)}</span><ChevronDown size={14} /></button></div></div>{profileMenuOpen && <div className="d2p-profile-menu"><strong>{name}</strong><span>{profile?.role?.replaceAll("_", " ") || "Doc2Postdoc member"}</span><button onClick={() => { setProfileMenuOpen(false); setView("Profile"); }}>View profile</button><button onClick={signOut}>Log out</button></div>}</header>
    <div className="d2p-layout"><aside className="d2p-sidebar"><div className="d2p-side-profile"><span className="d2p-avatar large">{initials(name)}</span><strong>{name}</strong><span>{profile?.role || "Doc2Postdoc member"}</span><button onClick={() => setView("Profile")}>View your profile</button></div><div className="d2p-side-group"><small>YOUR SPACE</small><NavButton active={view === "Messages"} onClick={() => setView("Messages")} icon={<MessageCircle size={17} />}>Messages</NavButton><button onClick={() => setComposerOpen(true)}><Plus size={17} /> Write a post</button></div><div className="d2p-side-group"><small>POSTDOCWORKS</small><Link href="/"><ShieldCheck size={17} /> Verification</Link><button onClick={() => setView("Profile")}><Settings size={17} /> Settings</button></div><div className="d2p-sidebar-bottom"><Image src="/doc2postdoc.png" alt="Doc2Postdoc logo" width={30} height={30} /><span>Where the next step<br />has already been taken.</span></div></aside>
      <section className="d2p-content">{view === "Home" && <HomeExperience profile={profile} matches={matches} posts={posts} connections={connections} onView={setView} onCompose={() => setComposerOpen(true)} />}{view === "Discover" && <DiscoverView posts={posts} onCompose={() => setComposerOpen(true)} />}{view === "Matches" && <MatchesView matches={filteredMatches} connections={connections} onConnect={connect} />}{view === "Messages" && <MessagesView connections={connections} conversations={conversations} userId={profile?.id || ""} onRefresh={loadWorkspace} />}{view === "Requests" && <RequestsView connections={connections} userId={profile?.id || ""} onRefresh={loadWorkspace} />}{view === "Profile" && profile && <ProfileEditor profile={profile} onSaved={refreshProfile} />}</section>
    </div>
    {composerOpen && <div className="d2p-modal-backdrop" onClick={() => setComposerOpen(false)}><form className="d2p-composer-modal" onSubmit={publish} onClick={(event) => event.stopPropagation()}><div className="d2p-modal-head"><h2>Share with your network</h2><button type="button" onClick={() => setComposerOpen(false)} aria-label="Close"><X size={18} /></button></div><textarea autoFocus value={composer} onChange={(event) => setComposer(event.target.value)} placeholder="What are you working through right now?" /><label className="d2p-media-picker"><Upload size={14} /> {composerMedia ? composerMedia.name : "Add a photo"}<input type="file" accept="image/*" onChange={(event) => setComposerMedia(event.target.files?.[0] || null)} /></label><button className="d2p-gold-button" type="submit">Publish post <Send size={15} /></button></form></div>}
    {toast && <div className="d2p-toast" role="status"><Check size={16} /> {toast}<button onClick={() => setToast("")}><X size={14} /></button></div>}
    <footer className="d2p-footer"><div><strong>Doc2Postdoc</strong><span>Real peer mentorship for the postdoc transition.</span></div><nav><button onClick={() => setView("Discover")}>Discover</button><button onClick={() => setView("Matches")}>My matches</button><Link href="/">PostdocWorks</Link><Link href="/terms">Terms of Service</Link><Link href="/privacy">Privacy Policy</Link></nav><span>© 2026 i4iSciences</span></footer>
  </main>;
}

function NavButton({ active, onClick, icon, children }: { active?: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) { return <button className={active ? "active" : ""} onClick={onClick}>{icon}{children}</button>; }
function initials(value: string) { return value.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function PostAvatar({ value }: { value: string }) { return <span className="d2p-avatar">{initials(value)}</span>; }
function MatchCard({ match, connected, onConnect }: { match: Match; connected: boolean; onConnect: () => void }) { return <article className="d2p-match-card"><div className="d2p-card-top"><PostAvatar value={match.name} /><div className="d2p-score"><strong>{match.score}%</strong><span>match</span></div></div><h3>{match.name}</h3><p className="d2p-match-role">{match.title} · {match.institution}</p><p className="d2p-match-location"><MapPin size={13} /> {match.location || "Location not added"}</p><div className="d2p-match-tags">{match.pillar && <span>{match.pillar}</span>}<span>{match.pillar_field || match.field}</span><span>{match.stage.replaceAll("_", " ")}</span></div><p className="d2p-match-about">{match.about || "A verified member of the Doc2Postdoc network."}</p>{Boolean(match.completed_mentorships) && <p className="d2p-match-reputation"><ShieldCheck size={13} /> {match.completed_mentorships} completed mentorship{match.completed_mentorships === 1 ? "" : "s"} on Doc2Postdoc</p>}<div className="d2p-card-actions"><button className="d2p-connect-button" onClick={onConnect}>{connected ? <><Check size={14} /> Connected</> : <><MessageCircle size={14} /> Connect</>}</button><button className="d2p-save-button" aria-label="Save person"><Bookmark size={16} /></button></div></article>; }
function PostCard({ post }: { post: Post }) { const author = post.author?.display_name || "Doc2Postdoc member"; return <article className="d2p-post"><PostAvatar value={author} /><div><div className="d2p-post-meta"><strong>{author}</strong><span>{post.author?.institution || "Doc2Postdoc network"}</span></div><p>{post.body}</p>{post.media_urls?.map((url) => <Image key={url} src={url} alt="Post attachment" width={560} height={300} className="d2p-post-media" />)}<div className="d2p-post-tags">{post.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="d2p-post-actions"><button><MessageCircle size={15} /> Reply</button><button><Bookmark size={15} /> Save</button></div></div></article>; }
function DiscoverView({ posts, onCompose }: { posts: Post[]; onCompose: () => void }) { return <><div className="d2p-page-heading"><p className="d2p-eyebrow">Community feed</p><h1>Learn in public, carefully.</h1><p>Questions, decisions, and lessons from people in the transition.</p><button className="d2p-gold-button" onClick={onCompose}><Plus size={16} /> Write a post</button></div><div className="d2p-discover-feed">{posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <Empty title="The network is quiet." copy="Be the first to share a useful decision or question." />}</div></>; }
function MatchesView({ matches, connections, onConnect }: { matches: Match[]; connections: Connection[]; onConnect: (match: Match) => void }) { return <><div className="d2p-page-heading"><p className="d2p-eyebrow">Matching engine</p><h1>People who have walked your path.</h1><p>Ranked by research area, career stage, institution context, and direction.</p></div><div className="d2p-full-match-grid">{matches.length ? matches.map((match) => <MatchCard key={match.id} match={match} connected={connections.some((connection) => connection.recipient_id === match.id || connection.requester_id === match.id)} onConnect={() => onConnect(match)} />) : <Empty title="No close matches yet." copy="Complete more of your profile and we will keep looking." />}</div></>; }
function MessagesView({ connections, conversations, userId, onRefresh }: { connections: Connection[]; conversations: Conversation[]; userId: string; onRefresh: () => Promise<void> }) {
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState("conduct");
  const [reportDescription, setReportDescription] = useState("");
  const [reportStatus, setReportStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [reportError, setReportError] = useState("");
  const accepted = connections.filter((connection) => connection.status === "accepted");
  const pending = connections.filter((connection) => connection.status === "pending" && connection.recipient_id === userId);

  async function loadMessages(conversationId: string) {
    const data = await request<{ messages: Message[] }>(`/api/doc2postdoc/messages?conversationId=${conversationId}`);
    setMessages(data.messages);
  }

  function choose(conversation: Conversation) {
    setSelected(conversation);
    setReportOpen(false);
    setReportStatus("idle");
    void loadMessages(conversation.id);
  }

  async function submitReport(event: FormEvent) {
    event.preventDefault();
    if (!selected || reportDescription.trim().length < 20) { setReportStatus("error"); setReportError("Describe what happened in at least 20 characters."); return; }
    setReportStatus("submitting");
    try {
      await request("/api/doc2postdoc/disputes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id, category: reportCategory, description: reportDescription }) });
      setReportStatus("sent");
      setReportDescription("");
    } catch (error) {
      setReportStatus("error");
      setReportError(error instanceof Error ? error.message : "Unable to submit your report.");
    }
  }

  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(() => { void loadMessages(selected.id); }, 4000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  async function respond(connectionId: string, status: "accepted" | "declined") {
    await request("/api/doc2postdoc/connections", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connectionId, status }) });
    await onRefresh();
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!selected || !draft.trim()) return;
    const outgoing = draft;
    setDraft("");
    await request("/api/doc2postdoc/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id, body: outgoing }) });
    await loadMessages(selected.id);
  }

  return <>
    <div className="d2p-page-heading"><p className="d2p-eyebrow">Private by default</p><h1>Messages</h1><p>Your conversations stay between matched members.</p></div>
    {pending.map((connection) => <div className="d2p-request-row" key={connection.id}><span><strong>New connection request</strong><small>{connection.message}</small></span><button onClick={() => respond(connection.id, "accepted")}><Check size={14} /> Accept</button><button onClick={() => respond(connection.id, "declined")}><X size={14} /></button></div>)}
    <div className="d2p-message-layout">
      <div className="d2p-conversation-list">{accepted.map((connection) => { const conversation = conversations.find((item) => item.connection_id === connection.id); return <button key={connection.id} className={selected?.id === conversation?.id ? "active" : ""} disabled={!conversation} onClick={() => conversation && choose(conversation)}><MessageCircle size={16} /><span><strong>{connection.requester_id === userId ? connection.recipient?.display_name : connection.requester?.display_name || "Matched member"}</strong><small>{conversation ? "Conversation open" : "Preparing conversation"}</small></span></button>; })}</div>
      <div className="d2p-message-panel">{selected ? <>
        <div className="d2p-message-panel-head">
          <span>Private conversation</span>
          <button type="button" className="d2p-report-toggle" onClick={() => setReportOpen((open) => !open)}>Report</button>
        </div>
        {reportOpen && (
          <form className="d2p-report-form" onSubmit={submitReport}>
            {reportStatus === "sent" ? <p className="d2p-report-sent"><Check size={13} /> Report submitted. Our team will review it.</p> : <>
              <select value={reportCategory} onChange={(event) => setReportCategory(event.target.value)}>
                <option value="conduct">Conduct</option>
                <option value="content">Content</option>
                <option value="ip">Intellectual property</option>
                <option value="privacy">Privacy</option>
              </select>
              <textarea value={reportDescription} onChange={(event) => setReportDescription(event.target.value)} placeholder="Describe what happened. Reports route through our Appeals & Dispute process." rows={3} />
              {reportStatus === "error" && <p className="d2p-report-error">{reportError}</p>}
              <button type="submit" disabled={reportStatus === "submitting"}>{reportStatus === "submitting" ? "Submitting..." : "Submit report"}</button>
            </>}
          </form>
        )}
        <div className="d2p-message-list" ref={listRef}>{messages.map((message) => <p className={message.sender_id === userId ? "mine" : ""} key={message.id}>{message.body}</p>)}</div>
        <form onSubmit={send} className="d2p-message-form"><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a private message" /><button aria-label="Send message"><Send size={15} /></button></form>
      </> : <Empty title="Choose a conversation" copy="Accept a connection to begin a private conversation." />}</div>
    </div>
  </>;
}
function Empty({ title, copy }: { title: string; copy: string }) { return <div className="d2p-empty"><FileText size={20} /><h2>{title}</h2><p>{copy}</p></div>; }
