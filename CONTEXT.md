# CONTEXT — wattle domain glossary

Definitions of the load-bearing nouns in this codebase. Use this vocabulary in code, prompts, and conversation. If a new concept earns its name during a refactor, add it here.

## Photo

A single image the user has selected. Has a `previewUrl` (object URL for the browser) and a `compressed` base64 JPEG (max 1024px, sent to the model). Defined in `src/lib/types.ts`.

## Neutral Listing

The platform-agnostic representation of an item — brand, type, colour, condition, size, material, title, description, hashtags, price range, gender, category, subcategory. Output of `/api/analyse`. The single source of truth that platform formatters work from. Type: `Listing` in `src/lib/types.ts`.

## Platform-formatted Listing

A Neutral Listing rewritten for one specific platform (Vinted / Depop / eBay) — different title length conventions, hashtag conventions, descriptive style. Plus a `fields` array of dropdown values (Vinted's "Parcel size", eBay's "Department", etc.). Output of `/api/format` and `/api/refine`. Type: `PlatformListing` in `src/lib/types.ts`.

## Market Intelligence

The Anthropic synthesis of live market data into a recommendation. Picks a winning platform, sets a recommended price, estimates sell likelihood, and gives per-platform upside / trade-off / sell time / views. Type: `MarketIntelligence` in `src/lib/types.ts`. Produced by `/api/market`.

## Refinement Chip

A natural-language instruction the user can toggle on the active Platform-formatted Listing — "shorter", "+ measurements", "stress condition", etc. Each chip has a fixed `instruction` string sent to `/api/refine`. Chip vocabulary is shared with iOS (`chip-vocab.ts` ↔ `Models.swift`). Defined in `src/lib/chip-vocab.ts`.

## Platform

A target resale destination — currently `"vinted" | "depop" | "ebay"`. The Platform module (`src/platforms/`) groups all knowledge about a platform into sliced capabilities. The string is the key; the slices are the implementation.

### Platform slices

Each platform lives in `src/platforms/<id>/` with the following files:

- **`metadata.ts`** — `PlatformMetadata`: display name, audience tagline, fee label + percentage, brand colour, app/web URLs. Pure data. Used by every UI surface.
- **`listing-spec.ts`** — `PlatformListingSpec`: the platform's `promptFragment` (formatting rules dropped into LLM prompts), `fieldsSchema` (dropdown enumeration shipped to the model in `/api/format`), `relevantChips` (which Refinement Chips this platform respects), and a `validate(listing)` function returning required-field errors. Pure, edge-safe.
- **`market.ts`** — `PlatformMarket.fetchPrices(query)`: returns active-listing price data (median / min / max / count) for the item. eBay uses SerpAPI's eBay engine; Vinted and Depop share a Google-`site:` fetcher in `src/platforms/shared/google-site-prices.ts`. Node-runtime.
- **`publish.ts`** _(eBay only)_ — `PlatformPublish.publishListing(...)`: posts a listing via the platform's write API. Asymmetric capability — Vinted and Depop have no public write API today. Node-runtime, imported only by `/api/ebay/list`.
- **`auth.ts`** _(eBay only)_ — OAuth flow, token encryption (AES-256-GCM with `EBAY_TOKEN_SECRET`), refresh logic, and per-user token retrieval from Supabase. Node-runtime.

### Registry

`src/platforms/registry.ts` exports `platformMetadata`, `platformListingSpec`, `platformMarket` as `Record<Platform, …>`. Callers that iterate (e.g. `/api/market` fetching prices for all platforms) consume the registry; callers that need one platform reach for the slice directly.

### Edge vs Node split

- Edge routes (`/api/analyse`, `/api/format`, `/api/refine`) may only import `metadata` and `listing-spec` slices. These have no Node-only dependencies.
- Node routes (`/api/market`, `/api/ebay/*`, `/api/auth/ebay/*`) may import any slice.
- `publish.ts` and `auth.ts` (eBay) pull in `crypto`, Supabase, and category data — never import these from an edge route.

## Listing Pipeline _(forward-looking — Phase 3)_

The end-to-end flow `page.tsx` orchestrates: Photo selection → Neutral Listing (analyse) → fan-out (market intelligence + Platform-formatted Listing per platform) → refinement (chip toggles, field edits, photo boost). To be extracted as `useListingPipeline()` in Phase 3.

## LLM Call Modules _(forward-looking — Phase 2)_

Each Anthropic call as a single module that owns its prompt, SDK invocation, JSON extraction, and shape validation. Planned: `analyseListing`, `formatListing`, `refineListing`, `synthesiseMarketIntelligence`. The corresponding `/api/*` routes will become thin HTTP adapters around these modules.
