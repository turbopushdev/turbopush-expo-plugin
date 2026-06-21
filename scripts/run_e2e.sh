#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

EXAMPLE="${1:?Usage: ./scripts/run_e2e.sh <example> <platform> [--test-only] (e.g. expo-56 ios)}"
PLATFORM="${2:?Usage: ./scripts/run_e2e.sh <example> <platform> [--test-only] (e.g. expo-56 ios)}"
# strip leading "examples/" if passed (e.g. examples/expo-56 → expo-56)
EXAMPLE="${EXAMPLE#examples/}"

TEST_ONLY=false
for arg in "$@"; do
  [ "$arg" = "--test-only" ] && TEST_ONLY=true
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
UPDATE_VERSION="1.0.1"

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

echo "==> [1/5] Clearing deployment history: $TURBOPUSH_APP_SLUG / $DEPLOYMENT..."
(cd "$EXAMPLE_DIR" && echo "y" | yarn turbopush deployment clear "$TURBOPUSH_APP_SLUG" "$DEPLOYMENT")

echo "==> [2/5] Setting version to $BUILD_VERSION and installing deps..."
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
      (cd "$EXAMPLE_DIR" && yarn ios --mode Release)
    fi
  elif [ "$PLATFORM" = "android" ]; then
    adb -s "$ANDROID_DEVICE" uninstall "$BUNDLE_ID" 2>/dev/null || true
    if [ "$IS_EXPO" = true ]; then
      (cd "$EXAMPLE_DIR" && ANDROID_SERIAL="$ANDROID_DEVICE" yarn android --variant release --no-bundler)
    else
      (cd "$EXAMPLE_DIR" && ANDROID_SERIAL="$ANDROID_DEVICE" yarn android --mode release)
    fi
  fi
else
  echo "==> Skipping native build and install (--test-only)..."
fi

echo "==> [3/5] Bumping to $UPDATE_VERSION and releasing OTA update..."
"$SCRIPT_DIR/set_env.sh" "$UPDATE_VERSION" "$EXAMPLE"
if [ "$IS_EXPO" = true ]; then
  (cd "$EXAMPLE_DIR" && yarn turbopush release-expo \
    "$TURBOPUSH_APP_SLUG" "$PLATFORM" "$BUILD_VERSION" \
    -d "$DEPLOYMENT" -r 100 --mandatory)
else
  (cd "$EXAMPLE_DIR" && yarn turbopush release-react \
    "$TURBOPUSH_APP_SLUG" "$PLATFORM" \
    -t "$BUILD_VERSION" -d "$DEPLOYMENT" -r 100 --mandatory)
fi

echo "==> [4/5] Running Maestro E2E tests (expected version: $UPDATE_VERSION)..."
if [ "$PLATFORM" = "android" ]; then
  maestro --device "$ANDROID_DEVICE" test \
    --env BUNDLE_ID="$BUNDLE_ID" \
    --env APP_VERSION="$UPDATE_VERSION" \
    "$ROOT_DIR/.maestro/sync_codepush_test.yaml"
else
  maestro test \
    --env BUNDLE_ID="$BUNDLE_ID" \
    --env APP_VERSION="$UPDATE_VERSION" \
    "$ROOT_DIR/.maestro/sync_codepush_test.yaml"
fi

echo "==> [5/5] Done!"
