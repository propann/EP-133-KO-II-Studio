#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 est requis. Installe-le avec : sudo apt install python3"
  exit 1
fi

echo "EP-133 Rhythm Hero : http://127.0.0.1:8787/docs/ep133-pad-player.html"
python3 tools/serve_local.py --host 127.0.0.1 --port 8787 --open
