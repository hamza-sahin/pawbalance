---
name: qa
description: Automated QA verification — analyzes changes, tests affected flows in browser (browser-use) and iOS simulator (ios-debug), self-heals on failure. Invoke with /qa or triggered automatically by CLAUDE.md rules during verification phases.
---

# QA Verification

Verify implementation changes by testing affected flows in both the web browser and iOS simulator. This skill is invoked automatically during brainstorming/systematic-debugging verification phases, or manually with `/qa`.

## Process

### Step 1: Analyze Changes

Run `git diff HEAD` (or `git diff` if uncommitted changes exist) to identify changed files. Map them to affected flows:

| Changed Path | Affected Flows |
|---|---|
| `src/app/(auth)/*` | Auth flows (login, register, forgot password) |
| `src/app/(app)/search/*` | Food search, category list, food detail |
| `src/app/(app)/profile/*` | Profile, settings, pet management |
| `src/app/(app)/scan/*` | Scanner screen |
| `src/app/(app)/bowl/*` | Home cooking screen |
| `src/app/(app)/learn/*` | Knowledge base screen |
| `src/app/onboarding/*` | Pet creation wizard |
| `src/components/food/*` | Food-related screens |
| `src/components/pet/*` | Pet-related screens |
| `src/components/ui/*` | All screens (shared components) |
| `src/components/navigation/*` | All screens (navigation) |
| `src/hooks/use-auth.ts` | Auth flows |
| `src/hooks/use-pets.ts` | Pet management flows |
| `src/hooks/use-food-search.ts` | Food search flows |
| `src/hooks/use-locale.ts` | All screens (i18n) |
| `src/lib/*` | All screens (shared utilities) |
| `src/store/*` | All screens (global state) |
| `src/messages/*` | All screens (translations) |
| `src/app/globals.css` | All screens (styling) |

If no code changes are detected (only docs, config, etc.), report "No testable changes" and skip.

### Step 2: Web Verification

1. **Build static export:**
   ```bash
   npm run build
   ```
   If the build fails, stop — diagnose and fix the build error before continuing.

2. **Serve the static export:**
   ```bash
   npx serve out -p 3001 &
   SERVE_PID=$!
   ```
   Wait for the server to be ready before proceeding.

3. **Test affected flows using browser-use skill:**
   - Invoke the `browser-use` skill
   - Navigate to `http://localhost:3001` and test each affected flow
   - For each flow, check:
     - Page loads without errors
     - Layout is not broken (no overlapping elements, no missing content)
     - Console has no JavaScript errors
     - The specific change works as intended
   - Take screenshots of any failures

4. **Stop the server:**
   ```bash
   kill $SERVE_PID 2>/dev/null
   ```

### Step 3: iOS Verification

1. **Ensure a simulator is booted:**
   - Check for booted simulators: `xcrun simctl list devices booted`
   - If none are booted, boot one: `python3 .claude/skills/ios-debug/scripts/simctl_boot.py`

2. **Sync to Capacitor:**
   ```bash
   npx cap sync ios
   ```

3. **Build and launch using ios-debug:**
   - Invoke the `ios-debug` skill
   - Build the app: `python3 .claude/skills/ios-debug/scripts/build_and_test.py --workspace ios/App/App.xcworkspace`
   - Launch in simulator: `python3 .claude/skills/ios-debug/scripts/app_launcher.py --launch com.pawbalance.app`

4. **Test affected flows on iOS:**
   - Use `python3 .claude/skills/ios-debug/scripts/screen_mapper.py` to analyze current screen
   - Use `python3 .claude/skills/ios-debug/scripts/navigator.py` to navigate to each affected flow
   - For each flow, check:
     - Screen renders correctly in native wrapper
     - No safe area issues (content not hidden behind notch/home indicator)
     - No Capacitor bridge errors in logs
     - The specific change works as intended on iOS
   - Use `python3 .claude/skills/ios-debug/scripts/log_monitor.py` to check for runtime errors if needed

### Step 4: Report Results

Present a summary:

```
## QA Results

**Changes tested:** [list of changed files]
**Affected flows:** [list of flows tested]

### Web (browser-use)
- [Flow name]: PASS/FAIL — [details if fail]
- ...

### iOS (ios-debug)
- [Flow name]: PASS/FAIL — [details if fail]
- ...

**Overall: PASS/FAIL**
```

Only claim success if ALL checks pass on BOTH platforms.

## Failure Behavior

If any check fails:
1. Diagnose the root cause of the failure
2. Implement a fix
3. Re-run this entire `/qa` process from Step 1
4. Repeat until all checks pass
5. **If stuck after 3 consecutive failed attempts on the same issue, STOP and ask the user for guidance.** Do not keep looping.
