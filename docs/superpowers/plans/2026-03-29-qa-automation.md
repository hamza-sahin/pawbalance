# QA Automation & Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire browser-use and ios-simulator-skill into Claude's existing development workflows via project rules and two new skills (`/qa` and `/deploy`), enabling autonomous verification and TestFlight deployment.

**Architecture:** Three deliverables — CLAUDE.md rules (when to verify/deploy), `/qa` skill (how to test via browser-use + ios-simulator-skill), `/deploy` skill (how to ship via push + TestFlight). No existing skills are modified. Rules drive behavior; skills codify process.

**Tech Stack:** Claude Code skills (SKILL.md YAML frontmatter format), browser-use CLI, ios-simulator-skill scripts, `npx serve` for static file serving, `deploy-testflight.sh` for iOS deployment.

**Spec:** `docs/superpowers/specs/2026-03-29-qa-automation-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `.claude/skills/qa/SKILL.md` | QA verification skill — analyzes changes, tests web + iOS |
| Create | `.claude/skills/deploy/SKILL.md` | Deploy skill — push + TestFlight deployment |
| Modify | `CLAUDE.md` | Add QA & Verification Rules section |

---

### Task 1: Create the `/qa` skill

**Files:**
- Create: `.claude/skills/qa/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/qa
```

- [ ] **Step 2: Write the `/qa` skill SKILL.md**

Create `.claude/skills/qa/SKILL.md` with this exact content:

```markdown
---
name: qa
description: Automated QA verification — analyzes changes, tests affected flows in browser (browser-use) and iOS simulator (ios-simulator-skill), self-heals on failure. Invoke with /qa or triggered automatically by CLAUDE.md rules during verification phases.
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
   npx serve out -p 3000 &
   SERVE_PID=$!
   ```
   Wait for the server to be ready before proceeding.

3. **Test affected flows using browser-use skill:**
   - Invoke the `browser-use` skill
   - Navigate to `http://localhost:3000` and test each affected flow
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

1. **Sync to Capacitor:**
   ```bash
   npx cap sync ios
   ```

2. **Build and launch using ios-simulator-skill:**
   - Invoke the `ios-simulator-skill` skill
   - Build the app: `python3 .claude/skills/ios-simulator-skill/scripts/build_and_test.py --build-only`
   - Launch in simulator: `python3 .claude/skills/ios-simulator-skill/scripts/app_launcher.py --action launch --bundle-id com.pawbalance.app`

3. **Test affected flows on iOS:**
   - Use `screen_mapper.py` to analyze current screen
   - Use `navigator.py` to navigate to each affected flow
   - For each flow, check:
     - Screen renders correctly in native wrapper
     - No safe area issues (content not hidden behind notch/home indicator)
     - No Capacitor bridge errors in logs
     - The specific change works as intended on iOS
   - Use `log_monitor.py` to check for runtime errors if needed

### Step 4: Report Results

Present a summary:

```
## QA Results

**Changes tested:** [list of changed files]
**Affected flows:** [list of flows tested]

### Web (browser-use)
- [Flow name]: PASS/FAIL — [details if fail]
- ...

### iOS (ios-simulator-skill)
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
```

- [ ] **Step 3: Verify the skill file is well-formed**

```bash
head -5 .claude/skills/qa/SKILL.md
```

Expected output should show the YAML frontmatter:
```
---
name: qa
description: Automated QA verification — analyzes changes, tests affected flows in browser (browser-use) and iOS simulator (ios-simulator-skill), self-heals on failure. Invoke with /qa or triggered automatically by CLAUDE.md rules during verification phases.
---
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/qa/SKILL.md
git commit -m "feat: add /qa skill for automated verification"
```

---

### Task 2: Create the `/deploy` skill

**Files:**
- Create: `.claude/skills/deploy/SKILL.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/deploy
```

- [ ] **Step 2: Write the `/deploy` skill SKILL.md**

Create `.claude/skills/deploy/SKILL.md` with this exact content:

```markdown
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
```

- [ ] **Step 3: Verify the skill file is well-formed**

```bash
head -5 .claude/skills/deploy/SKILL.md
```

