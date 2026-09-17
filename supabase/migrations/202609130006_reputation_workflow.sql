create policy "participants record mentorship outcomes" on public.doc2postdoc_mentorship_outcomes for insert to authenticated with check (mentor_id = auth.uid() or mentee_id = auth.uid());
create policy "participants update mentorship outcomes" on public.doc2postdoc_mentorship_outcomes for update to authenticated using (mentor_id = auth.uid() or mentee_id = auth.uid()) with check (mentor_id = auth.uid() or mentee_id = auth.uid());

create or replace view public.doc2postdoc_mentor_reputation as
select mentor_id as profile_id, count(*) filter (where completed_at is not null)::integer as completed_mentorships, round(coalesce(avg(quality_score) filter (where completed_at is not null), 0), 2) as average_quality_score, max(completed_at) as last_completed_at
from public.doc2postdoc_mentorship_outcomes group by mentor_id;

grant select on public.doc2postdoc_mentor_reputation to authenticated;
