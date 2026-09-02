#!/usr/bin/env bash
set -euo pipefail

# Generates an RSA keypair used for Turbopush code signing and extracts the
# public key in the raw base64 (SPKI) form expected by the native SDKs.
#
# Outputs (written under the repo root `.signing/` directory, which is gitignored):
#   signing-private.pem  - private key passed to the CLI via `-k`/`--privateKeyPath`
#   signing-public.pem   - public key in PEM form (for reference)
#   signing-public.b64   - public key as a single-line base64 string (injected into the app)

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

OUT_DIR="${TURBOPUSH_SIGNING_DIR:-$ROOT_DIR/.signing}"
PRIVATE_KEY_PATH="${TURBOPUSH_PRIVATE_KEY_PATH:-$OUT_DIR/signing-private.pem}"
PUBLIC_KEY_PEM_PATH="$OUT_DIR/signing-public.pem"
PUBLIC_KEY_B64_PATH="$OUT_DIR/signing-public.b64"

mkdir -p "$OUT_DIR"

if [ ! -f "$PRIVATE_KEY_PATH" ]; then
  echo "Generating RSA keypair in $OUT_DIR ..."
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$PRIVATE_KEY_PATH"
else
  echo "Using existing private key: $PRIVATE_KEY_PATH"
fi

# Derive the public key (SubjectPublicKeyInfo / X.509 SPKI) from the private key.
openssl rsa -in "$PRIVATE_KEY_PATH" -pubout -out "$PUBLIC_KEY_PEM_PATH"

# Extract the base64 body (single line) which is the exact format both the
# Android (`parsePublicKey`) and iOS (`getKeyValueFromPublicKeyString`) SDKs expect.
sed -e '1d' -e '$d' "$PUBLIC_KEY_PEM_PATH" | tr -d '\n' > "$PUBLIC_KEY_B64_PATH"

echo "Private key: $PRIVATE_KEY_PATH"
echo "Public key (PEM): $PUBLIC_KEY_PEM_PATH"
echo "Public key (base64): $PUBLIC_KEY_B64_PATH"
echo ""
echo "To use in a signed release:"
echo "  export TURBOPUSH_PRIVATE_KEY_PATH=\"$PRIVATE_KEY_PATH\""
echo "  export CODE_PUSH_PUBLIC_KEY=\"$(cat "$PUBLIC_KEY_B64_PATH")\""
