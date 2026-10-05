# FD Digital Printing

Sistem operasional untuk usaha digital printing: kasir, manajemen order,
piutang, pengeluaran, shift kasir, laporan, dan notifikasi otomatis
(Telegram + WhatsApp + email).

**Stack:** Bun + SvelteKit + Svelte 5 (runes) + TypeScript + Tailwind v4 +
Drizzle ORM + SQLite (`bun:sqlite`, tanpa dependensi native).

## Fitur

- **Kasir** — diskon (Rp/%), kembalian otomatis, harga dari katalog (dengan
  breakdown rumus di invoice), QRIS statis, AI Kasir (isi via suara / scan struk).
- **Order** — pipeline `baru → diproses → selesai → diambil`, janji selesai +
  badge telat, notifikasi otomatis saat selesai.
- **Piutang** — cicilan bertahap (histori tidak dihapus), reminder otomatis
  H-3 / H-1 / telat via Telegram/WhatsApp/email.
- **Pengeluaran & laba bersih** — catat pengeluaran, dashboard tampil
  `laba bersih = omzet − pengeluaran`.
- **Shift kasir** — buka/tutup shift, rekap cash, hitung selisih otomatis.
- **Laporan** — omzet harian/mingguan/bulanan, export CSV (Excel-friendly),
  invoice print + struk thermal 58mm.
- **Bot Telegram** `@FD_printing_bot` — mode publik (`/lacak`, `/harga`, `/info`)
  + mode admin whitelist (`/order`, `/piutang`, `/laporan`, `/pelanggan`).
- **WhatsApp dual-track** — Official Cloud API atau Baileys (unofficial),
  dengan anti-ban: warm-up, antrian serial, circuit breaker, kill switch.
- **Landing page publik** — daftar harga asli dari database, CTA WhatsApp.

## Prasyarat

