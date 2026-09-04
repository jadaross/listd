export const metadata = { title: "bower — privacy" };

const updated = "4 September 2026";

export default function Privacy() {
  return (
    <main style={{ maxWidth: "38rem", margin: "0 auto", padding: "3rem 1.5rem 5rem", lineHeight: 1.6 }}>
      <p style={{ fontSize: "2rem", fontStyle: "italic", margin: 0 }}>
        bower<span style={{ color: "#E1563C" }}>.</span>
      </p>
      <h1 style={{ fontWeight: 400, fontSize: "1.75rem", marginTop: "1.5rem" }}>Privacy</h1>
      <p style={{ color: "#86807A" }}>Last updated {updated}</p>

      <p>
        bower values a secondhand item from photographs and writes the listing for you. This page
        says exactly what it collects, where that goes, and what it keeps — which is very little.
      </p>

      <h2>What bower collects</h2>
      <ul>
        <li>
          <strong>Your Apple ID sign-in.</strong> Signing in with Apple gives bower an account
          identifier and, if you chose to share it, an email address. If you used Hide My Email,
          bower sees only Apple&rsquo;s relay address.
        </li>
        <li>
          <strong>The photos you choose to send.</strong> They are sent to be read once. They are
          not stored — not on bower&rsquo;s servers, and not anywhere else bower controls.
        </li>
        <li>
          <strong>Your platform preferences and usage count.</strong> Which platforms you sell on,
          which one you prefer, and how many reads and searches you have used this month.
        </li>
      </ul>

      <h2>Where it goes</h2>
      <ul>
        <li>
          <strong>Anthropic</strong> reads the photos and writes the listing text. Photos and the
          resulting text pass through Anthropic&rsquo;s API for that purpose and no other.
        </li>
        <li>
          <strong>Supabase</strong> holds your sign-in and your preferences.
        </li>
        <li>
          <strong>Vercel</strong> hosts bower&rsquo;s backend.
        </li>
      </ul>
      <p>
        bower has no analytics, no advertising, and no tracking. It does not sell or share your
        data with anyone for any purpose beyond running the app.
      </p>

      <h2>What bower keeps</h2>
      <p>
        No photos. No listings. No history. The only things that persist are your account and your
        preferences, and they exist so you do not have to sign in and set up every time.
      </p>

      <h2>Deleting your account</h2>
      <p>
        Settings → Delete account. It removes your sign-in and your preferences immediately. There
        is nothing else to delete.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about any of this: <a href="mailto:jada-ross@hotmail.com" style={{ color: "#2B3AA8" }}>jada-ross@hotmail.com</a>.
      </p>
    </main>
  );
}
