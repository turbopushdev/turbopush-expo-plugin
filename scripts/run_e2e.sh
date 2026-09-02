#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

EXAMPLE="${1:?Usage: ./scripts/run_e2e.sh <example> <platform> [--test-only] [--only <name>]}"
PLATFORM="${2:?Usage: ./scripts/run_e2e.sh <example> <platform> [--test-only] [--only <name>]}"
# strip leading "examples/" if passed (e.g. examples/expo-56 → expo-56)
EXAMPLE="${EXAMPLE#examples/}"
shift 2

# Export so scenario `before`/`after` commands can reference them.
export ROOT_DIR EXAMPLE

TEST_ONLY=false
ONLY=""
while [ $# -gt 0 ]; do
  case "$1" in
    --test-only) TEST_ONLY=true ;;
    --only)
      [ $# -ge 2 ] || { echo "Error: --only requires a scenario name"; exit 1; }
      ONLY="$2"
      shift
      ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
  shift
done

EXAMPLE_DIR="$ROOT_DIR/examples/$EXAMPLE"
if [ ! -d "$EXAMPLE_DIR" ]; then
  echo "Error: directory not found: $EXAMPLE_DIR"
  exit 1
fi

# Load config
# shellcheck source=../.env
source "$ROOT_DIR/.env"

BUILD_VERSION="1.0.0"
PRIVATE_KEY_PATH="$ROOT_DIR/.signing/signing-private.pem"
SCENARIOS_FILE="$ROOT_DIR/scenarios.json"
HARNESS_PORT="${HARNESS_PORT:-3210}"
HARNESS_URL="http://127.0.0.1:${HARNESS_PORT}"

# Detect whether this is an Expo-managed project
if node -e "const p=require('$EXAMPLE_DIR/package.json'); process.exit(p.dependencies?.expo || p.devDependencies?.expo ? 0 : 1)" 2>/dev/null; then
  IS_EXPO=true
else
  IS_EXPO=false
fi
echo "Detected project type: $([ "$IS_EXPO" = true ] && echo 'Expo' || echo 'React Native')"

if [ "$PLATFORM" = "ios" ]; then
  DEPLOYMENT="$IOS_DEPLOYMENT"
elif [ "$PLATFORM" = "android" ]; then
  DEPLOYMENT="$ANDROID_DEPLOYMENT"
  ANDROID_DEVICE=$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')
  if [ -z "$ANDROID_DEVICE" ]; then
    echo "Error: No Android emulator/device found. Start one first."
    exit 1
  fi
  echo "Detected Android device: $ANDROID_DEVICE"
else
  echo "Error: Platform must be 'ios' or 'android'"
  exit 1
fi

if [ -n "$ONLY" ]; then
  node -e 'const fs=require("fs");const c=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));process.exit(c.scenarios.some(s=>s.name===process.argv[2])?0:1)' \
    "$SCENARIOS_FILE" "$ONLY" || {
      echo "Error: scenario '$ONLY' not found in $SCENARIOS_FILE"
      exit 1
    }
fi

# Generates the signing keypair (once, reused) and injects the public key into
# the app build via EXPO_PUBLIC_CODE_PUSH_PUBLIC_KEY.
prepare_signing_keys() {
  bash "$SCRIPT_DIR/generate_signing_keys.sh"
  export EXPO_PUBLIC_CODE_PUSH_PUBLIC_KEY="$(cat "$ROOT_DIR/.signing/signing-public.b64")"
  echo "Code signing public key: ${EXPO_PUBLIC_CODE_PUSH_PUBLIC_KEY:0:24}..."
}

# Builds and installs the native app. When SIGNING=true the public key is baked
# into the app (Android strings.xml / iOS Info.plist); when false the app has no
# public key and will accept unsigned updates.
build_and_install() {
  local SIGNING="$1"

  if [ "$SIGNING" = true ]; then
    echo "==> Building app with code signing enabled..."
    prepare_signing_keys
  else
    unset EXPO_PUBLIC_CODE_PUSH_PUBLIC_KEY
    echo "==> Building app without code signing..."
  fi

  echo "==> Setting version to $BUILD_VERSION and installing deps..."
  "$SCRIPT_DIR/set_env.sh" "$BUILD_VERSION" "$EXAMPLE"
  (cd "$EXAMPLE_DIR" && yarn)

  if [ "$TEST_ONLY" = false ]; then
    if [ "$IS_EXPO" = true ]; then
      (cd "$EXAMPLE_DIR" && echo "y" | yarn prebuild --clean)
    fi

    if [ "$PLATFORM" = "ios" ]; then
      xcrun simctl uninstall booted "$BUNDLE_ID" 2>/dev/null || true
      if [ "$IS_EXPO" = true ]; then
        (cd "$EXAMPLE_DIR" && yarn ios --configuration Release --no-bundler)
      else
        (cd "$EXAMPLE_DIR" && yarn ios --mode Release --no-packager)
      fi
    elif [ "$PLATFORM" = "android" ]; then
      adb -s "$ANDROID_DEVICE" uninstall "$BUNDLE_ID" 2>/dev/null || true
      if [ "$IS_EXPO" = true ]; then
        (cd "$EXAMPLE_DIR" && ANDROID_SERIAL="$ANDROID_DEVICE" yarn android --variant release --no-bundler)
      else
        (cd "$EXAMPLE_DIR" && ANDROID_SERIAL="$ANDROID_DEVICE" yarn android --mode release --no-packager)
      fi
    fi
  else
    echo "==> Skipping native build and install (--test-only)..."
  fi
}

start_harness() {
  echo "==> Starting harness on $HARNESS_URL (cwd=$EXAMPLE_DIR)..."
  HARNESS_CWD="$EXAMPLE_DIR" HARNESS_PORT="$HARNESS_PORT" node "$SCRIPT_DIR/harness.mjs" &
  HARNESS_PID=$!
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    if node -e 'fetch(process.argv[1]).then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))' \
      "$HARNESS_URL/health" 2>/dev/null; then
      return 0
    fi
    sleep 0.3
  done
  echo "Error: harness failed to start"
  exit 1
}

stop_harness() {
  if [ -n "${HARNESS_PID:-}" ]; then
    kill "$HARNESS_PID" 2>/dev/null || true
  fi
}
trap stop_harness EXIT

# Runs a single scenario's Maestro flow. The flow itself drives the release via
# the harness; here we only build the env it needs.
run_scenario() {
  local name="$1" releaseSigned="$2" version="$3" flow="$4"
  local SIGN_ARGS=""
  [ "$releaseSigned" = "true" ] && SIGN_ARGS="-k $PRIVATE_KEY_PATH"

  # Only Android needs an explicit device; iOS targets the booted simulator.
  local maestro_cmd=(test)
  [ "$PLATFORM" = "android" ] && maestro_cmd=(--device "$ANDROID_DEVICE" test)

  echo ""
  echo "======================================================"
  echo " Scenario: $name (releaseSigned=$releaseSigned, version=$version, flow=$flow)"
  echo "======================================================"

  maestro "${maestro_cmd[@]}" \
    --env BUNDLE_ID="$BUNDLE_ID" \
    --env APP_VERSION="$version" \
    --env APP_SLUG="$TURBOPUSH_APP_SLUG" \
    --env PLATFORM="$PLATFORM" \
    --env DEPLOYMENT="$DEPLOYMENT" \
    --env TARGET_VERSION="$BUILD_VERSION" \
    --env SIGN_ARGS="$SIGN_ARGS" \
    --env HARNESS_URL="$HARNESS_URL" \
    --env ROOT_DIR="$ROOT_DIR" \
    --env EXAMPLE="$EXAMPLE" \
    "$ROOT_DIR/.maestro/flows/$flow"
}

start_harness

# Iterate the scenarios from scenarios.json, rebuilding the app only when the
# build signing state changes between scenarios.
LAST_BUILD_SIGNING=""
while IFS=$'\t' read -r name buildSigning releaseSigned version flow before after; do
  [ -z "$name" ] && continue
  if [ "$buildSigning" != "$LAST_BUILD_SIGNING" ]; then
    build_and_install "$buildSigning"
    LAST_BUILD_SIGNING="$buildSigning"
  fi

  if [ -n "$before" ]; then
    echo "==> [before] $before"
    (cd "$EXAMPLE_DIR" && bash -lc "$before")
  fi

  run_scenario "$name" "$releaseSigned" "$version" "$flow"

  if [ -n "$after" ]; then
    echo "==> [after] $after"
    (cd "$EXAMPLE_DIR" && bash -lc "$after")
  fi
done < <(node -e '
const fs = require("fs");
const cfg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
const only = process.argv[2] || "";
const list = only ? cfg.scenarios.filter((s) => s.name === only) : cfg.scenarios;
for (const s of list) {
  console.log([s.name, s.buildSigning, s.releaseSigned, s.version, s.flow, s.before || "", s.after || ""].join("\t"));
}
' "$SCENARIOS_FILE" "$ONLY")

echo "==> Done!"
