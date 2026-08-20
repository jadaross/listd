# Wattle iOS

Native SwiftUI app — port of the `Wattle iOS Prototype` design (Claude Design handoff bundle).

## Setup (one-time, ~30 seconds)

1. Open Xcode → **File → New → Project…**
2. Choose **iOS → App**, click Next
3. Settings:
   - **Product Name:** `Wattle`
   - **Interface:** SwiftUI
   - **Language:** Swift
   - **Storage:** None
   - Bundle identifier: e.g. `com.wattle.app`
4. Save location: this `ios/` directory (so the project sits at `ios/Wattle.xcodeproj`)
5. In the Project Navigator, **delete the auto-generated `ContentView.swift` and `WattleApp.swift`** (move to trash) — the ones in this folder replace them.
6. Right-click the `Wattle` group → **Add Files to "Wattle"…** → select the `Wattle/` folder in this directory → make sure "Create folder references" is selected → Add. (Xcode 16+ filesystem-synced folders work great here.)
7. Set deployment target to **iOS 17.0**.
8. Build & run on the iPhone 15 Pro simulator.

## Optional: nicer fonts

The prototype uses **Instrument Serif** (wordmark) and **Geist** (UI). The app falls back to the system serif (New York) and SF Pro out of the box. To match the design more closely:

1. Download both from Google Fonts.
2. Drag `.ttf` files into the Xcode project (copy items, add to target).
3. In **Info.plist** add the `UIAppFonts` array with each filename. Then change references in `Theme.swift` to use the custom font names.

## Backend

The screens render mock data (matching the prototype). When ready, point the API client at the Next.js edge routes already deployed from this repo (`/api/analyse`, `/api/group`) — the JSON shapes in `src/lib/types.ts` already cover the response.
