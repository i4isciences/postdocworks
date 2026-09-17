create table if not exists public.credential_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text not null check (char_length(email) between 5 and 320),
  phone text not null default '',
  orcid text not null default '',
  orcid_verified boolean not null default false,
  pmid text not null default '',
  pmid_verified boolean not null default false,
  dissertation_link text not null default '',
  abstract_link text not null default '',
  linkedin text not null default '',
  scholar text not null default '',
  researchgate text not null default '',
  endorser_name text not null default '',
  endorser_email text not null default '',
  endorser_phone text not null default '',
  endorser_relationship text not null default 'pi',
  endorser_domain_status text not null default 'unchecked',
  patents jsonb not null default '[]'::jsonb,
  trademarks jsonb not null default '[]'::jsonb,
  completeness_score int not null default 0 check (completeness_score between 0 and 100),
  user_id uuid references auth.users(id) on delete set null,
  email_verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.credential_applications enable row level security;

drop policy if exists "public can submit credential applications" on public.credential_applications;
create policy "public can submit credential applications" on public.credential_applications for insert to anon, authenticated with check (true);

drop policy if exists "owners can read their credential application" on public.credential_applications;
create policy "owners can read their credential application" on public.credential_applications for select to authenticated using (user_id = auth.uid());

grant insert on public.credential_applications to anon, authenticated;
grant select on public.credential_applications to authenticated;

create index if not exists credential_applications_email_idx on public.credential_applications (email);
