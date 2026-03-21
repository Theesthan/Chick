#!/usr/bin/env bash
set -e

echo "=== PoultryFlow Setup ==="
echo ""

# ── 1. Backend ────────────────────────────────────────────────────────────────
echo "[1/3] Starting backend (Docker)..."
cd poultryflow
docker compose up -d --build
cd ..
echo "    Backend running at http://localhost:8000"
echo ""

# ── 2. Admin Web ──────────────────────────────────────────────────────────────
echo "[2/3] Installing admin-web dependencies..."
cd admin-web
npm install
echo "    Run:  npm run dev   (starts at http://localhost:3000)"
cd ..
echo ""

# ── 3. Flutter Supervisor App ─────────────────────────────────────────────────
echo "[3/3] Setting up Flutter supervisor app..."
cd supervisor-app

# Check if flutter is available
if ! command -v flutter &> /dev/null; then
  echo "    Flutter not found in PATH. Install Flutter from https://flutter.dev/docs/get-started/install"
  echo "    Then run:  cd supervisor-app && flutter create . && flutter pub get"
  cd ..
  exit 0
fi

# Generate platform files if android/ doesn't exist
if [ ! -d "android" ]; then
  echo "    Generating platform files (flutter create .)..."
  # Save our lib/ files temporarily, create project, restore
  flutter create --project-name supervisor_app --org com.poultryflow .
fi

flutter pub get

# Add Android permissions
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
  # Add permissions before <application> tag if not already present
  if ! grep -q "ACCESS_FINE_LOCATION" "$MANIFEST"; then
    sed -i 's|<application|<uses-permission android:name="android.permission.INTERNET" />\n    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />\n    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />\n    <application|' "$MANIFEST"
    echo "    Added GPS + Internet permissions to AndroidManifest.xml"
  fi
fi

echo "    Run:  flutter run   (starts on connected device/emulator)"
cd ..
echo ""
echo "=== Setup complete ==="
echo ""
echo "Credentials (after seeding):"
echo "  Admin:      admin@poultryflow.com / admin123"
echo "  Supervisor: supervisor@poultryflow.com / super123"
echo "  Operator:   operator@poultryflow.com / oper123"
