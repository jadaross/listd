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

Copy `.env.example` to `.env.local` and set `ANTHROPIC_API_KEY` before running locally.

## Architecture

Single-page Next.js 15 app (App Router). No database, no auth, no server-side state — everything is client-local for the MVP.

### Request flow

1. User uploads photos in `PhotoUploader` → images are compressed client-side to max 1024px JPEG via Canvas API (`Photo.compressed` = base64 string)
2. `page.tsx` drives a state machine (`AppStep`) that progresses through: `mode-select → upload → [grouping → group-review →] loading → results / bulk-results`
3. API routes (both `export const runtime = "edge"`) call the Anthropic SDK:
   - `POST /api/analyse` — sends images + platform + tone to **claude-sonnet-4-6**, returns `AnalysisResult` (photo analysis + tag extraction + full listing JSON in one call)
   - `POST /api/group` — sends images to **claude-haiku-4-5-20251001**, returns `GroupResult` (groups photos by clothing item by index). Falls back to one group on any failure or invalid response.

### Key files

| Path | Role |
|---|---|
| `src/lib/types.ts` | All shared TypeScript types |
| `src/lib/prompts.ts` | `buildPrompt()` (listing generation) and `buildGroupPrompt()` (item grouping) — the entire prompt lives here |
| `src/app/page.tsx` | Full app state machine — all app state lives here, no external state library |
| `src/app/api/analyse/route.ts` | Edge route: photo analysis → listing |
| `src/app/api/group/route.ts` | Edge route: photo grouping for bulk mode |

### Prompt design

`buildPrompt()` in `prompts.ts` asks Claude to return a **single JSON object** covering three concerns in one pass: photo quality scoring, tag/label OCR (`tag_data`), and the full listing. The JSON schema is embedded in the prompt string. Description length is platform-conditional (Depop: max 60 words; Vinted: max 80 words).

### Bulk mode

Bulk mode groups photos across multiple items before generating listings. `page.tsx` calls `/api/group` first (haiku, cheap), user reviews detected groups in `BulkGroupReview`, then `generateBulk()` fires `Promise.all`-style parallel calls to `/api/analyse` — one per group — updating `BulkItem[]` via functional `setState` as each resolves (progressive rendering in `BulkResults`).

### `ListingOutput` in bulk vs single context

`onRegenerate`, `onPlatformChange`, and `onToneChange` are all optional props. The controls bar (platform/tone switcher + Regenerate button) only renders when `onRegenerate` is provided — it is omitted in bulk mode.
