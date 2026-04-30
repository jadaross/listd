# Listd

AI-powered listing generator for Vinted, Depop, and eBay. Upload photos of your clothes, get a photo critique, tag reading, market-priced listing, and a recommendation on which platform will sell it fastest — all in seconds.

## What it does

1. Upload photos of a clothing item (or multiple items in bulk mode)
2. AI scores each photo and flags missing shots (back view, care label, etc.)
3. AI reads visible tags — brand, size, fabric, RN number
4. A complete listing is generated: title, description, price range, attributes, and hashtags
5. Live market data is pulled from eBay, Vinted, and Depop to recommend the best platform and price
6. Copy and paste — or post directly to eBay if connected

## Features

- **Single & bulk mode** — list one item or detect and list multiple items from a mixed photo set
- **Photo coaching** — per-photo quality scores and specific suggestions before you waste time listing
- **Tag recognition** — reads brand, size, fabric, care instructions, and RN numbers from label photos
- **Three-platform output** — Vinted, Depop, and eBay, each with its own title format, hashtag conventions, and tone
- **Market intelligence** — fetches live comp prices across platforms via SerpAPI and recommends where to list and at what price
- **Direct eBay posting** — connect your eBay account via OAuth and publish drafts straight from the app
- **Currency selector** — GBP, USD, EUR
- **Tone selector** — Casual (Gen-Z Depop feel) or Professional (clean Vinted/eBay style)
- **Streaming responses** — listing fields render progressively as the model generates them
- **One-click copy** — every field has a copy button

## Running locally

```bash
npm install
cp .env.example .env.local
# Fill in the keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required environment variables

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API — listing generation, grouping, formatting |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase — stores eBay OAuth tokens |
| `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` / `EBAY_RU_NAME` / `EBAY_TOKEN_SECRET` / `EBAY_ENVIRONMENT` | eBay OAuth + direct posting |
| `SERPAPI_KEY` | Live price comps from eBay (free tier: 100 searches/month) |
| `NEXT_PUBLIC_APP_URL` | Used to build OAuth callback redirects |

Market intelligence and direct eBay posting are optional — without `SERPAPI_KEY` the market panel returns empty data, and without the eBay vars the connect button is disabled. The core listing flow only needs `ANTHROPIC_API_KEY`.

## Tech stack

- **Next.js 16** (App Router, Turbopack) — frontend and API routes
- **Anthropic Claude API** — `claude-sonnet-4-6` for listing generation and per-platform formatting, `claude-haiku-4-5` for bulk photo grouping and platform recommendation
- **Supabase** — auth + encrypted storage for eBay OAuth tokens
- **SerpAPI** — eBay price scraping for market comps
- **eBay Developer API** — OAuth + Sell API for direct draft creation
- **Tailwind CSS 4**
- **Vercel** — deployment

## Architecture

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full request flow and state machine. In brief:

- `POST /api/analyse` — streams photo analysis + tag extraction + listing JSON
- `POST /api/group` — groups photos by item for bulk mode
- `POST /api/format` — reformats a listing for a specific platform + tone
- `POST /api/market` — fetches comp prices and AI-generated platform recommendation
- `POST /api/ebay/list` — creates an eBay draft from a generated listing
- `/api/auth/ebay/*` — OAuth connect / callback / status / disconnect

## Roadmap

- **Saved history** — user accounts with listing history (Supabase scaffolding is already in place)
- **Vinted direct posting** — pending Vinted Pro API access
- **Depop direct posting** — pending Depop OAuth
- **Crosslisting** — one upload publishes to all connected platforms in parallel
- **iPhone app** — PWA first, then Expo/React Native for native barcode scanning
