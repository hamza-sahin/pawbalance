#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

GRAPHIFY_BIN="${GRAPHIFY_BIN:-$(command -v graphify || true)}"
GRAPHIFY_PYTHON=""

if [[ -n "$GRAPHIFY_BIN" ]]; then
  GRAPHIFY_PYTHON="$(head -n 1 "$GRAPHIFY_BIN" | tr -d '#!')"
fi

if [[ -z "$GRAPHIFY_PYTHON" ]]; then
  GRAPHIFY_PYTHON="${PYTHON:-python3}"
fi

"$GRAPHIFY_PYTHON" -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
