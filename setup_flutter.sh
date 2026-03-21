#!/usr/bin/env bash
# Run from the Chick/ root: bash setup_flutter.sh
set -e

cd supervisor-app

echo "Initializing Flutter project..."
flutter create --project-name supervisor_app --org com.poultryflow .

echo "Installing pub dependencies..."
flutter pub get

MANIFEST="android/app/src/main/AndroidManifest.xml"
echo "Patching AndroidManifest.xml..."

# Insert permissions before <application using Python (cross-platform)
python3 - <<'PYEOF'
import re, pathlib

path = pathlib.Path("android/app/src/main/AndroidManifest.xml")
text = path.read_text()

permissions = """\
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
"""

if "ACCESS_FINE_LOCATION" not in text:
    text = text.replace("<application", permissions + "    <application", 1)
    path.write_text(text)
    print("  ✓ Permissions added")
else:
    print("  ✓ Permissions already present")
PYEOF

echo ""
echo "Done! Now run:  cd supervisor-app && flutter run"
