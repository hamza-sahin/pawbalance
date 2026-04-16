#!/usr/bin/env python3
import json
import os
import re
import sys


def ordered_unique(items):
    seen = set()
    out = []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out


raw = sys.stdin.read()
if not raw.strip():
    sys.exit(0)

try:
    payload = json.loads(raw)
except json.JSONDecodeError:
    sys.exit(0)

prompt = (payload.get("prompt") or "")
if not isinstance(prompt, str):
    sys.exit(0)

normalized = prompt.lower()
notes = []

if os.path.exists("graphify-out/graph.json") and re.search(
    r"\b(architecture|codebase|system architecture|project structure|file structure|component|module)\b",
    normalized,
):
    if os.path.exists("graphify-out/wiki/index.md"):
        notes.append(
            "Graphify rule: architecture/codebase question. Read graphify-out/wiki/index.md first "
            "(then GRAPH_REPORT.md) before exploring raw files."
        )
    else:
        notes.append(
            "Graphify rule: architecture/codebase question. Read graphify-out/GRAPH_REPORT.md first."
        )

if os.path.exists(".codex/rules/") or os.path.exists(".codex/rules.md"):
    skill_refs = re.findall(r"/[a-z0-9_-]+(?::[a-z0-9_-]+)?", normalized, flags=re.I)
    if skill_refs:
        skill_refs = ordered_unique(skill_refs)
        notes.append(
            "Skill invocation rule: user mentioned skill references "
            + ", ".join(skill_refs)
            + ". Invoke each matching skill before working."
        )

if re.search(r"\b(ui|user interface|screen|layout|component|style|css|src/(components|app)|globals\.css)\b", normalized):
    notes.append(
        "UI rule: if this touches UI components/layout/styling, run /ui-ux-pro-max before editing."
    )

if re.search(r"\b(implement|feature|bug|fix|after implementing|after fixing)\b.*\b(qa|verification)\b", normalized) or "/qa" in prompt or "/deploy" in prompt:
    notes.append(
        "QA rule: after implementing feature work or fixing bugs, run /qa before claiming completion. "
        "Only run /deploy after /qa passes."
    )

if notes:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "UserPromptSubmit",
                    "additionalContext": " ; ".join(notes),
                }
            }
        )
    )
