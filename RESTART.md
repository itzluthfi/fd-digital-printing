# RESTART.md — Cara menghidupkan ulang stack FD Digital Printing

> Dibuat 2026-10-04 18:25 UTC setelah investigasi: relaunch preview jam 18:00
> menjatuhkan `AI_GATEWAY_KEY` (AI Kasir 503) karena key-nya transient.
> File ini berisi perintah pemulihan — TANPA secret apa pun di dalamnya.

## Yang mati saat sandbox restart

3 proses + semua env transient. Yang **aman di disk** (tidak perlu diapa-apakan):
`.env` (auth secret, trusted origins, webhook secret, admin Telegram IDs),
database SQLite (`data/`), kode, dan konfigurasi Cloudflare Zero Trust
(public hostname `fd-printing.sir-l.web.id` → `http://localhost:5173` tetap ada).

Yang **hilang** dan harus dimasukkan ulang: token tunnel Cloudflare,
`TELEGRAM_BOT_TOKEN`, `AI_GATEWAY_KEY`.

## Urutan pemulihan (3 proses, berurutan)

```bash
# 1. Egress forwarder — WAJIB jalan duluan.
#    Tanpa ini, server tidak bisa memanggil api.telegram.org & AI gateway
#    (kredensial proxy sandbox kedaluwarsa tiap beberapa menit).
setsid python3 ~/workspace/bin/egress-forwarder.py >> /tmp/fd-forwarder.log 2>&1 < /dev/null &

# 2. Cloudflare tunnel — token ambil dari dashboard:
#    Cloudflare Zero Trust → Networks → Tunnels → fd-printing → Configure → Install connector.
#    (token sengaja TIDAK disimpan di mana pun, sesuai aturan user)
cd ~/workspace/bin && setsid ./cloudflared-patched tunnel run --protocol http2 --token <TOKEN_DARI_DASHBOARD> >> /tmp/fd-tunnel.log 2>&1 < /dev/null &

# 3. Preview server — 3 env WAJIB diisi, kalau tidak fiturnya mati diam-diam:
#    TELEGRAM_BOT_TOKEN = token @FD_printing_bot (minta ke user, transient)
#    AI_GATEWAY_KEY     = key nine router (minta ke user, transient; tanpa ini /api/ai/* = 503)
#    FD_HTTP_FORWARDER  = http://127.0.0.1:8089 (selalu ini di sandbox)
cd ~/workspace/fd-digital-printing && setsid env \
  TELEGRAM_BOT_TOKEN=<TOKEN_BOT> \
  AI_GATEWAY_KEY=<KEY_NINE_ROUTER> \
  FD_HTTP_FORWARDER=http://127.0.0.1:8089 \
  bun run preview --port 5173 --host 127.0.0.1 >> /tmp/fd-preview.log 2>&1 < /dev/null &
```

## Setelah 3 proses jalan

1. **Webhook Telegram** harus didaftarkan ulang (tidak otomatis):
   ```bash
   curl -sS --max-time 20 \
     --proxy http://127.0.0.1:8089 \
     "https://api.telegram.org/bot<TOKEN_BOT>/setWebhook" \
     -d "url=https://fd-printing.sir-l.web.id/api/telegram/webhook" \
     -d "secret_token=$(grep TELEGRAM_WEBHOOK_SECRET ~/workspace/fd-digital-printing/.env | cut -d= -f2)"
   ```
   Harus balas `{"ok":true,...}`. Tes: kirim `/menu` ke @FD_printing_bot → banner harus muncul.
2. **Verifikasi end-to-end** (2 menit):
   - `curl -s -o /dev/null -w "%{http_code}\n" https://fd-printing.sir-l.web.id/` → 200
   - Login `owner@fd.local` → buka /kasir → tombol "Isi via suara" → harus mengisi form (bukan error 503)
   - Kirim pesan tes ke bot Telegram → harus dibalas

## Pelajaran 2026-10-04

- Env transient (`TELEGRAM_BOT_TOKEN`, `AI_GATEWAY_KEY`) hilang tiap relaunch/restart.
  Relaunch preview TANPA menyertakan ulang env = fitur mati diam-diam (AI Kasir 503).
- Cek cepat sebelum bilang "selesai" ke user:
  `tr '\0' '\n' < /proc/$(pgrep -f "vite.js preview")/environ | grep -E "TELEGRAM_BOT_TOKEN|AI_GATEWAY_KEY|FD_HTTP_FORWARDER"`
  — ketiga-tiganya harus ada.
