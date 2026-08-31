# eBay OAuth and publishing are removed

The eBay integration — four auth routes, AES-256-GCM token encryption, refresh logic, and a publish call — was the heaviest thing in the codebase at roughly 390 lines, and the only reason Supabase existed. We removed it entirely: bower now hands the user listing text to paste, rather than posting on their behalf.

## Consequences

- **eBay survives as a destination, not an integration.** It remains a platform we value items against and can recommend; we simply don't publish to it.
- The app cannot observe outcomes. It has no way to know whether anything sold, which is why the History screen's "Listed 12 / Sold 7 / Earned £284" was removed rather than wired up — those numbers were unknowable, and displaying them would have been a lie in the UI.
- Supabase lost its only purpose here and was repurposed rather than removed; see ADR-0006.
