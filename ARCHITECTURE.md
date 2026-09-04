# Architecture

Every route runs on the **Node runtime** and requires a Supabase bearer token —
there are no anonymous requests, because the Allowance meter needs someone to
meter ([ADR-0007](./docs/adr/0007-metered-from-day-one.md)). Handlers are
wrapped in `withAuth` from `src/lib/auth.ts`.

## Call flow

```mermaid
flowchart TD
    User([iOS app]) -->|bearer token| Auth{withAuth}
    Auth -->|401| Reject([Rejected])

    Auth -->|photos + tone| Analyse["POST /api/analyse<br/>SONNET 5 · 1 call<br/>streams SSE<br/>spends 1 Allowance unit"]
    Analyse --> Neutral["photo scores<br/>tag_data<br/>Neutral Listing<br/>+ the price guess"]

    Neutral -->|"user taps 'get a real price'"| Valuate["POST /api/valuate<br/>spends 1 Allowance unit"]
    Valuate --> Profile[("profile.enabled_platforms<br/>read as the caller, never from the body")]
    Profile --> Bands["SONNET 5 + web_search<br/>1 call per Enabled Platform<br/>run in parallel, cached per item+platform"]
    Bands --> Recommend["recommend()<br/>pure function — no LLM<br/>Price Band x sell-likelihood, net of fees"]

    Recommend -->|recommended platform| Format["POST /api/format<br/>HAIKU 4.5 · 1 call<br/>only the platform being shown"]
    Format --> Listing[Platform-formatted Listing]

    Listing -->|user taps Refinement Chips| Refine["POST /api/refine<br/>HAIKU 4.5 · 1 call per round"]
    Refine --> Listing
    Listing --> Copy([User copies and pastes])

    style Analyse fill:#e0e7ff,stroke:#6366f1
    style Bands fill:#e0e7ff,stroke:#6366f1
    style Format fill:#fef3c7,stroke:#f59e0b
    style Refine fill:#fef3c7,stroke:#f59e0b
    style Recommend fill:#dcfce7,stroke:#16a34a
```

## API routes

| Route | Purpose | LLM |
|---|---|---|
| `POST /api/analyse` | Photos → photo quality scores, tag OCR, Neutral Listing with a price guess. One JSON object. Streams SSE. Spends one unit. | Sonnet 5 × 1 |
| `POST /api/valuate` | `ValuationItem` → a Price Band per Enabled Platform, plus a Recommendation. Spends one Allowance unit. | Sonnet 5 × *n* platforms |
| `POST /api/format` | Neutral Listing + platform + tone → a Platform-formatted Listing | Haiku 4.5 × 1 |
| `POST /api/refine` | Platform-formatted Listing + Refinement Chips → a rewritten one | Haiku 4.5 × 1 |
| `GET` / `PATCH /api/profile` | Enabled Platforms, Preferred Platform, Allowance | none |
| `DELETE /api/profile` | The caller's account, via the service role; profile cascades | none |

## Models

Set in one place, `src/lib/llm/client.ts`:

| Job | Model | Why |
|---|---|---|
| `analyse` | `claude-sonnet-5` | Multi-image reasoning, and everything downstream is built on its output |
| `valuation` | `claude-sonnet-5` | Needs `web_search_20260209`, and judging whether a result is genuinely comparable *is* the product |
| `format` | `claude-haiku-4-5-20251001` | Rewriting text it has already been given |
| `refine` | `claude-haiku-4-5-20251001` | Same, one instruction at a time |

## Cost per item

| | Calls |
|---|---|
| One Enabled Platform | **3** — analyse, one Price Band, one format |
| Three Enabled Platforms | **5** — analyse, three Price Bands, one format |
| Each Refinement Chip round | +1 Haiku call |

Only Enabled Platforms are valued, so cost scales with what each user actually
sells on. Price Bands are cached per item+platform, and `format` runs for the
platform being shown rather than fanning out across all three
([ADR-0004](./docs/adr/0004-unified-valuation-core.md)).

## Two things the design deliberately protects

**Enabled Platforms are read from the caller's profile, never from the request
body.** A client that could name its own platforms could ask for work it had
not enabled, and the meter charges one unit however many platforms that turns
out to be.

**The Allowance unit is reserved before the work, not counted after it.** Two
reads or searches racing on one account must not both spend the last unit, so
the check and the decrement are a single SQL statement (`spend_allowance`). Work
that then fails is refunded — including a read whose stream dies part-way, which
is caught by a wrapper around the stream because that failure can arrive after
the headers have gone. A read costs one, a search costs one, 40 a month.

## What is not here

- **No publishing.** The eBay OAuth flow, token encryption and Sell Inventory
  call were removed ([ADR-0003](./docs/adr/0003-ebay-oauth-and-publishing-removed.md));
  Bower hands the user text to paste.
- **No sold-price data.** Comparables are what people are *asking* today, found
  by web search ([ADR-0005](./docs/adr/0005-asking-price-valuation.md)). The
  SerpAPI + Apify + scraper stack this used to need is gone.
- **No web UI.** The Next.js app is API routes plus one legal page, `/privacy`,
  which App Store Connect requires at a public URL
  ([ADR-0001](./docs/adr/0001-ios-only-web-ui-removed.md),
  [ADR-0002](./docs/adr/0002-headless-nextjs-api-on-vercel.md)).
- **No image storage.** Photos are sent in the request and not persisted.

## The client

`ios-app/bower/` — SwiftUI, iOS 26.5, one package dependency (supabase-swift,
Auth product only). Six screens in one linear flow with Settings behind a header
icon; there is no tab bar. `BowerAPI` is the only thing that touches the network,
behind `BowerAPIClient` so screens build against `StubAPI` fixtures.

Two facts about the wire the client is shaped around. `/api/analyse` streams a
JSON *document* in text fragments — `streaming-text.ts` defines the format and
`BowerAPI.readStringStream` mirrors its reference consumer — so the client
assembles then decodes, and the loading screen deliberately shows no facts as
they arrive. And 401s are not interchangeable: `auth.ts` distinguishes expired
from rejected tokens so the client can refresh silently on one and sign out on
the other, and `APIError` keeps them apart.
