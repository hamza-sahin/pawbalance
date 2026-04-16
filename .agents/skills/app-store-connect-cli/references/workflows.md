# ASC Workflow Patterns

Source: `refs/App-Store-Connect-CLI/docs/WORKFLOWS.md`

## High-Level Workflow Surfaces

| Command | Purpose |
|---------|---------|
| `asc publish appstore` | Canonical App Store shipping path |
| `asc publish testflight` | Canonical TestFlight publish path |
| `asc workflow` | User-defined orchestration for repo-specific pipelines |

## Verified: Local Xcode to TestFlight Pipeline

This pattern archives locally, exports an IPA, and publishes to TestFlight.

### Prerequisites

1. Create `.asc/export-options-app-store.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>app-store-connect</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>teamID</key>
  <string>YOUR_TEAM_ID</string>
  <key>uploadSymbols</key>
  <true/>
</dict>
</plist>
```

### Pipeline Steps

```bash
# 1. Get next build number
asc builds latest --app "$APP_ID" --version "$VERSION" --platform IOS --next --initial-build-number 1 --output json

# 2. Archive
asc xcode archive \
  --project "$PROJECT_PATH" \
  --scheme "$SCHEME" \
  --configuration Release \
  --archive-path ".asc/artifacts/App-$VERSION-$BUILD_NUMBER.xcarchive" \
  --clean --overwrite \
  --xcodebuild-flag=-destination --xcodebuild-flag=generic/platform=iOS \
  --xcodebuild-flag=-allowProvisioningUpdates \
  --xcodebuild-flag=MARKETING_VERSION=$VERSION \
  --xcodebuild-flag=CURRENT_PROJECT_VERSION=$BUILD_NUMBER \
  --output json

# 3. Export IPA
asc xcode export \
  --archive-path "$ARCHIVE_PATH" \
  --export-options ".asc/export-options-app-store.plist" \
  --ipa-path ".asc/artifacts/App-$VERSION-$BUILD_NUMBER.ipa" \
  --overwrite \
  --xcodebuild-flag=-allowProvisioningUpdates \
  --output json

# 4. Publish to TestFlight
asc publish testflight \
  --app "$APP_ID" \
  --ipa "$IPA_PATH" \
  --group "Beta" \
  --wait --poll-interval 10s \
  --output json
```

### Automated Workflow File

Create `.asc/workflow.json` to automate the full pipeline:

```json
{
  "env": {
    "APP_ID": "YOUR_APP_ID",
    "PROJECT_PATH": "App.xcodeproj",
    "SCHEME": "App",
    "CONFIGURATION": "Release",
    "EXPORT_OPTIONS": ".asc/export-options-app-store.plist",
    "TESTFLIGHT_GROUP": "Beta",
    "VERSION": ""
  },
  "workflows": {
    "testflight_beta": {
      "description": "Archive, export, upload, and distribute to TestFlight.",
      "steps": [
        {
          "name": "resolve_next_build",
          "run": "asc builds latest --app \"$APP_ID\" --version \"$VERSION\" --platform IOS --next --initial-build-number 1 --output json",
          "outputs": { "BUILD_NUMBER": "$.nextBuildNumber" }
        },
        {
          "name": "archive",
          "run": "asc xcode archive --project \"$PROJECT_PATH\" --scheme \"$SCHEME\" --configuration \"$CONFIGURATION\" --archive-path \".asc/artifacts/App-$VERSION-${steps.resolve_next_build.BUILD_NUMBER}.xcarchive\" --clean --overwrite --output json",
          "outputs": { "ARCHIVE_PATH": "$.archive_path", "BUILD_NUMBER": "$.build_number" }
        },
        {
          "name": "export",
          "run": "asc xcode export --archive-path ${steps.archive.ARCHIVE_PATH} --export-options \"$EXPORT_OPTIONS\" --ipa-path \".asc/artifacts/App-$VERSION-${steps.archive.BUILD_NUMBER}.ipa\" --overwrite --output json",
          "outputs": { "IPA_PATH": "$.ipa_path" }
        },
        {
          "name": "publish",
          "run": "asc publish testflight --app \"$APP_ID\" --ipa ${steps.export.IPA_PATH} --group \"$TESTFLIGHT_GROUP\" --wait --poll-interval 10s --output json",
          "outputs": { "BUILD_ID": "$.buildId" }
        }
      ]
    }
  }
}
```

Run with:
```bash
asc workflow run testflight_beta --env VERSION=1.2.3
```

## App Store Submission Workflow

```bash
# 1. Validate readiness
asc validate --app "$APP_ID" --version "1.2.3"

# 2. Stage version (dry-run first)
asc release stage --app "$APP_ID" --version "1.2.3" --build "$BUILD_ID" --dry-run

# 3. Stage for real
asc release stage --app "$APP_ID" --version "1.2.3" --build "$BUILD_ID"

# 4. Submit
asc release submit --app "$APP_ID" --version "1.2.3" --confirm

# 5. Monitor
asc status --app "$APP_ID" --watch
```

## Metadata Sync Workflow

```bash
# Pull current metadata to local directory
asc metadata pull --app "$APP_ID" --version "1.2.3" --dir ./metadata

# Edit files locally, then diff
asc metadata diff --app "$APP_ID" --version "1.2.3" --dir ./metadata

# Apply changes
asc metadata apply --app "$APP_ID" --version "1.2.3" --dir ./metadata
```
