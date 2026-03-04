# TODO — Production Security & Architecture

## Requested

- [ ] **Rate limiting** — Add per-IP (and optionally per-session) rate limits on `/api/analyse` and `/api/group`. Without this, a single user can exhaust Anthropic API credits instantly. Consider `upstash/ratelimit` with Redis or a Vercel Edge middleware approach.

- [ ] **Traceability / observability** — Integrate LangGraph or a lightweight alternative (e.g. LangSmith, Langfuse, or Helicone) to trace every Claude call: inputs, outputs, latency, token usage, and errors. Essential for debugging prompt regressions and monitoring costs in production.

- [ ] **Security node — prompt injection & malicious image guard** — Add a pre-flight validation step before images hit Claude. This should: (1) reject images with embedded text that attempts to override system instructions (e.g. "Ignore previous instructions…"), (2) scan for adversarial payloads in base64 content, (3) enforce strict MIME type validation rather than trusting the client-supplied type.

---

## Brainstormed — Additional Production Security

### API & Request Hardening

- [ ] **Request payload size cap** — Base64 images can be very large. Enforce a max request body size (e.g. 10MB) at the middleware level before parsing, to prevent memory exhaustion and slow-loris style abuse.

- [ ] **Strict image validation** — Currently `media_type` is hardcoded as `image/jpeg` regardless of what was uploaded. Validate actual image headers (magic bytes) server-side to confirm the content matches the declared type. Reject non-image files disguised as JPEGs.

- [ ] **CORS lockdown** — Ensure API routes only accept requests from your own origin. Edge routes currently have no explicit CORS policy — add `Access-Control-Allow-Origin` restricted to your domain to prevent third-party sites from calling your API.

- [ ] **Output sanitisation** — Claude's JSON response is parsed and forwarded to the client as-is. Sanitise all string fields (title, description, hashtags) before returning them to prevent stored XSS if the content is ever rendered as raw HTML elsewhere.

### Cost & Abuse Controls

- [ ] **Anthropic spend alerts** — Set hard and soft spend limits in the Anthropic console. A runaway request loop or abuse can generate large bills with no server-side protection.

- [ ] **Per-request token budget enforcement** — `max_tokens` is set but the prompt itself could be inflated by a large number of images. Add a pre-flight token estimate and reject requests likely to exceed a safe threshold.

- [ ] **Abuse pattern detection** — Log request metadata (IP, timestamp, image count, response time) and alert on spikes. Even basic structured logging to Vercel Log Drains or a service like Axiom gives visibility.

### Content Moderation

- [ ] **NSFW / harmful image filtering** — Users can upload arbitrary images. Add a content moderation pass (e.g. using a dedicated moderation API or Claude's own moderation endpoint) before forwarding to the listing model, to prevent the platform being used to generate listings for prohibited items.

- [ ] **Output content policy check** — Validate that Claude's generated listing doesn't contain policy-violating content (e.g. listings for weapons, drugs, counterfeit goods). A simple keyword blocklist plus a secondary Claude moderation call would suffice for MVP.

### Infrastructure & Secrets

- [ ] **Environment variable validation at startup** — Currently the API key check is per-request. Add a startup-time check (e.g. in `next.config.ts`) that fails the build/deploy if required env vars are missing or malformed.

- [ ] **Secret rotation strategy** — Document a process for rotating `ANTHROPIC_API_KEY` without downtime. Consider using Vercel's environment variable versioning or a secrets manager (Doppler, Infisima).

- [ ] **Error message hardening** — Some error responses include raw error messages (`err.message`) which can leak internal details (model names, SDK internals). Normalise all 500 responses to a generic message in production, and log the detail server-side only.

### Headers & Browser Security

- [ ] **Content Security Policy (CSP) headers** — Add strict CSP headers via `next.config.ts` `headers()` to prevent XSS, clickjacking, and data exfiltration. At minimum: `default-src 'self'`, restricted `script-src`, `frame-ancestors 'none'`.

- [ ] **Security headers audit** — Run the app through securityheaders.com and add missing headers: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

### Monitoring & Incident Response

- [ ] **Structured request logging** — Add structured logs (JSON) for every API call including: timestamp, endpoint, image count, model used, token usage, latency, and anonymised IP hash. Ship to a log aggregator.

- [ ] **Alerting on error rate spikes** — Set up alerts if 5xx error rate on `/api/analyse` or `/api/group` exceeds a threshold — could indicate prompt injection attack, model outage, or abuse.

- [ ] **Incident response runbook** — Document what to do if the API key is leaked, if costs spike unexpectedly, or if the model starts returning harmful content. Even a short internal doc reduces response time significantly.
