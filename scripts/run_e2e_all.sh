#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

PLATFORM_ARG="${1:-all}"

case "$PLATFORM_ARG" in
  ios)     PLATFORMS=("ios") ;;
  android) PLATFORMS=("android") ;;
  all)     PLATFORMS=("ios" "android") ;;
  *) echo "Usage: ./scripts/run_e2e_all.sh [ios|android|all]"; exit 1 ;;
esac

EXAMPLES=()

for dir in "$ROOT_DIR/examples"/expo-*/ "$ROOT_DIR/examples"/rn-*/; do
  [ -d "$dir" ] || continue
  example="$(basename "$dir")"
  EXAMPLES+=("$example")
done

PASSED=()
FAILED=()

for example in "${EXAMPLES[@]}"; do
  for platform in "${PLATFORMS[@]}"; do
    echo ""
    echo "======================================================"
    echo " Running e2e: $example / $platform"
    echo "======================================================"
    if "$SCRIPT_DIR/run_e2e.sh" "$example" "$platform"; then
      PASSED+=("$example/$platform")
    else
      FAILED+=("$example/$platform")
    fi
  done
done

echo ""
echo "======================================================"
echo " Results"
echo "======================================================"

echo "Passed (${#PASSED[@]}):"
for p in "${PASSED[@]}"; do
  echo "  ✓ $p"
done

if [ ${#FAILED[@]} -gt 0 ]; then
  echo "Failed (${#FAILED[@]}):"
  for f in "${FAILED[@]}"; do
    echo "  ✗ $f"
  done
  exit 1
fi