Expected output should show the YAML frontmatter:
```
---
name: deploy
description: Push to remote and deploy to TestFlight via deploy-testflight.sh. Requires /qa to have passed first. Invoke with /deploy or triggered automatically when finishing a development branch.
---
```

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/deploy/SKILL.md
git commit -m "feat: add /deploy skill for TestFlight deployment"
```

---

### Task 3: Add QA & Verification Rules to CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (append new section before `## Out of Scope`)

- [ ] **Step 1: Add the QA & Verification Rules section**

Insert the following section in `CLAUDE.md` immediately **before** the `## Out of Scope` line:

```markdown
## QA & Verification Rules

### When to Verify

- **After implementing a feature** — when the brainstorming workflow reaches its verification phase, invoke `/qa` before claiming the work is done.
- **After fixing a bug** — when the systematic-debugging workflow reaches its verification phase, invoke `/qa` before claiming the fix is done.
- **When explicitly asked** — the user can run `/qa` at any time.

### How Verification Works

The `/qa` skill (`.claude/skills/qa/SKILL.md`) runs this sequence:

1. Analyze `git diff` to determine which files changed and map them to affected screens/flows
2. Build the static export (`npm run build`) and serve `out/` locally
3. Test affected flows in the browser using the `browser-use` skill
4. Run full iOS build cycle (`npx cap sync ios` → Xcode build → simulator launch)
5. Test the same affected flows on iOS using the `ios-simulator-skill`
6. Report pass/fail per flow, per platform

Testing is **context-aware** — only flows affected by the change are tested, not a full sweep.

If any check fails, autonomously diagnose, fix, and re-run `/qa`. Stop after 3 failed attempts on the same issue and ask the user.

### When to Deploy

- **When finishing a development branch** — after `/qa` passes, invoke `/deploy` to push and ship to TestFlight.
- **When explicitly asked** — the user can run `/deploy` at any time.

### How Deployment Works

The `/deploy` skill (`.claude/skills/deploy/SKILL.md`) runs:

1. Push the current branch to remote (`git push -u origin HEAD`)
2. Run `./scripts/deploy-testflight.sh` (build → archive → upload to App Store Connect)
3. Report success or failure

`/deploy` requires `/qa` to have passed first. If not, it runs `/qa` automatically.
```

- [ ] **Step 2: Verify the section was added correctly**

```bash
grep -n "QA & Verification Rules" CLAUDE.md
```

Expected: a line number showing the new section header exists.

- [ ] **Step 3: Verify CLAUDE.md still renders correctly**

Read the full file and confirm no formatting issues were introduced (broken markdown, missing section breaks, etc.).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add QA & verification rules to CLAUDE.md"
```

---

### Task 4: Smoke Test the Setup

This task verifies the skills are recognized by Claude Code and the tools they depend on are available.

- [ ] **Step 1: Verify browser-use CLI is available**

```bash
npx browser-use --version
```

Expected: a version number. If it fails, install with:
```bash
npx browser-use doctor
```

- [ ] **Step 2: Verify ios-simulator-skill scripts are present**

```bash
ls .claude/skills/ios-simulator-skill/scripts/build_and_test.py \
   .claude/skills/ios-simulator-skill/scripts/app_launcher.py \
   .claude/skills/ios-simulator-skill/scripts/navigator.py \
   .claude/skills/ios-simulator-skill/scripts/screen_mapper.py
```

Expected: all four files listed without errors.

- [ ] **Step 3: Verify serve works with the static export**

```bash
npm run build && npx serve out -p 3199 &
SERVE_PID=$!
sleep 2
curl -s -o /dev/null -w "%{http_code}" http://localhost:3199
kill $SERVE_PID 2>/dev/null
```

Expected: HTTP status `200`.

- [ ] **Step 4: Verify iOS build toolchain**

```bash
xcodebuild -version
xcrun simctl list devices booted
```

Expected: Xcode version info and list of any booted simulators.

- [ ] **Step 5: Verify skill files are recognized**

Check that both skill directories contain valid SKILL.md files:

```bash
head -3 .claude/skills/qa/SKILL.md
head -3 .claude/skills/deploy/SKILL.md
```

Expected: both show `---` (start of YAML frontmatter).

- [ ] **Step 6: Commit verification results (if any fixes were needed)**

If any fixes were needed during smoke testing, commit them:
```bash
git add -A
git commit -m "fix: address issues found during QA setup smoke test"
```

If no fixes were needed, skip this step.
