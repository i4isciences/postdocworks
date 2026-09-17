# Doc2Postdoc database

Supabase is the only database, auth provider, and persistence layer for Doc2Postdoc. Apply the migration to the hosted project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
npm run db:push
```

Never use `SUPABASE_SECRET_KEY` in browser code. Server routes use the publishable key and the authenticated user session so Row Level Security remains active.