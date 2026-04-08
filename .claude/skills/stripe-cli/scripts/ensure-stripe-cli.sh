#!/usr/bin/env bash
# Ensures the Stripe CLI is installed and available.
# Downloads from GitHub releases if not found.
# Usage: source scripts/ensure-stripe-cli.sh
set -euo pipefail

if command -v stripe &>/dev/null; then
  echo "stripe $(stripe version 2>/dev/null || echo '(version unknown)') is installed"
  exit 0
fi

echo "Stripe CLI not found. Downloading..."

VERSION=$(curl -sS https://api.github.com/repos/stripe/stripe-cli/releases/latest \
  | grep '"tag_name"' | head -1 | sed 's/.*"v\(.*\)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "ERROR: Could not determine latest Stripe CLI version." >&2
  echo "Try: brew install stripe/stripe-cli/stripe" >&2
  exit 1
fi

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  darwin) OS_LABEL="mac-os" ;;
  linux)  OS_LABEL="linux" ;;
  *)      echo "ERROR: Unsupported OS: $OS" >&2; exit 1 ;;
esac

case "$ARCH" in
  x86_64)        ARCH_LABEL="x86_64" ;;
  arm64|aarch64) ARCH_LABEL="arm64" ;;
  *)             echo "ERROR: Unsupported arch: $ARCH" >&2; exit 1 ;;
esac

URL="https://github.com/stripe/stripe-cli/releases/download/v${VERSION}/stripe_${VERSION}_${OS_LABEL}_${ARCH_LABEL}.tar.gz"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "Downloading Stripe CLI v${VERSION} from $URL"
curl -sSL "$URL" -o "$TMPDIR/stripe-cli.tar.gz"
tar -xzf "$TMPDIR/stripe-cli.tar.gz" -C "$TMPDIR" stripe

# Try /usr/local/bin first, fall back to project bin/
if [ -w /usr/local/bin ]; then
  mv "$TMPDIR/stripe" /usr/local/bin/stripe
  echo "Installed to /usr/local/bin/stripe"
else
  mkdir -p bin
  mv "$TMPDIR/stripe" bin/stripe
  chmod +x bin/stripe
  echo "Installed to ./bin/stripe (add to PATH or use ./bin/stripe)"
  echo "export PATH=\"\$PWD/bin:\$PATH\""
fi

echo "Stripe CLI v${VERSION} ready."
