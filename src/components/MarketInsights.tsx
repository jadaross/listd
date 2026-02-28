"use client";

import type { MarketInsights, PlatformPriceData } from "@/lib/types";

interface Props {
  data: MarketInsights | null;
  loading: boolean;
}

function formatPrice(p: number | null, currency = "GBP"): string {
  if (p === null) return "—";
  const symbol = currency === "GBP" ? "£" : currency;
  return `${symbol}${p.toFixed(2).replace(/\.00$/, "")}`;
}

function PlatformRow({
  label,
  data,
  loading,
}: {
  label: string;
  data: PlatformPriceData | undefined;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className="flex gap-2 items-center">
          <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const hasData = data && data.count > 0 && data.median !== null;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      {hasData ? (
        <div className="flex items-baseline gap-2 text-right">
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(data.median, data.currency)}
          </span>
          <span className="text-xs text-gray-400">
            {formatPrice(data.min, data.currency)}–{formatPrice(data.max, data.currency)}{" "}
            <span className="text-gray-300">({data.count} listings)</span>
          </span>
        </div>
      ) : (
        <span className="text-xs text-gray-400 italic">No results</span>
      )}
    </div>
  );
}

export default function MarketInsights({ data, loading }: Props) {
  if (!loading && !data) return null;

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Market prices
        </p>
        {data?.query && (
          <span className="text-[10px] text-gray-300 font-mono truncate max-w-[160px]">
            {data.query}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-3 leading-relaxed">
        Live prices from active listings — median price with range shown.
      </p>
      <div>
        <PlatformRow label="eBay" data={data?.ebay} loading={loading} />
        <PlatformRow label="Vinted" data={data?.vinted} loading={loading} />
        <PlatformRow label="Depop" data={data?.depop} loading={loading} />
      </div>
    </div>
  );
}
