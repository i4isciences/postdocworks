"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleHelp,
  Compass,
  FileText,
  Home,
  MessageCircle,
  Network,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

const navItems = [
  { label: "Home", icon: Home },
  { label: "Opportunities", icon: BriefcaseBusiness },
  { label: "Network", icon: UsersRound },
  { label: "Doc2Postdoc", icon: Network },
];

const opportunities = [
  { id: 1, type: "Industry", title: "Senior Scientist, Translational Biology", company: "Helix Therapeutics", location: "Boston, MA · Hybrid", match: 94, posted: "2d ago", tags: ["Cell biology", "CRISPR", "Drug discovery"], logo: "H", tone: "coral" },
  { id: 2, type: "Academia", title: "Assistant Professor, Systems Biology", company: "University of Michigan", location: "Ann Arbor, MI · On campus", match: 89, posted: "4d ago", tags: ["Systems biology", "Genomics", "PI track"], logo: "M", tone: "blue" },
  { id: 3, type: "Industry", title: "Research Lead, Computational Medicine", company: "Nexora Health", location: "Remote · United States", match: 87, posted: "1w ago", tags: ["Python", "ML", "Clinical data"], logo: "N", tone: "gold" },
];

const peers = [
  { name: "Amina Rahman", role: "Director of Computational Biology", org: "Arcadia Bio", context: "Former postdoc at Stanford", initials: "AR", online: true },
  { name: "Jonas Weber", role: "Assistant Professor", org: "ETH Zurich", context: "Systems biology · 3rd year postdoc", initials: "JW", online: false },
  { name: "Sofia Lin", role: "Principal Scientist", org: "Nucleus AI", context: "Made the academia to industry move", initials: "SL", online: true },
];

const prompts = [
  "What roles fit my research background?",
  "Translate my publication record for industry",
  "Help me prepare for a PI interview",
];

export default function WorkspacePage() {
  const [active, setActive] = useState("Home");
  const [saved, setSaved] = useState<number[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  function askEyewee(prompt: string) {
    setQuestion(prompt);
    setAnswer("I’m mapping that to your research record, goals, and the next-step paths you’ve saved. Your strongest current direction is translational biology in a research-led industry team. I found 12 roles and 4 people in your network that align with it.");
  }

  return (
    <main className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link href="/" className="workspace-brand"><span className="brand-mark">P</span><span>postdocworks</span></Link>
        <div className="workspace-switcher"><span className="workspace-avatar">JM</span><span><strong>Jordan Mitchell</strong><small>Postdoc · Cell biology</small></span><ChevronDown size={15} /></div>
        <nav className="workspace-nav" aria-label="Workspace navigation">
          {navItems.map(({ label, icon: Icon }) => <button key={label} className={active === label ? "active" : ""} onClick={() => setActive(label)}><Icon size={18} /><span>{label}</span>{label === "Doc2Postdoc" && <span className="nav-badge">3</span>}</button>)}
        </nav>
        <div className="sidebar-label">Your workspace</div>
        <nav className="workspace-nav workspace-nav-secondary">
          <button onClick={() => setActive("Messages")} className={active === "Messages" ? "active" : ""}><MessageCircle size={18} /><span>Messages</span><span className="nav-badge quiet">2</span></button>
          <button onClick={() => setActive("Saved")} className={active === "Saved" ? "active" : ""}><Bookmark size={18} /><span>Saved</span></button>
          <button onClick={() => setActive("Profile")} className={active === "Profile" ? "active" : ""}><UserRound size={18} /><span>My profile</span></button>
        </nav>
        <div className="sidebar-bottom"><button><Settings2 size={17} /> Settings</button><button><CircleHelp size={17} /> Help center</button><Link href="/" className="back-to-site">← Back to postdocworks.io</Link></div>
      </aside>

      <section className="workspace-main">
        <header className="workspace-topbar"><div className="mobile-brand"><span className="brand-mark">P</span> postdocworks</div><div className="workspace-search"><Search size={17} /><input placeholder="Search people, roles, or research" aria-label="Search workspace" /></div><div className="topbar-actions"><button className="icon-button" aria-label="Notifications"><Bell size={19} /><span className="notification-dot" /></button><button className="profile-button" onClick={() => setShowProfile(!showProfile)}><span className="workspace-avatar small">JM</span><ChevronDown size={15} /></button></div></header>
        {showProfile && <div className="profile-popover"><strong>Jordan Mitchell</strong><span>Postdoc · Cell biology</span><button onClick={() => setShowProfile(false)}><X size={14} /> Close</button></div>}

        <div className="workspace-content">
          {active === "Home" && <>
            <div className="workspace-welcome"><div><p className="workspace-eyebrow">Monday, September 14, 2026</p><h1>Good morning, Jordan.</h1><p className="workspace-subtitle">Here’s what’s moving your next step forward.</p></div><button className="outline-button"><Plus size={16} /> Update profile</button></div>
            <div className="profile-progress"><div className="progress-copy"><div className="progress-icon"><ShieldCheck size={19} /></div><div><strong>Your profile is 82% complete</strong><span>Add your career goals to sharpen your matches.</span></div></div><button onClick={() => setActive("Profile")}>Complete profile <ArrowUpRight size={15} /></button><div className="progress-track"><span /></div></div>
            <div className="workspace-grid workspace-grid-main"><section><div className="section-row"><div><p className="workspace-eyebrow">For your next move</p><h2>Recommended for you</h2></div><button className="text-button" onClick={() => setActive("Opportunities")}>View all <ArrowUpRight size={15} /></button></div><div className="opportunity-list">{opportunities.map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} saved={saved.includes(opportunity.id)} onSave={() => setSaved(saved.includes(opportunity.id) ? saved.filter((id) => id !== opportunity.id) : [...saved, opportunity.id])} />)}</div></section><aside className="eyewee-card"><div className="eyewee-card-top"><span className="eyewee-orbit"><Sparkles size={19} /></span><span className="live-label"><i /> Eyewee is ready</span></div><h2>Your research has more than one future.</h2><p>Ask Eyewee to translate your record, explore a path, or find the people who have already made the move.</p><div className="prompt-list">{prompts.map((prompt) => <button key={prompt} onClick={() => askEyewee(prompt)}>{prompt}<ArrowUpRight size={14} /></button>)}</div><div className="eyewee-input"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === "Enter" && askEyewee(question)} placeholder="Ask Eyewee anything..." aria-label="Ask Eyewee" /><button aria-label="Send question" onClick={() => askEyewee(question)}><Send size={15} /></button></div>{answer && <div className="eyewee-answer"><Sparkles size={14} /><span>{answer}</span></div>}</aside></div>
            <div className="section-row network-heading"><div><p className="workspace-eyebrow">Your network</p><h2>People worth knowing</h2></div><button className="text-button" onClick={() => setActive("Network")}>Explore network <ArrowUpRight size={15} /></button></div><div className="peer-grid">{peers.map((peer) => <PeerCard key={peer.name} peer={peer} />)}</div>
          </>}
          {active !== "Home" && <WorkspaceView active={active} onBack={() => setActive("Home")} />}
        </div>
      </section>
    </main>
  );
}

