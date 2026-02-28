"use client";

import CopyButton from "./CopyButton";
import type { Listing, TagData, Platform, Tone } from "@/lib/types";
import { getCategories } from "@/lib/categories";
import type { Gender, MainCategory } from "@/lib/categories";

interface Props {
  listing: Listing;
  tagData: TagData;
  platform: Platform;
  tone: Tone;
  onPlatformChange?: (p: Platform) => void;
  onToneChange?: (t: Tone) => void;
  onRegenerate?: () => void;
}

export default function ListingOutput({
  listing,
  tagData,
  platform,
  tone,
  onPlatformChange,
  onToneChange,
  onRegenerate,
}: Props) {
  const hashtagString = listing.hashtags
    .map((h) => (platform === "depop" && !h.startsWith("#") ? `#${h}` : h))
    .join(" ");

  const detailsText = [
    listing.brand && `Brand: ${listing.brand}`,
    listing.clothing_type && `Type: ${listing.clothing_type}`,
    listing.condition && `Condition: ${listing.condition}`,
    listing.size && `Size: ${listing.size}`,
    listing.material && `Material: ${listing.material}`,
    listing.colour_primary &&
      `Colour: ${listing.colour_primary}${listing.colour_secondary ? ` / ${listing.colour_secondary}` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-3">
      {/* Controls — hidden in bulk mode (no onRegenerate) */}
      {onRegenerate && (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
              Settings
            </span>

            {(["vinted", "depop"] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => onPlatformChange?.(p)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  platform === p
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {p === "vinted" ? "Vinted" : "Depop"}
              </button>
            ))}

            <div className="w-px h-4 bg-gray-200 mx-1" />

            {(["casual", "professional"] as Tone[]).map((t) => (
              <button
                key={t}
                onClick={() => onToneChange?.(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  tone === t
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}

            <button
              onClick={onRegenerate}
              className="ml-auto px-3.5 py-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Regenerate
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Change platform or tone, then hit Regenerate to refresh the listing.
          </p>
        </div>
      )}

      {/* Title */}
      <ListingCard
        label="Title"
        copyText={listing.title}
      >
        <p className="text-gray-900 font-semibold text-base leading-snug">
          {listing.title}
        </p>
      </ListingCard>

      {/* Description */}
      <ListingCard label="Description" copyText={listing.description}>
        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
          {listing.description}
        </p>
      </ListingCard>

      {/* Price */}
      <ListingCard
        label="Suggested price"
        copyText={`£${listing.price_min} – £${listing.price_max}`}
      >
        <p className="text-2xl font-bold text-gray-900">
          £{listing.price_min}{" "}
          <span className="text-gray-400 font-normal text-lg">–</span>{" "}
          £{listing.price_max}
        </p>
        {listing.price_reasoning && (
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            {listing.price_reasoning}
          </p>
        )}
      </ListingCard>

      {/* Details grid */}
      <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Item details
          </p>
          <CopyButton text={detailsText} label="Copy all" />
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {[
            { label: "Brand", value: listing.brand },
            { label: "Type", value: listing.clothing_type },
            { label: "Condition", value: listing.condition },
            { label: "Size", value: listing.size },
            { label: "Material", value: listing.material },
            {
              label: "Colour",
              value: listing.colour_secondary
                ? `${listing.colour_primary} / ${listing.colour_secondary}`
                : listing.colour_primary,
            },
          ]
            .filter((d) => d.value)
            .map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {value}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Listed under — category classification */}
      {listing.gender && listing.main_category && (
        (() => {
          const cats = getCategories(
            listing.gender as Gender,
            listing.main_category as MainCategory
          );
          return (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Listed under
              </p>
              <div className="space-y-2">
                <TagRow label="Vinted" value={cats.vinted} />
                <TagRow label="Depop" value={cats.depop} />
                <TagRow label="eBay" value={cats.ebay.name} />
              </div>
              {listing.subcategory && (
                <p className="text-xs text-gray-400 mt-2">
                  Item type: <span className="font-medium text-gray-500">{listing.subcategory}</span>
                </p>
              )}
            </div>
          );
        })()
      )}

      {/* Hashtags / Keywords */}
      {listing.hashtags.length > 0 && (
        <ListingCard
          label={platform === "depop" ? "Hashtags" : "Keywords"}
          copyText={hashtagString}
        >
          {platform === "depop" ? (
            <div className="flex flex-wrap gap-2">
              {listing.hashtags.map((tag) => {
                const display = tag.startsWith("#") ? tag : `#${tag}`;
                return (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
                  >
                    {display}
                  </span>
                );
              })}
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {listing.hashtags.join(", ")}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Vinted doesn&apos;t use hashtags — weave these keywords into
                your title and description for better search visibility.
              </p>
            </div>
          )}
        </ListingCard>
      )}

      {/* Tag data (if extracted) */}
      {(tagData.rn_number ||
        tagData.fabric_composition ||
        tagData.country_of_manufacture ||
        tagData.care_instructions) && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Extracted from tag
          </p>
          <div className="space-y-2">
            {tagData.rn_number && (
              <TagRow label="RN number" value={tagData.rn_number}>
                <span className="text-gray-400 text-xs ml-2">
                  — useful for dating vintage items
                </span>
              </TagRow>
            )}
            {tagData.fabric_composition && (
              <TagRow label="Fabric" value={tagData.fabric_composition} />
            )}
            {tagData.country_of_manufacture && (
              <TagRow
                label="Made in"
                value={tagData.country_of_manufacture}
              />
            )}
            {tagData.care_instructions && (
              <TagRow label="Care" value={tagData.care_instructions} />
            )}
            {tagData.style_number && (
              <TagRow label="Style no." value={tagData.style_number} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({
  label,
  copyText,
  children,
}: {
  label: string;
  copyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        <CopyButton text={copyText} />
      </div>
      {children}
    </div>
  );
}

function TagRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2 text-xs">
      <span className="text-gray-400 w-16 shrink-0">{label}</span>
      <span className="text-gray-700 font-medium">{value}</span>
      {children}
    </div>
  );
}
