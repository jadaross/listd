# Bower iOS

Native SwiftUI app — port of the `Bower iOS Prototype` design (Claude Design handoff bundle).

## Setup (one-time, ~30 seconds)

1. Open Xcode → **File → New → Project…**
2. Choose **iOS → App**, click Next
3. Settings:
   - **Product Name:** `Bower`
   - **Interface:** SwiftUI
   - **Language:** Swift
   - **Storage:** None
   - Bundle identifier: e.g. `com.bower.app`
4. Save location: this `ios/` directory (so the project sits at `ios/Bower.xcodeproj`)
5. In the Project Navigator, **delete the auto-generated `ContentView.swift` and `BowerApp.swift`** (move to trash) — the ones in this folder replace them.
6. Right-click the `Bower` group → **Add Files to "Bower"…** → select the `Bower/` folder in this directory → make sure "Create folder references" is selected → Add. (Xcode 16+ filesystem-synced folders work great here.)
7. Set deployment target to **iOS 17.0**.
8. Build & run on the iPhone 15 Pro simulator.

## Optional: nicer fonts

The prototype uses **Instrument Serif** (wordmark) and **Geist** (UI). The app falls back to the system serif (New York) and SF Pro out of the box. To match the design more closely:

1. Download both from Google Fonts.
2. Drag `.ttf` files into the Xcode project (copy items, add to target).
3. In **Info.plist** add the `UIAppFonts` array with each filename. Then change references in `Theme.swift` to use the custom font names.

## Backend

The screens render mock data (matching the prototype) and do no networking at
all. See ADR-0001 — these files are a visual reference; the real app gets built
beside them.

When you wire up a real client, the routes are deployed from this repo and run
on the **Node runtime**, not the edge (ADR-0002):

| Route | Purpose |
|---|---|
| `POST /api/analyse` | Photos → photo scores, tag data, and a Neutral Listing. Streams SSE. |
| `POST /api/valuate` | An item → a Price Band per Enabled Platform, plus a Recommendation. Spends one Allowance unit. |
| `POST /api/format` | Neutral Listing + platform + tone → a Platform-formatted Listing |
| `POST /api/refine` | A Platform-formatted Listing + Refinement Chips → a rewritten one |
| `GET` / `PATCH /api/profile` | The caller's Enabled Platforms and Allowance |

**Every route requires a Supabase bearer token** — there are no anonymous
requests (ADR-0007). Sign in with Apple is issue #15 and has to land before any
of these can be called.

The JSON shapes in `src/lib/types.ts` cover every response, and the Refinement
Chip vocabulary in `src/lib/chip-vocab.ts` is shared with `Models.swift` — keep
the two in step.
