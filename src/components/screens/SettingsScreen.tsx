"use client";

import { useRouter } from "next/navigation";
import EbayConnect from "@/components/EbayConnect";
import { Eyebrow } from "@/components/ui/Eyebrow";

export function SettingsScreen() {
  const router = useRouter();
  const sections: { title: string; rows: { label: string; value: string }[] }[] = [
    {
      title: "Account",
      rows: [
        { label: "Currency", value: "GBP" },
        { label: "Default tone", value: "Auto" },
      ],
    },
    {
      title: "Generation",
      rows: [
        { label: "Auto-add measurements", value: "On" },
        { label: "Include hashtags by default", value: "Depop only" },
        { label: "Photo coaching", value: "On" },
      ],
    },
  ];

  return (
    <div className="px-[22px] pt-1 pb-[110px] flex flex-col gap-5">
      {/* Profile */}
      <div className="flex gap-3.5 items-center py-1">
        <div
          className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[20px] font-semibold"
          style={{ background: "rgba(200, 50, 26, 0.13)", color: "var(--color-app-accent)" }}
        >
          EM
        </div>
        <div>
          <div className="text-[17px] font-semibold text-app-text">Ellie M.</div>
          <div className="text-[13px] text-app-muted">wattle Pro · 47 listings</div>
        </div>
      </div>

      {/* eBay connect — real OAuth flow, kept inside Settings */}
      <div className="flex flex-col gap-2">
        <Eyebrow className="pl-1">Connections</Eyebrow>
        <div className="bg-app-card rounded-[14px] border border-app-line p-3.5">
          <EbayConnect />
        </div>
      </div>

      {sections.map((s) => (
        <div key={s.title} className="flex flex-col gap-2">
          <Eyebrow className="pl-1">{s.title}</Eyebrow>
          <div className="bg-app-card rounded-[14px] border border-app-line overflow-hidden">
            {s.rows.map((r, i) => (
              <div
                key={r.label}
                className={`px-4 py-3.5 flex justify-between items-center ${
                  i > 0 ? "border-t border-app-line" : ""
                }`}
              >
                <div className="text-[14px] text-app-text">{r.label}</div>
                <div className="text-[14px] text-app-muted flex items-center gap-1.5">
                  {r.value}
                  <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                    <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Help */}
      <div className="flex flex-col gap-2">
        <Eyebrow className="pl-1">Help</Eyebrow>
        <div className="bg-app-card rounded-[14px] border border-app-line overflow-hidden">
          <button
            type="button"
            onClick={() => router.push("/onboarding?from=tour")}
            className="w-full px-4 py-3.5 flex justify-between items-center text-left hover:bg-app-subtle/60"
          >
            <div className="text-[14px] text-app-text">How to use wattle</div>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden className="text-app-muted">
              <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
