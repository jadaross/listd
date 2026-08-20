# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

wattle values a secondhand item from photographs and tells the user what to write,
where to post it, and what to ask for it.

It is **an iOS app with a headless backend**. There is no web UI — the Next.js app
exists purely for its API routes and its deployment story on Vercel. If you open this
repo expecting pages, see `docs/adr/0002-headless-nextjs-api-on-vercel.md`.

Read `CONTEXT.md` for the domain vocabulary and `docs/adr/` for why things are the way
they are before making architectural changes.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build + type-check
npm run lint     # BROKEN — `next lint` was removed in Next 16, and .eslintrc.json
                 # predates ESLint 9 flat config. Needs eslint.config.js.
```

No test suite exists yet. Type-checking is done via `npm run build`.

## Environment

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY`.

## Architecture

### API routes

All routes call the Anthropic SDK (`@anthropic-ai/sdk`).

| Route | Runtime | Purpose |
|---|---|---|
| `POST /api/analyse` | edge | Photos → `AnalysisResult` (photo quality scoring + tag OCR + Neutral Listing). Streams SSE. |
| `POST /api/format`  | edge | Neutral `Listing` + platform + tone → `PlatformListing`. |
| `POST /api/refine`  | edge | Existing `PlatformListing` + chip instructions → rewritten `PlatformListing`. |

### Key files

| Path | Role |
|---|---|
| `src/lib/types.ts` | All shared TypeScript types |
| `src/lib/llm/*` | One module per Anthropic call — owns its prompt, SDK invocation, and parsing |
| `src/lib/chip-vocab.ts` | Refinement Chip vocabulary, shared with iOS (`ios/Wattle/Models.swift`) |
| `src/platforms/*` | Per-platform knowledge: `metadata.ts` (name, fees, colour) and `listing-spec.ts` (prompt fragment, field schema, validation) |
| `ios/` | SwiftUI files — a **visual reference only**. Entirely mock-driven, no networking. See ADR-0001. |

### Not built yet

The next things to build, in rough order:

1. **Auth + the usage meter** — Supabase, Sign in with Apple + email (ADR-0006, ADR-0007)
2. **The Valuation service** — asking-price bands per enabled platform (ADR-0004, ADR-0005)
3. **The iOS app itself** — a real client, written next to `ios/` rather than on top of it

### Prompt design

`analyse` returns a **single JSON object** covering three concerns in one pass: photo
quality scoring, tag/label OCR (`tag_data`), and the Neutral Listing. `refine` accepts a
`PlatformListing` plus a list of natural-language refinements (one per chip the user
tapped) and returns just the `PlatformListing`.

Format **only the platform being shown** — never fan out across all three. See ADR-0004.

## Theme

Warm direction, carried over to iOS: `--bg #f6f2eb`, `--card #fff`, `--text #1c1a16`,
`--muted #86807a`, `--subtle #efebe3`, `--accent #3b5cff`. Fonts: **Instrument Serif**
for the `wattle.` wordmark and expressive headlines, **Geist** for everything else.
