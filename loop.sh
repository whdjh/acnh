#!/bin/bash
# Ralph Wiggum Loop Script

MODE="${1:-build}"  # default: build mode

if [ "$MODE" = "plan" ]; then
  PROMPT_FILE="PROMPT_plan.md"
else
  PROMPT_FILE="PROMPT_build.md"
fi

echo "🔄 Starting Ralph loop in $MODE mode..."
echo "Press Ctrl+C to stop"
echo ""

while true; do
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📖 Reading $PROMPT_FILE + AGENTS.md"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Combine AGENTS.md + PROMPT file and pipe to claude
  cat AGENTS.md "$PROMPT_FILE" | claude

  echo ""
  echo "✅ Iteration complete. Restarting in 3 seconds..."
  sleep 3
done
