-- Doc2Postdoc 12-Pillar subject-matching taxonomy (Pillar -> Field -> Specialization).
-- Pillar/Field values are validated in the application layer against
-- lib/doc2postdoc/taxonomy.ts (a "representative set" per the source doc, expected to evolve),
-- so these are left as text rather than a Postgres enum to avoid a migration every time the
-- taxonomy is refined. Specialization (Level 3) is explicitly open/extensible per spec.

alter table public.doc2postdoc_profiles add column if not exists pillar text not null default '';
alter table public.doc2postdoc_profiles add column if not exists pillar_field text not null default '';
alter table public.doc2postdoc_profiles add column if not exists specialization text not null default '';
alter table public.doc2postdoc_profiles add column if not exists secondary_pillar text not null default '';

alter table public.doc2postdoc_signups add column if not exists pillar text not null default '';
alter table public.doc2postdoc_signups add column if not exists pillar_field text not null default '';
alter table public.doc2postdoc_signups add column if not exists specialization text not null default '';
alter table public.doc2postdoc_signups add column if not exists secondary_pillar text not null default '';

create index if not exists doc2postdoc_profiles_pillar_idx on public.doc2postdoc_profiles (pillar);

drop function if exists public.find_doc2postdoc_matches(uuid, integer);

create or replace function public.find_doc2postdoc_matches(match_user uuid, result_limit integer default 20)
returns table (id uuid, display_name text, role public.doc2postdoc_role, career_stage public.doc2postdoc_stage, research_area text, specialties text[], institution text, geography text, bio text, credibility_score numeric, verified_badges text[], completed_mentorships integer, pillar text, pillar_field text, match_score integer)
language sql stable security invoker set search_path = public as $$
  with seeker as (select * from public.doc2postdoc_profiles where id = match_user), ranked as (
    select candidate.*, least(100, round(
      (case
        when candidate.pillar <> '' and candidate.pillar = seeker.pillar then 35
        when lower(candidate.research_area) = lower(seeker.research_area) and candidate.research_area <> '' then 35
        else 0
      end) +
      (case when candidate.pillar <> '' and candidate.pillar = seeker.pillar and candidate.pillar_field <> '' and candidate.pillar_field = seeker.pillar_field then 10 else 0 end) +
      (case when candidate.specialties && seeker.specialties then 25 else 0 end) +
      (case when candidate.career_stage <> seeker.career_stage then 20 else 5 end) +
      (case when candidate.geography <> '' and lower(candidate.geography) = lower(seeker.geography) then 10 else 0 end) +
      least(10, candidate.credibility_score / 10)
    )::integer)::integer as computed_score
    from public.doc2postdoc_profiles candidate cross join seeker
    where candidate.id <> seeker.id and candidate.is_mentor = true and candidate.mentor_available = true
  )
  select ranked.id, ranked.display_name, ranked.role, ranked.career_stage, ranked.research_area, ranked.specialties, ranked.institution, ranked.geography, ranked.bio, ranked.credibility_score, ranked.verified_badges,
    coalesce(reputation.completed_mentorships, 0) as completed_mentorships, ranked.pillar, ranked.pillar_field, ranked.computed_score
  from ranked left join public.doc2postdoc_mentor_reputation reputation on reputation.profile_id = ranked.id
  order by ranked.computed_score desc, ranked.credibility_score desc, ranked.created_at asc limit greatest(1, least(result_limit, 50));
$$;

grant execute on function public.find_doc2postdoc_matches(uuid, integer) to authenticated;
