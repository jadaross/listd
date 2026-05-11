"use client";

import { HISTORY_FIXTURES, MOCK_PHOTOS } from "@/lib/mock-data";
import { PhotoTile } from "@/components/ui/PhotoTile";
import { StatBlock } from "@/components/ui/StatBlock";

export function HistoryScreen() {
  return (
    <div className="px-[22px] pt-1 pb-[110px] flex flex-col gap-3.5">
      <div className="bg-app-card rounded-2xl p-4 border border-app-line flex">
        <div className="flex-1"><StatBlock label="Listed" value="12" /></div>
        <div className="flex-1"><StatBlock label="Sold"   value="7"  /></div>
        <div className="flex-1"><StatBlock label="Earned" value="£284" /></div>
      </div>

      <div className="flex flex-col gap-2">
        {HISTORY_FIXTURES.map((it, idx) => (
          <div
            key={idx}
            className="bg-app-card rounded-[14px] px-3.5 py-3 border border-app-line flex items-center gap-3"
          >
            <PhotoTile
              photo={MOCK_PHOTOS[idx % MOCK_PHOTOS.length]}
              rounded={9}
              showLabel={false}
              className="w-11 h-11"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-app-text truncate">{it.title}</div>
              <div className="text-[12px] text-app-muted">{it.platform} · {it.when}</div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-semibold text-app-text">£{it.price}</div>
              <div
                className="text-[10px] uppercase tracking-[0.08em] font-semibold"
                style={{ color: it.status === "sold" ? "#1f8a5b" : "var(--color-app-muted)" }}
              >
                {it.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
