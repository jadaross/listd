"use client";

import type { Screen } from "./TabBar";

/**
 * Mobile-first device frame. On desktop, centers a ~430px column with the warm
 * background filling the page — the same layout as the iOS app, just framed for
 * a deploy-anywhere preview.
 */
export function RootShell({
  screen,
  header,
  children,
}: {
  screen: Screen;
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh w-full flex items-stretch justify-center bg-app-bg">
      <div className="relative w-full max-w-[430px] min-h-dvh bg-app-bg flex flex-col overflow-hidden">
        {header}
        <div
          key={screen}
          className="flex-1 overflow-y-auto no-scrollbar screen-enter"
          style={{ paddingBottom: 24 }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
