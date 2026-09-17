alter table public.doc2postdoc_posts add column if not exists media_urls text[] not null default '{}';
create policy "members upload own post media" on storage.objects for insert to authenticated with check (bucket_id = 'doc2postdoc-avatars' and (storage.foldername(name))[1] = auth.uid()::text and (storage.foldername(name))[2] = 'posts');
