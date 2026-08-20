# CONTEXT — wattle domain glossary

wattle values a secondhand item from photographs and tells the user what to write, where to post it, and what to ask for it.

This is a glossary, not a spec. Use this vocabulary in code, prompts, and conversation. If a new concept earns its name during a refactor, add it here. Architectural decisions live in `docs/adr/`.

## The item

**Item**:
The physical thing being sold or considered — a jacket, a pair of boots. Exists in the world, not in the database.
_Avoid_: product, SKU, listing (a listing is what you write *about* an Item)

**Photo**:
One image of an Item, taken or chosen by the user.

**Neutral Listing**:
The platform-agnostic description of an Item — brand, type, colour, condition, size, material — derived from its Photos. The single source of truth every platform's wording is generated from.
_Avoid_: base listing, generic listing

**Platform-formatted Listing**:
A Neutral Listing rewritten in one Platform's voice and conventions, plus the dropdown values that Platform requires.
_Avoid_: caption, post, formatted copy

**Refinement Chip**:
A one-tap instruction the user applies to a Platform-formatted Listing — "shorter", "stress condition", "add measurements".
_Avoid_: tweak, filter, tag

## Platforms

**Platform**:
A resale destination — Vinted, Depop, or eBay. wattle writes for them and values against them; it does not post to them.
_Avoid_: marketplace, channel, site

**Enabled Platform**:
A Platform the user has told us they actually sell on. Only Enabled Platforms are valued, and only they can be recommended.

## Valuation

**Valuation**:
The answer to *what is this Item worth?* — one Price Band per Enabled Platform, with the Comparables that justify it. Deliberately independent of why the question was asked, so both modes can use it.
_Avoid_: market intelligence, pricing, appraisal

**Comparable**:
A currently-listed item, similar enough to the user's Item to inform its value. What someone is **asking** today — not what anything sold for. wattle has no access to sold prices; see ADR-0005.
_Avoid_: comp, sold comp, match

**Price Band**:
A low-to-high range an Item could reasonably be listed at on one Platform. Always a range, never a single number.
_Avoid_: price, estimate, valuation (a Valuation *contains* Price Bands)

**Confidence**:
How much the Comparables agree. Low Confidence is a real answer — it's what stops Scout from calling a coin-flip a bargain.

**Recommendation**:
The Enabled Platform an Item should be posted on, chosen by Price Band weighted by likelihood of selling. Only exists when more than one Platform is enabled; with one, there is nothing to choose between.
_Avoid_: winner, best platform, suggestion

## Modes

**Sell Mode**:
The user has an Item and wants to list it. Produces a Recommendation and a Platform-formatted Listing to copy. This is v1.

**Scout Mode**:
The user is standing in a shop and wants to know whether to buy an Item at its asking price. The same Valuation, minus the asking price, plus a verdict. Deferred to v2.
_Avoid_: buy mode, reseller mode

## Account

**Allowance**:
How much valuing a user may do before they are asked to pay. Counted server-side against their account from the first release, whether or not anything is being charged yet.
_Avoid_: quota, credits, limit
