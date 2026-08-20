# The backend stays Next.js on Vercel, headless

An iOS app cannot hold the Anthropic API key — anyone can pull strings out of an `.ipa`, and a leaked key bills to us until we notice — so cutting the web UI does not mean cutting the server. We kept the existing Next.js app on Vercel and deleted only its rendering layer, leaving `src/app/api/*` and `src/lib/llm/*` as a JSON API the iOS client talks to over HTTPS.

## Considered options

Rewriting the backend as Supabase Edge Functions would have put auth and compute with one vendor, but meant porting all five prompt/parse call sites from the TypeScript Anthropic SDK to Deno — rewriting the one part of the codebase that was already working and worth keeping, to save a second vendor bill.

## Consequences

A future reader will open this repo, find a Next.js project with no pages, and assume something is broken. It isn't. The framework is here for its API routes and its deployment story, nothing else.
