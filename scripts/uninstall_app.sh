#!/usr/bin/env bash
set -e

BUNDLE_ID="${1:-com.test.codepush}"
PLATFORM="${2:-ios}"

if [ "$PLATFORM" = "android" ]; then
  DEVICE=$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')
  if [ -z "$DEVICE" ]; then
    echo "No Android device found, skipping uninstall."
    exit 0
  fi
  echo "Uninstalling $BUNDLE_ID from $DEVICE..."
  adb -s "$DEVICE" uninstall "$BUNDLE_ID" 2>/dev/null || true
else
  echo "Uninstalling $BUNDLE_ID from booted simulator..."
  xcrun simctl uninstall booted "$BUNDLE_ID" 2>/dev/null || true
fi

echo "Done."
