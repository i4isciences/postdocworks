alter table public.credential_applications add column if not exists terms_accepted_at timestamptz;
alter table public.registrations add column if not exists terms_accepted_at timestamptz;
alter table public.doc2postdoc_signups add column if not exists terms_accepted_at timestamptz;
