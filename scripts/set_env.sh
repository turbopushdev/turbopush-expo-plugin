#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

VERSION="${1:?Usage: ./scripts/set_env.sh <version> <example> (e.g. 1.0.0 expo-56)}"
EXAMPLE="${2:?Usage: ./scripts/set_env.sh <version> <example> (e.g. 1.0.0 expo-56)}"

SHARED_CONSTANTS="$ROOT_DIR/examples/shared/constants.json"
ROOT_ENV="$ROOT_DIR/.env"
EXAMPLE_ENV="$ROOT_DIR/examples/$EXAMPLE/.env"

node -e "
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync('$SHARED_CONSTANTS', 'utf8'));
  data.APP_VERSION = '$VERSION';
  fs.writeFileSync('$SHARED_CONSTANTS', JSON.stringify(data, null, 2) + '\n');
"

cp "$ROOT_ENV" "$EXAMPLE_ENV"

echo "APP_VERSION=$VERSION, .env copied to examples/$EXAMPLE"
