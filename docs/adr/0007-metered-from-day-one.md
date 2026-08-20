# Usage is metered from day one, though the app ships free

Every listing costs real money — roughly $0.05–$0.06 in Anthropic tokens — so a free app on the public App Store has an unbounded bill attached to it. From the first release, every API call authenticates as a user and decrements a server-side counter, even though nothing is charged yet and the payment model is deliberately undecided.

## Consequences

Metering is the expensive half to retrofit: it reaches into auth, the API layer, and the client all at once. A StoreKit paywall on top of an existing meter is roughly a week's work and can wait until we know what to charge for. This is also the reason authentication had to be genuine rather than the placeholder login the web app shipped with — the meter needs someone to meter.