- [Bun](https://bun.sh) >= 1.4
- Git

## Jalan di lokal

```bash
git clone https://github.com/itzluthfi/fd-digital-printing.git
cd fd-digital-printing
bun install

# 1. Konfigurasi
cp .env.example .env
# Isi BETTER_AUTH_SECRET dengan string acak yang panjang, misal:
# openssl rand -base64 32

# 2. Database
bun run db:push     # buat tabel SQLite di data/app.db
bun run db:seed     # data contoh (8 pelanggan, 12 order, dst) — opsional

# 3. Jalan
bun run dev         # http://localhost:5173
```

### Akun demo (setelah `db:seed`)

| Email            | Role     | Password   |
| ---------------- | -------- | ---------- |
| owner@fd.local   | owner    | `admin123` |
| admin@fd.local   | admin    | `admin123` |
| operator@fd.local| operator | `admin123` |
| customer@fd.local| customer | `admin123` |

> Operator sengaja tidak bisa melihat harga/omzet.

## Environment variables

Salin `.env.example` ke `.env`. Yang wajib diisi untuk jalan lokal
minimal: `BETTER_AUTH_SECRET`.

| Variable | Wajib | Keterangan |
| -------- | ----- | ---------- |
| `BETTER_AUTH_SECRET` | Ya | Secret session auth (string acak panjang) |
| `BETTER_AUTH_URL` | Ya | URL publik app, mis. `http://localhost:5173` |
| `DB_PATH` | Tidak | Path SQLite (default `./data/app.db`) |
| `TRUSTED_ORIGINS` | Prod | Domain publik, koma-dipisah (anti CSRF di balik tunnel/proxy) |
| `TELEGRAM_BOT_TOKEN` | Bot | Token dari [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_WEBHOOK_SECRET` | Bot | String acak untuk validasi webhook |
| `ADMIN_TELEGRAM_IDS` | Bot | ID Telegram admin, koma-dipisah |
| `RESEND_API_KEY` | Tidak | [Resend](https://resend.com) — email produksi (gratis 3.000/bln). Tanpa ini email hanya di-print ke terminal |
| `EMAIL_FROM` | Tidak | Alamat pengirim, mis. `FD Digital Printing <noreply@domain.id>` |
| `WA_PROVIDER` | Tidak | `off` (default, aman) / `cloud` / `baileys` |
| `WA_CLOUD_TOKEN` | WA cloud | Token Meta Developer |
| `WA_CLOUD_PHONE_ID` | WA cloud | Phone Number ID Meta Developer |
| `WA_PAIR_NUMBER` | WA baileys | Nomor **cadangan** (bukan nomor utama!) untuk pairing code |
| `AI_GATEWAY_URL` | Tidak | URL AI gateway (default `https://mj9.sir-l.web.id/v1`) |
| `AI_GATEWAY_KEY` | AI Kasir | Key gateway — tanpa ini `/api/ai/*` = 503 |
| `AI_TEXT_MODEL` / `AI_VISION_MODEL` | Tidak | Nama model teks & vision |

> **Jangan commit `.env`.** File ini sudah masuk `.gitignore`.

## Production (VPS)

Gratis penuh: Cloudflare Tunnel (tanpa buka port), Telegram Bot API,
systemd untuk jalan 24/7.

```bash
# 1. Build
bun install
bun run db:push
bun run build

# 2. Jalankan (contoh systemd unit /etc/systemd/system/fd-printing.service)
#    EnvironmentFile=/opt/fd-digital-printing/.env
#    ExecStart=/usr/bin/bun ./build/index.js
#    Isi .env: BETTER_AUTH_URL=https://domain-anda.id, TRUSTED_ORIGINS=https://domain-anda.id, dst.

# 3. Expose via Cloudflare Tunnel (gratis)
#    Cloudflare Zero Trust → Networks → Tunnels → buat tunnel →
#    Public Hostname: domain-anda.id → http://localhost:3000

# 4. Daftarkan webhook Telegram (sekali saja)
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://domain-anda.id/api/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
# Harus balas {"ok":true,...}. Tes: kirim /menu ke bot.

# 5. Reminder piutang otomatis (cron, tiap 07:00)
0 7 * * * cd /opt/fd-digital-printing && /usr/bin/bun run reminder >> /var/log/fd-reminder.log 2>&1
```

### Backup database

SQLite = satu file. Backup cukup salin `data/app.db`:

```bash
# cron harian, mis. 02:00
0 2 * * * cp /opt/fd-digital-printing/data/app.db /backup/fd-$(date +\%F).db
```

### WhatsApp (opsional)

- **Official Cloud API** (`WA_PROVIDER=cloud`): daftar di Meta Developer,
  gratis. Paling aman dari banned.
- **Baileys** (`WA_PROVIDER=baileys`): unofficial — **wajib nomor cadangan**,
  bukan nomor utama/bisnis. Pairing code diambil di halaman Pengaturan →
  WhatsApp setelah server jalan. Ada warm-up otomatis, batas 150 pesan/hari,
  dan kill switch bila risk score ≥ 100.

## CI/CD (GitHub Actions, gratis)

**CI** — aktif otomatis. Setiap push/PR ke `main` menjalankan
`bun run check` (type-check) + `bun run build` di GitHub Actions.
Workflow: `.github/workflows/ci.yml`.

**CD** — deploy otomatis ke VPS setiap push ke `main`.
Workflow sudah siap (`.github/workflows/cd.yml`), tapi **skip halus**
sampai kamu selesaikan setup sekali ini:

1. **Siapkan VPS** (sekali saja):
   ```bash
   # install bun + git, lalu:
   sudo mkdir -p /opt/fd-digital-printing && sudo chown $USER:$USER /opt/fd-digital-printing
   git clone https://github.com/itzluthfi/fd-digital-printing.git /opt/fd-digital-printing
   cd /opt/fd-digital-printing && bun install && bun run db:push && bun run build
   # buat .env produksi (lihat tabel environment di atas) + systemd unit (lihat bagian Production)
   ```
2. **Beri akses restart tanpa password** untuk user deploy:
   ```bash
   echo "$USER ALL=(ALL) NOPASSWD: /bin/systemctl restart fd-printing" | sudo tee /etc/sudoers.d/fd-printing
   ```
3. **Buat SSH key khusus deploy** di laptop/komputer kamu:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/fd-deploy -N "" -C "fd-deploy"
   ssh-copy-id -i ~/.ssh/fd-deploy.pub user@vps-kamu
   ```
4. **Isi 3 secret** di GitHub → repo → Settings → Secrets and variables → Actions:
   | Secret | Isi |
   | ------ | --- |
   | `SSH_HOST` | IP/domain VPS |
   | `SSH_USER` | user SSH VPS |
   | `SSH_PRIVATE_KEY` | isi file `~/.ssh/fd-deploy` (yang private) |
   | `SSH_PORT` | opsional, default 22 |

Setelah itu, tiap push ke `main`: GitHub SSH ke VPS → backup `app.db` →
`git pull` → `bun install` → `db:push` → `build` → restart service →
verifikasi service aktif. Bisa juga dijalankan manual via tab Actions →
CD → Run workflow.

## Perintah

| Perintah | Keterangan |
| -------- | ---------- |
| `bun run dev` | dev server |
| `bun run build` | build production |
| `bun run preview` | coba hasil build secara lokal |
| `bun run check` | type-check (svelte-check) |
| `bun run db:push` | sinkron skema ke SQLite |
| `bun run db:seed` | isi data contoh |
| `bun run db:studio` | GUI database |
| `bun run reminder` | kirim reminder piutang (dipakai cron) |

## Struktur

```
src/
  routes/
    (app)/        # halaman staff: dashboard, kasir, order, piutang, ...
    (auth)/       # sign-in / sign-up
    api/          # endpoint: telegram webhook, AI, export CSV, ...
  lib/
    katalog.ts              # hitung harga katalog (pure, ter-test)
    format.ts               # format rupiah/tanggal
    server/
      db/schema.ts          # skema Drizzle (sumber kebenaran tabel)
      notify/               # fan-out: telegram.ts, whatsapp.ts, email.ts
      wa/                   # provider WA: cloud.ts, baileys.ts, antiban.ts
      jobs/reminder-piutang.ts
static/           # aset publik (logo, QRIS)
data/app.db       # SQLite (jangan di-commit kalau berisi data real)
```

## Catatan keamanan

- Secret hanya lewat environment variable — tidak ada token di source code.
- Rate limit aktif di endpoint auth & webhook.
- Role `operator` tidak menerima data harga/omzet dari server (bukan cuma
  disembunyikan di UI).
