#!/usr/bin/env bash
set -euo pipefail

if [ -f graphify-out/graph.json ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse"}}'
fi
