# QA Automation & Deployment Design

## Overview

Automated QA and deployment system for PawBalance that integrates into existing Claude Code workflows. When Claude implements a feature (via brainstorming) or fixes a bug (via systematic-debugging), it autonomously verifies the change in both web browser and iOS simulator before claiming completion. When finishing a development branch, it pushes and deploys to TestFlight autonomously.

## Components

Three pieces work together:

1. **CLAUDE.md rules** — tell Claude *when* to verify and deploy
2. **`/qa` skill** — *how* to test (browser-use + ios-debug)
3. **`/deploy` skill** — *how* to ship (push + TestFlight)

## 1. Project Rules (CLAUDE.md Addition)

Add a `## QA & Verification Rules` section to CLAUDE.md.

### Verification Triggers

- After implementing a feature (brainstorming workflow reaches verification phase)
- After fixing a bug (systematic-debugging workflow reaches verification phase)
- When explicitly asked to verify (`/qa`)

### Verification Sequence

Claude invokes the `/qa` skill, which runs:

1. Build static export (`npm run build`) — fail fast if build breaks
2. Serve `out/` directory locally (`npx serve out -p 3000`)
3. Test affected flows in browser via `browser-use` skill
4. Full iOS build cycle: `npx cap sync ios` → Xcode build → simulator launch
5. Test same affected flows on iOS via `ios-debug`
6. Report pass/fail results before claiming work is done

### Context-Aware Testing

- Claude analyzes the git diff to determine which files changed
- Maps changed files to affected screens/flows
- Only those flows are tested — no full sweep

### Branch Completion

- When finishing a development branch (`/finishing-a-development-branch`), run `/qa` then `/deploy`

## 2. `/qa` Skill

A user-invocable skill that walks through the full verification sequence.

### Step 1: Analyze Changes

- Read `git diff` to identify changed files
- Map files to affected screens/flows using this heuristic:
  - `src/app/(auth)/*` → auth flows (login, register, forgot password)
  - `src/app/(app)/search/*` → food search, category, food detail
  - `src/app/(app)/profile/*` → profile, settings, pet management
  - `src/app/(app)/scan/*` → scanner screen
  - `src/app/(app)/bowl/*` → home cooking screen
  - `src/app/(app)/learn/*` → knowledge base screen
  - `src/app/onboarding/*` → pet creation wizard
  - `src/components/food/*` → food-related screens
  - `src/components/pet/*` → pet-related screens
  - `src/components/ui/*` → all screens (shared components)
  - `src/components/navigation/*` → all screens (navigation)
  - `src/hooks/use-auth.ts` → auth flows
  - `src/hooks/use-pets.ts` → pet management flows
  - `src/hooks/use-food-search.ts` → food search flows
  - `src/hooks/use-locale.ts` → all screens (i18n)
  - `src/lib/*` → all screens (shared utilities)
  - `src/store/*` → all screens (global state)
  - `src/messages/*` → all screens (translations)
  - `src/app/globals.css` → all screens (styling)

### Step 2: Web Verification

1. Run `npm run build` — if build fails, stop and fix
2. Serve `out/` directory: `npx serve out -p 3000`
3. Invoke `browser-use` skill to:
   - Navigate to each affected screen
   - Check for: broken layouts, missing content, console errors, functional correctness
   - Verify the specific change works as intended
4. Stop the local server when done

### Step 3: iOS Verification

1. Run `npx cap sync ios`
2. Invoke `ios-debug` to:
   - Build the iOS app (`build_and_test.py`)
   - Launch in simulator (`app_launcher.py`)
   - Navigate affected flows using semantic navigation (`navigator.py`, `screen_mapper.py`)
   - Check for: native rendering issues, safe area problems, Capacitor bridge errors, functional correctness
3. Verify the specific change works as intended on iOS

### Step 4: Report Results

- Summary of what was tested (which flows, why)
- Pass/fail per flow, per platform (web + iOS)
- Screenshots of any failures
- Only claim success if both web and iOS pass

### Failure Behavior

If any check fails, Claude autonomously:
1. Diagnoses the failure
2. Implements a fix
3. Re-runs the full `/qa` sequence from Step 1
4. Repeats until all checks pass
5. If stuck after 3 consecutive failed attempts on the same issue, stops and asks the user for guidance

## 3. `/deploy` Skill

A user-invocable skill for pushing code and deploying to TestFlight.

### Precondition

`/qa` must have passed in the current session. If not, run `/qa` first.

### Steps

1. **Push to remote** — `git push` (with `-u` if no upstream tracking branch)
2. **Deploy to TestFlight** — run `./scripts/deploy-testflight.sh` which executes:
   - `npm run build` (static export)
   - `npx cap sync ios`
   - `xcodebuild archive` (Xcode archive)
   - `xcodebuild -exportArchive` (export .ipa)
   - `xcrun altool --upload-app` (upload to App Store Connect)
3. **Report result** — confirm successful upload or report failure

### Failure Behavior

Same self-healing loop as `/qa`:
1. Diagnose the failure
2. Implement a fix
3. Retry the deploy
4. Stop after 3 failed attempts on the same issue and ask the user

## Workflow Integration

```
Brainstorming / Systematic Debugging
    |
    +-- ... design / implement / fix ...
    |
    +-- Verification phase
            |
            v
         /qa (auto-triggered by CLAUDE.md rules)
            |
            +-- Analyze changes -> affected flows
            +-- Web: build static -> serve -> browser-use
            +-- iOS: cap sync -> build -> simulator -> ios-debug
            +-- Fail? -> fix -> re-run /qa (up to 3x)
            +-- Pass
                    |
                    v
         /finishing-a-development-branch
            |
            +-- /qa (if not already passed)
            +-- /deploy (push + TestFlight)
            +-- Done
```

### Manual Use

Both skills work standalone:
- `/qa` — run anytime to verify current state
- `/deploy` — run anytime to push + ship to TestFlight

### What Stays Unchanged

- Superpowers skills (brainstorming, systematic-debugging, finishing-a-development-branch) are not modified
- The existing `ios-debug` and `browser-use` skill are used as-is
- The existing `deploy-testflight.sh` script is used as-is

## Dependencies

- `browser-use` skill (already available)
- `ios-debug` (already installed at `.claude/skills/ios-debug/`)
- `deploy-testflight.sh` (already exists at `scripts/deploy-testflight.sh`)
- `npx serve` (needs to be installed: `npm install --save-dev serve`)
