create extension if not exists pgcrypto;

create type public.doc2postdoc_role as enum ('phd_student', 'postdoc', 'faculty', 'industry');
create type public.doc2postdoc_stage as enum ('phd_finishing', 'postdoc_search', 'postdoc_early', 'postdoc_late', 'industry_transition', 'faculty_track', 'industry');
create type public.connection_status as enum ('pending', 'accepted', 'declined', 'blocked');

create table public.doc2postdoc_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.doc2postdoc_role not null default 'phd_student',
  career_stage public.doc2postdoc_stage not null default 'phd_finishing',
  research_area text not null default '',
  specialties text[] not null default '{}',
  institution text not null default '',
  institution_type text not null default '',
  geography text not null default '',
  bio text not null default '',
  avatar_url text,
  is_mentor boolean not null default false,
  mentor_available boolean not null default false,
  credibility_score numeric(5,2) not null default 0 check (credibility_score between 0 and 100),
  credibility_profile jsonb not null default '{}'::jsonb,
  verified_badges text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.doc2postdoc_connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  recipient_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  message text not null check (char_length(message) between 12 and 2000),
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> recipient_id),
  unique (requester_id, recipient_id)
);

create unique index doc2postdoc_connections_pair_idx on public.doc2postdoc_connections (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

create table public.doc2postdoc_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.doc2postdoc_conversations (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.doc2postdoc_connections(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.doc2postdoc_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.doc2postdoc_conversations(id) on delete cascade,
  sender_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index doc2postdoc_profiles_area_idx on public.doc2postdoc_profiles using gin (specialties);
create index doc2postdoc_profiles_stage_idx on public.doc2postdoc_profiles (career_stage);
create index doc2postdoc_connections_recipient_idx on public.doc2postdoc_connections (recipient_id, status);
create index doc2postdoc_posts_created_idx on public.doc2postdoc_posts (created_at desc);
create index doc2postdoc_messages_conversation_idx on public.doc2postdoc_messages (conversation_id, created_at);

create or replace function public.set_doc2postdoc_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.doc2postdoc_profiles for each row execute procedure public.set_doc2postdoc_updated_at();
create trigger connections_updated_at before update on public.doc2postdoc_connections for each row execute procedure public.set_doc2postdoc_updated_at();
create trigger posts_updated_at before update on public.doc2postdoc_posts for each row execute procedure public.set_doc2postdoc_updated_at();

create or replace function public.handle_doc2postdoc_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.doc2postdoc_profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', '')) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_doc2postdoc after insert on auth.users for each row execute procedure public.handle_doc2postdoc_user();

create or replace function public.find_doc2postdoc_matches(match_user uuid, result_limit integer default 20)
returns table (id uuid, display_name text, role public.doc2postdoc_role, career_stage public.doc2postdoc_stage, research_area text, specialties text[], institution text, geography text, bio text, credibility_score numeric, verified_badges text[], match_score integer)
language sql stable security invoker set search_path = public as $$
  with seeker as (select * from public.doc2postdoc_profiles where id = match_user)
  select candidate.id, candidate.display_name, candidate.role, candidate.career_stage, candidate.research_area, candidate.specialties, candidate.institution, candidate.geography, candidate.bio, candidate.credibility_score, candidate.verified_badges,
    least(100, greatest(0, round(
      (case when candidate.research_area <> '' and candidate.research_area = seeker.research_area then 45 else 0 end) +
      (case when candidate.career_stage <> seeker.career_stage then 20 else 5 end) +
      (case when candidate.geography <> '' and candidate.geography = seeker.geography then 15 else 0 end) +
      (case when candidate.institution_type <> '' and candidate.institution_type = seeker.institution_type then 10 else 0 end) +
      least(10, candidate.credibility_score / 10)
    )::integer))::integer as match_score
  from public.doc2postdoc_profiles candidate, seeker
  where candidate.id <> seeker.id and candidate.is_mentor = true and candidate.mentor_available = true
  order by match_score desc, candidate.credibility_score desc, candidate.created_at asc
  limit result_limit;
$$;

alter table public.doc2postdoc_profiles enable row level security;
alter table public.doc2postdoc_connections enable row level security;
alter table public.doc2postdoc_posts enable row level security;
alter table public.doc2postdoc_conversations enable row level security;
alter table public.doc2postdoc_messages enable row level security;

create policy "profiles are visible to signed in members" on public.doc2postdoc_profiles for select to authenticated using (true);
create policy "members update their own profile" on public.doc2postdoc_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "members insert their own profile" on public.doc2postdoc_profiles for insert to authenticated with check (id = auth.uid());

create policy "members see their own connection requests" on public.doc2postdoc_connections for select to authenticated using (requester_id = auth.uid() or recipient_id = auth.uid());
create policy "members send connection requests" on public.doc2postdoc_connections for insert to authenticated with check (requester_id = auth.uid());
create policy "recipients update connection status" on public.doc2postdoc_connections for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "members read the community feed" on public.doc2postdoc_posts for select to authenticated using (true);
create policy "members create their own posts" on public.doc2postdoc_posts for insert to authenticated with check (author_id = auth.uid());
create policy "authors update their own posts" on public.doc2postdoc_posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "authors delete their own posts" on public.doc2postdoc_posts for delete to authenticated using (author_id = auth.uid());

create policy "matched members see conversations" on public.doc2postdoc_conversations for select to authenticated using (exists (select 1 from public.doc2postdoc_connections c where c.id = connection_id and c.status = 'accepted' and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())));
create policy "matched members create conversations" on public.doc2postdoc_conversations for insert to authenticated with check (exists (select 1 from public.doc2postdoc_connections c where c.id = connection_id and c.status = 'accepted' and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())));
create policy "matched members read messages" on public.doc2postdoc_messages for select to authenticated using (exists (select 1 from public.doc2postdoc_conversations v join public.doc2postdoc_connections c on c.id = v.connection_id where v.id = conversation_id and c.status = 'accepted' and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())));
create policy "matched members send messages" on public.doc2postdoc_messages for insert to authenticated with check (sender_id = auth.uid() and exists (select 1 from public.doc2postdoc_conversations v join public.doc2postdoc_connections c on c.id = v.connection_id where v.id = conversation_id and c.status = 'accepted' and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.find_doc2postdoc_matches(uuid, integer) to authenticated;
