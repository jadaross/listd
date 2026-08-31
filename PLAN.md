# Bower — App Planning Document

> AI-powered listing generator for Vinted & Depop. Upload photos of your clothes, get a photo critique, tag lookup, and a ready-to-post listing in seconds.

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

## MVP Scope (Web App)

The MVP is a web app. Modern mobile browsers support camera access so users can photograph items directly from their phone without a native app.

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
| Platform selector | Vinted or Depop — tailors output format and field structure |
| Regenerate button | Re-run the AI for a different take |
| Copy to clipboard | One-click copy per field |
| No account required (v1) | Keep friction as low as possible for early users |

### What MVP Does NOT Include

- Automatically posting to Vinted/Depop (see API section — not yet possible at this scale)
- Account system / saved listings history (v2)
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

| Service | Cost |
|---|---|
| SerpApi (Google Lens + Shopping) | ~£0.001 per search; ~£1/1,000 searches |
| Go-UPC Barcode Lookup | Tiered; free tier available |

Budget ~£0.005 additional per listing that has tag data worth looking up.

---

## Tech Stack

### Recommended: Next.js + Supabase + Vercel + Cloudflare R2

| Layer | Tool | Why |
|---|---|---|
| Frontend + API | Next.js (App Router) | React, handles UI and API routes, huge ecosystem |
| Database + Auth | Supabase | Postgres + free tier + built-in auth |
| Image storage | Cloudflare R2 | Zero egress fees — critical for image-heavy apps |
| AI vision + generation | Anthropic API (Claude Sonnet) | Best multi-image + description quality |
| Product lookup | SerpApi | Google Lens + Google Shopping programmatic access |
| Barcode decode | `pyzbar` (Python) or `zxing-js` (browser) | Open source, no API cost |
| Deployment | Vercel | One-click, auto preview deployments |

### Estimated Monthly Cost at MVP Scale

| Service | Cost |
|---|---|
| Vercel | £0 (hobby) |
| Supabase | £0 (free tier) |
| Cloudflare R2 | £0–4/month |
| Claude API (1,000 listings) | ~£4–10/month |
| SerpApi (1,000 tag lookups) | ~£1/month |
| **Total** | **~£5–15/month** |

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

## Future Features (Post-MVP)

### v2 — Accounts & Depop Direct Posting

- User accounts (Supabase Auth)
- Saved listing history and drafts
- Depop OAuth integration — connect your Depop account, post directly from Bower
- Background removal (PhotoRoom API or Claid.ai integration)

### v3 — Smarter Pricing

- Live price comparison: search Vinted/Depop for similar items and show price distribution chart
- Original retail price retrieved from product lookup (gives "was £X, now selling for £Y" framing)
- "Listed at" / "Sold for" tracking from your own user base (proprietary pricing dataset over time)

### v4 — Vinted Direct Posting

- Incorporate as a business if needed
- Apply for Vinted Pro API allowlist
- One-click Vinted posting (noting the architectural constraint — may require a different model, e.g. browser extension or Vinted Pro business account)

### v5 — Crosslisting & Inventory Sync

- One listing → post to both Vinted and Depop simultaneously
- Platform-specific variants auto-generated from one photo set
- Mark as sold on all platforms when one sells (via webhooks)

### v6 — iPhone App

- Build PWA first (browser camera + home screen shortcut)
- When ready: Expo (React Native) — React knowledge transfers, same codebase covers Android, Expo EAS handles App Store submission without Xcode
- Native advantage: use `AVFoundation` for real barcode scanning from the camera (more reliable than server-side barcode decode from uploaded photos)

---

## App Name Ideas

- **Bower** (current) — clean, action-oriented
- **Flaunt** — fashion-forward feel
- **Rack** — clothing rack metaphor
- **Tagged** — tagging items
- **Snap & Sell** — describes the action clearly

---

## Open Questions

1. **Primary platform for v1**: Both Vinted and Depop from day one, or start with one?
2. **Monetisation**: Free with usage cap? Subscription (e.g. £5/month for unlimited)? Pay-per-listing?
3. **Target user**: Occasional seller clearing their wardrobe, or semi-pro reseller doing 20+ items/week? (Affects feature priority significantly)
4. **Tone presets**: Casual / Professional is a good start. Could add: Vintage Aesthetic, Luxury/Designer, Streetwear/Hype
5. **Photo coaching UX**: Show suggestions before generating the listing (two-step flow), or generate listing and show suggestions alongside?

---

## Immediate Next Steps

1. Email `business@depop.com` now — start the partner access conversation early
2. Set up Next.js + Supabase + Vercel from the official template
3. Add Cloudflare R2 for image storage
4. Build the multi-photo upload UI
5. Wire up Claude with a combined photo-critique + listing-generation prompt
6. Build the output UI: photo feedback section + listing fields with copy buttons
7. Add tone toggle and platform selector
8. Add SerpApi integration for tag-based product lookup
9. Ship to Vercel and test with 5–10 real wardrobe items
