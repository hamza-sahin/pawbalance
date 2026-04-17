#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    result = subprocess.run(
        ["python3", str(REPO_ROOT / ".codex" / "hooks" / "qa_state.py"), "pending-note"],
        cwd=REPO_ROOT,
        env=os.environ.copy(),
        capture_output=True,
        text=True,
        check=True,
    )
    note = result.stdout.strip()
    if not note:
        return 0

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "additionalContext": note,
                }
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
