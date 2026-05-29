"use client";

export type Screen =
  | "home"
  | "confirm"
  | "generating"
  | "results"
  | "recommendation"
  | "scout-checking"
  | "scout-result"
  | "history"
  | "settings";

const NEW_FLOW: Screen[] = [
  "home",
  "confirm",
  "generating",
  "results",
  "recommendation",
  "scout-checking",
  "scout-result",
];

export function TabBar({
  screen,
  onNav,
}: {
  screen: Screen;
  onNav: (s: Screen) => void;
}) {
  const activeNew = NEW_FLOW.includes(screen);
  const tabs: { key: Screen; label: string; icon: React.ReactNode; isActive: boolean }[] = [
    {
      key: "home",
      label: "New",
      isActive: activeNew,
      icon: (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
          <rect x="3" y="3" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="1.8" />
          <path d="M13 9v8M9 13h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "history",
      label: "Listings",
      isActive: screen === "history",
      icon: (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
          <rect x="4" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="1.6" />
          <path d="M7 9h12M7 13h12M7 17h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "settings",
      label: "You",
      isActive: screen === "settings",
      icon: (
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden>
          <circle cx="13" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
          <path d="M5 22c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className="absolute bottom-0 inset-x-0 h-[78px] pt-2 pb-[18px] flex items-start justify-around border-t border-app-line z-10"
      style={{ background: "rgba(246, 242, 235, 0.9)", backdropFilter: "blur(20px) saturate(160%)" }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onNav(t.key)}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium ${
            t.isActive ? "text-app-accent" : "text-app-muted"
          }`}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
