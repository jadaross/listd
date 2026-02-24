import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "listd — perfect listings, instantly",
  description:
    "Upload photos of your clothes. Get a complete, ready-to-post listing for Vinted or Depop in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
