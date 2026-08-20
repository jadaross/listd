# Valuation uses public asking prices, not sold prices

A future reader will ask why a resale-pricing app doesn't use sold comps. Because for our platforms they are not available to us at any price: **Vinted publishes no sold data at all** (sold items are removed from search entirely), **Depop exposes none** and forbids scraping, and **eBay's Marketplace Insights API — the one real sold-comps source — is Limited Release and closed to new applicants**. We ground valuations in public *asking* prices via Claude's server-side web search, and say so in the UI: "similar items are listed at £18–£26."

## Considered options

Every commercial "Vinted sold comps" product infers a sale by watching a listing **disappear between crawls** — a proxy that cannot distinguish a sale from a seller pausing, editing, or deleting. More importantly it is not a lookup: the data only exists if something has been crawling and storing listings for weeks before the user opens the app. Accurate sold comps is a continuously-running data-collection operation, not an API integration — a second product that would have consumed the iOS migration. Scraping also breaches both platforms' terms and exposes an App Store listing to a rights-holder complaint.

This replaced a stack of SerpAPI + Apify + a Google `site:` scraper — three dependencies and two secrets, all deleted.

## Consequences

- The service is deliberately shaped so a **paid comps feed can replace the implementation** without touching a caller, if the product proves out.
- **Always a range with confidence, never a single number.** Scout's buy/no-buy call needs the error bar: "worth £18–£26, so £6 is a clear buy" and "worth £8–£26, too uncertain to call" are different answers.
- We say "listed at", never "sells for" — asking-price data cannot support a sold-price claim, and that claim is what generates one-star reviews when an item sits unsold at the quoted number.
