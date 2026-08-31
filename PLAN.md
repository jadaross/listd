# Bower — original planning document

> **Status: historical, retained for the research.** This is the document the
> project was started from. Its *research* is still good and still cited — the
> Vinted/Depop API assessment, the photo quality system, the tag pipeline, the
> competitive landscape. Its *plan* has been superseded by the ADRs in
> `docs/adr/`, and where the two disagree, **the ADRs win**.
>
> Superseded in three big ways: it plans a **web app** (ADR-0001 made the native
> iOS app the product and deleted the web UI), it plans **direct posting** to
> Vinted and Depop (ADR-0003 removed publishing entirely), and it plans
> **no accounts** (ADR-0007 metered from day one, so every route is
> authenticated). Sections below are annotated where they are no longer true.
>
> For what is actually next, read the GitHub issues, not this file.

---

## The Problem

Listing clothes on Vinted or Depop is tedious. You need to:
- Take good photos (most people don't)
- Write a title and description
- Pick the right category, colour, brand, size, condition
- Research a fair price
- Add hashtags

Most people skip half of it or write lazy listings that don't sell. Bower does all of this for you — including telling you which photos to retake before you even start.

---

## MVP Scope (web app — superseded by ADR-0001)

> The MVP was going to be a web app on the theory that mobile browser camera
> access was enough. It wasn't: the product's strongest moment is photographing
> an item in a shop and getting a price before you walk away, and that is a
> native moment. The web UI was deleted. **The user flow below survived the
> pivot almost unchanged** — it is still what the app does, just in SwiftUI
> against the API routes rather than in a browser.

### Core User Flow

```
1. User uploads all their photos of a clothing item (from camera or photo library)
   — garment shots, close-ups, tag photos, anything they have

2. AI reviews the photos and:
   a. Scores photo quality (lighting, focus, background, completeness)
   b. Identifies which standard shots are missing
   c. Gives specific suggestions: "Add a back shot", "Photograph the care label"

3. User retakes any missing/poor photos and re-uploads

4. AI analyses the full photo set:
   — reads any visible clothing tags (brand, size, fabric, RN/CA number)
   — searches for additional product details from tag data
   — assesses condition, colour, type

5. A completed listing draft appears:
   - Title
   - Description / caption (Casual or Professional tone)
   - Suggested price range (with reasoning)
   - Category, colour, brand, condition, size, material
   - Hashtags (Depop) or keywords (Vinted)

6. User regenerates if needed, then copies content and pastes into Vinted / Depop
```

### Key Features for MVP

| Feature | Details |
|---|---|
| Multi-photo upload | Unlimited images, drag-and-drop or tap to upload |
| Photo quality critique | Score per photo + specific issues (blur, lighting, background, wrinkles) |
| Missing shot detection | Checks for: front, back, tag, defect, measurement, detail shots |
| Actionable photo suggestions | "You should also photograph the care label" |
| Tag / label recognition | Reads brand, size, fabric, RN/CA number, care symbols from tag photos |
| Product lookup from tag data | Searches for original product details using tag info |
| AI listing generation | Title, description, price range, all attributes, hashtags |
| Tone toggle | Casual (fun, gen-z Depop feel) vs. Professional (clean, Vinted-style) |
| Platform selector | Vinted or Depop — tailors output format and field structure *(eBay was added as a third platform; the user's Enabled Platforms now drive this)* |
| Regenerate button | Re-run the AI for a different take |
| Copy to clipboard | One-click copy per field |
| ~~No account required (v1)~~ | **Reversed by ADR-0007.** Every route requires a Supabase bearer token, because the Allowance meter needs someone to meter |

### What MVP Does NOT Include

- Automatically posting to Vinted/Depop (see API section — not yet possible at this scale)
- ~~Account system~~ *(shipped early — see ADR-0007)* / saved listings history (still to come)
- Bulk listing of multiple items (v2)
- Live sold-price data from Vinted/Depop (v2)

---

## Photo Quality System

### The Standard Shot List

The AI checks every upload against this list and flags what's missing:

| Shot | Why It Matters |
|---|---|
| Front (hero) | Cover photo — the most important |
| Back | Buyers need to see the full rear |
| Side profile | Important for structured items (jackets, blazers, coats) |
| Care label / brand tag | Proves authenticity, provides fabric and care info |
| Size tag | Critical for vintage where sizing is non-standard |
| Key detail | Collar, buttons, print, embroidery, hardware |
| Defect close-up | Any pilling, staining, fading — honesty reduces disputes |
| Measurement | Flat lay with tape measure; reduces returns significantly |
| On-body / styled | Shows fit and drape; Depop and Vinted both favour this |

Vinted recommends up to 20 photos for maximum algorithmic visibility. Depop's data shows a 4-photo minimum (model + flat lay + 2 close-ups) increases sell-through by 20%.

### Photo Quality Criteria

Each uploaded photo gets scored on:
- **Focus** — is the item sharp?
- **Lighting** — natural, even light vs. harsh shadows or underexposure
- **Background** — neutral and uncluttered? (Vinted favours plain; Depop allows lifestyle)
- **Framing** — full item visible and not cropped
- **Presentation** — item laid flat or on hanger, not crumpled

### Technical Approach

One combined multimodal AI call (Claude Sonnet) receives all uploaded photos and returns:

```json
{
  "photo_scores": [
    {
      "photo_index": 0,
      "issues": ["slightly underexposed", "wrinkled garment"],
      "score": 3
    }
  ],
  "missing_shots": ["back view", "care label", "measurement"],
  "photo_suggestions": [
    "Add a photo of the back of the garment",
    "Photograph the care label — buyers use this to verify fabric content",
    "Lay the item flat and photograph it with a tape measure across the chest"
  ],
  "ready_to_list": false
}
```

The same call (or a second call once the user confirms they're done with photos) generates the full listing.

**Platform guidelines to bake into the prompt:**
- Vinted: plain/neutral background preferred, no stock photos, 8–20 photos ideal
- Depop: square 1:1 crop, lifestyle shots accepted, tag photo required for branded items

---

## Tag Recognition & Product Lookup Pipeline

> **Half shipped.** Reading the tag *did* ship — it is one of the three things
> the single `analyse` call returns, as `tag_data`. The **lookup waterfall
> below did not**: there is no SerpApi, no Google Lens call, no barcode
> decode and no RN-number lookup in the codebase. Comparables are found by the
> valuation's own web search instead (ADR-0005). Kept because it is still the
> best sketch of what a product-lookup feature would need to do.

### What the AI Reads from Tag Photos

With a clear tag photo, AI vision can extract with high accuracy:

| Field | Accuracy (specialist model benchmark) |
|---|---|
| Size | ~93% |
| Fabric composition | ~90% |
| Country of manufacture | ~81% |
| Care symbols | ~87% |
| Brand name | ~77% |
| RN / CA number | — (OCR-dependent) |
| Style / SKU number | — (OCR-dependent) |

Claude Sonnet and GPT-4o are both strong at reading text from imperfect tag images in a single pass.

### RN Numbers (Key for UK/US Vintage Items)

RN (Registered Identification Number) is a US FTC designation on clothing tags. It's a **powerful vintage dating signal:**

| RN Range | Era |
|---|---|
| RN00101–RN04086 | Pre-1959 |
| RN13670+ | Post-1959 |
| ~RN17000–20000 | Mid-1960s |
| Higher numbers | Later decades |

There is no official RN lookup API — but a web search for `"RN XXXXXX"` reliably returns the brand/manufacturer name. This is automated via SerpApi.

Union label presence is another vintage dating signal: ILGWU label = US-made, 1900–1995. ACWA label = 1914–1976.

### Product Lookup Waterfall

After extracting tag data, the pipeline runs lookups in this order:

```
1. If EAN/UPC barcode decoded
   → Barcode Lookup API (go-upc.com) → product name, brand, retail image

2. If style/SKU number found
   → Google Shopping via SerpApi → original retail listing, price, images

3. If RN number found
   → Web search "RN [number]" → brand/manufacturer identification

4. Always
   → Google Lens via SerpApi with tag photo OR garment photo
   → visual product matches with retailer links and pricing

5. Results combined
   → passed to listing generation AI call as additional context
```

**Note on barcodes:** General LLMs cannot reliably decode barcodes visually. For web MVP, prompt users to type the barcode number if they can see it. For the native app (future), use the phone's native barcode scanner (iOS AVFoundation / Android ML Kit).

### Data Validation / Up-to-Date Checks

To ensure generated details are accurate rather than AI hallucinations:

- **Brand confirmation**: Cross-reference AI's brand guess against what was read from the tag
- **Price validation**: After AI suggests a price range, run a live search of current Vinted/Depop listings for the same brand + item type and display the range alongside the suggestion
- **Product lookup confirmation**: If Google Lens returns a strong match, show the user the matched product so they can confirm before it's used in the listing

This gives users transparency and catches any AI errors before the listing goes live.

---

## Vinted & Depop API — Honest Assessment

This is the most important strategic decision for the product. Here is what the research actually found.

### Vinted Pro API

**Access:** Allowlist-only. No public sign-up. No self-service.

**Who qualifies:**
- Must be a **legally registered business** (sole trader UTR, SIRET, company number)
- Must be incorporated in: UK, France, Italy, Netherlands, Spain, Portugal, Luxembourg, or Belgium
- Individual developers with no registered business entity are **not eligible**
- No documented cases of indie developers or small startups getting access

**How to apply:** The portal is at `pro-portal.svc.vinted.com` — but there is no published application form or email address. The process is opaque and relationship-driven.

**Auth model: HMAC-SHA256 — not OAuth.**
- One business gets one set of credentials
- No user-level OAuth — there is **no way for individual users to connect their own Vinted account** to a third-party app
- This makes the Vinted Pro API architecturally unsuitable for a multi-tenant SaaS where each user posts to their own Vinted account

**What CreateItems supports:**

Required fields: `catalog_id`, `price`, `currency`, `title`, `description`, `photos`, `status_id`, `package_size_id`

Optional fields: `brand`, `colors`, `sizes`, `attributes`, `measurements`

Starts at 500 active item slots. Account manager review after 30 days.

**Bot detection:** Vinted deployed DataDome in ~2025. Unofficial automation is actively detected.

**Bottom line for Bower:** The Vinted Pro API cannot power a multi-user "post on behalf of users" feature. Even if you got approved, you'd be posting as your own business account, not as each individual user. This is a fundamental architectural mismatch. **For Vinted: the copy-paste approach is not just the easy option — it's the only realistic option for a multi-user product.**

---

### Depop Partner API

**Access:** Private, not public — but the path to access is clearer.
- Email: `business@depop.com`
- No NDA or revenue threshold documented
- Depop explicitly works with crosslisting tools via API — some have confirmed partner relationships

**Auth model: OAuth 2.0 (Authorization Code + PKCE) — this is the good news.**
- Proper user-level OAuth flow
- Individual sellers authorise your app, you get per-user access tokens
- This is exactly the architecture needed for a multi-tenant "post on behalf of users" SaaS
- Granular scopes (e.g. `products_read`, write scopes)

**What the create listing endpoint supports:**

`PUT /api/v1/products/{sku}` (upsert)

Required: `sku`, `price_amount`, `price_currency`, `description`, `quantity`, `department`, `product_type`, `size_set_id`, `size_id`, `condition`

Optional: `colour`, `style`, `age`, `source`, `brand`, `national_shipping_cost`, `international_shipping_cost`, `attributes`

Photos: array with `url` + optional `#type` tags (`cover-image`, `back`, `tag`, etc.)

**ToS on crosslisting:** Depop explicitly permits it:
> "You may simultaneously list your items for sale on other platforms via third party cross-listing platforms, as long as you fully comply with the Terms of Service."

**Sandbox environment** available for testing without real listings.

**Bottom line for Bower:** Depop is the right first platform to pursue official API access for. The OAuth model supports multi-user posting, crosslisting is ToS-approved, and there's a clear (if relationship-gated) path to access. **Email business@depop.com early — even before you have users — and start the conversation.**

---

### Unofficial / Workaround APIs

Several unofficial libraries exist:

**Vinted (unofficial):**
- `Androz2091/vinted-api` (JS), `vincenzoAiello/VintedAPI` (Node), `Pawikoski/vinted-api-wrapper` (Python)
- All are primarily read-only (search, item fetch). No well-maintained library supports reliable listing creation via unofficial endpoints.
- DataDome bot detection makes these increasingly risky.

**Depop (unofficial):**
- `akimbo7/Depopped` — Python, mimics the mobile client. Does support listing-creation-type operations via the private mobile API.
- Risks: ToS ban, account loss, no recourse. Depop enforcement escalated significantly in 2023–2024.

**Verdict:** Do not build on unofficial APIs as a core product feature. Use them only for personal research and testing to understand platform data structures. Enforcement is account-level bans, not legal action — but for a product, losing user accounts is unacceptable.

---

### API Strategy Summary

| Platform | Official API | Multi-user OAuth | Realistic for MVP | Path to posting |
|---|---|---|---|---|
| **Vinted** | Yes (allowlist, registered business only) | No (HMAC only) | No | Copy-paste for now; revisit if you incorporate |
| **Depop** | Yes (invite, email to apply) | Yes (OAuth 2.0) | Possible post-MVP | Email business@depop.com now |

**The plan:**
- **MVP**: Generate listing content → user copies and pastes. Both platforms.
- **v2**: Email Depop for partner access. Build OAuth flow for Depop one-click posting.
- **v3**: Incorporate as a business if needed; revisit Vinted Pro for bulk/power sellers.

---

## AI Strategy

### Model: Claude Sonnet (Anthropic)

Single multimodal API call per listing covering: photo quality assessment, missing shot detection, tag reading, and listing generation all in one.

**Prompt output structure:**

```json
{
  "photo_scores": [...],
  "missing_shots": [...],
  "photo_suggestions": [...],
  "tag_data": {
    "brand": "...",
    "size": "...",
    "fabric": "...",
    "rn_number": "...",
    "country_of_manufacture": "...",
    "care_instructions": "..."
  },
  "listing": {
    "brand": "...",
    "clothing_type": "...",
    "colour": "...",
    "condition": "...",
    "size": "...",
    "material": "...",
    "title": "...",
    "description": "...",
    "hashtags": [...],
    "price_min": 0,
    "price_max": 0,
    "price_reasoning": "..."
  }
}
```

Tone is controlled by swapping a system prompt section: "casual and conversational, like a Depop Gen-Z seller" vs. "clean and professional, factual."

Platform is controlled by adjusting the output format: Depop wants hashtags and a casual style, Vinted wants category-specific keywords and a more formal tone.

### Cost Per Listing

| Model | Approx cost per listing |
|---|---|
| Claude Sonnet | ~£0.004–0.01 (more photos = more tokens) |
| GPT-4o | ~£0.002–0.006 |
| GPT-4o mini | ~£0.0003–0.001 |

At 1,000 listings/month: ~£4–10 on Claude Sonnet. Worth it for the quality difference.

### Additional API Costs (Tag Lookup)

*None of these are incurred — the lookup waterfall was never built. Costed here
for whenever it is.*

| Service | Cost |
|---|---|
| SerpApi (Google Lens + Shopping) | ~£0.001 per search; ~£1/1,000 searches |
| Go-UPC Barcode Lookup | Tiered; free tier available |

Budget ~£0.005 additional per listing that has tag data worth looking up.

---

## Tech Stack

### As planned vs. as built

| Layer | Tool | Status |
|---|---|---|
| API | Next.js (App Router) | **Adopted** — API routes only, no UI (ADR-0002) |
| Database + Auth | Supabase | **Adopted** — identity, Enabled Platforms, Allowance meter |
| Image storage | Cloudflare R2 | **Never adopted.** Photos are sent to the model in the request and not stored |
| AI vision + generation | Anthropic API | **Adopted** — Sonnet 5 for analysis and valuation, Haiku 4.5 for formatting and refinement |
| Product lookup | SerpApi | **Never adopted.** Comparables come from the model's web search (ADR-0005) |
| Barcode decode | `pyzbar` / `zxing-js` | **Never adopted.** Tag OCR happens inside the `analyse` call |
| Client | Native SwiftUI | **Replaces the browser** (ADR-0001) |
| Deployment | Vercel | **Adopted** |

### Estimated Monthly Cost at MVP Scale

| Service | Cost |
|---|---|
| Vercel | £0 (hobby) |
| Supabase | £0 (free tier) |
| ~~Cloudflare R2~~ | *never adopted* |
| Claude API (1,000 listings) | ~£4–10/month |
| ~~SerpApi (1,000 tag lookups)~~ | *never adopted* |
| **Total** | **~£4–10/month** — original estimate, never re-costed against the Valuation's web search |

---

## Competitive Landscape

### Platform-Native AI (indirect competition)

| Platform | Feature | Gap |
|---|---|---|
| **Depop** | "Generate Description" from one photo (Sep 2024) | Platform-locked, no price, no photo critique |
| **Poshmark** | "Smart List AI" (Feb 2025) | US-only, Poshmark-only, no price |

### Third-Party Tools (direct competition)

| Tool | Platforms | AI Listing | Price/month | Gap |
|---|---|---|---|---|
| **Reeva** | eBay, Mercari, Poshmark, Depop | Full AI from photos | $29–59 | No Vinted, US-focused |
| **Vendoo** | Vinted + 9 others | AI assist (not generate) | £0–45 | Browser extension, not AI-first |
| **Crosslist** | Vinted + 5 others | Minimal | £0–25 | Form-based |
| **Nifty** | Poshmark, eBay, Mercari, Depop | AI-assisted | — | No Vinted |

**None of them do photo quality critique or tag lookup.** That's the gap.

### Your Differentiator

1. **Photo coaching before listing** — no competitor does this
2. **Tag-to-product-details pipeline** — RN lookup, barcode lookup, Google Lens visual search
3. **Vinted-first, Europe-first** — every competitor is US/Poshmark-centric
4. **Live data validation** — price suggestions backed by real current listings, not just AI guesses

---

## Roadmap

*Rewritten 2026-08-31. The original v2–v6 ladder is kept below only where it is
still live; the rest is recorded as dead so it does not get rebuilt by accident.*

### Shipped

- **Accounts** (Supabase Auth) — was "v2". Landed early: the Allowance meter
  needs someone to meter (ADR-0007).
- **Live price comparison** — was "v3". Now the Valuation: one Price Band per
  Enabled Platform, justified by currently-listed Comparables (ADR-0005).
- **eBay** as a third platform alongside Vinted and Depop.

### Dead — do not revive without reopening the ADR

- **Depop direct posting** (was v2) and **Vinted direct posting** (was v4).
  ADR-0003 removed publishing entirely; the API assessment above is the
  evidence for it. Bower hands the user text to paste.
- **Crosslisting and inventory sync** (was v5) — depends on posting, so it dies
  with it.
- **PWA first, then Expo/React Native** (was v6) — ADR-0001 made the native
  SwiftUI app the product. There is no PWA and no React Native.

### Actually next

The backend is done. What remains is the client, tracked as GitHub issues:

| Issue | Work | Who |
|---|---|---|
| #11 | Create the Xcode project | human |
| #15 | Sign in with Apple — needs Apple Developer portal config | human |
| #16 | Onboarding: what do you sell on? → Enabled Platforms | agent |
| #12 | Photograph an Item → Neutral Listing | agent |
| #13 | Valuation and Recommendation screen | agent |
| #14 | Format the recommended platform and copy it | agent |

Backend latency work in flight: #17 provisional price before the search
returns, #18 value every platform in one search pass, #19 stream `/api/valuate`.

### Then

- **Scout Mode** — *"I'm in a shop, is this worth buying?"* Deliberately v2.
- **StoreKit paywall** on the existing meter. ADR-0007 parked it until there is
  something worth charging for; it is about a week's work on top of the meter.
- Saved listing history and drafts.
- Background removal (PhotoRoom or Claid.ai).
- Original retail price from tag lookup, for "was £X, now £Y" framing.

---

## Open Questions

1. **Monetisation** — the meter exists and nothing is charged yet. How big is
   the free tier, and is it a subscription or pay-per-valuation? (ADR-0007)
2. **Target user** — occasional wardrobe-clearer, or semi-pro reseller doing
   20+ items a week? Still open, and it still drives feature priority.
3. **Tone presets** — Casual / Professional is what ships. Worth adding Vintage
   Aesthetic, Luxury/Designer, Streetwear/Hype?
4. **Photo coaching UX** — show suggestions before the listing (two-step), or
   alongside it?

*Answered since this was written:* primary platform for v1 — all three, with
the user's Enabled Platforms deciding which get valued.
