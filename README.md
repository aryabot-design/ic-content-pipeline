# Master Dashboard

A comprehensive project tracker and analytics dashboard for the K-10 Indonesian Mathematics curriculum project. Syncs data from a private Google Sheet and provides real-time visibility into 2000+ assets across 10 grades.

## Features

- **Overview Dashboard** – KPI cards, grade progress, asset type breakdown, QC funnel, vendor workload, phase comparison
- **Grade Explorer** – Drill from grade → chapter → module → assets with completion rings
- **Asset Tracker** – Hierarchical chapter/module view with EN/ID status tracking and filters
- **QC Pipeline** – SVG funnel visualization for English and Indonesian pipelines, plus Module Owner and Grade-wise breakdowns
- **Vendors** – Per-vendor workload cards with asset type breakdown
- **Google SSO Auth** – Sign in with the Google account that has access to the sheet
- **Auto token refresh** – Access tokens refresh automatically, session persists
- **Server-side caching** – 15-minute in-memory cache, no database required

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Recharts (charts)
- NextAuth v5 (Google OAuth)
- Google Sheets API (via `googleapis`)
- Deployed on Vercel

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable the **Google Sheets API**
3. Go to **APIs & Services > Credentials**
4. Create an **OAuth Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (and your production URL)
6. Copy the Client ID and Client Secret

### 3. Configure environment variables

Create `.env.local` with:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_SHEET_ID=your_sheet_id
AUTH_SECRET=your_random_secret
AUTH_URL=http://localhost:3000
```

Generate `AUTH_SECRET` with: `openssl rand -base64 32`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your Google account.

## Deploy to Vercel

1. Push the repo to GitHub
2. Import into Vercel
3. Add the same environment variables
4. Update `AUTH_URL` to your Vercel URL
5. Add the Vercel URL as an authorized redirect URI in Google Cloud Console

## Architecture

```
Google Sheet (private)
       │
       │  Google Sheets API (OAuth)
       ▼
Next.js API routes
       │
       │  In-memory cache (15 min TTL)
       ▼
React dashboard (client-side hooks)
```

No database needed – the Google Sheet is the source of truth. Data is cached server-side in-memory per deployment instance.
