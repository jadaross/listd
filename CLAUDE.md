# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build + type-check
npm run lint     # ESLint
```

No test suite exists yet. Type-checking is done via `npm run build` (Next.js runs `tsc` as part of the build).

## Environment

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` (and `SERPAPI_KEY` for market data) before running locally.

## Architecture

Mobile-first Next.js 15 app (App Router). The web UI mirrors the native iOS app in `ios/` — both render the same screens and call the same API. No database; client-local state for the MVP.

### Screen flow

`src/app/page.tsx` is a thin screen-router driven by an `AppState` mirroring `ios/Wattle/WattleApp.swift`:

```
home → confirm → generating → results → recommendation
                              tab bar also exposes: history, settings
```

State at the top: `screen`, `photos`, `result` (`AnalysisResult`), `marketInsights`, `formattedListings`, `activePlatform`, `chips`, `edits`, `addedPhotos`, `regenerating`, `editingField`.

### API routes

All routes call the Anthropic SDK (`@anthropic-ai/sdk`); SerpAPI is used for live market data.

| Route | Runtime | Purpose |
|---|---|---|
| `POST /api/analyse` | edge | Photos → `AnalysisResult` (photo analysis + tag OCR + neutral listing). Streams SSE. |
| `POST /api/format`  | edge | Neutral `Listing` + platform + tone → `PlatformListing` (per-platform title/desc/tags). |
| `POST /api/refine`  | edge | Existing `PlatformListing` + chip instructions → rewritten `PlatformListing`. |
| `POST /api/market`  | nodejs | SerpAPI lookup + Claude synthesises per-platform reasoning + winner. |
| `POST /api/ebay/list` | nodejs | Posts a listing to eBay via the user's OAuth token. |
| `GET/POST /api/auth/ebay/*` | nodejs | eBay OAuth flow. |

### Key files

| Path | Role |
|---|---|
| `src/lib/types.ts` | All shared TypeScript types |
| `src/lib/prompts.ts` | `buildPrompt`, `buildNeutralPrompt`, `buildFormatPrompt`, `buildRefinePrompt` — every prompt lives here |
| `src/app/page.tsx` | App state machine + screen router |
| `src/components/screens/*` | One file per screen; each is a port of `ios/Wattle/Screens/*.swift` |
| `src/components/ui/*` | Shared primitives (`PhotoTile`, `FieldRow`, `FeedbackChips`, `BoostAccuracy`, etc.) |
| `src/components/layout/*` | `RootShell`, `NavHeader`, `TabBar` |
| `ios/` | Native SwiftUI app — must stay in sync with the web on flows and copy |

### Prompt design

`buildPrompt` returns a **single JSON object** covering three concerns in one pass: photo quality scoring, tag/label OCR (`tag_data`), and the full listing. Description length is platform-conditional. `buildRefinePrompt` accepts a `PlatformListing` + list of natural-language refinements (one per chip the user tapped) and returns just the `PlatformListing`. The chip vocabulary is shared with iOS — see `FeedbackChip` in `ios/Wattle/Models.swift`.

### Theme

Warm direction matches the iOS prototype: `--bg #f6f2eb`, `--card #fff`, `--text #1c1a16`, `--muted #86807a`, `--subtle #efebe3`, `--accent #3b5cff`. Fonts: **Instrument Serif** for the `wattle.` wordmark + expressive headlines, **Geist** for everything else (loaded via `next/font/google`).
