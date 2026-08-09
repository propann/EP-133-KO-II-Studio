#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
exec python3 tools/serve_local.py --host 0.0.0.0 --port 8787
