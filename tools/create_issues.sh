#!/usr/bin/env bash
# Requires: GitHub CLI (gh) and authenticated session.
# Usage: ./tools/create_issues.sh owner/repo

REPO="$1"
if [ -z "$REPO" ]; then
  echo "Usage: $0 owner/repo"
  exit 1
fi

issues=(
  "Backend: FastAPI scaffold with /healthz and /ws echo|Aariz|Create FastAPI app, health check, and WebSocket echo endpoint."
  "Backend: Idempotent write logic (design) |Aariz|Draft design for sequence numbers + idempotency keys."
  "Frontend: React shell + WebSocket client|Nikita|Basic editor textarea, chat panel, and connect button."
  "Frontend: Autosave batching (~500ms)|Nikita|Save deltas (console log for now)."
  "Infra: Terraform skeleton|Arin|Providers, backends (local), variables; no resources yet."
  "Infra: CI (GitHub Actions)|Arin|Add CI for backend tests + frontend build."
  "QA: Crash/recovery test plan|Abhyansh|Write manual test steps for kill-and-restore flow."
  "Docs: CONTRIBUTING + PR template|Abhyansh|Contrib guide and PR checklist."
)

for entry in "${issues[@]}"; do
  IFS='|' read -r title assignee body <<< "$entry"
  echo "Creating: $title"
  gh issue create --repo "$REPO" --title "$title" --body "$body" --assignee "$assignee" || true
done
