#!/bin/bash
set -euo pipefail

# ============================================================
# PawBalance → TestFlight deploy script
# Usage: ./scripts/deploy-testflight.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
IOS_DIR="$PROJECT_DIR/ios/App"
ARCHIVE_DIR="$PROJECT_DIR/build/PawBalance.xcarchive"
EXPORT_OPTIONS="$PROJECT_DIR/scripts/ExportOptions.plist"

cd "$PROJECT_DIR"

echo "==> Step 1: Building Next.js static export..."
npm run build

echo "==> Step 2: Syncing to Capacitor iOS..."
npx cap sync ios

echo "==> Step 3: Archiving iOS app..."
rm -rf "$ARCHIVE_DIR"
mkdir -p build

xcodebuild archive \
  -workspace "$IOS_DIR/App.xcworkspace" \
  -scheme "App" \
  -configuration Release \
  -archivePath "$ARCHIVE_DIR" \
  -destination "generic/platform=iOS" \
  CODE_SIGN_STYLE=Automatic \
  | tail -5

echo "==> Step 4: Exporting & uploading to App Store Connect..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_DIR" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -allowProvisioningUpdates \
  | tail -10

echo ""
echo "==> Done! Build uploaded to App Store Connect."
echo "    Check TestFlight in ~10 minutes."
