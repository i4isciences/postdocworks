"use client";

import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DOC2POSTDOC_PILLAR_NAMES, fieldsForPillar } from "../../lib/doc2postdoc/taxonomy";

type Entry = { id: string; [key: string]: string | string[] | boolean | null };
type Profile = { display_name: string; role: string; research_area: string; institution: string; geography: string; bio: string; about: string; interests: string[]; avatar_url: string | null; connection_count: number; is_mentor?: boolean; mentor_available?: boolean; credibility_score?: number; pillar?: string; pillar_field?: string; specialization?: string; experience?: Entry[]; education?: Entry[]; certifications?: Entry[]; achievements?: Entry[] };
type Section = "experience" | "education" | "certifications" | "achievements";

export default function ProfileEditor({ profile, onSaved }: { profile: Profile; onSaved: () => Promise<void> }) {
  const [bioEditing, setBioEditing] = useState(false);
  const [bio, setBio] = useState(profile.bio || "");
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [about, setAbout] = useState(profile.about || "");
  const [details, setDetails] = useState({ display_name: profile.display_name, role: profile.role, research_area: profile.research_area, institution: profile.institution, geography: profile.geography });
  const [pillar, setPillar] = useState(profile.pillar || "");
  const [pillarField, setPillarField] = useState(profile.pillar_field || "");
  const [specialization, setSpecialization] = useState(profile.specialization || "");
  const [entrySection, setEntrySection] = useState<Section | null>(null);
  const [entryDraft, setEntryDraft] = useState<Record<string, string>>({});
  const [mentorSaving, setMentorSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const mentoring = Boolean(profile.is_mentor && profile.mentor_available);

  async function toggleMentoring() {
    setMentorSaving(true);
    try { await save({ is_mentor: !mentoring, mentor_available: !mentoring }); }
    finally { setMentorSaving(false); }
  }

  async function saveBio() {
    await save({ bio });
    setBioEditing(false);
  }

  async function saveAbout() {
    await save({ about });
    setEditing(null);
  }

  async function saveDetails(event: FormEvent) {
    event.preventDefault();
    await save(details);
    setEditing(null);
  }

  async function saveField(event: FormEvent) {
    event.preventDefault();
    await save({ pillar, pillar_field: pillarField, specialization, research_area: specialization.trim() || pillarField });
    setEditing(null);
  }

  async function save(payload: Record<string, unknown>) {
    const response = await fetch("/api/doc2postdoc/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error("Unable to save profile changes.");
    await onSaved();
  }

  async function changePhoto(file: File | undefined) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/doc2postdoc/profile/avatar", { method: "POST", body: form });
    if (!response.ok) throw new Error("Unable to update profile photo.");
    setMenu(false);
    await onSaved();
  }

  async function removePhoto() {
    if (!window.confirm("Remove your profile photo?")) return;
    await fetch("/api/doc2postdoc/profile/avatar", { method: "DELETE" });
    setMenu(false);
    await onSaved();
  }

  async function addEntry(section: Section) {
    const response = await fetch("/api/doc2postdoc/profile/sections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, item: entryDraft }) });
    if (!response.ok) throw new Error("Unable to add profile entry.");
    setEntryDraft({}); setEntrySection(null); await onSaved();
  }

  async function deleteEntry(section: Section, id: string) {
    await fetch("/api/doc2postdoc/profile/sections", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, id }) });
    await onSaved();
  }

  const avatar = profile.avatar_url ? <Image src={profile.avatar_url} alt="Profile photo" width={96} height={96} className="d2p-profile-photo" /> : <span className="d2p-avatar profile-placeholder">{profile.display_name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>;
  return <div className="d2p-profile-page">
    <section className="d2p-profile-hero"><div className="d2p-profile-hero-photo"><button className="d2p-photo-trigger" onClick={() => setMenu(!menu)} aria-label="Profile photo options">{avatar}</button><input ref={input} type="file" accept="image/*" hidden onChange={(event) => changePhoto(event.target.files?.[0])} />{menu && <div className="d2p-photo-menu"><button onClick={() => input.current?.click()}>Change</button><button onClick={() => input.current?.click()}>Edit</button><button onClick={removePhoto} disabled={!profile.avatar_url}>Remove</button></div>}</div><div className="d2p-profile-hero-copy"><h1>{profile.display_name || "Your name"}</h1>{bioEditing ? <div className="d2p-bio-editor"><textarea autoFocus value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Add a short professional bio." /><div><button className="d2p-save-profile" onClick={saveBio}>Save bio</button><button className="d2p-cancel-profile" onClick={() => setBioEditing(false)}>Cancel</button></div></div> : <div className="d2p-bio-row"><p>{profile.bio || "Add a short professional bio."}</p><button className="d2p-add-bio" onClick={() => setBioEditing(true)} aria-label="Add bio"><Plus size={15} /></button></div>}<span>{profile.role.replaceAll("_", " ")} · {profile.research_area || "Research area not added"}</span></div><div className="d2p-profile-stat"><strong>{profile.connection_count}</strong><span>connections</span></div></section>
    <section className="d2p-profile-section"><div className="d2p-profile-section-head"><h2>About</h2>{editing === "about" ? <button className="d2p-save-profile" onClick={saveAbout}>Save changes</button> : <button className="d2p-edit-icon" onClick={() => setEditing("about")} aria-label="Edit about"><Pencil size={15} /></button>}</div>{editing === "about" ? <><textarea autoFocus value={about} onChange={(event) => setAbout(event.target.value)} /><button className="d2p-cancel-profile" onClick={() => setEditing(null)}>Cancel</button></> : <p className="d2p-profile-copy">{profile.about || "Add a short description about your research and direction."}</p>}</section>
    <section className="d2p-profile-section d2p-mentor-section">
      <div className="d2p-profile-section-head">
        <h2>Mentorship</h2>
        {typeof profile.credibility_score === "number" && <span className="d2p-credibility-pill">Credibility {Math.round(profile.credibility_score)}</span>}
      </div>
      <div className="d2p-mentor-row">
        <div>
          <strong>Available to mentor a PhD student</strong>
          <p>Turn this on to appear in Doc2Postdoc matches for PhD students in your field, career stage, and geography. Off by default — you decide when you&apos;re ready to be found.</p>
        </div>
        <button
          type="button"
          className={`d2p-toggle${mentoring ? " on" : ""}`}
          role="switch"
          aria-checked={mentoring}
          aria-label="Available to mentor a PhD student"
          disabled={mentorSaving}
          onClick={toggleMentoring}
        >
          <span />
        </button>
      </div>
    </section>
    <section className="d2p-profile-section">
      <div className="d2p-profile-section-head">
        <h2>Field &amp; specialization</h2>
        {editing === "field" ? <button className="d2p-save-profile" form="profile-field" type="submit">Save changes</button> : <button className="d2p-edit-icon" onClick={() => setEditing("field")} aria-label="Edit field and specialization"><Pencil size={15} /></button>}
      </div>
      {editing === "field" ? (
        <form id="profile-field" className="d2p-detail-grid" onSubmit={saveField}>
          <label>Pillar
            <select value={pillar} onChange={(event) => { setPillar(event.target.value); setPillarField(""); }}>
              <option value="">Select one</option>
              {DOC2POSTDOC_PILLAR_NAMES.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </label>
          <label>Field
            <select value={pillarField} onChange={(event) => setPillarField(event.target.value)} disabled={!pillar}>
              <option value="">{pillar ? "Select one" : "Choose a pillar first"}</option>
              {fieldsForPillar(pillar).map((field) => <option key={field} value={field}>{field}</option>)}
            </select>
          </label>
          <label>Specialization<input value={specialization} onChange={(event) => setSpecialization(event.target.value)} placeholder="e.g. HBV persistence mechanisms" /></label>
          <button className="d2p-cancel-profile" type="button" onClick={() => setEditing(null)}>Cancel</button>
        </form>
      ) : (
        <div className="d2p-detail-grid d2p-readonly-grid">
          <span><small>Pillar</small>{profile.pillar || "Not added"}</span>
          <span><small>Field</small>{profile.pillar_field || "Not added"}</span>
          <span><small>Specialization</small>{profile.specialization || "Not added"}</span>
        </div>
      )}
    </section>
    <section className="d2p-profile-section"><div className="d2p-profile-section-head"><h2>Professional details</h2>{editing === "details" ? <button className="d2p-save-profile" form="profile-details" type="submit">Save changes</button> : <button className="d2p-edit-icon" onClick={() => setEditing("details")} aria-label="Edit professional details"><Pencil size={15} /></button>}</div>{editing === "details" ? <form id="profile-details" className="d2p-detail-grid" onSubmit={saveDetails}>{Object.entries(details).map(([key, value]) => <label key={key}>{key.replaceAll("_", " ")}<input value={value} onChange={(event) => setDetails({ ...details, [key]: event.target.value })} /></label>)}<button className="d2p-cancel-profile" type="button" onClick={() => setEditing(null)}>Cancel</button></form> : <div className="d2p-detail-grid d2p-readonly-grid"><span><small>Role</small>{profile.role.replaceAll("_", " ")}</span><span><small>Research area</small>{profile.research_area || "Not added"}</span><span><small>Institution</small>{profile.institution || "Not added"}</span><span><small>Geography</small>{profile.geography || "Not added"}</span></div>}</section>{(["experience", "education", "certifications", "achievements"] as Section[]).map((section) => <ProfileEntries key={section} section={section} entries={profile[section] || []} editing={entrySection === section} draft={entryDraft} setDraft={setEntryDraft} onEdit={() => setEntrySection(section)} onCancel={() => { setEntrySection(null); setEntryDraft({}); }} onSave={() => addEntry(section)} onDelete={(id) => deleteEntry(section, id)} />)}
  </div>;
}

function ProfileEntries({ section, entries, editing, draft, setDraft, onEdit, onCancel, onSave, onDelete }: { section: Section; entries: Entry[]; editing: boolean; draft: Record<string, string>; setDraft: (value: Record<string, string>) => void; onEdit: () => void; onCancel: () => void; onSave: () => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const labels: Record<Section, [string, string][]> = { experience: [["role_title", "Role"], ["company", "Company"], ["description", "Description"], ["skills", "Skills"], ["started_on", "Start date"], ["ended_on", "End date"]], education: [["degree", "Degree"], ["institution", "Institution"], ["field", "Field"], ["description", "Description"], ["started_on", "Start date"], ["ended_on", "End date"]], certifications: [["name", "Certification"], ["issuing_organization", "Issuing organization"], ["issued_on", "Issued date"], ["credential_url", "Credential URL"]], achievements: [["title", "Achievement"], ["organization", "Organization"], ["description", "Description"], ["achieved_on", "Date"]] };
  const title = section.charAt(0).toUpperCase() + section.slice(1);
  return <section className="d2p-profile-section"><div className="d2p-profile-section-head"><h2>{title}</h2><button className="d2p-edit-icon" onClick={onEdit} aria-label={`Edit ${title}`}><Pencil size={15} /></button></div>{entries.map((entry) => <div className="d2p-entry" key={entry.id}><div><h3>{String(entry.role_title || entry.degree || entry.name || entry.title || "Entry")}</h3><strong>{String(entry.company || entry.institution || entry.issuing_organization || entry.organization || "")}</strong><p>{String(entry.description || entry.field || entry.credential_url || "")}</p></div>{editing && <button onClick={() => onDelete(entry.id)} aria-label={`Delete ${title} entry`}><Trash2 size={15} /></button>}</div>)}{editing && <div className="d2p-entry-editor">{labels[section].map(([key, label]) => <label key={key}>{label}<input value={draft[key] || ""} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}<div><button className="d2p-save-profile" onClick={onSave}><Plus size={14} /> Add entry</button><button className="d2p-cancel-profile" onClick={onCancel}>Done</button></div></div>}</section>;
}
