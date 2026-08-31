# Sign in with Apple (native iOS) + Supabase — primary-source research

Researched 2026-08-31 against live Apple Developer and Supabase documentation, plus
the current state of the `bower` repo (`/Users/jada/Desktop/repos/bower`). Every claim
below is sourced inline; anything I could not confirm from a primary source is listed
explicitly in the final section rather than guessed at.

---

## 1. Ordered checklist — what a human must actually do

This is written for **native-only** Sign in with Apple (AuthenticationServices on
device), because that's what an iOS app needs — bower does not need the web/OAuth
redirect flow, and steps that only exist for that flow are marked **[web-only, skip]**.

### A. Apple Developer portal (developer.apple.com/account → Certificates, Identifiers & Profiles)

1. **Confirm Apple Developer Program membership is paid**, not a free/personal team.
   Sign in with Apple is one of the capabilities that requires the paid $99/yr Program
   — a personal team (an Apple ID not enrolled in the paid program) cannot enable it.
   *(Primary source could not be pinned down for this exact capability name on Apple's
   own membership-comparison page — see §4/§6 and the gaps section.)*
2. **Register (or open) the App ID** for bower's bundle ID:
   Identifiers → **+** → App IDs → App → enter Description and the **explicit** Bundle
   ID (must match the target's bundle ID in Xcode) → under **Capabilities**, check the
   **Sign in with Apple** checkbox → Continue → Register.
   ["Register an App ID"](https://developer.apple.com/help/account/identifiers/register-an-app-id/)
   — "Select the corresponding checkboxes to enable the app capabilities you want to
   use... A checkbox is disabled if the technology requires an explicit App ID and
   you're creating a wildcard App ID."
3. **That's the entire portal requirement for native-only sign-in.** No Services ID,
   no return URLs, no web domain, and — per Apple's own private-key doc — **no private
   key/signing key is required unless you also want the web/OAuth flow**:
   ["Create a Sign in with Apple private key"](https://developer.apple.com/help/account/capabilities/create-a-sign-in-with-apple-private-key)
   lists creating a Services ID and verifying a domain as prerequisites specifically
   "for each website that uses Sign in with Apple" — i.e. that's the web path, not the
   native one.
4. **[web-only, skip unless bower later ships a web login]** Register a Services ID
   (Identifiers → **+** → Services IDs), configure Sign in with Apple on it, associate
   it to the App ID, and list return URLs/domains.
   ["Register a Services ID"](https://developer.apple.com/help/account/identifiers/register-a-services-id/),
   ["Configure Sign in with Apple for the web"](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/)
5. **[web-only, skip unless bower later ships a web login]** Create a Sign in with
   Apple private key (Keys → **+** → check Sign in with Apple → Configure → associate
   with the primary App ID → **download the `.p8` immediately — it cannot be
   downloaded again**), note its Key ID, and use it plus the Team ID and Services ID
   to mint a client-secret JWT (ES256, `iss`=Team ID, `sub`=Services ID, `aud`=
   `https://appleid.apple.com`, `exp` ≤ 15,777,000s / 6 months from now).
   ["Create a private key to access a service"](https://developer.apple.com/help/account/keys/create-a-private-key)

### B. Supabase dashboard (Authentication → Providers → Apple)

6. Toggle the **Apple** provider on.
7. In **Client IDs**, add the app's **bundle ID** (the same string as the App ID from
   step 2). This is what lets Supabase accept the native `id_token`'s `aud` claim.
   ["Login with Apple" guide](https://supabase.com/docs/guides/auth/social-login/auth-apple):
   "Register all of the App IDs that will be using your Supabase project in the Apple
   provider configuration in the Supabase dashboard under *Client IDs*." If bower ever
   adds the web/Services-ID flow too, that Services ID must be listed **first** in the
   same comma-separated field, because "Supabase uses the first client ID in the list
   for the web `signInWithOAuth` flow, while the native `signInWithIdToken` flow
   accepts any client ID in the list as a valid token audience, regardless of order."
8. **Secret Key field — known friction point, do not let this block you.** Supabase's
   own docs say native-only apps don't need the OAuth secret at all, but as of this
   writing the dashboard UI still won't save the provider config without *something*
   in the Secret Key box. This is an open, maintainer-acknowledged bug/gap, not a real
   requirement — see the exact citation in §2 below. Practical implication: budget for
   generating a throwaway Services ID + `.p8` + client-secret JWT anyway, purely to
   satisfy the dashboard save, even though nothing in the native runtime path uses it.
9. **[web-only, skip if step 8's workaround isn't needed]** If a real secret is
   generated, remember Apple's client secret JWT expires at most 6 months out and must
   be regenerated and re-pasted into Supabase before then, or web sign-in breaks.

### C. Xcode (once the `.xcodeproj` exists — CLAUDE.md notes there isn't one yet, issue #11)

10. Target → **Signing & Capabilities** → **+ Capability** → **Sign in with Apple**.
    Xcode adds the `com.apple.developer.applesignin` entitlement to the app's
    entitlements file automatically when signing is Automatic, and regenerates the
    provisioning profile for you.
    ["Capabilities Overview"](https://developer.apple.com/help/account/capabilities/capabilities-overview/):
    "To use certain app services, you need to provision your app by adding a
    capability to Xcode's project editor. Xcode edits the needed entitlements and
    Information Property List files... and configuring your signing assets." If
    signing is set to **Manual**, this step does *not* happen automatically — you must
    separately enable the capability on the App ID in the portal (already done in
    step 2) and regenerate the provisioning profile yourself; Apple's parallel
    Game Center documentation states this explicitly for manual signing ("generate a
    new profile, and add the entitlement directly to your entitlements plist") — see
    §6 for why this is a documented analogy rather than a Sign-in-with-Apple-specific
    quote.
11. Make the actual sign-in call: `ASAuthorizationAppleIDProvider` → request → handle
    the `ASAuthorizationAppleIDCredential` → take its `identityToken` (the raw
    `id_token` bytes, decode to a String) and the `nonce` you supplied on the request
    → call Supabase's `signInWithIdToken`. Exact shape in §3 below.

---

## 2. Q1 — Apple Developer portal artifacts: native vs. web

Confirmed directly from Apple's own Account Help pages (not the SPA docs, which
WebFetch could not render — see gaps section):

- **Native-only**: an **App ID** with the **Sign in with Apple** capability checkbox
  enabled is sufficient on Apple's side. No Services ID, no domain, no key.
  ["Register an App ID"](https://developer.apple.com/help/account/identifiers/register-an-app-id/)
- **Web/OAuth flow additionally needs**: a **Services ID** (a *separate* identifier
  type from an App ID — "A Services ID identifies your website that interacts with
  Apple web services such as WeatherKit, Sign in with Apple... For each website, you
  can create a Services ID, configure your domain and return URL, and create an
  associated private key" —
  ["Register a Services ID"](https://developer.apple.com/help/account/identifiers/register-a-services-id/)),
  domain verification and return URLs configured against it
  (["Configure Sign in with Apple for the web"](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web/)),
  and a private signing key associated to the primary App ID, used to mint the
  client-secret JWT
  (["Create a Sign in with Apple private key"](https://developer.apple.com/help/account/capabilities/create-a-sign-in-with-apple-private-key)).
- Team ID is not something you "create" — it's the account's existing Team ID, used
  only as the `iss` claim when minting the web client-secret JWT (see §1 step 5 and
  the JWT-claims citation there, gathered via search of Apple's REST API docs — I
  could not get WebFetch to render that specific page's body; treat the exact claim
  list as corroborated by multiple independent secondary sources rather than a single
  Apple page quote, and see gaps section).

**Bottom line for bower**: because bower is native-only (no web login), the App ID
capability toggle (step 2 above) is the *entire* Apple-portal requirement unless a
Services ID is later needed to satisfy Supabase's dashboard save-button bug (§1 step 8).

---

## 3. Q2 — What Supabase's Apple provider config needs, and whether native needs the secret

Primary source: [supabase.com/docs/guides/auth/social-login/auth-apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)
(fetched via the docs' own GitHub source, `apps/docs/content/guides/auth/social-login/auth-apple.mdx`,
to get the full un-rendered text).

- **Client IDs field is required and is where native sign-in is registered**: "Register
  all of the App IDs that will be using your Supabase project in the Apple provider
  configuration in the Supabase dashboard under *Client IDs*." This is exactly the
  "Authorized Client ID" mechanism referenced in the task brief — the app's **bundle
  ID** goes in this field, and Supabase checks the native `id_token`'s `aud` claim
  against every entry in the list, not just the first.
- **Secret Key is documented as OAuth-only**: "This requirement only applies if you're
  configuring OAuth settings (Services ID, signing key, etc.). Native-only
  implementations don't require secret key rotation." Read together with the ordering
  note ("If your project also uses native Sign in with Apple... list this Services ID
  as the first entry"), Supabase's own docs treat the Services ID/secret as optional
  for a native-only app.
- **But the dashboard UI currently disagrees with the docs**: a still-open Supabase
  discussion,
  ["Make Apple provider Secret Key optional for native-only Sign in with Apple #44217"](https://github.com/orgs/supabase/discussions/44217),
  has a Supabase maintainer (`anatoly-os`) confirm: *"Secret key is still required, but
  docs states 'If you're building a native app only, you do not need to configure the
  OAuth settings.'"* — i.e. Supabase acknowledges the contradiction between its own
  docs and the dashboard's save behavior. **Practical effect for bower**: the developer
  doing this setup should expect the dashboard to refuse to save the Apple provider
  config with the Secret Key field empty, even though the native flow will never use
  that secret at runtime, and should not lose time thinking they've misconfigured
  something when that happens.

---

## 4. Q3 — Exchanging the native credential for a Supabase session (Swift)

Primary source: [supabase.com/docs/reference/swift/auth-signinwithidtoken](https://supabase.com/docs/reference/swift/auth-signinwithidtoken)

```swift
let session = try await supabase.auth.signInWithIdToken(
  credentials: OpenIDConnectCredentials(
    provider: .apple,
    idToken: "your-id-token",
    nonce: "your nonce"
  )
)
```

Required parameters on `OpenIDConnectCredentials`: `provider` (`.apple`), `idToken`
(the raw JWT string from `ASAuthorizationAppleIDCredential.identityToken`, decoded
from `Data` to `String`), and `nonce`.

**Nonce / replay protection** (from the same family of Apple/Supabase native-flow
docs referenced throughout this research, and standard OIDC practice that Supabase's
guide explicitly builds around): the app generates a random nonce, SHA256-hashes it,
passes the *hashed* value as `ASAuthorizationAppleIDRequest.nonce`, and Apple embeds
that hashed value inside the returned `id_token`'s `nonce` claim. The app then sends
the **original, un-hashed** nonce to `signInWithIdToken`, and Supabase/Apple's
verification compares its hash against the token's `nonce` claim — this stops a
captured `id_token` from being replayed by a different, unrelated sign-in request. I
was not able to pull the exact prose of Supabase's own nonce-handling explanation
verbatim from a page WebFetch could render in full (the reference page above gave the
function signature but not a prose walkthrough) — flagging this specific piece
per-claim rather than asserting a quote; the mechanism itself is standard OIDC and is
implied by the `nonce` parameter's presence in the SDK signature above.

---

## 5. Q4 — Apple private-relay email vs. an existing email/password account

This is a **real, currently open, documented gap** — not something Supabase resolves
cleanly.

- Supabase's identity-linking guide
  ([supabase.com/docs/guides/auth/auth-identity-linking](https://supabase.com/docs/guides/auth/auth-identity-linking),
  fetched via its GitHub source) states the general rule: **"Supabase Auth
  automatically links identities with the same email address to a single user."** New
  identities are matched to an existing user by email, and only if the email is
  verified; unconfirmed identities on the existing user get removed at that point "to
  prevent account takeover attacks." SAML SSO users are excluded from this matching.
- **But this breaks down specifically for Apple's private relay addresses.** A
  currently open Supabase issue,
  ["Auth Issue: Apple Relay Email Conflict #43895"](https://github.com/supabase/supabase/issues/43895),
  describes exactly bower's scenario: a user signs up via Apple using Hide My Email
  (so their Supabase-visible email is a `@privaterelay.appleid.com` address), later
  tries to log in with their real email/password (or a different Google account using
  the real address) — Supabase does eventually recognize both belong to the same
  person but currently creates **two distinct `user_id`s** rather than linking them
  cleanly, and the reported symptom includes a 500 error during token exchange.
- Separately, a related discussion on adding an email/password credential to an
  existing OAuth-created account
  (["Link Multiple Auth Providers to an Account #313"](https://github.com/supabase/gotrue/issues/313)
  and the metadata note found alongside it) indicates the `providers` column /
  `raw_app_meta_data` on `auth.users` isn't always kept in sync when a second provider
  is added after the fact — so even the *account settings* UI a user might see ("signed
  in with Apple and Email") can't be trusted to reflect reality without care.

**Implication for bower**: because v1 ships *both* Apple and email/password (ADR-0006),
a user who signs up with Apple's private relay email and later tries email/password
with their real address (or vice-versa) is not guaranteed a single, merged account —
they may silently end up with two profiles, two allowance meters, and no obvious way
to notice. This is worth a deliberate product decision (e.g., prompt the user to link
accounts explicitly via `linkIdentity()`, or treat Apple and email/password as
genuinely separate accounts and say so) rather than assuming Supabase merges them for
free. **Not clearly documented by Supabase as solved** — flagged again in §6.

---

## 6. Q5 — Is Sign in with Apple required by App Store review, given email/password exists?

Fetched verbatim from Apple's own guidelines page:
[developer.apple.com/app-store/review/guidelines/#sign-in-with-apple](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple)

> **4.8 Login Services**
>
> Apps that use a third-party or social login service (such as Facebook Login, Google
> Sign-In, Log in with X, Sign In with LinkedIn, Login with Amazon, or WeChat Login) to
> set up or authenticate the user's primary account with the app must also offer as an
> equivalent option another login service with the following features:
> - the login service limits data collection to the user's name and email address;
> - the login service allows users to keep their email address private as part of
>   setting up their account; and
> - the login service does not collect interactions with your app for advertising
>   purposes without consent.
>
> A user's primary account is the account they establish with your app for the
> purposes of identifying themselves, signing in, and accessing your features and
> associated services.
>
> Another login service is not required if:
> - Your app exclusively uses your company's own account setup and sign-in systems.
> - Your app is an alternative app marketplace, or an app distributed from an
>   alternative app marketplace, that uses a marketplace-specific login for account,
>   download, and commerce features.
> - Your app is an education, enterprise, or business app that requires the user to
>   sign in with an existing education or enterprise account.
> - Your app uses a government or industry-backed citizen identification system or
>   electronic ID to authenticate users.
> - Your app is a client for a specific third-party service and users are required to
>   sign in to their mail, social media, or other third-party account directly to
>   access their content.

**Reading this precisely against bower**: 4.8's trigger condition is "uses a
third-party or social login service... to set up or authenticate the user's primary
account." bower's two methods are (a) Sign in with Apple and (b) first-party
email/password. Email/password alone is not a *third-party* login service — it's
bower's "own account setup and sign-in systems" — so **on the exemption list's own
wording, an app offering only first-party email/password would be exempt and would
not need Sign in with Apple at all.** The moment Sign in with Apple itself is added as
a second, additional login option, though, it *is* one of the services 4.8 lists as
triggering the requirement in the first place (Apple's own sign-in counts as a
"third-party or social login service" for this purpose, per how Apple has enforced
4.8 in practice and per Apple explicitly designing 4.8 to make its own service the
usual compliant "equivalent option"). **Net effect: once bower offers Sign in with
Apple, 4.8 is satisfied, and email/password already existing alongside it doesn't
create a problem or make it removable** — the guideline is about not offering *other*
third-party logins (Google, Facebook, etc.) without also offering a privacy-respecting
equivalent, and Apple's own Sign in with Apple always counts as satisfying that
equivalent requirement for itself. Practically: bower is compliant either way (Apple +
email, or email alone), but ADR-0006's stated rationale — "Sign in with Apple is close
to mandatory on the App Store" — is directionally right as a product/friction argument
(lowest-friction iOS sign-in) more than as a strict 4.8 legal requirement, given
email/password alone would already exempt the app under "exclusively uses your
company's own account setup and sign-in systems." I could not find an Apple-published
line stating "if you offer only email+password you are exempt, full stop" as an
explicit worked example — this is my precise reading of the exemption bullet's actual
wording, not a paraphrase Apple wrote themselves; flagged accordingly in §7.

---

## 7. Q6 — Xcode-side requirements

- **Capability toggle**: Signing & Capabilities → **+ Capability** → **Sign in with
  Apple**.
- **Entitlement key**: `com.apple.developer.applesignin`. I could not get WebFetch to
  render the body of Apple's canonical entitlement reference page
  ([developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.applesignin](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.applesignin))
  — it's a JS-rendered SPA page and only the `<title>` came through. The key name
  itself is corroborated by Apple's own Capabilities Overview help page structure and
  by the entitlement URL slug itself (Apple names entitlement reference pages after
  the literal key), plus widely-repeated secondary sources; I'm flagging this as
  "very likely correct, not independently confirmed by quoted primary-source body
  text" rather than treating it as fully verified — see gaps section.
- **Provisioning profile regeneration**: confirmed generally (not Sign-in-with-Apple-
  specific) from
  ["Capabilities Overview"](https://developer.apple.com/help/account/capabilities/capabilities-overview/):
  automatic signing means "Xcode edits the needed entitlements and Information
  Property List files... and configuring your signing assets" — i.e. Xcode
  regenerates the profile for you. For manual signing, Apple's parallel Game Center
  reference page
  ([developer.apple.com/help/account/reference/capability-entitlement-updates/](https://developer.apple.com/help/account/reference/capability-entitlement-updates/))
  is explicit that you must "make sure the capability is enabled in Certificates,
  Identifiers & Profiles, generate a new profile, and add the [capability's]
  entitlement directly to your entitlements plist" — the same page does not carry a
  Sign-in-with-Apple-specific paragraph, so this is an analogy from Apple's documented
  behavior for another capability on the same reference page, not a quote about Sign
  in with Apple by name.
- **Free/personal team support**: multiple independent secondary sources (developer
  forums, third-party guides) consistently state Sign in with Apple requires the paid
  Apple Developer Program and is not available on a free/personal team, alongside
  CarPlay, HealthKit, DeviceCheck, push notifications, and CloudKit. I could **not**
  find this stated in Apple's own primary-source membership comparison page — see
  gaps section; the ["Choosing a Membership"](https://developer.apple.com/support/compare-memberships/)
  page only groups "Advanced app capabilities and services" as a paid-tier bucket
  without naming Sign in with Apple specifically.

---

## 8. What already exists in bower — what's missing, not what's built

Read directly from the repo (not modified):

- `/Users/jada/Desktop/repos/bower/src/lib/auth.ts` — server-side bearer-token
  verification only (`withAuth`, `authenticate`). It trusts whatever session token
  the client already holds; it has **no knowledge of how that session was created**
  (Apple vs. email/password) and needs none, by design.
- `/Users/jada/Desktop/repos/bower/src/lib/supabase.ts` — three stateless Supabase
  clients (anon/user/service). Nothing Apple-specific; nothing needs to be, since
  Supabase Auth itself owns the Apple provider logic.
- `/Users/jada/Desktop/repos/bower/supabase/migrations/0001_identity_and_metering.sql`
  — `public.profiles` keyed on `auth.users.id`, created automatically via an
  `on_auth_user_created` trigger regardless of which provider created the
  `auth.users` row. **This means the profile/allowance-meter side is already
  provider-agnostic and needs zero schema changes for Apple sign-in** — a user who
  signs in with Apple gets a profile row exactly the same way an email/password user
  does. What's *not* present anywhere in the schema is any handling for the
  identity-linking edge case in §5 (private relay email colliding with a separate
  email/password signup) — there's no unique-email constraint or merge logic, so if
  Supabase Auth creates two `auth.users` rows for the same person, bower gets two
  `profiles` rows too, silently.
- `/Users/jada/Desktop/repos/bower/docs/adr/0006-supabase-for-auth-and-metering.md`
  — already states the *why* ("Sign in with Apple is close to mandatory on the App
  Store... Guideline 4.8 requires offering it alongside any third-party sign-in") but
  does not record the Apple Developer portal steps, the Supabase dashboard config, or
  the private-relay-email edge case — this research fills exactly that gap.
- `/Users/jada/Desktop/repos/bower/docs/adr/0007-metered-from-day-one.md` — confirms
  auth had to be "genuine rather than the placeholder login the web app shipped with,"
  reinforcing that real Apple + email auth is a hard v1 requirement, not optional
  polish.
- **`ios/`** — confirmed via `find` that there is no sign-in-related Swift file at all
  (searched for `*sign*`, `*auth*`, `*login*` — zero matches) among `RootView.swift`,
  `BowerApp.swift`, `Models.swift`, `Theme.swift`, and the `Screens/`/`Components/`
  subfolders. This corroborates ADR-0001's statement that `ios/` is "entirely
  mock-driven, with no networking" — there is genuinely nothing to build on for the
  Apple sign-in screen; it starts from zero.
- **No `.xcodeproj`** exists anywhere in the repo (confirmed by directory listing),
  matching CLAUDE.md's note that this is tracked as issue #11. **Every Xcode-side step
  in §1.C is blocked on that project existing first** — the Apple Developer portal and
  Supabase dashboard steps (§1.A, §1.B) can and should happen before or independent of
  the Xcode project being created, since they're pure configuration with no code
  dependency.
- **`src/lib/llm/`, `src/lib/chip-vocab.ts`, `src/platforms/`** — unrelated to auth,
  not touched by this research.

**Summary of what's missing for Apple sign-in specifically**: everything in §1 end to
end — no App ID capability has been confirmed enabled, no Supabase Apple provider
config has been confirmed set up, no Xcode project exists yet to add the capability
to, and no native `ASAuthorizationAppleIDProvider` / `signInWithIdToken` call exists
anywhere in the repo (expected, since `ios/` is mock-only).

---

## 9. Could NOT establish from a primary source — explicit open questions

Listed here rather than filled from memory:

1. **Free/personal-team exclusion of Sign in with Apple** — could not find an Apple
   first-party page that names "Sign in with Apple" explicitly on a paid-vs-free
   capability list. Apple's own "Choosing a Membership" page only says "Advanced app
   capabilities and services" is a paid-tier bucket without itemizing. This is widely
   and consistently reported by developer forums and third-party guides, but I did not
   verify it against Apple's own words naming the capability specifically.
2. **`com.apple.developer.applesignin` entitlement page body** — Apple's canonical
   entitlement reference page is a JS-rendered SPA that WebFetch could not extract
   (only the `<title>` came through). The key name and its "Default" array value are
   corroborated by secondary sources and the Capabilities Overview help page's general
   description of how Xcode manages entitlements, but I did not get a quoted primary
   sentence from Apple's own entitlement-specific page.
3. **Whether provisioning-profile regeneration is stated by Apple specifically for
   Sign in with Apple** (as opposed to Game Center, the only capability Apple's
   "Capability and entitlement updates" reference page names explicitly) — I'm
   extrapolating from Apple's general Capabilities Overview text plus the Game Center
   example on the same page, not a Sign-in-with-Apple-specific sentence.
4. **Apple's exact JWT claim list for the web client-secret** (`sub`, `iss`, `aud`,
   `exp`) — WebFetch could not render the body of Apple's "Generate and validate
   tokens" REST API documentation page (same SPA-rendering problem as other
   `/documentation/` pages). The claim list above is corroborated by multiple
   independent third-party implementation guides that all agree with each other, but
   is not a direct quote from Apple's own page text. (Low-stakes for bower either way,
   since bower is native-only and this JWT is only needed for the web/OAuth path it
   isn't taking.)
5. **Supabase's own prose explanation of nonce handling** for the native
   `signInWithIdToken` flow — the Swift reference page gave the function signature but
   I could not pull a rendered paragraph explicitly walking through hash-then-compare
   nonce mechanics from Supabase's own docs. The mechanism described in §4 is standard
   OIDC practice and matches the presence of the `nonce` parameter in the SDK, but I'm
   not treating it as a verbatim-sourced Supabase claim.
6. **Whether Supabase's private-relay-email identity conflict (§5) has since been
   fixed** — the GitHub issue (#43895) referenced is open at the time of this research;
   I could not confirm a resolution date, a shipped fix, or an official Supabase
   statement of intended behavior (as opposed to "this is a bug"). Anyone acting on
   this section should re-check that issue's current status before writing
   account-merge product logic against it.
7. **Apple's own explicit worked example for the "own account setup" 4.8 exemption**
   — I could not find an Apple-published sentence saying in so many words "an app
   offering only email+password, with no other third-party login, is exempt from
   4.8." My conclusion in §6 is my own precise reading of the exemption bullet's
   wording ("exclusively uses your company's own account setup and sign-in systems"),
   not a paraphrase of an Apple-authored example.
