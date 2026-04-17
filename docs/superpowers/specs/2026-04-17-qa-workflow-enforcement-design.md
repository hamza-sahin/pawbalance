# QA Workflow Enforcement Design

## Status

Proposed on 2026-04-17. This design supersedes the QA execution model in [2026-03-29-qa-automation-design.md](/Users/hamzasahin/src/pawbalance/docs/superpowers/specs/2026-03-29-qa-automation-design.md) for automatic verification behavior, enforcement, and platform scope.

## Problem

PawBalance already has QA reminder text in project rules and a `/qa` skill, but the workflow is weak in practice:

- Feature and bug-fix sessions can finish implementation without automatically transitioning into `/qa`
- Current Codex hooks only remind about QA in narrow prompt patterns instead of enforcing a session-level QA requirement
- The existing `/qa` skill still assumes an iOS simulator flow, which is slower and no longer desired for this project
- Parallel Codex sessions can produce stale “QA already passed” assumptions if state is tracked too loosely

The result is an inconsistent finish path: implementation can end without local browser validation in the final mobile target view.

## Goals

- Automatically require `/qa` after feature implementation and bug fixes
- Trigger QA only after implementation is complete, not in the middle of work
- Make QA browser-only, always against the local app, always in iPhone 16 Pro view
- Require login with the shared test account for protected flows
- Prevent stale QA pass state when new code edits happen
- Keep parallel Codex sessions isolated while conservatively invalidating QA for shared worktrees
- Allow a non-success final response only when QA is blocked or still failing after retries

## Non-Goals

- Reintroducing iOS simulator, Xcode, or Capacitor-native QA into `/qa`
- Running QA for docs-only, design-only, or rule-only work
- Building a general-purpose workflow engine for all skills
- Guaranteeing a perfect “before final answer” interception hook; current Codex hooks do not expose that lifecycle event

## Constraints

- Current repo-level Codex hooks provide `SessionStart`, `UserPromptSubmit`, `PreToolUse`, and `PostToolUse`
- `CODEX_THREAD_ID` is available in the environment and can identify a Codex session
- `browser-use` CLI does not expose a first-class viewport flag in current help output, so iPhone 16 Pro emulation will be established through a required local helper that launches or configures the browser session before `browser-use` attaches
- QA must always target the local served app, not production

## Design Summary

The workflow adds a stateful QA gate around implementation work.

1. Prompt classification marks a session as feature, bug-fix, or other.
2. The first qualifying code edit in a feature or bug-fix session marks QA as required.
3. While QA is required, hooks keep injecting blocking context so the agent is repeatedly told not to claim completion before `/qa`.
4. `/qa` runs local mobile-web verification only:
   - local build
   - local server
   - browser-use attached to iPhone 16 Pro emulation
   - test-account login for protected flows
5. A passing `/qa` clears the gate.
6. Any later qualifying code edit invalidates the previous QA pass and reopens the gate.

This does not rely on a nonexistent “before final answer” hook. Instead, it uses persistent per-thread state and repeated hook context so the agent treats QA as a mandatory completion gate.

## QA State Model

Store QA gate state in a repo-local file:

- Path: `.codex/state/qa-sessions.json`

Each session record is keyed by `CODEX_THREAD_ID`.

Each record stores:

- `workspace_key` — canonical repo root + real worktree path
- `branch` — current branch name when recorded
- `mode` — `feature`, `bugfix`, or `other`
- `qa_required` — whether the thread must run `/qa` before a success claim
- `qa_in_progress` — whether `/qa` is currently running
- `qa_passed` — whether the latest qualifying code state passed QA
- `last_code_edit_at` — timestamp of latest qualifying code edit
- `last_qa_run_at` — timestamp of latest `/qa` attempt
- `last_qa_result` — `passed`, `failed`, `blocked`, or `unknown`

### Parallel Session Behavior

Parallel sessions are isolated per `CODEX_THREAD_ID`, but QA invalidation is also scoped by `workspace_key`.

- Different threads in different worktrees do not interfere
- Different threads in the same worktree share invalidation semantics
- If one thread edits code in a worktree, all session records for that same `workspace_key` are marked `qa_required=true`

This is intentionally conservative. It prevents one thread from claiming that an earlier QA pass still applies after another thread changed the same working tree.

If `CODEX_THREAD_ID` is missing, the system falls back to a best-effort key derived from cwd and pid. This fallback is only for resilience and should not be treated as equally strong isolation.

## Trigger Model

### Sessions That Can Require QA

Only sessions classified as feature or bug-fix work can become QA-gated.

Classification sources:

- feature/build/implementation language in the user prompt
- bug/fix/debug/systematic-debugging language in the user prompt
- explicit `/qa` invocation remains valid at any time

### Edits That Flip the QA Gate On

QA becomes required only after the first qualifying code edit in a feature or bug-fix session.

Qualifying edit targets include:

- `src/**`
- `ios/**`
- `scripts/**`
- `package.json`
- `capacitor.config.ts`
- test files under the repo

Edits that should not flip the gate:

- design specs
- general docs
- graphify output
- hook/rule documentation only

This ensures QA is not required during brainstorming or other non-implementation work.

### Events That Reopen the Gate

Even after `/qa` passes, any later qualifying code edit in the same worktree reopens the gate and invalidates the old pass.

## Enforcement Flow

### Hook Responsibilities

#### `UserPromptSubmit`

- classify the session mode
- load any existing thread QA state
- emit stronger context when QA is required
- remind the model that only a blocked/failing final report is allowed until `/qa` passes or exhausts retries

#### `PostToolUse`

- detect qualifying code edits
- mark `qa_required=true` and `qa_passed=false`
- invalidate all session records sharing the same `workspace_key`

