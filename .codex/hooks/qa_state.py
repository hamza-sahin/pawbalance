#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path


FEATURE_RE = re.compile(r"\b(implement|feature|build|add|create)\b", re.I)
BUGFIX_RE = re.compile(r"\b(fix|bug|debug|regression|broken|issue)\b", re.I)
QUALIFYING_PREFIXES = ("src/", "ios/", "scripts/")
QUALIFYING_FILES = {"package.json", "capacitor.config.ts"}
IGNORED_PREFIXES = ("docs/", "graphify-out/")
IGNORED_EXACT = {
    "CODEX.md",
    ".codex/rules.md",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def run_git(*args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        check=True,
        capture_output=True,
        text=True,
        cwd=Path.cwd(),
    )
    return result.stdout.strip()


def repo_root() -> str:
    return run_git("rev-parse", "--show-toplevel")


def branch_name() -> str:
    return run_git("rev-parse", "--abbrev-ref", "HEAD")


def thread_id() -> str:
    return os.environ.get("CODEX_THREAD_ID") or f"fallback:{Path.cwd().resolve()}:{os.getpid()}"


def state_path() -> Path:
    return Path(os.environ.get("QA_STATE_FILE", ".codex/state/qa-sessions.json"))


def workspace_key() -> str:
    return f"{repo_root()}::{Path.cwd().resolve()}"


def normalize_path(path: str) -> str:
    value = path.strip()
    if not value:
        return ""
    cwd = Path.cwd().resolve()
    if value.startswith(str(cwd)):
        value = os.path.relpath(value, cwd)
    return value.lstrip("./")


def classify_prompt(prompt: str) -> str:
    if BUGFIX_RE.search(prompt):
        return "bugfix"
    if FEATURE_RE.search(prompt):
        return "feature"
    return "other"


def is_qualifying_code_path(path: str) -> bool:
    candidate = normalize_path(path)
    if not candidate:
        return False
    if candidate in IGNORED_EXACT:
        return False
    if candidate.startswith(IGNORED_PREFIXES):
        return False
    if candidate.startswith(".claude/rules/"):
        return False
    if candidate.startswith(".agents/skills/") and candidate.endswith("/SKILL.md"):
        return False
    if candidate.startswith(QUALIFYING_PREFIXES):
        return True
    if candidate in QUALIFYING_FILES:
        return True
    return any(
        marker in candidate
        for marker in ("/__tests__/", ".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx")
    )


def load_state() -> dict:
    path = state_path()
    if not path.exists():
        return {"threads": {}}
    return json.loads(path.read_text())


def save_state(state: dict) -> None:
    path = state_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n")


def upsert_session(state: dict, *, mode: str | None = None) -> dict:
    session = state.setdefault("threads", {}).setdefault(
        thread_id(),
        {
            "workspace_key": workspace_key(),
            "branch": branch_name(),
            "mode": "other",
            "qa_required": False,
            "qa_in_progress": False,
            "qa_passed": False,
            "last_code_edit_at": None,
            "last_qa_run_at": None,
            "last_qa_result": "unknown",
        },
    )
    session["workspace_key"] = workspace_key()
    session["branch"] = branch_name()
    if mode in {"feature", "bugfix"}:
        session["mode"] = mode
    elif mode == "other" and session["mode"] == "other":
        session["mode"] = "other"
    return session


def record_prompt(prompt: str) -> dict:
    state = load_state()
    session = upsert_session(state, mode=classify_prompt(prompt))
    save_state(state)
    return session


def mark_edit(paths: list[str]) -> dict:
    state = load_state()
    session = upsert_session(state)
    changed_paths = sorted({normalize_path(path) for path in paths if is_qualifying_code_path(path)})
    if session["mode"] not in {"feature", "bugfix"} or not changed_paths:
        save_state(state)
        return {"changed_paths": changed_paths, "qa_required": session["qa_required"]}

    timestamp = now_iso()
    for record in state["threads"].values():
        if record.get("workspace_key") != session["workspace_key"]:
            continue
        record["qa_required"] = True
        record["qa_passed"] = False
        record["qa_in_progress"] = False
        record["last_code_edit_at"] = timestamp
        record["last_qa_result"] = "unknown"

    save_state(state)
    return {"changed_paths": changed_paths, "qa_required": True}


def mark_qa(result: str) -> dict:
    state = load_state()
    session = upsert_session(state)
    session["last_qa_run_at"] = now_iso()
    session["qa_in_progress"] = False
    session["last_qa_result"] = result
    if result == "passed":
        session["qa_required"] = False
        session["qa_passed"] = True
    else:
        session["qa_required"] = True
        session["qa_passed"] = False
    save_state(state)
    return session


def pending_note() -> str:
    state = load_state()
    session = upsert_session(state)
    save_state(state)
    if not session["qa_required"]:
        return ""
    return (
        "QA gate active for this thread/workspace. Run /qa before any success claim. "
        "Only send a blocked/failing final response if /qa cannot pass after retries."
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    record_prompt_parser = subparsers.add_parser("record-prompt")
    record_prompt_parser.add_argument("--prompt", required=True)

    mark_edit_parser = subparsers.add_parser("mark-edit")
    mark_edit_parser.add_argument("--paths", nargs="+", required=True)

    mark_qa_parser = subparsers.add_parser("mark-qa")
    mark_qa_parser.add_argument(
        "--result",
        choices=["passed", "failed", "blocked"],
        required=True,
    )

    subparsers.add_parser("pending-note")

    args = parser.parse_args()

    if args.command == "record-prompt":
        print(json.dumps(record_prompt(args.prompt)))
        return 0
    if args.command == "mark-edit":
        print(json.dumps(mark_edit(args.paths)))
        return 0
    if args.command == "mark-qa":
        print(json.dumps(mark_qa(args.result)))
        return 0
    if args.command == "pending-note":
        note = pending_note()
        if note:
            print(note)
        return 0

    return 1


if __name__ == "__main__":
    raise SystemExit(main())
