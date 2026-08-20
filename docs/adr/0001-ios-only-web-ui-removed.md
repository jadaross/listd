# iOS-only; the web UI is removed

wattle began as a Next.js web app with a SwiftUI prototype mirroring it. The product's strongest moment — photographing an item and getting a price before you walk away — is a phone moment, so the native app is the product and the web UI is not worth maintaining alongside it. We deleted every screen, component, and page; what remains of the Next.js app is its API routes (see ADR-0002).

## Consequences

- The `ios/` SwiftUI files are a **visual reference, not a foundation**. They are entirely mock-driven, with no networking, and their single-god-object state model will not survive real async work. Keep the theme and layout; rewrite the app.
- **Scout mode is deferred to v2**, not cancelled. Its code was removed from the working tree rather than left to rot; see ADR-0004 for why rebuilding it is cheap, and the deletion commit for retrieval.
- Sell mode is the whole of v1.
