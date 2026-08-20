# Supabase provides identity and the usage meter

Supabase was in the stack solely to store eBay OAuth tokens, which ADR-0003 deleted. Rather than remove it, we repurposed it: it now holds user identity (Sign in with Apple and email), each user's enabled platforms, and the usage counter that ADR-0007 depends on.

Sign in with Apple is close to mandatory on the App Store — Guideline 4.8 requires offering it alongside any third-party sign-in — and it's the lowest-friction option on iOS regardless.

## Consequences

Enabled platforms live server-side, not on the device, because the valuation and the meter both need to read them. Asking *"what do you sell on?"* is now the job of onboarding, which previously existed to connect an eBay account that no longer connects to anything.
