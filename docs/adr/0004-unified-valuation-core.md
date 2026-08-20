# One valuation service serves both Sell and Scout

Sell mode asks "where should I post this and for how much?" and Scout mode asks "should I buy this at £6?" — these look like two features but they are one question (*what is this item worth?*) with different arithmetic on the answer. We built a single `Valuation` service that answers only the underlying question, and kept mode-specific logic out of it.

The interface is roughly `valuate(item, enabledPlatforms) → { perPlatform: { low, high, confidence, comparables }, winner? }`.

## Consequences

- **Scout v2 is a screen and a subtraction**, not a second pipeline. This is the main reason building the valuation core carefully in v1 is worth it.
- Valuation returns a **band per platform**, not one global number, because choosing between platforms requires per-platform signal. Fees are a constant applied afterwards; the band is the only input that varies per item.
- The **winner is `price band × likelihood of selling`**, not net-after-fees. Vinted charges sellers 0% against Depop's 10% and eBay's 13.25%, so a net-after-fees criterion would pick Vinted every time and the recommendation would be a constant function with a reasoning paragraph attached.
- **We only value platforms the user has enabled**, and when exactly one is enabled we skip winner-selection entirely — there is nothing to compare. Cost scales with what each user actually sells on.
