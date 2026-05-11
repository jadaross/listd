// Chip vocabulary shared with the iOS app (FeedbackChip in ios/Listd/Models.swift).
// Both clients send the same `instruction` strings to /api/refine.

export type ChipId =
  | "shorter"
  | "longer"
  | "casual"
  | "serious"
  | "measurements"
  | "hashtags"
  | "condition"
  | "vintage";

export const CHIPS: { id: ChipId; label: string; instruction: string }[] = [
  { id: "shorter",      label: "Shorter",            instruction: "Rewrite shorter — cut to the essentials, drop filler." },
  { id: "longer",       label: "More detail",        instruction: "Add more useful detail without padding or repetition." },
  { id: "casual",       label: "More casual",        instruction: "Make it more casual and conversational — natural, friendly, not corporate." },
  { id: "serious",      label: "Less serious",       instruction: "Tone down the emojis and fashion-speak; keep it plain and honest." },
  { id: "measurements", label: "+ Measurements",     instruction: 'Add a measurements section: chest 23", length 26", sleeve 25" (only if not already present).' },
  { id: "hashtags",     label: "+ Hashtags",         instruction: "Expand the hashtags/keywords array with relevant search terms (no duplicates)." },
  { id: "condition",    label: "Stress condition",   instruction: "Stress the condition: be explicit that there are no rips, stains, smells, or repairs, and that the lining is intact." },
  { id: "vintage",      label: "More vintage feel",  instruction: "Lean into the vintage angle — mention era (90s/2000s) and broken-in character." },
];

export function instructionsFor(chipIds: Iterable<ChipId>): string[] {
  const set = new Set(chipIds);
  return CHIPS.filter((c) => set.has(c.id)).map((c) => c.instruction);
}
