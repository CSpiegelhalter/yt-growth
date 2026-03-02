#!/usr/bin/env bash
# Pre-flight suite: runs all 6 checks, compares against baseline, outputs table.
# Usage: ./scripts/preflight.sh [--update-baseline]
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
BASELINE="$ROOT_DIR/.agent/baseline.json"

# Colors (disabled if not a terminal)
if [ -t 1 ]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; NC='\033[0m'; BOLD='\033[1m'
else
  RED=''; GREEN=''; YELLOW=''; NC=''; BOLD=''
fi

# --- Run checks, capture counts ---

echo "${BOLD}=== Pre-flight suite ===${NC}"
echo ""
FAILED=0

# 1. Build
echo "  [1/6] bun run build ..."
BUILD_OUTPUT=$(cd "$WEB_DIR" && bun run build 2>&1) || true
if echo "$BUILD_OUTPUT" | grep -q "✓ Compiled successfully"; then
  BUILD_ERRORS=0
  echo "         ${GREEN}pass${NC}"
else
  BUILD_ERRORS=1
  echo "         ${RED}FAIL${NC}"
  echo "$BUILD_OUTPUT" | tail -20
fi

# 2. Lint
echo "  [2/6] bun run lint ..."
LINT_OUTPUT=$(cd "$WEB_DIR" && bun run lint 2>&1) || true
# Count ESLint errors (lines matching "X errors")
LINT_ERRORS=$(echo "$LINT_OUTPUT" | grep -oE '[0-9]+ error' | head -1 | grep -oE '[0-9]+' || echo "0")
if [ "$LINT_ERRORS" -eq 0 ] 2>/dev/null; then
  echo "         ${GREEN}pass${NC}"
else
  echo "         ${RED}$LINT_ERRORS error(s)${NC}"
fi

# 3. Knip
echo "  [3/6] knip ..."
KNIP_OUTPUT=$(cd "$ROOT_DIR" && bunx knip --config apps/web/knip.json 2>&1) || true

# Count unused exports
KNIP_UNUSED_EXPORTS=$(echo "$KNIP_OUTPUT" | grep -oE 'Unused exports \([0-9]+\)' | grep -oE '[0-9]+' || echo "0")

# Count unused files
KNIP_UNUSED_FILES=$(echo "$KNIP_OUTPUT" | grep -oE 'Unused files \([0-9]+\)' | grep -oE '[0-9]+' || echo "0")

echo "         exports=${KNIP_UNUSED_EXPORTS} files=${KNIP_UNUSED_FILES}"

# 4. Madge (circular deps)
echo "  [4/6] madge (circular deps) ..."
MADGE_OUTPUT=$(cd "$ROOT_DIR" && bunx madge --circular --extensions ts,tsx,js,jsx apps/web/app apps/web/lib 2>&1) || true
if echo "$MADGE_OUTPUT" | grep -q "No circular dependency found"; then
  CIRCULAR_DEPS=0
else
  CIRCULAR_DEPS=$(echo "$MADGE_OUTPUT" | grep -cE '^\s+[0-9]+\)' || echo "0")
fi
echo "         circular=${CIRCULAR_DEPS}"

# 5. Dependency-cruiser
echo "  [5/6] dependency-cruiser ..."
DEPCRUISE_OUTPUT=$(cd "$ROOT_DIR" && bunx depcruise --config dependency-cruiser.js --output-type err-long apps/web 2>&1) || true
if echo "$DEPCRUISE_OUTPUT" | grep -q "no dependency violations found"; then
  DEPCRUISE_VIOLATIONS=0
else
  DEPCRUISE_VIOLATIONS=$(echo "$DEPCRUISE_OUTPUT" | grep -cE '^\s*violation' || echo "0")
  # Fallback: count "err" lines
  if [ "$DEPCRUISE_VIOLATIONS" -eq 0 ] 2>/dev/null; then
    DEPCRUISE_VIOLATIONS=$(echo "$DEPCRUISE_OUTPUT" | grep -cE '^\s*err\s' || echo "0")
  fi
fi
echo "         violations=${DEPCRUISE_VIOLATIONS}"

# 6. jscpd (code duplication)
echo "  [6/6] jscpd ..."
JSCPD_OUTPUT=$(cd "$ROOT_DIR" && bunx jscpd apps/web --pattern "**/*.{ts,tsx}" --min-lines 8 --min-tokens 70 2>&1) || true
JSCPD_CLONES=$(echo "$JSCPD_OUTPUT" | grep -oE 'Found [0-9]+ clones' | grep -oE '[0-9]+' || echo "0")
# Fallback: count "Clone found" lines
if [ "$JSCPD_CLONES" = "0" ]; then
  JSCPD_CLONES=$(echo "$JSCPD_OUTPUT" | grep -c "Clone found" || echo "0")
fi
echo "         clones=${JSCPD_CLONES}"

echo ""

# --- Read baseline ---

