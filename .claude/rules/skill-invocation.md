---
description: Rule for invoking skills mentioned in user prompts
globs: *
---

# Skill Invocation Rule

When the user's prompt mentions single or multiple skills (e.g. `/brainstorming /ios-debug /ui-ux-pro-max implement feature A`), you MUST invoke ALL of them using the Skill tool before proceeding with the task.

## Requirements

1. **Parse ALL references.** Scan user message for every `/skill-name` or `/namespace:skill-name` pattern. Count them. You must invoke exactly that many skills.
2. **Invoke EVERY skill. Zero exceptions.** Do not skip any referenced skill for any reason.
3. **Invoke in parallel when possible.** Send multiple Skill tool calls in a single response to prevent interruption between invocations. Only sequence them if one skill's output is needed before invoking the next.
4. **After all skills loaded**, follow each skill's instructions as you execute the task.

## Common Rationalizations That Are NOT Valid Reasons to Skip

| Excuse | Why It's Wrong |
|--------|---------------|
| "Skill already active via hook/mode" | User explicitly referenced it — invoke it anyway. Hooks and skill invocations are separate. |
| "I can handle this implicitly" | Skill contains specific instructions you don't have without loading it. |
| "Another skill covers this area" | Each skill provides distinct guidance. Never assume overlap. |
| "It's a mode, not a task skill" | If user typed `/skill-name`, invoke it. Period. |
| "I'll invoke it later" | ALL skills load BEFORE any other work. No exceptions. |

## Known Failure Patterns (OBSERVED IN PRODUCTION)

These exact failures have happened. Watch for them:

1. **`/superpowers:brainstorming` skipped** — Model starts "setting up brainstorming tasks" or "exploring requirements" WITHOUT calling `Skill("superpowers:brainstorming")`. This is WRONG. The Skill tool call loads specific instructions. "Doing brainstorming" is not the same as loading the skill.

2. **`/caveman` skipped** — Caveman mode activates via startup hook, so model thinks skill invocation redundant. WRONG. The hook and the skill are separate. Always invoke `Skill("caveman")` when user references `/caveman`.

3. **Sequential invocation → interruption** — Invoking skills one-by-one means user can interrupt mid-sequence. Send ALL Skill calls in ONE response.

## Verification

Before proceeding with task work, count: skills referenced vs skills invoked. If mismatch → invoke missing ones immediately. This is a hard gate — no task work until count matches.
