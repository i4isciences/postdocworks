create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 160),
  email text not null check (char_length(email) between 5 and 320),
  institution text not null check (char_length(institution) between 2 and 240),
  research_area text not null check (char_length(research_area) between 2 and 240),
  orcid text not null default '',
  linkedin text not null default '',
  role text not null check (role in ('phd_student', 'postdoc', 'faculty', 'industry')),
  message text not null default '',
  credentials jsonb not null default '{}'::jsonb,
  source text not null default 'homepage',
  created_at timestamptz not null default now()
);

alter table public.registrations add column if not exists credentials jsonb not null default '{}'::jsonb;

alter table public.registrations enable row level security;

drop policy if exists "public can submit registrations" on public.registrations;
create policy "public can submit registrations" on public.registrations for insert to anon, authenticated with check (true);

grant insert on public.registrations to anon, authenticated;

insert into storage.buckets (id, name, public)
values ('registration-assets', 'registration-assets', false)
on conflict (id) do nothing;
