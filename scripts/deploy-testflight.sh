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
EXPORT_DIR="$PROJECT_DIR/build/export"
EXPORT_OPTIONS="$PROJECT_DIR/scripts/ExportOptions.plist"

cd "$PROJECT_DIR"

echo "==> Step 1: Building Next.js static export..."
npm run build

echo "==> Step 2: Syncing to Capacitor iOS..."
npx cap sync ios

echo "==> Step 3: Archiving iOS app..."
rm -rf "$ARCHIVE_DIR" "$EXPORT_DIR"
mkdir -p build

xcodebuild archive \
  -workspace "$IOS_DIR/App.xcworkspace" \
  -scheme "App" \
  -configuration Release \
  -archivePath "$ARCHIVE_DIR" \
  -destination "generic/platform=iOS" \
  CODE_SIGN_STYLE=Automatic \
  | tail -5

echo "==> Step 4: Exporting .ipa..."
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_DIR" \
  -exportPath "$EXPORT_DIR" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  | tail -5

IPA_PATH=$(find "$EXPORT_DIR" -name "*.ipa" -type f | head -1)

if [ -z "$IPA_PATH" ]; then
  echo "ERROR: No .ipa found in $EXPORT_DIR"
  exit 1
fi

echo "==> Step 5: Uploading to App Store Connect via xcrun..."
xcrun altool --upload-app \
  --type ios \
  --file "$IPA_PATH" \
  --apiKey "${APP_STORE_API_KEY_ID}" \
  --apiIssuer "${APP_STORE_API_ISSUER_ID}"

echo ""
echo "==> Done! Build uploaded to App Store Connect."
echo "    Check TestFlight in ~10 minutes."
