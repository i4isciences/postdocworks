-- Doc2Postdoc signup is being split into two real steps:
--   1. A lightweight, role-specific signup (name/email/password/career stage/pillar/field,
--      plus a mentor-availability toggle for postdocs) that creates the auth user and sends a
--      verification email.
--   2. The full match-profile form, which only renders once the member has verified their
--      email AND logged in -- gated by profile_completed_at below.
-- See app/doc2postdoc/Doc2PostdocSignupForm.tsx and the (now post-login) Doc2PostdocProfileForm.tsx.

alter table public.doc2postdoc_signups add column if not exists mentor_available boolean not null default false;

alter table public.doc2postdoc_profiles add column if not exists profile_completed_at timestamptz;