function OpportunityCard({ opportunity, saved, onSave }: { opportunity: typeof opportunities[number]; saved: boolean; onSave: () => void }) {
  return <article className="opportunity-card"><div className={`company-logo ${opportunity.tone}`}>{opportunity.logo}</div><div className="opportunity-body"><div className="opportunity-meta"><span>{opportunity.type}</span><small>{opportunity.posted}</small></div><h3>{opportunity.title}</h3><p>{opportunity.company} · {opportunity.location}</p><div className="tag-row">{opportunity.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div><div className="opportunity-actions"><button className={`save-button ${saved ? "saved" : ""}`} onClick={onSave} aria-label={saved ? "Remove saved opportunity" : "Save opportunity"}>{saved ? <Check size={16} /> : <Bookmark size={16} />}</button><div className="match-score"><strong>{opportunity.match}%</strong><span>match</span></div></div></article>;
}

function PeerCard({ peer }: { peer: typeof peers[number] }) {
  return <article className="peer-card"><div className="peer-card-head"><div className="peer-avatar">{peer.initials}<i className={peer.online ? "online" : ""} /></div><button className="more-button" aria-label={`More options for ${peer.name}`}>•••</button></div><h3>{peer.name}</h3><p>{peer.role}</p><strong>{peer.org}</strong><span className="peer-context">{peer.context}</span><button className="connect-button"><MessageCircle size={14} /> Connect</button></article>;
}

function WorkspaceView({ active, onBack }: { active: string; onBack: () => void }) {
  const titles: Record<string, [string, string]> = { Opportunities: ["Opportunity feed", "Roles tuned to your research, experience, and goals."], Network: ["Your network", "Researchers and career paths connected to your work."], "Doc2Postdoc": ["Doc2Postdoc", "Find a postdoc who has already made your next transition."], Messages: ["Messages", "Private conversations with people in your network."], Saved: ["Saved opportunities", "The roles you are keeping close."], Profile: ["Your research profile", "The record Eyewee uses to make your next step more precise."] };
  const [title, subtitle] = titles[active] || titles.Opportunities;
  return <div className="empty-workspace-view"><button className="back-workspace" onClick={onBack}>← Home</button><p className="workspace-eyebrow">PostdocWorks workspace</p><h1>{title}</h1><p>{subtitle}</p><div className="view-placeholder"><div className="placeholder-icon">{active === "Doc2Postdoc" ? <Network size={24} /> : active === "Profile" ? <FileText size={24} /> : <Compass size={24} />}</div><h2>{active === "Doc2Postdoc" ? "Three people are already close matches" : "This view is ready for your next action"}</h2><span>Connect your account to bring your verified record, conversations, and live opportunity data here.</span><button className="button button-primary" onClick={onBack}>Return to home <ArrowUpRight size={15} /></button></div></div>;
}
