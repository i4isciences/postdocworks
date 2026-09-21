-- Early-access waitlist for the PostdocWorks/eyewee/Doc2Postdoc landing page. Public, anonymous
-- insert only (no accounts exist in this app) -- same pattern as postdocworks' own
-- `registrations` table (202609140001_public_registrations.sql): RLS enabled, insert-only policy
-- for anon, no select/update/delete exposed to the client.

create table if not exists public.eyewee_waitlist (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text not null check (char_length(email) between 5 and 320),
  career_stage text not null default 'Postdoc',
  research_field text not null default '',
  institution text not null default '',
  city text not null default '',
  consent_given boolean not null default false,
  consented_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists eyewee_waitlist_email_idx on public.eyewee_waitlist (email);

alter table public.eyewee_waitlist enable row level security;

drop policy if exists "public can join the waitlist" on public.eyewee_waitlist;
create policy "public can join the waitlist" on public.eyewee_waitlist
  for insert to anon, authenticated with check (true);

grant insert on public.eyewee_waitlist to anon, authenticated;
