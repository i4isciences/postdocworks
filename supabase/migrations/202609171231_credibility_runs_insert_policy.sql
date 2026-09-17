-- score_my_doc2postdoc_credibility() runs `security invoker` and inserts a row into
-- doc2postdoc_credibility_runs on every scoring call, but the table only ever had a
-- select policy — every real call to the scorer has been failing with a 42501 RLS
-- violation. This was caught by live end-to-end testing, not a hypothetical gap.
create policy "members record their own credibility runs" on public.doc2postdoc_credibility_runs for insert to authenticated with check (profile_id = auth.uid());

grant insert on public.doc2postdoc_credibility_runs to authenticated;