if [ -f "$BASELINE" ]; then
  B_BUILD=$(python3 -c "import json; d=json.load(open('$BASELINE')); print(d.get('buildErrors',0))")
  B_LINT=$(python3 -c "import json; d=json.load(open('$BASELINE')); print(d.get('lintErrors',0))")
  B_KNIP_EXPORTS=$(python3 -c "import json; d=json.load(open('$BASELINE')); print(d.get('knipUnusedExports',0))")
  B_KNIP_FILES=$(python3 -c "import json; d=json.load(open('$BASELINE')); print(d.get('knipUnusedFiles',0))")
  B_CIRCULAR=$(python3 -c "import json; d=json.load(open('$BASELINE')); print(d.get('circularDeps',0))")
  B_DEPCRUISE=$(python3 -c "import json; d=json.load(open('$BASELINE')); print(d.get('depcruiseViolations',0))")
  B_JSCPD=$(python3 -c "import json; d=json.load(open('$BASELINE')); print(d.get('jscpdClones',0))")
else
  echo "${YELLOW}No baseline found. Current results will be saved as baseline.${NC}"
  B_BUILD="-"; B_LINT="-"; B_KNIP_EXPORTS="-"; B_KNIP_FILES="-"
  B_CIRCULAR="-"; B_DEPCRUISE="-"; B_JSCPD="-"
fi

# --- Compare and build table ---

status() {
  local baseline="$1" current="$2"
  if [ "$baseline" = "-" ]; then echo "new"; return; fi
  if [ "$current" -lt "$baseline" ] 2>/dev/null; then echo "pass*"; return; fi
  if [ "$current" -gt "$baseline" ] 2>/dev/null; then echo "FAIL"; FAILED=1; return; fi
  echo "pass"
}

S_BUILD=$(status "$B_BUILD" "$BUILD_ERRORS")
S_LINT=$(status "$B_LINT" "$LINT_ERRORS")
S_KNIP_EXPORTS=$(status "$B_KNIP_EXPORTS" "$KNIP_UNUSED_EXPORTS")
S_KNIP_FILES=$(status "$B_KNIP_FILES" "$KNIP_UNUSED_FILES")
S_CIRCULAR=$(status "$B_CIRCULAR" "$CIRCULAR_DEPS")
S_DEPCRUISE=$(status "$B_DEPCRUISE" "$DEPCRUISE_VIOLATIONS")
S_JSCPD=$(status "$B_JSCPD" "$JSCPD_CLONES")

# --- Output table ---

echo "${BOLD}| Metric                 | Baseline | Current | Status |${NC}"
echo "|-----------------------|----------|---------|--------|"
printf "| Build errors          | %-8s | %-7s | %-6s |\n" "$B_BUILD" "$BUILD_ERRORS" "$S_BUILD"
printf "| Lint errors           | %-8s | %-7s | %-6s |\n" "$B_LINT" "$LINT_ERRORS" "$S_LINT"
printf "| Knip unused exports   | %-8s | %-7s | %-6s |\n" "$B_KNIP_EXPORTS" "$KNIP_UNUSED_EXPORTS" "$S_KNIP_EXPORTS"
printf "| Knip unused files     | %-8s | %-7s | %-6s |\n" "$B_KNIP_FILES" "$KNIP_UNUSED_FILES" "$S_KNIP_FILES"
printf "| Circular deps (madge) | %-8s | %-7s | %-6s |\n" "$B_CIRCULAR" "$CIRCULAR_DEPS" "$S_CIRCULAR"
printf "| Dep-cruiser violations| %-8s | %-7s | %-6s |\n" "$B_DEPCRUISE" "$DEPCRUISE_VIOLATIONS" "$S_DEPCRUISE"
printf "| jscpd clones          | %-8s | %-7s | %-6s |\n" "$B_JSCPD" "$JSCPD_CLONES" "$S_JSCPD"
echo ""

# --- Update baseline if improved or creating new ---

IMPROVED=0
if [ "$B_BUILD" = "-" ]; then
  IMPROVED=1
fi
for metric_pair in \
  "$B_BUILD:$BUILD_ERRORS" \
  "$B_LINT:$LINT_ERRORS" \
  "$B_KNIP_EXPORTS:$KNIP_UNUSED_EXPORTS" \
  "$B_KNIP_FILES:$KNIP_UNUSED_FILES" \
  "$B_CIRCULAR:$CIRCULAR_DEPS" \
  "$B_DEPCRUISE:$DEPCRUISE_VIOLATIONS" \
  "$B_JSCPD:$JSCPD_CLONES"; do
  b="${metric_pair%%:*}"
  c="${metric_pair##*:}"
  if [ "$b" != "-" ] && [ "$c" -lt "$b" ] 2>/dev/null; then
    IMPROVED=1
  fi
done

if [ "$IMPROVED" -eq 1 ] && [ "$FAILED" -eq 0 ]; then
  mkdir -p "$(dirname "$BASELINE")"
  cat > "$BASELINE" <<EOJSON
{
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
  "buildErrors": $BUILD_ERRORS,
  "lintErrors": $LINT_ERRORS,
  "knipUnusedExports": $KNIP_UNUSED_EXPORTS,
  "knipUnusedFiles": $KNIP_UNUSED_FILES,
  "circularDeps": $CIRCULAR_DEPS,
  "depcruiseViolations": $DEPCRUISE_VIOLATIONS,
  "jscpdClones": $JSCPD_CLONES
}
EOJSON
  echo "${GREEN}Baseline updated with improvements.${NC}"
fi

if [ "$FAILED" -ne 0 ]; then
  echo "${RED}REGRESSIONS DETECTED -- fix before completing the task.${NC}"
  exit 1
else
  echo "${GREEN}All checks passed.${NC}"
  exit 0
fi
