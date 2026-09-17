-- Local-only fixtures for Doc2Postdoc. Password for both users: Doc2PostdocTest123!
create extension if not exists pgcrypto;

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'student@test.doc2postdoc.local', crypt('Doc2PostdocTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Jordan Mitchell"}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mentor@test.doc2postdoc.local', crypt('Doc2PostdocTest123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Amira Rahman"}', now(), now())
on conflict (id) do nothing;

insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"sub":"00000000-0000-0000-0000-000000000001","email":"student@test.doc2postdoc.local"}', 'email', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '{"sub":"00000000-0000-0000-0000-000000000002","email":"mentor@test.doc2postdoc.local"}', 'email', now(), now())
on conflict (provider_id, provider) do nothing;

update public.doc2postdoc_profiles set display_name = 'Jordan Mitchell', role = 'phd_student', career_stage = 'phd_finishing', research_area = 'Cell Biology', specialties = '{CRISPR,Genomics}', institution = 'University of Chicago', institution_type = 'research_university', geography = 'Chicago, IL', bio = 'PhD candidate researching cell biology and preparing for the postdoc transition.' where id = '00000000-0000-0000-0000-000000000001';
update public.doc2postdoc_profiles set display_name = 'Amira Rahman', role = 'postdoc', career_stage = 'industry_transition', research_area = 'Cell Biology', specialties = '{CRISPR,Genomics,Drug Discovery}', institution = 'Broad Institute', institution_type = 'research_institute', geography = 'Cambridge, MA', bio = 'Postdoctoral researcher who moved from genomics into translational biotech.', is_mentor = true, mentor_available = true, credibility_score = 91, credibility_profile = '{"publications": 28, "endorsements": 3, "verified": true}', verified_badges = '{publication_verified,pi_endorsed}' where id = '00000000-0000-0000-0000-000000000002';

insert into public.doc2postdoc_posts (author_id, body, tags)
values ('00000000-0000-0000-0000-000000000002', 'The most useful part of my transition was learning to describe the problems I solve, not just the techniques I use.', '{career_transition,industry}')
on conflict do nothing;
