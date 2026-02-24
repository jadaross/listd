"use client";

import { useState } from "react";
import type { PhotoAnalysis, PhotoScore } from "@/lib/types";

interface Props {
  analysis: PhotoAnalysis;
}

export default function PhotoFeedback({ analysis }: Props) {
  // Auto-expand if there are issues
  const hasIssues =
    analysis.missing_shots.length > 0 ||
    analysis.scores.some((s) => s.quality_score < 4);
  const [expanded, setExpanded] = useState(hasIssues);

  const issueCount =
    analysis.suggestions.length +
    analysis.scores.filter((s) => s.quality_score < 4 && s.issues.length > 0)
      .length;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${
              hasIssues ? "bg-amber-50" : "bg-emerald-50"
            }`}
          >
            {hasIssues ? "📷" : "✅"}
          </span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Photo tips</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {hasIssues
                ? `${issueCount} suggestion${issueCount !== 1 ? "s" : ""}`
                : "All photos look great"}
            </p>
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-gray-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 px-5 pb-5">
          {/* Missing shots / suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                Missing shots
              </p>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <svg
                        width="8"
                        height="8"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#D97706"
                        strokeWidth="3"
                      >
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </span>
                    <p className="text-sm text-gray-600">{suggestion}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Per-photo scores */}
          <div className="mt-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
              Photo quality
            </p>
            <div className="space-y-2">
              {analysis.scores.map((score) => (
                <PhotoScoreRow key={score.index} score={score} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoScoreRow({ score }: { score: PhotoScore }) {
  const badgeStyle =
    score.quality_score >= 4
      ? "bg-emerald-100 text-emerald-700"
      : score.quality_score === 3
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <div className="flex items-start gap-3">
      <span
        className={`px-2 py-0.5 rounded text-[11px] font-semibold shrink-0 mt-0.5 ${badgeStyle}`}
      >
        {score.quality_score}/5
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 capitalize leading-snug">
          Photo {score.index + 1}
          {score.shot_type !== "unknown" && (
            <span className="text-gray-400"> · {score.shot_type}</span>
          )}
        </p>
        {score.issues.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            {score.issues.join(" · ")}
          </p>
        )}
      </div>
    </div>
  );
}
