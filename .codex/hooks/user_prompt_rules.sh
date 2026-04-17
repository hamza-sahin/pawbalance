#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def ordered_unique(items):
    seen = set()
    output = []
    for item in items:
        if item not in seen:
            seen.add(item)
            output.append(item)
    return output


def qa_state(*args: str) -> str:
    result = subprocess.run(
        ["python3", str(REPO_ROOT / ".codex" / "hooks" / "qa_state.py"), *args],
        cwd=REPO_ROOT,
        env=os.environ.copy(),
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


raw = sys.stdin.read()
if not raw.strip():
    raise SystemExit(0)

try:
    payload = json.loads(raw)
except json.JSONDecodeError:
    raise SystemExit(0)

prompt = payload.get("prompt") or ""
if not isinstance(prompt, str):
    raise SystemExit(0)

normalized = prompt.lower()
notes = []

qa_state("record-prompt", "--prompt", prompt)

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

skill_refs = re.findall(r"/[a-z0-9_-]+(?::[a-z0-9_-]+)?", prompt, flags=re.I)
if skill_refs:
    notes.append(
        "Skill invocation rule: user mentioned skill references "
        + ", ".join(ordered_unique(skill_refs))
        + ". Invoke each matching skill before working."
    )

if re.search(r"\b(ui|user interface|screen|layout|component|style|css|src/(components|app)|globals\.css)\b", normalized):
    notes.append(
        "UI rule: if this touches UI components/layout/styling, run /ui-ux-pro-max before editing."
    )

if re.search(r"\b(implement|feature|build|fix|bug|debug)\b", normalized):
    notes.append(
        "QA rule: feature and bug-fix sessions require /qa after qualifying code edits and before any success claim."
    )

if "/qa" in prompt:
    notes.append(
        "QA skill requested: run local browser QA against http://localhost:3001 in iPhone 16 Pro view. "
        "Use test@pawbalance.com for protected flows."
    )

if "/deploy" in prompt:
    notes.append("Deploy rule: only run /deploy after /qa passes for the current edited code state.")

pending_note = qa_state("pending-note")
if pending_note:
    notes.append(pending_note)

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
