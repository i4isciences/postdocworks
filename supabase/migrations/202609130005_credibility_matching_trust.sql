alter table public.doc2postdoc_profiles add column if not exists credibility_scored_at timestamptz;

create table public.doc2postdoc_credibility_inputs (
  profile_id uuid primary key references public.doc2postdoc_profiles(id) on delete cascade,
  academic_record_score numeric(5,2) not null default 0 check (academic_record_score between 0 and 100),
  publications_count integer not null default 0 check (publications_count >= 0),
  citation_count integer not null default 0 check (citation_count >= 0),
  publication_impact_score numeric(5,2) not null default 0 check (publication_impact_score between 0 and 100),
  endorsement_count integer not null default 0 check (endorsement_count >= 0),
  endorsement_score numeric(5,2) not null default 0 check (endorsement_score between 0 and 100),
  trajectory_score numeric(5,2) not null default 0 check (trajectory_score between 0 and 100),
  platform_activity_score numeric(5,2) not null default 0 check (platform_activity_score between 0 and 100),
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.doc2postdoc_credibility_runs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  model_version text not null,
  weights jsonb not null,
  components jsonb not null,
  total_score numeric(5,2) not null check (total_score between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.doc2postdoc_mentorship_outcomes (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.doc2postdoc_connections(id) on delete cascade,
  mentor_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  mentee_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  completed_at timestamptz,
  quality_score numeric(5,2) check (quality_score between 0 and 100),
  outcome text,
  created_at timestamptz not null default now(),
  check (mentor_id <> mentee_id)
);

create table public.doc2postdoc_private_assets (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.doc2postdoc_conversations(id) on delete cascade,
  owner_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  storage_path text not null,
  content_hash text,
  created_at timestamptz not null default now()
);

create table public.doc2postdoc_disputes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.doc2postdoc_conversations(id) on delete set null,
  reporter_id uuid not null references public.doc2postdoc_profiles(id) on delete cascade,
  category text not null check (category in ('content', 'conduct', 'ip', 'privacy')),
  description text not null check (char_length(description) between 20 and 5000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index doc2postdoc_credibility_runs_profile_idx on public.doc2postdoc_credibility_runs(profile_id, created_at desc);
create index doc2postdoc_outcomes_mentor_idx on public.doc2postdoc_mentorship_outcomes(mentor_id, completed_at desc);

alter table public.doc2postdoc_credibility_inputs enable row level security;
alter table public.doc2postdoc_credibility_runs enable row level security;
alter table public.doc2postdoc_mentorship_outcomes enable row level security;
alter table public.doc2postdoc_private_assets enable row level security;
alter table public.doc2postdoc_disputes enable row level security;

create policy "members read own credibility inputs" on public.doc2postdoc_credibility_inputs for select to authenticated using (profile_id = auth.uid());
create policy "members update own credibility inputs" on public.doc2postdoc_credibility_inputs for all to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "members read own credibility runs" on public.doc2postdoc_credibility_runs for select to authenticated using (profile_id = auth.uid());
create policy "participants read mentorship outcomes" on public.doc2postdoc_mentorship_outcomes for select to authenticated using (mentor_id = auth.uid() or mentee_id = auth.uid());
create policy "matched participants manage owned assets" on public.doc2postdoc_private_assets for all to authenticated using (owner_id = auth.uid() and exists (select 1 from public.doc2postdoc_conversations v join public.doc2postdoc_connections c on c.id = v.connection_id where v.id = conversation_id and c.status = 'accepted' and (c.requester_id = auth.uid() or c.recipient_id = auth.uid()))) with check (owner_id = auth.uid() and exists (select 1 from public.doc2postdoc_conversations v join public.doc2postdoc_connections c on c.id = v.connection_id where v.id = conversation_id and c.status = 'accepted' and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())));
create policy "reporters manage own disputes" on public.doc2postdoc_disputes for insert to authenticated with check (reporter_id = auth.uid());
create policy "reporters read own disputes" on public.doc2postdoc_disputes for select to authenticated using (reporter_id = auth.uid());

create or replace function public.score_my_doc2postdoc_credibility()
returns table (score numeric, components jsonb, weights jsonb, model_version text)
language plpgsql security invoker set search_path = public as $$
declare
  input public.doc2postdoc_credibility_inputs;
  academic numeric; publications numeric; endorsements numeric; trajectory numeric; platform numeric; total numeric;
  weight_data jsonb := '{"academic_record":25,"publication_impact":30,"endorsements":20,"trajectory":15,"platform_activity":10}'::jsonb;
  component_data jsonb;
begin
  select * into input from public.doc2postdoc_credibility_inputs where profile_id = auth.uid();
  if not found then insert into public.doc2postdoc_credibility_inputs(profile_id) values (auth.uid()) returning * into input; end if;
  academic := input.academic_record_score;
  publications := greatest(input.publication_impact_score, least(100, input.publications_count * 2 + least(40, input.citation_count / 5)));
  endorsements := greatest(input.endorsement_score, least(100, input.endorsement_count * 20));
  trajectory := input.trajectory_score;
  platform := input.platform_activity_score;
  total := round((academic * .25) + (publications * .30) + (endorsements * .20) + (trajectory * .15) + (platform * .10), 2);
  component_data := jsonb_build_object('academic_record', academic, 'publication_impact', publications, 'endorsements', endorsements, 'trajectory', trajectory, 'platform_activity', platform);
  update public.doc2postdoc_profiles set credibility_score = total, credibility_profile = jsonb_build_object('model_version', 'doc2postdoc-credibility-v1', 'weights', weight_data, 'components', component_data), credibility_scored_at = now() where id = auth.uid();
  insert into public.doc2postdoc_credibility_runs(profile_id, model_version, weights, components, total_score) values (auth.uid(), 'doc2postdoc-credibility-v1', weight_data, component_data, total);
  return query select total, component_data, weight_data, 'doc2postdoc-credibility-v1'::text;
end;
$$;

grant execute on function public.score_my_doc2postdoc_credibility() to authenticated;

create or replace function public.find_doc2postdoc_matches(match_user uuid, result_limit integer default 20)
returns table (id uuid, display_name text, role public.doc2postdoc_role, career_stage public.doc2postdoc_stage, research_area text, specialties text[], institution text, geography text, bio text, credibility_score numeric, verified_badges text[], match_score integer)
language sql stable security invoker set search_path = public as $$
  with seeker as (select * from public.doc2postdoc_profiles where id = match_user), ranked as (
    select candidate.*, least(100, round(
      (case when lower(candidate.research_area) = lower(seeker.research_area) and candidate.research_area <> '' then 35 else 0 end) +
      (case when candidate.specialties && seeker.specialties then 25 else 0 end) +
      (case when candidate.career_stage <> seeker.career_stage then 20 else 5 end) +
      (case when candidate.geography <> '' and lower(candidate.geography) = lower(seeker.geography) then 10 else 0 end) +
      least(10, candidate.credibility_score / 10)
    )::integer)::integer as computed_score
    from public.doc2postdoc_profiles candidate cross join seeker
    where candidate.id <> seeker.id and candidate.is_mentor = true and candidate.mentor_available = true
  )
  select ranked.id, ranked.display_name, ranked.role, ranked.career_stage, ranked.research_area, ranked.specialties, ranked.institution, ranked.geography, ranked.bio, ranked.credibility_score, ranked.verified_badges, ranked.computed_score
  from ranked order by ranked.computed_score desc, ranked.credibility_score desc, ranked.created_at asc limit greatest(1, least(result_limit, 50));
$$;
