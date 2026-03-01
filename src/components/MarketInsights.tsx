"use client";

import type { MarketInsights, MarketIntelligence, PlatformPriceData, Platform } from "@/lib/types";

interface Props {
  data: MarketInsights | null;
  loading: boolean;
}

function formatPrice(p: number | null | undefined, currency = "GBP"): string {
  if (p === null || p === undefined) return "—";
  const symbol = currency === "GBP" ? "£" : currency;
  return `${symbol}${p.toFixed(2).replace(/\.00$/, "")}`;
}

const PLATFORM_COLOURS: Record<Platform, { bg: string; text: string; badge: string }> = {
  depop: { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-600" },
  vinted: { bg: "bg-teal-50", text: "text-teal-700", badge: "bg-teal-600" },
  ebay: { bg: "bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-500" },
};

const PLATFORM_LABELS: Record<Platform, string> = {
  depop: "Depop",
  vinted: "Vinted",
  ebay: "eBay",
};

const LIKELIHOOD_CONFIG = {
  high: { dots: 3, colour: "bg-emerald-500", label: "High chance of selling", text: "text-emerald-700" },
  medium: { dots: 2, colour: "bg-amber-400", label: "Moderate chance of selling", text: "text-amber-700" },
  low: { dots: 1, colour: "bg-red-400", label: "Lower chance of selling", text: "text-red-600" },
};

function LikelihoodPill({ likelihood }: { likelihood: MarketIntelligence["sell_likelihood"] }) {
  const cfg = LIKELIHOOD_CONFIG[likelihood];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
      <span className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${i <= cfg.dots ? cfg.colour : "bg-gray-200"}`}
          />
        ))}
      </span>
      {cfg.label}
    </span>
  );
}

function RecommendationCard({
  intelligence,
}: {
  intelligence: MarketIntelligence;
}) {
  const colours = PLATFORM_COLOURS[intelligence.recommended_platform];

  return (
    <div className={`rounded-xl px-4 py-3.5 ${colours.bg} border border-opacity-20`}>
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className={`text-xs font-bold uppercase tracking-wider ${colours.text}`}>
          Best platform
        </span>
        <span className={`px-2.5 py-0.5 rounded-full text-white text-xs font-bold ${colours.badge}`}>
          {PLATFORM_LABELS[intelligence.recommended_platform]}
        </span>
        <span className={`text-sm font-bold ${colours.text}`}>
          List at {formatPrice(intelligence.recommended_price)}
        </span>
      </div>
      <div className="mb-2">
        <LikelihoodPill likelihood={intelligence.sell_likelihood} />
      </div>
      <p className={`text-xs leading-relaxed ${colours.text} opacity-90`}>
        {intelligence.platform_reasoning}
      </p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl px-4 py-3.5 bg-gray-100 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-3 w-12 bg-gray-200 rounded" />
      </div>
      <div className="h-3 w-36 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-full bg-gray-200 rounded mb-1" />
      <div className="h-3 w-3/4 bg-gray-200 rounded" />
    </div>
  );
}

function EbayRow({ data, loading }: { data: PlatformPriceData | undefined; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-start justify-between py-2.5 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-500">eBay</span>
        <div className="flex flex-col items-end gap-1">
          <div className="h-3 w-28 bg-gray-100 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const hasActive = data && data.count > 0 && data.median !== null;
  const hasSold = data && (data.sold_count ?? 0) > 0 && data.sold_median !== null;

  return (
    <div className="flex items-start justify-between py-2.5 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600">eBay</span>
      <div className="flex flex-col items-end gap-0.5">
        {hasSold ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-semibold text-emerald-700">
              {formatPrice(data!.sold_median, data!.currency)} sold
            </span>
            <span className="text-xs text-gray-400">({data!.sold_count} comps)</span>
          </div>
        ) : null}
        {hasActive ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-gray-900">
              {formatPrice(data!.median, data!.currency)} active
            </span>
            <span className="text-xs text-gray-400">({data!.count} listed)</span>
          </div>
        ) : (
          !hasSold && <span className="text-xs text-gray-400 italic">No results</span>
        )}
      </div>
    </div>
  );
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

  const intelligence = data?.intelligence ?? null;

  // Check if we got any real data at all
  const hasAnyData =
    data &&
    ((data.ebay?.count ?? 0) > 0 ||
      (data.vinted?.count ?? 0) > 0 ||
      (data.depop?.count ?? 0) > 0);

  // Show setup prompt if load finished but no data came back
  if (!loading && data && !hasAnyData) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Market insights
        </p>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 space-y-1.5">
          <p className="text-sm font-medium text-gray-700">Live pricing not configured</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Add the following to <code className="bg-gray-100 px-1 rounded">.env.local</code> to
            see real market prices and platform recommendations:
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs font-mono text-gray-600">
              SERPAPI_KEY=…{" "}
              <span className="text-gray-400 font-sans">— Vinted &amp; Depop prices</span>
            </p>
            <p className="text-xs font-mono text-gray-600">
              EBAY_CLIENT_ID / SECRET{" "}
              <span className="text-gray-400 font-sans">— eBay live data</span>
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            SerpAPI free tier: 100 searches/month.{" "}
            <a
              href="https://serpapi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              serpapi.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Market insights
        </p>
        {data?.query && (
          <span className="text-[10px] text-gray-300 font-mono truncate max-w-[160px]">
            {data.query}
          </span>
        )}
      </div>

      {/* Recommendation card */}
      <div className="mb-4">
        {loading && !intelligence ? (
          <SkeletonCard />
        ) : intelligence ? (
          <RecommendationCard
            intelligence={intelligence}
          />
        ) : null}
      </div>

      {/* Key insight */}
      {intelligence?.key_insight && (
        <div className="flex gap-2 bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 mb-4">
          <span className="text-base leading-none mt-0.5">💡</span>
          <p className="text-xs text-gray-600 leading-relaxed">{intelligence.key_insight}</p>
        </div>
      )}
      {loading && !intelligence && (
        <div className="flex gap-2 bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 mb-4 animate-pulse">
          <div className="h-3 w-full bg-gray-100 rounded" />
        </div>
      )}

      {/* Platform data table */}
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
        Platform data
      </p>
      <div>
        <EbayRow data={data?.ebay} loading={loading} />
        <PlatformRow label="Vinted" data={data?.vinted} loading={loading} />
        <PlatformRow label="Depop" data={data?.depop} loading={loading} />
      </div>
    </div>
  );
}
