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

echo "    Seeding default users..."
API_URL="http://localhost:8000"

# Wait for API readiness
for _ in {1..60}; do
  if curl -sf "$API_URL/health" > /dev/null; then
    break
  fi
  sleep 1
done

seed_or_verify_user() {
  local name="$1"
  local email="$2"
  local password="$3"
  local role="$4"

  local register_status
  register_status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"email\":\"$email\",\"password\":\"$password\",\"role\":\"$role\"}")

  if [ "$register_status" = "200" ]; then
    echo "      ✓ Created: $email"
    return 0
  fi

  local login_status
  login_status=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\"}")

  if [ "$login_status" = "200" ]; then
    echo "      ✓ Exists:  $email"
    return 0
  fi

  echo "      ✗ Failed:  $email"
  return 1
}

seed_or_verify_user "Admin User" "admin@poultryflow.com" "admin123" "admin" || true
seed_or_verify_user "Supervisor User" "supervisor@poultryflow.com" "super123" "supervisor" || true
seed_or_verify_user "Operator User" "operator@poultryflow.com" "oper123" "operator" || true

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
