"use client";

import type { Currency } from "@/lib/currency";
import { CURRENCY_LIST, CURRENCIES } from "@/lib/currency";

interface Props {
  currency: Currency;
  onChange: (c: Currency) => void;
}

export default function CurrencySelector({ currency, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Currency
      </span>
      <div className="flex gap-1.5">
        {CURRENCY_LIST.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
              currency === c
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
            }`}
          >
            {CURRENCIES[c].symbol} {c}
          </button>
        ))}
      </div>
    </div>
  );
}
