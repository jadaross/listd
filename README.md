# wattle

wattle values a secondhand item from photographs and tells you what to write,
where to post it, and what to ask for it.

It is **an iOS app with a headless backend**. There is no web UI — the Next.js
app exists purely for its API routes and its deployment story on Vercel. See
[ADR-0002](./docs/adr/0002-headless-nextjs-api-on-vercel.md).

`CONTEXT.md` holds the domain vocabulary; `docs/adr/` holds the decisions.

## What it does

1. You photograph an item.
2. Each photo is scored, missing shots are flagged, and any visible tag is read
   — brand, size, fabric, care instructions.
3. A **Neutral Listing** is written: the platform-agnostic description
   everything else is generated from.
4. Each **Enabled Platform** is valued against currently-listed comparables,
   producing a **Price Band** and a confidence in it.
5. The platform most likely to sell it for the most is **recommended**, and the
   listing is rewritten in that platform's voice, ready to copy.

wattle writes for Vinted, Depop and eBay. It does not post to them —
[ADR-0003](./docs/adr/0003-ebay-oauth-and-publishing-removed.md) removed
publishing, and asking prices come from live comparables rather than sold data
([ADR-0005](./docs/adr/0005-asking-price-valuation.md)).

## Running locally

```bash
npm install
cp .env.example .env.local   # or: vercel env pull .env.local
npm run dev
```

There is nothing to open in a browser. See [`SETUP.md`](./SETUP.md) for the
environment, the Supabase schema, and how to call a route by hand.

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Every model call — analysis, valuation, formatting |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Identity: verifying the caller's bearer token |
| `SUPABASE_SERVICE_ROLE_KEY` | The Allowance meter. Server-side only — never ship it to the app |

## API

Every route requires a Supabase bearer token. There are no anonymous requests:
usage is metered from the first release, and the meter needs someone to meter
([ADR-0007](./docs/adr/0007-metered-from-day-one.md)).

| Route | Purpose |
|---|---|
| `POST /api/analyse` | Photos → photo scores, tag data, and a Neutral Listing. Streams. |
| `POST /api/valuate` | An item → a Price Band per Enabled Platform, plus a Recommendation. Spends one Allowance unit. |
| `POST /api/format` | Neutral Listing + platform + tone → a Platform-formatted Listing |
| `POST /api/refine` | A Platform-formatted Listing + Refinement Chips → a rewritten one |
| `GET` / `PATCH /api/profile` | The caller's Enabled Platforms and Allowance |

## Tech stack

- **Next.js 16** (App Router, Turbopack) — API routes only, Node runtime
- **Anthropic Claude API** — Sonnet 5 for analysis and valuation, Haiku 4.5 for
  formatting and refinement
- **Supabase** — identity, Enabled Platforms, and the Allowance meter
- **Vercel** — deployment
- **Vitest** — `npm test`

## Where it is

The backend is done. Identity, metering and the Valuation are live and covered
by tests.

What remains is the client: there is no Xcode project in the repo yet. The
SwiftUI files under `ios/` are a **visual reference only** — mock-driven, no
networking ([ADR-0001](./docs/adr/0001-ios-only-web-ui-removed.md)). The real
app gets built beside them.

Scout Mode — *"I'm in a shop, is this worth buying?"* — is deliberately v2.
