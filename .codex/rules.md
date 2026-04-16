# Codex rule migration from `.claude/rules`

## Active codex rule mappings

- `caveman-mode.md` -> **SessionStart** hook.
  - Keeps current session in caveman style from startup/resume/clear/compact.
- `graphify.md` -> **PreToolUse** + **UserPromptSubmit** + **PostToolUse** hooks.
  - `Glob|Grep` search now injects graph context reminder.
  - Architecture/codebase prompts now inject guidance to read graph docs first.
  - Post edit/write/patch/bash hooks trigger graph rebuild.
- `skill-invocation.md` -> **UserPromptSubmit** hook.
  - Reminder injected for slash-style skill references so skills should be invoked before work begins.
- `qa-verification.md` -> **UserPromptSubmit** reminder.
  - Reminder to run `/qa` after feature/bug-fix work and `/deploy` only after QA passes.
- `ui-ux-skill.md` -> **UserPromptSubmit** reminder.
  - Reminder to run `/ui-ux-pro-max` before UI/component/layout work.

## Notes

- Script hooks live in `.codex/hooks/*.sh` and are invoked by `.codex/hooks.json`.
- This preserves behavior as much as possible within Codex hook capabilities.
