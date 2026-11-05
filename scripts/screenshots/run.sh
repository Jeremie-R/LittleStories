#!/bin/sh
# Regenerates the README screenshots from the fictional demo journal, using the system WebKit (macOS only).
# Needs the dev server on http://localhost:5174 (`bun run dev -- --port 5174`). With the Supabase env vars
# set, the welcome screen shows the sign-in buttons enabled. Storage is throwaway: no account is touched.
set -e
cd "$(dirname "$0")"
OUT="$(mktemp -d)"

node plan.mjs "$OUT"
swift shoot.swift "$OUT/config.json"

cp hero.html "$OUT/"
printf '{"width":1200,"height":760,"quality":0.9,"outDir":"%s","steps":[{"url":"file://%s/hero.html","wait":1,"shot":"hero.jpg"}]}' "$OUT" "$OUT" >"$OUT/hero.json"
swift shoot.swift "$OUT/hero.json"

DEST=../../docs/screenshots
mkdir -p "$DEST"
for f in "$OUT"/*.jpg; do
  name=$(basename "$f")
  width=540
  [ "$name" = hero.jpg ] && width=1800
  sips --resampleWidth "$width" -s formatOptions 80 "$f" --out "$DEST/$name" >/dev/null
done
rm -rf "$OUT"
echo "Screenshots written to docs/screenshots"
