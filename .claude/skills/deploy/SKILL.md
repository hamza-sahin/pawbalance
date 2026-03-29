---
name: deploy
description: Push to remote and deploy to TestFlight via deploy-testflight.sh. Requires /qa to have passed first. Invoke with /deploy or triggered automatically when finishing a development branch.
---

# Deploy to TestFlight

Push code to remote and deploy to TestFlight. This skill is invoked automatically when finishing a development branch (after `/qa` passes), or manually with `/deploy`.

## Precondition

`/qa` must have passed in the current session. If `/qa` has not been run or did not pass, run `/qa` first before proceeding.

## Process

### Step 1: Push to Remote

```bash
git push -u origin HEAD
```

If the push fails (e.g., no remote, auth issue), diagnose and fix before continuing.

### Step 2: Deploy to TestFlight

Run the existing deploy script:

```bash
./scripts/deploy-testflight.sh
```

This script handles the full pipeline:
1. `npm run build` — static export
2. `npx cap sync ios` — sync to Capacitor
3. `xcodebuild archive` — Xcode archive
4. `xcodebuild -exportArchive` — export .ipa
5. `xcrun altool --upload-app` — upload to App Store Connect

The script uses these environment variables (with defaults already set in the script):
- `APP_STORE_API_KEY_ID` (default: `4NH42JUWM6`)
- `APP_STORE_API_ISSUER_ID` (default: `0b5bf398-ce6b-47b4-988a-386910acf728`)

### Step 3: Report Result

On success:
```
## Deploy Complete

- Branch pushed to remote
- Build uploaded to App Store Connect
- TestFlight build should be available in ~10 minutes
```

On failure, report the specific error and which step failed.

## Failure Behavior

If any step fails:
1. Diagnose the root cause
2. Implement a fix
3. Retry the failed step
4. **If stuck after 3 consecutive failed attempts on the same issue, STOP and ask the user for guidance.**
