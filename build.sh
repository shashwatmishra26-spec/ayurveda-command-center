#!/usr/bin/env bash
# Builds the app from source (src/*.jsx) into dist/*.build.js, plus a
# self-contained React 19 bundle (only needed for the standalone build).
#
#   npm install
#   npm run build              # bash build.sh -> writes dist/*.build.js
#   npm run build:standalone   # also writes standalone.html (single file)
#
set -e
cd "$(dirname "$0")"
mkdir -p dist
ESBUILD="./node_modules/.bin/esbuild"
if [ ! -x "$ESBUILD" ]; then
  echo "esbuild not found — run 'npm install' first." >&2
  exit 1
fi

# 1. Bundle React 19 + ReactDOM (from node_modules) into a single global
#    script (window.React / window.ReactDOM) — only used by the standalone
#    (offline, no-CDN) build.
"$ESBUILD" src/react-entry.js \
  --bundle --format=iife --platform=browser --minify \
  --outfile=dist/react-globals.bundle.js

# 2. Transpile each JSX source file to plain JS (classic <script>, JSX
#    compiled to React.createElement calls). Files intentionally share one
#    global scope across <script> tags (no ES module import/export).
for f in ui modules1 modules2 modules3 app; do
  "$ESBUILD" "src/$f.jsx" \
    --loader:.jsx=jsx \
    --jsx=transform \
    --jsx-factory=React.createElement \
    --jsx-fragment=React.Fragment \
    --target=es2020 \
    --outfile="dist/$f.build.js"
done

echo "Build complete:"
ls -la dist/
