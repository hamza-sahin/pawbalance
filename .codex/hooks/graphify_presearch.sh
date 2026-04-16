#!/usr/bin/env bash
set -euo pipefail

if [ -f graphify-out/graph.json ]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PreToolUse","additionalContext":"graphify: Knowledge graph exists. Read graphify-out/GRAPH_REPORT.md first (or graphify-out/wiki/index.md if it exists) before searching raw files."}}'
fi
