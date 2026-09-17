create unique index if not exists doc2postdoc_connections_pair_idx on public.doc2postdoc_connections (least(requester_id, recipient_id), greatest(requester_id, recipient_id));

drop policy if exists "recipients update connection status" on public.doc2postdoc_connections;
create policy "recipients update connection status" on public.doc2postdoc_connections for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
