#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
PATCH_PATH_RE = re.compile(r"^\*\*\* (?:Update|Add|Delete) File: (.+)$", re.M)


def collect_strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from collect_strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from collect_strings(child)


def normalize_candidate(candidate: str) -> str:
    value = candidate.strip()
    if not value:
        return ""
    if value.startswith(str(REPO_ROOT)):
        value = str(Path(value).resolve().relative_to(REPO_ROOT))
    return value.lstrip("./")


def extract_paths(payload: dict) -> list[str]:
    candidates = set()
    for text in collect_strings(payload):
        if "*** Begin Patch" in text:
            for match in PATCH_PATH_RE.findall(text):
                candidates.add(normalize_candidate(match))
            continue
        normalized = normalize_candidate(text)
        if "/" in normalized or normalized.endswith((".ts", ".tsx", ".py", ".sh", ".md")):
            candidates.add(normalized)
    return sorted(path for path in candidates if path)


def main() -> int:
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw.strip() else {}
    paths = extract_paths(payload)
    if not paths:
        return 0

    result = subprocess.run(
        [
            "python3",
            str(REPO_ROOT / ".codex" / "hooks" / "qa_state.py"),
            "mark-edit",
            "--paths",
            *paths,
        ],
        cwd=REPO_ROOT,
        env=os.environ.copy(),
        capture_output=True,
        text=True,
        check=True,
    )
    summary = json.loads(result.stdout)
    changed_paths = summary.get("changed_paths", [])
    if not changed_paths:
        return 0

    preview = ", ".join(changed_paths[:3])
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": (
                        "QA gate activated after qualifying code edit: "
                        f"{preview}. Run /qa before any success claim."
                    ),
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
