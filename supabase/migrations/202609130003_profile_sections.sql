alter table public.doc2postdoc_profiles add column if not exists about text not null default '';
alter table public.doc2postdoc_profiles add column if not exists interests text[] not null default '{}';
alter table public.doc2postdoc_profiles add column if not exists avatar_path text;

create table public.doc2postdoc_experience (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  role_title text not null,
  company text not null,
  description text not null default '',
  skills text[] not null default '{}',
  started_on date,
  ended_on date,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.doc2postdoc_education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  institution text not null,
  degree text not null,
  field text not null default '',
  description text not null default '',
  started_on date,
  ended_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.doc2postdoc_certifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  name text not null,
  issuing_organization text not null,
  issued_on date,
  credential_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.doc2postdoc_achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  title text not null,
  organization text not null default '',
  description text not null default '',
  achieved_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doc2postdoc_experience_profile_idx on public.doc2postdoc_experience(profile_id, started_on desc);
create index if not exists doc2postdoc_education_profile_idx on public.doc2postdoc_education(profile_id, started_on desc);
create index if not exists doc2postdoc_certifications_profile_idx on public.doc2postdoc_certifications(profile_id, issued_on desc);
create index if not exists doc2postdoc_achievements_profile_idx on public.doc2postdoc_achievements(profile_id, achieved_on desc);

create trigger experience_updated_at before update on public.doc2postdoc_experience for each row execute procedure public.set_doc2postdoc_updated_at();
create trigger education_updated_at before update on public.doc2postdoc_education for each row execute procedure public.set_doc2postdoc_updated_at();
create trigger certifications_updated_at before update on public.doc2postdoc_certifications for each row execute procedure public.set_doc2postdoc_updated_at();
create trigger achievements_updated_at before update on public.doc2postdoc_achievements for each row execute procedure public.set_doc2postdoc_updated_at();

alter table public.doc2postdoc_experience enable row level security;
alter table public.doc2postdoc_education enable row level security;
alter table public.doc2postdoc_certifications enable row level security;
alter table public.doc2postdoc_achievements enable row level security;

create policy "members read experience" on public.doc2postdoc_experience for select to authenticated using (true);
create policy "owners manage experience" on public.doc2postdoc_experience for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "members read education" on public.doc2postdoc_education for select to authenticated using (true);
create policy "owners manage education" on public.doc2postdoc_education for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "members read certifications" on public.doc2postdoc_certifications for select to authenticated using (true);
create policy "owners manage certifications" on public.doc2postdoc_certifications for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "members read achievements" on public.doc2postdoc_achievements for select to authenticated using (true);
create policy "owners manage achievements" on public.doc2postdoc_achievements for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

insert into storage.buckets (id, name, public) values ('doc2postdoc-avatars', 'doc2postdoc-avatars', true) on conflict (id) do nothing;
create policy "members upload own avatar" on storage.objects for insert to authenticated with check (bucket_id = 'doc2postdoc-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "members update own avatar" on storage.objects for update to authenticated using (bucket_id = 'doc2postdoc-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "members delete own avatar" on storage.objects for delete to authenticated using (bucket_id = 'doc2postdoc-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