#### `PreToolUse`

- inject QA-pending context while the gate is dirty
- keep the completion requirement visible during later tool usage rather than only at the opening prompt

### Completion Semantics

Because no true completion hook exists, completion enforcement is behavioral:

- if QA is required, the agent must run `/qa` before making a success claim
- if `/qa` passes, success claims are allowed
- if `/qa` is blocked or still failing after allowed retries, the final message must explicitly report blocked/failing status instead of claiming completion

The project rules and skill docs should align around this exact behavior so the hooks and written instructions reinforce each other.

## `/qa` Skill Redesign

`/qa` becomes browser-only and local-only.

### Step 1: Analyze Changes

- Inspect current diff
- Map changed paths to affected user flows
- Skip QA only when there are no testable code changes

### Step 2: Local Build and Serve

- Build the static app locally
- Serve the generated output locally
- Fail fast on build issues before any browser validation

### Step 3: Launch iPhone 16 Pro Browser Session

- Start or attach to a browser session configured for iPhone 16 Pro mobile emulation
- Use a required local helper script to set viewport, user agent, and device metrics before `browser-use` attaches
- Use this browser session for the full QA run

### Step 4: Authenticated Mobile-Web Validation

For affected protected flows:

- sign in with `test@pawbalance.com`
- use password `TestPass123!`

For each affected flow, verify:

- page loads without runtime errors
- layout is correct in iPhone 16 Pro view
- content is present and usable
- console has no relevant JavaScript errors
- the implemented feature or fix works as intended

Public flows skip login when authentication is not needed.

### Step 5: Self-Heal Loop

If QA fails:

1. diagnose the issue
2. implement a fix
3. rerun the full `/qa` flow
4. stop after three failed attempts on the same issue and report blocked/failing status

### Step 6: Clear or Preserve State

- pass: clear `qa_required`, mark `qa_passed=true`
- fail: keep `qa_required=true`, mark `last_qa_result=failed`
- blocked: keep `qa_required=true`, mark `last_qa_result=blocked`

## Skill and Rule Updates

### `brainstorming`

The design and implementation workflow should explicitly state that once implementation is complete, verification hands off to `/qa` before any completion claim.

### `systematic-debugging`

After root cause is fixed and the implementation phase finishes, verification must hand off to `/qa` before the fix can be claimed as done.

### Project Rules

Update project-level QA text in:

- `CODEX.md`
- `.claude/rules/qa-verification.md`

The wording should be consistent:

- QA is mandatory after feature or bug-fix implementation
- QA is local browser validation only
- QA runs in iPhone 16 Pro view
- success claims require a post-edit QA pass
- blocked/failing final responses are allowed only when QA cannot pass after the allowed process

## Files to Change

- `.codex/hooks/user_prompt_rules.sh`
- new `.codex/hooks/qa_state.py`
- `.codex/hooks.json`
- `CODEX.md`
- `.claude/rules/qa-verification.md`
- `.agents/skills/qa/SKILL.md`
- `.agents/skills/brainstorming/SKILL.md`
- `.agents/skills/systematic-debugging/SKILL.md`
- required helper under `scripts/` for iPhone 16 Pro browser launch/emulation

## Edge Cases

### Docs-Only Work

Docs-only, spec-only, graphify-only, and rule-doc-only edits should not require QA.

### Shared Worktree, Multiple Threads

If two Codex threads edit the same worktree, any new qualifying edit invalidates QA for all thread records using that worktree. This favors correctness over convenience.

### Browser Setup Failure

If the local browser cannot be started in the required mobile configuration, `/qa` must report blocked status rather than silently downgrading to desktop or production testing.

### Protected vs Public Flows

Only protected flows require test-account login, but `/qa` must know when a changed file maps to authenticated screens and enforce login there.

### Post-QA Edits

Any qualifying code edit after a QA pass invalidates the pass immediately. There is no grace window.

## Testing Strategy for the Workflow Itself

Implementation should include targeted verification of the gate:

- feature prompt + no code edit => no QA gate
- feature prompt + qualifying code edit => QA gate opens
- docs-only edit => no QA gate
- `/qa` pass => QA gate clears
- code edit after `/qa` pass => QA gate reopens
- two threads, same worktree => second code edit invalidates both
- two threads, different worktrees => no cross-invalidation
- blocked `/qa` => success claim remains disallowed

## Trade-Offs

### Why State File Instead of Reminders Only

Reminder text already exists and is insufficient. Persistent state gives the hooks memory across the full implementation session.

### Why Worktree-Level Invalidation

It is stricter than thread-only invalidation, but it prevents stale QA passes in the only scenario where they are unsafe: multiple sessions touching the same code state.

### Why Browser-Only QA

The project wants fast, repeatable, local verification in a mobile view without the overhead and flakiness of simulator-based testing.

## Recommended Implementation Order

1. Add the QA state helper and hook integration
2. Rewrite `/qa` around local mobile-web verification
3. Update project rules and skill docs for consistent handoff language
4. Add workflow-state tests or hook-level checks for the QA gate behavior

## Acceptance Criteria

This design is complete when the implemented workflow satisfies all of the following:

- feature and bug-fix sessions do not require QA until after the first qualifying code edit
- once qualifying code is edited, the session remains QA-gated until `/qa` passes or reports blocked/failing after retries
- `/qa` tests only the local app
- `/qa` uses iPhone 16 Pro browser view, not the iOS simulator
- protected flows log in with the shared test account
- later code edits invalidate previous QA passes
- parallel sessions in separate worktrees remain isolated
- parallel sessions in the same worktree conservatively share invalidation
