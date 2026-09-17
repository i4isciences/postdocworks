create table if not exists public.doc2postdoc_signups (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text not null check (char_length(email) between 5 and 320),
  signup_role text not null check (signup_role in ('doc', 'postdoc')),
  career_stage text not null default '',
  primary_field text not null default '',
  credibility_notes text not null default '',
  academic_memberships text not null default '',
  social_memberships text not null default '',
  institution text not null default '',
  department text not null default '',
  city text not null default '',
  state_province text not null default '',
  country text not null default '',
  usa_region text not null default '',
  languages text not null default '',
  hobbies text not null default '',
  marital_status text not null default '',
  dietary text not null default '',
  peer_field text not null default '',
  professional_connection text not null default '',
  match_radius text not null default 'Campus',
  broadcast_opt_in boolean not null default false,
  user_id uuid references auth.users(id) on delete set null,
  email_verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.doc2postdoc_signups enable row level security;

drop policy if exists "public can submit doc2postdoc signups" on public.doc2postdoc_signups;
create policy "public can submit doc2postdoc signups" on public.doc2postdoc_signups for insert to anon, authenticated with check (true);

drop policy if exists "owners can read their doc2postdoc signup" on public.doc2postdoc_signups;
create policy "owners can read their doc2postdoc signup" on public.doc2postdoc_signups for select to authenticated using (user_id = auth.uid());

grant insert on public.doc2postdoc_signups to anon, authenticated;
grant select on public.doc2postdoc_signups to authenticated;

create index if not exists doc2postdoc_signups_email_idx on public.doc2postdoc_signups (email);

alter table public.doc2postdoc_profiles add column if not exists email text not null default '';
alter table public.doc2postdoc_profiles add column if not exists department text not null default '';
alter table public.doc2postdoc_profiles add column if not exists academic_memberships text not null default '';
alter table public.doc2postdoc_profiles add column if not exists social_memberships text not null default '';
alter table public.doc2postdoc_profiles add column if not exists languages text not null default '';
alter table public.doc2postdoc_profiles add column if not exists hobbies text not null default '';
alter table public.doc2postdoc_profiles add column if not exists marital_status text not null default '';
alter table public.doc2postdoc_profiles add column if not exists dietary text not null default '';
alter table public.doc2postdoc_profiles add column if not exists peer_field text not null default '';
alter table public.doc2postdoc_profiles add column if not exists professional_connection text not null default '';
alter table public.doc2postdoc_profiles add column if not exists match_radius text not null default 'Campus';
alter table public.doc2postdoc_profiles add column if not exists broadcast_opt_in boolean not null default false;
alter table public.doc2postdoc_profiles add column if not exists usa_region text not null default '';
alter table public.doc2postdoc_profiles add column if not exists career_stage_label text not null default '';
