---
name: app-store-connect-cli
description: Automate App Store Connect workflows using the `asc` CLI — builds, TestFlight, metadata, submissions, versions, screenshots, signing, and release pipelines. Use when the user needs to interact with App Store Connect API, manage app versions, upload builds, submit for review, manage TestFlight, or automate release workflows.
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Agent
---

# App Store Connect CLI (`asc`)

A fast, lightweight CLI for automating iOS/macOS release workflows through the App Store Connect API. Built in Go.

## Step 0: Ensure `asc` Is Installed

Before running any `asc` command, verify the binary exists:

```bash
command -v asc || echo "NOT_INSTALLED"
```

If `NOT_INSTALLED`, download the latest release from GitHub:

```bash
# Detect architecture and download the correct binary
ARCH=$(uname -m)
if [ "$ARCH" = "arm64" ]; then
  ASSET="asc_macOS_arm64"
elif [ "$ARCH" = "x86_64" ]; then
  ASSET="asc_macOS_amd64"
else
  echo "Unsupported architecture: $ARCH" && exit 1
fi

# Download latest release binary
curl -fsSL "https://github.com/rudrankriyam/App-Store-Connect-CLI/releases/latest/download/$ASSET" -o /tmp/asc
chmod +x /tmp/asc
sudo install -m 755 /tmp/asc /usr/local/bin/asc
rm /tmp/asc
```

Verify:
```bash
asc --version
```

## Step 1: Verify Authentication

Before any API operation, confirm credentials are configured:

```bash
asc auth status --validate
```

If auth is not configured, set up using the project's API key:

```bash
asc auth login \
  --name "PawBalance" \
  --key-id "4NH42JUWM6" \
  --issuer-id "<ISSUER_ID>" \
  --private-key ~/.private_keys/AuthKey_4NH42JUWM6.p8
```

The Key ID and private key path are from CLAUDE.md. Ask the user for the Issuer ID if not already stored.

For CI/headless environments, use `--bypass-keychain` and environment variables:
- `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY_PATH`

## Step 2: Discover Commands

**Always check `--help` before running any command.** The CLI is self-documenting:

```bash
asc --help                         # All top-level commands
asc <command> --help               # Subcommands for a family
asc <command> <subcommand> --help  # All flags for a specific action
```

Do not memorize flags. Always verify with `--help`.

## Step 3: Execute the Workflow

Match the user's request to the appropriate workflow below. For detailed command reference, read `references/command-reference.md`.

---

### Common Workflows

#### List Apps
```bash
asc apps list --output table
```

#### Get App Info
```bash
asc apps get --app "<APP_ID>" --output json
```

#### List Builds
```bash
asc builds list --app "<APP_ID>" --output table --paginate
```

#### Upload Build
```bash
asc builds upload --app "<APP_ID>" --ipa "/path/to/App.ipa"
```

#### Publish to TestFlight
```bash
asc publish testflight \
  --app "<APP_ID>" \
  --ipa "/path/to/App.ipa" \
  --group "Beta" \
  --wait
```

#### Publish to App Store
```bash
asc publish appstore \
  --app "<APP_ID>" \
  --ipa "/path/to/App.ipa" \
  --version "1.2.3" \
  --submit \
  --confirm
```

#### Check Release Status
```bash
asc status --app "<APP_ID>" --watch
```

#### Validate Submission Readiness
```bash
asc validate --app "<APP_ID>" --version "1.2.3"
```

#### Manage Versions
```bash
asc versions list --app "<APP_ID>" --output table
asc versions create --app "<APP_ID>" --version "1.2.3" --platform IOS
```

#### Manage Screenshots
```bash
asc screenshots list --app "<APP_ID>" --version "1.2.3"
asc screenshots upload --app "<APP_ID>" --version "1.2.3" --locale "en-US" --display "APP_IPHONE_67" --file "/path/to/screenshot.png"
```

#### Manage Localizations / Metadata
```bash
asc localizations list --app "<APP_ID>" --version "1.2.3"
asc metadata pull --app "<APP_ID>" --version "1.2.3" --dir ./metadata
asc metadata apply --app "<APP_ID>" --version "1.2.3" --dir ./metadata
```

#### TestFlight Management
```bash
asc testflight list --app "<APP_ID>"
asc testflight groups --app "<APP_ID>"
asc testflight testers --app "<APP_ID>"
asc testflight feedback --app "<APP_ID>"
asc testflight crashes --app "<APP_ID>"
```

#### Local Xcode Build + TestFlight Pipeline
For the full archive-export-upload pipeline, read `references/workflows.md`.

```bash
# Get next build number
asc builds latest --app "<APP_ID>" --version "1.2.3" --platform IOS --next

# Archive
asc xcode archive --project "App.xcodeproj" --scheme "App" --configuration Release \
  --archive-path ".asc/artifacts/App.xcarchive" --clean --overwrite

# Export IPA
asc xcode export --archive-path ".asc/artifacts/App.xcarchive" \
  --export-options ".asc/export-options-app-store.plist" \
  --ipa-path ".asc/artifacts/App.ipa" --overwrite

# Publish
asc publish testflight --app "<APP_ID>" --ipa ".asc/artifacts/App.ipa" \
  --group "Beta" --wait
```

#### In-App Purchases & Subscriptions
```bash
asc iap list --app "<APP_ID>"
asc subscriptions list --app "<APP_ID>"
```

#### Signing & Certificates
```bash
asc certificates list
asc profiles list
asc bundle-ids list
```

#### Users & Devices
```bash
asc users list
asc devices list
```

#### Analytics & Finance
```bash
asc analytics --app "<APP_ID>"
asc finance --vendor-number "<VENDOR_NUMBER>"
```

---

## Output Format Control

- **Interactive terminal:** defaults to `table`
- **Piped/CI:** defaults to `json`
- **Explicit:** `--output table|json|markdown`
- **Pretty JSON:** `--output json --pretty`
- **Environment default:** `ASC_DEFAULT_OUTPUT=json`

## Pagination

- `--paginate` — fetch all pages automatically
- `--limit N` — results per page
- `--next URL` — manual next page

## Debugging

- `--debug` — enable debug logging
- `--api-debug` — log HTTP requests/responses (redacted)
- `ASC_DEBUG=api` — same as `--api-debug` via env var

## Error Handling

If a command fails:
1. Re-run with `--debug` to get detailed error output
2. Check `asc auth status --validate` for auth issues
3. Run `asc doctor` for configuration diagnostics
4. Verify flags with `asc <command> --help`

## PawBalance-Specific Context

- **App ID:** Look up with `asc apps list --bundle-id com.pawbalance.app`
- **Team ID:** `7N6TBDYHYS`
- **API Key ID:** `4NH42JUWM6`
- **Private Key:** `~/.private_keys/AuthKey_4NH42JUWM6.p8`
- **Bundle ID:** `com.pawbalance.app`

## References

For detailed docs, read these files when the current step requires them:

- **Full command reference:** `references/command-reference.md`
- **Workflow patterns (Xcode pipelines, automation):** `references/workflows.md`
- **CI/CD integration (GitHub Actions, GitLab, etc.):** `references/ci-cd.md`
- **Environment variables:** `references/environment-variables.md`
