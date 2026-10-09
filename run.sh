#!/usr/bin/env sh
# Menjalankan Presentasi 3D di macOS / Linux.
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1; then PY=python3
elif command -v python >/dev/null 2>&1; then PY=python
else
  echo "[X] Python 3 tidak ditemukan. Pasang Python 3 (https://www.python.org/downloads/) lalu jalankan lagi."
  exit 1
fi
exec "$PY" tools/serve.py "$@"
