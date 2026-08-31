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

Warm direction, carried over to iOS: `--bg #f6f2eb`, `--card #fff`, `--text #1c1a16`,
`--muted #86807a`, `--subtle #efebe3`, `--accent #3b5cff`. Fonts: **Instrument Serif**
for the `bower.` wordmark and expressive headlines, **Geist** for everything else.

## Wayfinding operations

The tracker is **GitHub Issues on `jadaross/bower`**. Both native sub-issues and
native issue dependencies are enabled, so the frontier renders in GitHub's own UI.

| Concept | How it is expressed |
|---|---|
| The map | One issue labelled `wayfinder:map` |
| A ticket | A **sub-issue** of the map, labelled `wayfinder:grilling` / `:prototype` / `:research` / `:task` |
| Claiming | Assign to `jadaross` — an open, unassigned ticket is unclaimed |
| Blocking | Native issue dependencies, not body text |
| The frontier | Open sub-issues of the map that are unassigned and have no open blocker |

Both dependency APIs take a **numeric issue id, not the issue number**, and it must
be sent with `-F` (typed) rather than `-f` (string) — between them, the two
single easiest thing to get wrong here.

```bash
# id for a given issue number
gh api repos/jadaross/bower/issues/<number> --jq .id

# attach a ticket to the map
gh api -X POST repos/jadaross/bower/issues/<map>/sub_issues -F sub_issue_id=<id>

# B is blocked by A
gh api -X POST repos/jadaross/bower/issues/<B>/dependencies/blocked_by -F issue_id=<id-of-A>

# the frontier
gh issue list --label wayfinder:grilling --label wayfinder:research \
              --label wayfinder:prototype --label wayfinder:task \
              --state open --search "no:assignee"
```

Implementation issues (`ready-for-agent`, `ready-for-human`) are a **separate
population** from decision tickets. A wayfinder ticket asks a question; an
implementation issue builds a thing. Do not mix the labels on one issue.
