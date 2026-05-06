# Deploy to Vercel

## One-time setup
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

Or connect via GitHub:
1. Push to a GitHub repo
2. Go to vercel.com → Import repo
3. Framework = Next.js
4. Deploy

## Data refreshes
Data is currently in JSON files at `src/data/`. To refresh:
1. Export fresh data from PostgreSQL
2. Replace the JSON files
3. Redeploy

## Moving to Supabase (later)
1. Create free Supabase project
2. Import the JSON data
3. Update `src/lib/sheets.ts` to use Supabase client
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel env vars
5. Redeploy
