---
name: qa
description: Automated QA verification — analyzes changes, tests affected flows in the local browser via browser-use in iPhone 16 Pro view, and self-heals on failure. Invoke with /qa or when feature/bug-fix work reaches verification.
---

# QA Verification

Verify implementation changes by testing affected flows in the local browser only. `/qa` always targets `http://localhost:3001` in iPhone 16 Pro browser view. This skill is invoked automatically during brainstorming/systematic-debugging verification phases, or manually with `/qa`.

## Process

### Step 1: Analyze Changes

Run `git diff HEAD` (or `git diff` if uncommitted changes exist) to identify changed files. Map them to affected flows:

| Changed Path | Affected Flows |
|---|---|
| `src/app/(auth)/*` | Auth flows (login, register, forgot password) |
| `src/app/(app)/search/*` | Food search, category list, food detail |
| `src/app/(app)/profile/*` | Profile, settings, pet management |
| `src/app/(app)/scan/*` | Scanner screen |
| `src/app/(app)/recipes/*` | Recipe list, create/edit, AI analysis |
| `src/app/(app)/learn/*` | Knowledge base screen |
| `src/app/api/*` | API routes backed by the local app |
| `src/app/onboarding/*` | Pet creation wizard |
| `src/components/food/*` | Food-related screens |
| `src/components/pet/*` | Pet-related screens |
| `src/components/ui/*` | All screens (shared components) |
| `src/components/navigation/*` | All screens (navigation) |
| `src/hooks/use-auth.ts` | Auth flows |
| `src/hooks/use-pets.ts` | Pet management flows |
| `src/hooks/use-food-search.ts` | Food search flows |
| `src/hooks/use-recipes.ts` | Recipe CRUD flows |
| `src/hooks/use-recipe-analysis.ts` | AI analysis flows |
| `src/hooks/use-locale.ts` | All screens (i18n) |
| `src/components/recipe/*` | Recipe-related screens |
| `src/lib/agent/*` | AI analysis backend |
| `src/lib/*` | All screens (shared utilities) |
| `src/store/*` | All screens (global state) |
| `src/messages/*` | All screens (translations) |
| `src/app/globals.css` | All screens (styling) |

If no code changes are detected, run:

```bash
python3 .codex/hooks/qa_state.py mark-qa --result passed
```

Then report `No testable changes` and stop.

### Step 2: Build and Serve the Local App

1. Choose the local build target:
   ```bash
   # Static-only changes
   npm run build

   # API/backend changes touching src/app/api/* or src/lib/agent/*
   npm run build:server
   ```
2. Start the matching local server:
   ```bash
   # Static-only changes
   npx serve out -p 3001 &
   SERVE_PID=$!

   # API/backend changes
   npm run start -- --hostname 127.0.0.1 --port 3001 &
   SERVE_PID=$!
   ```
3. Verify the server is reachable:
   ```bash
   curl -I http://localhost:3001
   ```

If build or serving fails, run:

```bash
python3 .codex/hooks/qa_state.py mark-qa --result blocked
```

Then diagnose the issue before continuing.

### Step 3: Launch iPhone 16 Pro Browser View

Run:

```bash
./scripts/browser-use-iphone-16-pro.sh http://localhost:3001
```

The helper must leave an active browser-use session open in mobile-sized view. If it fails, mark QA blocked:

```bash
python3 .codex/hooks/qa_state.py mark-qa --result blocked
```

### Step 4: Test the Affected Flows

Use browser-use against the local app. For each affected flow:

- verify the page loads without crashes
- verify the layout is usable in iPhone 16 Pro view
- verify the specific feature or fix works
- check console/runtime issues with `browser-use eval`
- take screenshots on failures

For protected flows, sign in first:

- **Email:** `test@pawbalance.com`
- **Password:** `TestPass123!`

Do not use production URLs.

### Step 5: Close the Local Server

Run:

```bash
kill $SERVE_PID 2>/dev/null || true
browser-use close || true
```

### Step 6: Persist QA Result

If all affected flows pass:

```bash
python3 .codex/hooks/qa_state.py mark-qa --result passed
```

If QA fails after diagnosis or reruns:

```bash
python3 .codex/hooks/qa_state.py mark-qa --result failed
```

If the environment blocks QA:

```bash
python3 .codex/hooks/qa_state.py mark-qa --result blocked
```

### Step 7: Self-Heal Loop

If any check fails:
1. Diagnose the root cause
2. Implement a fix
3. Re-run this entire `/qa` process from Step 1
4. Repeat until all checks pass
5. **If stuck after 3 consecutive failed attempts on the same issue, STOP and ask the user for guidance.**

## Report Format

```text
## QA Results

**Changes tested:** [list of changed files]
**Affected flows:** [list of flows tested]

### Local Web (iPhone 16 Pro view)
- [Flow name]: PASS/FAIL — [details if fail]
- ...

**Overall: PASS/FAIL**
```

Only claim success if the local browser checks pass and the QA state was marked `passed`.
