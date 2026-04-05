---
description: Rule for invoking skills mentioned in user prompts
globs: *
---

# Skill Invocation Rule

When the user's prompt mentions single or multiple skills (e.g. `/brainstorming /ios-debug /ui-ux-pro-max implement feature A`), you MUST invoke ALL of them using the Skill tool before proceeding with the task.

- Parse the user's message for every `/skill-name` reference.
- Invoke each referenced skill via the Skill tool. Do not skip any.
- If skills have a natural ordering (e.g. brainstorming before implementation, ui-ux before coding, qa after implementation), invoke them in that order.
- After all skills are loaded, follow each skill's instructions as you execute the task.
- Never assume a skill is irrelevant just because another skill covers a related area. Each skill provides distinct guidance.
