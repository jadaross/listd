# Vinted API Query — User-Level OAuth

**To:** See contact notes below
**Subject:** Developer Inquiry — User-Level OAuth API for Third-Party Integrations

---

## How to find the right contact

Vinted doesn't publish a developer relations or API inquiry email publicly. Try:

1. **Vinted Pro portal** — `https://pro-portal.svc.vinted.com` (requires a Pro business account to access; the contact form may be inside)
2. **LinkedIn** — Search "Vinted" + "Developer Relations", "Business Development", or "API" — reaching out directly to a relevant team member often works better than a generic inquiry email
3. **General business contact** — `business@vinted.com` or `pro@vinted.com` (not confirmed — check vinted.com/about or the footer)
4. **Vinted Pro documentation page** — `https://pro-docs.svc.vinted.com` may list a support contact for API partners

---

## Email template

**Subject:** Developer Inquiry — User-Level OAuth for Third-Party Seller Tools

---

Hi Vinted team,

I'm a developer building **Listd**, an AI-powered listing assistant for secondhand clothing sellers. The app helps sellers create better Vinted listings faster — uploading photos, reading care labels, and generating complete listings with titles, descriptions, suggested prices, and category tags.

I've read the Vinted Pro Integrations API documentation carefully and I have a question about the roadmap.

The current Vinted Pro API uses HMAC-SHA256 authentication with a single business account credential set, which is well-suited for brands and wholesalers managing their own inventory. However, for a tool like Listd — where individual sellers want to connect their personal Vinted accounts and post listings on their own behalf — this architecture isn't a fit, as there's no user-level OAuth flow.

**My question is:** Is Vinted planning to introduce an OAuth 2.0 authorization flow (similar to how Depop's Partner API works) that would allow third-party tools to request permission from individual sellers and act on their behalf? This is the standard mechanism for tools like crosslisting apps, listing assistants, and inventory managers that serve individual sellers rather than single businesses.

If this is on the roadmap, I'd love to know approximately when it might be available and whether there's a developer waitlist or early partner programme I could join.

If it's not currently planned, is there any alternative architecture you'd recommend for a tool that wants to integrate with Vinted in a user-authorised way?

I'm also happy to discuss what Listd does in more detail — I think there's a genuine opportunity for tools that help Vinted's casual sellers (the majority of the platform) list more items with better quality, which benefits both sellers and buyers.

Thanks for your time, and for building the best secondhand platform in Europe.

Best,
[Your name]
[Your email]
[LinkedIn / portfolio URL]

---

## Why this matters (context for your own notes)

The Vinted Pro API is architecturally a B2B tool — one business, one credential set. This means even if you were an approved partner, you could only manage your *own* Vinted Pro inventory, not post on behalf of your users. Until Vinted introduces user-level OAuth, direct auto-posting to individual Vinted accounts via an official API isn't possible for a multi-user SaaS. This email is asking them to confirm whether that's changing.

In the meantime, Listd generates listing content and users copy-paste it into Vinted. That's the right MVP approach — but this email starts the relationship and puts you in the queue if they build it.
