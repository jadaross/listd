import type { ReactNode } from "react";

// The one non-API surface. ADR-0001 removed the web UI; this exists because
// App Store Connect requires a privacy policy at a public URL, and the page
// below is that URL. Nothing else should be added here.
export const metadata = { title: "bower" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#FBF7EF", color: "#1B1A20", fontFamily: "Georgia, serif" }}>
        {children}
      </body>
    </html>
  );
}
