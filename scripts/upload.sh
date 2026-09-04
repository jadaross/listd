#!/usr/bin/env bash
# Archive bower and upload it to App Store Connect. One command; no Xcode UI.
#
# Bumps the build number first, because App Store Connect refuses a build
# number it has already seen. Uses the Apple ID Xcode is signed into, and
# creates or renews the distribution certificate and profile as needed.
#
#   ./scripts/upload.sh          # bump build, archive, upload
#
# With "Enable automatic distribution" on the TestFlight group, the build
# reaches testers the moment it finishes processing — usually minutes.
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/ios-app/bower"

PBX=bower.xcodeproj/project.pbxproj
CURRENT=$(grep -o 'CURRENT_PROJECT_VERSION = [0-9]*' "$PBX" | head -1 | grep -o '[0-9]*$')
NEXT=$((CURRENT + 1))
sed -i '' "s/CURRENT_PROJECT_VERSION = $CURRENT;/CURRENT_PROJECT_VERSION = $NEXT;/g" "$PBX"
echo "build $CURRENT → $NEXT"

OUT=$(mktemp -d)
xcodebuild archive \
  -project bower.xcodeproj -scheme bower -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "$OUT/bower.xcarchive" \
  -allowProvisioningUpdates -quiet
echo "archived"

xcodebuild -exportArchive \
  -archivePath "$OUT/bower.xcarchive" \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath "$OUT/export" \
  -allowProvisioningUpdates -quiet
echo "uploaded build $NEXT — App Store Connect is processing it"

cd ../..
git add ios-app/bower/bower.xcodeproj/project.pbxproj
git commit -q -m "chore: build $NEXT" && git push -q origin main
echo "committed and pushed"
