# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

bower values a secondhand item from photographs and tells the user what to write,
where to post it, and what to ask for it.

It is **an iOS app with a headless backend**. There is no web UI — the Next.js app
exists purely for its API routes and its deployment story on Vercel. If you open this
repo expecting pages, see `docs/adr/0002-headless-nextjs-api-on-vercel.md`.

Read `CONTEXT.md` for the domain vocabulary, `ARCHITECTURE.md` for the call flow and
what each model call costs, and `docs/adr/` for why things are the way they are before
making architectural changes.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build + type-check
npm run lint     # ESLint (flat config, eslint.config.mjs)
```

No test suite exists yet. Type-checking is done via `npm run build`.

## Environment

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` plus the three
Supabase values (or run `vercel env pull .env.local`). See `SETUP.md`.

## Architecture

### API routes

Every route runs on the Node runtime and requires a Supabase bearer token —
there are no anonymous requests, because the meter needs someone to meter
(ADR-0007). Wrap handlers in `withAuth` from `src/lib/auth.ts`.

| Route | Purpose |
|---|---|
| `POST /api/analyse` | Photos → `AnalysisResult` (photo quality scoring + tag OCR + Neutral Listing). Streams SSE. |
| `POST /api/format`  | Neutral `Listing` + platform + tone → `PlatformListing`. |
| `POST /api/refine`  | Existing `PlatformListing` + chip instructions → rewritten `PlatformListing`. |
| `POST /api/valuate` | `ValuationItem` → a Price Band per Enabled Platform, plus a Recommendation. Spends one Allowance unit. |
| `GET`/`PATCH /api/profile` | The caller's Enabled Platforms and Allowance. |

`/api/valuate` reads the Enabled Platforms from the caller's profile — never
from the request body. A client that could name its own platforms could ask for
work it had not enabled.

### Key files

| Path | Role |
|---|---|
| `src/lib/types.ts` | All shared TypeScript types |
| `src/lib/llm/*` | One module per Anthropic call — owns its prompt, SDK invocation, and parsing |
| `src/lib/chip-vocab.ts` | Refinement Chip vocabulary, shared with iOS (`ios/Bower/Models.swift`) |
| `src/platforms/*` | Per-platform knowledge: `metadata.ts` (name, fees, colour) and `listing-spec.ts` (prompt fragment, field schema, validation) |
| `src/lib/auth.ts` | Bearer-token verification and the `withAuth` route wrapper |
| `src/lib/supabase.ts` | The three Supabase clients — anon, per-user (RLS applies), service role (RLS bypassed) |
| `src/lib/allowance.ts` | The Allowance meter. Counting itself lives in SQL, not here |
| `src/lib/profile.ts` | Enabled Platforms, read and written as the caller |
| `supabase/migrations/*` | The schema, and the source of truth for it — never edit in the dashboard |
| `ios/` | SwiftUI files — a **visual reference only**. Entirely mock-driven, no networking. See ADR-0001. |

### Not built yet

The backend is complete for v1: identity, metering and the Valuation all exist
and are covered by tests. What remains is the client.

1. **The Xcode project** — there is no `.xcodeproj` in the repo at all (#11)
2. **Sign in with Apple** — needs Apple Developer portal configuration (#15)
3. **The screens** — photograph an Item, valuation, format and copy (#12, #13, #14, #16)

Build the real app *beside* `ios/`, not on top of it: those files are mock-driven
with a single-god-object state model that will not survive real async work.

### Prompt design

`analyse` returns a **single JSON object** covering three concerns in one pass: photo
quality scoring, tag/label OCR (`tag_data`), and the Neutral Listing. `refine` accepts a
`PlatformListing` plus a list of natural-language refinements (one per chip the user
tapped) and returns just the `PlatformListing`.

Format **only the platform being shown** — never fan out across all three. See ADR-0004.

## Theme

Carried over from the Claude Design prototype (`Bower iOS Prototype.html`).

**Light** — bg `#FBF7EF`, card `#FFFDF8`, subtle `#F1EADC`, line `#E5DECE`, text `#1B1A20`, muted `#86807A`.
**Dark** — bg `#131521`, card `#1C1F30`, subtle `#232739`, line `#2E3348`, text `#F2EEE6`, muted `#8D93A8`.

The accent palette is shared by both themes:

| Name | Hex | Carries |
|---|---|---|
| satin | `#2B3AA8` | The primary — buttons, links, selection |
| sheen | `#7BA9E8` | Progress and fills on dark grounds |
| shell | `#DCE3F0` | Pale blue ground |
| coral | `#E1563C` | The wordmark's full stop, errors, the "guess" marker |
| pollen | `#E8B547` | The dot in the mark, warnings, the allowance ceiling |
| moss | `#3F6B4A` | Confirmed, copied, evidence ticks |
| avenue | `#171A2E` | Full-bleed dark screens — analysing, failure |

Fonts: **Instrument Serif**, *italic*, for the wordmark and expressive headlines;
**Geist** for UI; **Geist Mono** for kickers, counters and numerics.

The mark is **the arch** — a bower, drawn as a stroked arch with a pollen dot at its
centre. The wordmark is `bower` in italic serif with a coral full stop. The accent
moved from `#3b5cff` to the deeper `#2B3AA8`, so the bowerbird-prizes-blue reasoning
behind the name still holds.

Two things the app says in its own voice, and should keep saying: copy confirmations
read **"In the bower"**, and the analyse action is **"Have a squiz"**.
