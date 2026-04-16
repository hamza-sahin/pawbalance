#!/usr/bin/env bash
set -euo pipefail

if [ -d graphify-out ]; then
  python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))" >/dev/null 2>&1 || true
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"graphify: Ran graphify rebuild after code edit."}}'
fi
