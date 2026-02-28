"use client";

import { useEffect, useState } from "react";
import type { EbayConnectionStatus } from "@/lib/types";

export default function EbayConnect() {
  const [status, setStatus] = useState<EbayConnectionStatus | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/ebay/status")
      .then((r) => r.json())
      .then((data: EbayConnectionStatus) => setStatus(data))
      .catch(() => setStatus({ connected: false, username: null, expiresAt: null }));
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/auth/ebay/disconnect", { method: "DELETE" });
      setStatus({ connected: false, username: null, expiresAt: null });
    } finally {
      setDisconnecting(false);
    }
  }

  // Loading
  if (status === null) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse" />
        <span className="text-xs text-gray-400">Checking eBay…</span>
      </div>
    );
  }

  if (status.connected) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
        <span className="text-xs text-gray-600">
          eBay{status.username ? `: ${status.username}` : ""} connected
        </span>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          {disconnecting ? "Disconnecting…" : "Disconnect"}
        </button>
      </div>
    );
  }

  return (
    <a
      href="/api/auth/ebay/connect"
      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
    >
      Connect eBay account
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  );
}
