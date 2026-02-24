# Listd

AI-powered listing generator for Vinted and Depop. Upload photos of your clothes, get a photo critique, tag reading, and a ready-to-paste listing in seconds.

## What it does

1. Upload photos of a clothing item (or multiple items in bulk mode)
2. AI scores each photo and flags missing shots (back view, care label, etc.)
3. AI reads any visible tags — brand, size, fabric, RN number
4. A complete listing is generated: title, description, price range, attributes, and hashtags
5. Copy and paste into Vinted or Depop

## Features

- **Single & bulk mode** — list one item or detect and list multiple items from a mixed photo set
- **Photo coaching** — per-photo quality scores and specific suggestions before you waste time listing
- **Tag recognition** — reads brand, size, fabric, care instructions, and RN numbers from label photos
- **Platform-aware output** — Vinted and Depop have different title formats, hashtag conventions, and tones
- **Tone selector** — Casual (Gen-Z Depop feel) or Professional (clean Vinted style)
- **One-click copy** — every field has a copy button

## Running locally

```bash
npm install
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech stack

- **Next.js 15** (App Router) — frontend and API routes
- **Anthropic Claude API** — `claude-sonnet-4-6` for listing generation, `claude-haiku-4-5-20251001` for bulk photo grouping
- **Tailwind CSS 4**
- **Vercel** — deployment

## Roadmap

- **v2** — user accounts, saved listing history, Depop OAuth (direct posting)
- **v3** — live price comparison from real Vinted/Depop listings
- **v4** — Vinted direct posting (requires Vinted Pro API access)
- **v5** — crosslisting: one upload → both platforms simultaneously
- **v6** — iPhone app (PWA first, then Expo/React Native for native barcode scanning)
