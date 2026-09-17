drop function if exists public.find_doc2postdoc_matches(uuid, integer);

create or replace function public.find_doc2postdoc_matches(match_user uuid, result_limit integer default 20)
returns table (id uuid, display_name text, role public.doc2postdoc_role, career_stage public.doc2postdoc_stage, research_area text, specialties text[], institution text, geography text, bio text, credibility_score numeric, verified_badges text[], completed_mentorships integer, match_score integer)
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
  select ranked.id, ranked.display_name, ranked.role, ranked.career_stage, ranked.research_area, ranked.specialties, ranked.institution, ranked.geography, ranked.bio, ranked.credibility_score, ranked.verified_badges,
    coalesce(reputation.completed_mentorships, 0) as completed_mentorships, ranked.computed_score
  from ranked left join public.doc2postdoc_mentor_reputation reputation on reputation.profile_id = ranked.id
  order by ranked.computed_score desc, ranked.credibility_score desc, ranked.created_at asc limit greatest(1, least(result_limit, 50));
$$;

grant execute on function public.find_doc2postdoc_matches(uuid, integer) to authenticated;

drop policy if exists "reporters manage own disputes" on public.doc2postdoc_disputes;
drop policy if exists "reporters read own disputes" on public.doc2postdoc_disputes;
create policy "reporters create own disputes" on public.doc2postdoc_disputes for insert to authenticated with check (reporter_id = auth.uid());
create policy "reporters read own disputes" on public.doc2postdoc_disputes for select to authenticated using (reporter_id = auth.uid());

grant select, insert on public.doc2postdoc_disputes to authenticated;
