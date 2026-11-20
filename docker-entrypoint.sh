#!/bin/sh
set -e

# Otomatis pastikan direktori data SQLite ada
mkdir -p /app/data

# Inisialisasi skema tabel jika belum ada
if [ -f "src/lib/server/db/init-schema.ts" ]; then
  echo "[ENTRYPOINT] Initializing SQLite schema..."
  bun src/lib/server/db/init-schema.ts || true
fi

echo "[ENTRYPOINT] Starting FD Digital Printing application on port ${PORT:-3000}..."
exec bun ./build/index.js
