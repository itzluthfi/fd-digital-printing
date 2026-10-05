# PLAN — FD Digital Printing (v2)

> Sumber kebenaran pengerjaan. Update file ini setiap ada perubahan scope
> yang disepakati. Dibaca sebelum tiap sesi kerja (lihat Anti-Halu Checklist).

## Konteks

Mitra: digital printing retail (ais ITATS + 2 admin keuangan + operator mesin + manager).
Masalah: omzet dicatat manual pakai kalkulator, piutang di Excel dan dihapus
saat lunas, nagih jatuh tempo manual via WA, order online via chat WA + invoice
manual, kredit offline maks 3 hari tanpa sistem.

## Stack (final)

- Runtime: **Bun** · Framework: **SvelteKit + Svelte 5 runes + TypeScript**
- Styling: **Tailwind CSS v4** · Komponen: **shadcn-svelte** · Ikon: **Lucide** (asli)
- Auth: **Better Auth** (email + password)
- Email transaksional: **Resend** (free tier 3.000/bln, 100/hari, tanpa kartu kredit)
- DB: **SQLite** via `bun:sqlite` + **Drizzle ORM** (cukup untuk 1 toko;
  naik ke Postgres kalau multi-cabang/SaaS)
- WA: integrasi ke gateway milik user (infrastruktur bot yang sudah ada)
- Telegram: via Bot API. User buat bot di @BotFather → token disimpan di env.
  Pelanggan harus `/start` ke bot dulu supaya dapat chat ID.
  - Bot FD sudah dibuat & terverifikasi aktif (2026-10-04): "FD-printing" (@FD_printing_bot).
  - Token disimpan di Secure Vault (custom.telegram-bot-api) + env `TELEGRAM_BOT_TOKEN` di server saat deploy. Jangan hardcode.
  - Modul pengirim: `src/lib/server/notify/telegram.ts` (`sendTelegram(chatId, text)`).
  - **Bot admin interaktif** (2026-10-04): webhook `POST /api/telegram/webhook` (secret via
    `TELEGRAM_WEBHOOK_SECRET`, akses dikunci ke `ADMIN_TELEGRAM_IDS`). Perintah: /order, /piutang,
    /laporan, /pelanggan, /menu; ubah status order & kirim reminder/notif via inline keyboard.
    Push otomatis ke admin: order baru, perubahan status, pembayaran piutang.
    Kode: `src/lib/server/bot/` (`api.ts`, `admin.ts`).
- Notifikasi (order selesai, invoice, reminder piutang H-3/H-1/telat) dikirim ke
  **WA + Telegram + email** — satu event, tiga channel (yang tersedia).

## Design System — Anti AI Slop (wajib dipatuhi)

1. **Tanpa emoji di UI.** Semua ikon pakai Lucide asli. Tanpa pengecualian.
2. **Warna solid.** Palet: navy brand dari logo (`#16305e` kira-kira, samakan
   dengan file logo), netral (slate), 1 aksen, warna semantik
   (hijau=lunas/selesai, kuning=menunggu, merah=telat/gagal). Tanpa gradient
   dekoratif.
3. **Tipografi:** satu font (Inter), hierarki jelas. Bahasa Indonesia.
4. **Teks seperlunya.** Setiap kalimat harus punya fungsi. Tidak ada teks
   pengisi, tidak ada lorem ipsum, tidak ada placeholder yang tampil ke user.
5. **Komponen shadcn-svelte** (button, input, table, dialog, badge, AlertDialog
   untuk modal konfirmasi, svelte-sonner untuk toast). Konsisten, tidak bikin
   komponen custom tanpa alasan. Bukan react-hot-toast (React-only),
   bukan SweetAlert (berat, tidak match design system).
6. **Optimistic UI.** Setiap aksi kasih feedback instan, rollback otomatis
   saat request gagal. Target: ringan, cepat, interaktif.
6. **Data rapat, bukan kartu-kartu kosong.** Tabel padat untuk kasir/piutang;
   empty state satu baris + satu aksi.
7. **Mode gelap: ditunda** sampai Fase 5 (jangan melebar scope).

## Role & Hak Akses (v2)

| Fitur | Owner | Admin | Operator | Customer | Guest |
|---|---|---|---|---|---|
| Dashboard omzet & laporan | ✅ | ✅ | ❌ | ❌ | ❌ |
| Kasir / input transaksi | ✅ | ✅ | ❌ | ❌ | ❌ |
| Kelola piutang & termin | ✅ | ✅ | ❌ | ❌ | ❌ |
| Kelola data pelanggan | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update status order | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lihat harga / omzet | ✅ | ✅ | ❌ | ❌ | ❌ |
| Kelola user & pengaturan | ✅ | ❌ | ❌ | ❌ | ❌ |
| Order via web + upload file | — | — | — | ✅ | ✅ |
| Lihat order & piutang sendiri | — | — | — | ✅ | via kode |
| Terima notif WA + email | — | — | — | ✅ | ✅ (WA saja) |

Catatan:
- **Customer**: YA, jadi role resmi (bukan cuma tracking kode). Punya akun
  supaya bisa lihat riwayat order + sisa piutangnya sendiri. Registrasi opsional
  — **Guest** tetap bisa order tanpa akun (gesekan nol), tracking via kode.
- **Operator** tetap super-simpel: antrian + 1 tombol. Tanpa harga/omzet.
- Staff (Owner/Admin/Operator) dibuatkan akun oleh Owner (tidak registrasi
  publik). Customer registrasi sendiri via email.

## Auth — Standar Profesional (Better Auth)

- Login email + password. Min. 8 karakter.
- **Verifikasi email wajib** untuk Customer sebelum bisa order dengan akun.
  Staff yang dibuat Owner langsung aktif (atau via invite link).
- **Lupa password**: /forgot-password → email berisi link reset (kedaluwarsa
  1 jam) → /reset-password. Sesi lain dicabut setelah reset berhasil.
- Sesi: cookie-based, 7 hari, perpanjang otomatis saat dipakai.
- Rate limit: login 100/60 dtk; email verifikasi 1/90 dtk (bawaan Better Auth).
- Tabel auth (`user`, `session`, `account`, `verification`) via Drizzle adapter;
  tabel `customers` app terhubung opsional ke `user.id` (guest → NULL).
- Route: `/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`,
  `/verify-email`. Proteksi route per role di `hooks.server.ts`.

## Email — via Resend

Satu bentuk pesan konsisten; tanpa API key saat dev → email dicetak ke terminal
(jadi sign-up lokal tetap jalan). Domain pengirim perlu 2 DNS record
(saat deploy).

| Event | Penerima | Isi |
|---|---|---|
| Verifikasi email | Customer baru | link verifikasi |
| Lupa password | siapa saja | link reset 1 jam |
| Order diterima | Customer/Guest | kode order + ringkasan |
| Cetakan selesai | Customer/Guest | siap diambil + alamat |
| Invoice / kwitansi | pembayar | rincian + total |
| Piutang H-3 / H-1 / telat | Customer | sisa + jatuh tempo + cara bayar |

WA tetap channel utama untuk pelanggan Indo, Telegram opsional (butuh bot token
dari @BotFather + pelanggan /start dulu); email = cadangan profesional
+ wajib untuk auth (verifikasi/reset).

## Fase Pengerjaan (v2)

### Fase 0 — Fondasi Auth, Email & Desain ✅ SELESAI (2026-10-04)
- [x] Scaffold, DB inti (customers, orders, payments, receivables), logo
- [x] Better Auth terpasang (tabel user/session/account/verification + kolom role,
      hooks.server.ts proteksi per role, route /sign-in /sign-up /forgot-password
      /reset-password /verify-email, sesi 7 hari, rate limit, reset 1 jam)
      — terbukti: sign-up, sign-in, get-session, redirect guard (curl)
- [x] Resend terpasang (tanpa API key → cetak ke terminal, terbukti)
- [x] Design tokens (navy logo #002b57 + slate + aksen oranye, Inter, ID) + layout shell per role
- [x] Komponen gaya shadcn-svelte (button/input/label/badge/table/dialog/alert-dialog/textarea/select)
      + Lucide + svelte-sonner terpasang. Catatan: CLI shadcn-svelte tidak bisa
      non-interaktif di sandbox → komponen ditulis manual mengikuti API shadcn.
- [x] `bun run check` 0 error, `bun run build` lolos (wajib via runtime bun karena bun:sqlite)

### Fase 1 — Kasir (PRIORITAS) ✅ SELESAI (2026-10-04)
- [x] Dashboard: omzet hari ini, order aktif, piutang aktif, piutang ≤7 hari jatuh tempo (`/dashboard`)
- [x] Kasir: input cepat (pelanggan/walk-in, deskripsi, total, metode: cash/transfer/qris/piutang) (`/kasir`)
- [x] Metode piutang → otomatis buat receivables + jatuh tempo (default +3 hari)
- [x] Laporan omzet harian/mingguan/bulanan per metode bayar (`/laporan`)
- [x] Invoice/kuitansi print-friendly (+ kirim via email) (`/kasir/invoice/[id]`)
- [x] Kelola pelanggan (`/pelanggan`) + kelola pengguna/staff owner-only (`/pengguna`)
- Selesai jika: ais tutup hari tanpa kalkulator; angka laporan = angka real.
- Bukti: `bun run check` 0 error, `bun run build` lolos; alur kasir→invoice terverifikasi live (order #49 uji lalu dihapus, DB kembali ke seed).

### AI Kasir — Isi via Suara & Scan Struk ✅ SELESAI (2026-10-04)
- Tombol "Isi via suara" di `/kasir`: Web Speech API (id-ID) → transkrip → `POST /api/ai/parse` → AI ekstrak `{description, total, customer_name}` → form terisi otomatis (nama pelanggan dicocokkan ke data pelanggan, bila baru → mode walk-in + nama terisi).
- Tombol "Scan struk": foto (kamera HP) → resize max 1024px → `POST /api/ai/scan` → vision baca struk → form terisi.
- Arsitektur: browser → API server FD → AI gateway user (OpenAI-compatible `/v1`, `AI_GATEWAY_URL`, key di `AI_GATEWAY_KEY` env server SAJA, tidak pernah ke browser). Model default: teks `cf/@cf/meta/llama-3.1-8b-instruct-fp8-fast`, vision `ag/gemini-3.6-flash-low` (bisa dioverride via `AI_TEXT_MODEL`/`AI_VISION_MODEL`).
- Scan pakai pipeline 2 tahap (vision→transkripsi teks→model teks ekstrak JSON) karena model vision tidak konsisten mematuhi instruksi JSON-only; sudah termasuk retry 3x + ekstraksi substring JSON.
- Hanya owner/admin. File: `src/lib/server/ai.ts`, `src/routes/api/ai/parse/+server.ts`, `src/routes/api/ai/scan/+server.ts`.
- Key gateway dipakai transient (tidak disimpan di repo/memory); preview restart → key harus dimasukkan ulang ke env proses.
- Bukti: `/api/ai/parse` live → `{"description":"Cetak banner 2x1 dua pcs buat Pak Budi","total":100000,"customer_name":"Pak Budi"}`; `/api/ai/scan` live → `{"description":"Struk pembelian dari Toko ATK Maju di Jl Merdeka 12","total":135000,"items":[...]}`.

### Fase 2 — Order Pipeline + Notifikasi Selesai ✅ SELESAI (2026-10-04)
- [x] Antrian order: baru → diproses → selesai → diambil (tombol Lanjut per baris, filter chip)
- [x] View operator super-simpel (kolom harga & kontak disembunyikan untuk operator)
- [x] Telegram + email otomatis saat selesai ("siap diambil"); WA masih stub (tunggu gateway user)
- Bukti: check 0 error, build lolos, uji lanjut status + notifikasi terformat benar

### Fase 3 — Buku Piutang ✅ SELESAI (2026-10-04)
- [x] Daftar piutang + riwayat cicilan/termin; bayar termin → sisa update otomatis
- [x] Lunas = status berubah, histori tersimpan (TIDAK dihapus) — terbukti di uji
- [x] Reminder H-3, H-1, telat via Telegram/email (+WA stub); anti-spam via tabel reminders;
      tombol "Kirim reminder" manual. Cron otomatis = Fase 5 (butuh server).
- [x] Laporan piutang aktif & macet (badge "Telat X hari", filter belum lunas/lunas)
- Bukti: 24/24 uji logika reminder lolos (termasuk anti-spam run kedua = 0 terkirim)

### Fase 4 — Order Web + Akun Customer
- [ ] Registrasi/login customer (verifikasi email)
- [ ] Form order publik + upload file (guest & customer)
- [ ] Tracking via kode (guest) / dashboard (customer)
- [ ] (Opsional) QRIS dinamis + kode unik per order

### Fase 5 — Deploy & Serah Terima
- [ ] Verifikasi domain email (DNS) + mode gelap (opsional)
- [ ] Backup DB otomatis harian, deploy VPS
- [ ] Panduan 1 halaman per role

## Rencana Lanjutan (disetujui user 2026-10-04)

Urutan eksekusi: A → B → D → C → E. WA dibangun dual-track sejak awal.

### A2. Bot Telegram — banner + emoji menu + perbaiki egress ✅ SELESAI (2026-10-04)
- Banner menu utama: maskot robot gaya Muse (navy/oranye) + teks FD Digital Printing, 1280x720, di `/bot-banner.jpg`.
- `/start` & `/menu` (publik + admin) kirim FOTO banner + caption + keyboard; semua tombol pakai emoji sesuai (🔍💰🏠 / 📋💳📊👥).
- Callback pratinjau menu publik dari foto admin pakai editMessageCaption (fallback teks).
- Bukti PoC live: simulasi `/menu` admin via webhook publik → 200, sendPhoto ok:true, banner TERKIRIM ke Telegram admin, nol error. getWebhookInfo: pending 0.
- Bug infra diperbaiki: proses preview long-lived di sandbox gagal memanggil api.telegram.org (kredensial HTTPS_PROXY kedaluwarsa untuk koneksi baru → 407; Bun tidak pakai system CA store).
  Solusi: `~/workspace/bin/egress-forwarder.py` (tunnel CONNECT persisten per host di 127.0.0.1:8089) + `src/lib/server/http.ts` (postJson/getJson; via forwarder bila FD_HTTP_FORWARDER diset).
  Dipakai: bot/api.ts, notify/telegram.ts, notify/status.ts, ai.ts. Di VPS produksi forwarder tidak dibutuhkan.

### A. Katalog Harga + Hitung Otomatis ✅ SELESAI (2026-10-04)
- Tabel `price_items` (nama, kategori, satuan meter/pcs/lembar/paket, harga, aktif).
- Halaman `/harga` (owner/admin saja — operator tidak boleh lihat harga): CRUD + toggle aktif + search; tabel di desktop, card di HP; optimistic UI + rollback.
- Kasir: panel "Dari katalog harga" → pilih item → input P×L (meter) atau jumlah → tombol "Pakai RpX" → deskripsi + total terisi otomatis. Bisa tetap override manual.
- Seed: 7 item contoh (banner MM/Korea, stiker vinyl/chromo, brosur, kartu nama, cetak foto).
- Bukti: `bun run check` 0 error, build lolos, /harga & /kasir HTTP 200 via publik, tambah→hapus item terverifikasi via API (7 item kembali).

### B. WhatsApp — dual track (official + unofficial fallback) ✅ SELESAI (2026-10-05, belum live-test)
**Implementasi:**
- `WA_PROVIDER = cloud | baileys | off` (default `off` = aman). Env: `WA_CLOUD_TOKEN`, `WA_CLOUD_PHONE_ID`, `WA_PAIR_NUMBER` (nomor cadangan untuk pairing code).
- Modul: `src/lib/server/wa/` — `provider.ts` (interface + factory + `wa_meta` KV), `cloud.ts` (official Cloud API v21.0 via `postJson`), `baileys.ts` (socket + worker antrian), `antiban.ts` (pure logic, ter-test).
- DB: tabel `wa_outbox` (antrian: queued/sending/sent/failed/cancelled, scheduledAt, attempts) + `wa_meta` (warmup_started_at, sent_today, risk_score, kill_switch, pairing_code, seen:<no>).
- Pengiriman TIDAK langsung: `sendWhatsApp()` → masuk `wa_outbox` → worker kirim serial dengan jeda anti-ban.
**Anti-ban bawaan (dari riset operator produksi 2024–2026):**
- WAJIB nomor cadangan — bukan nomor utama/pribadi; nomor VoIP lebih cepat di-ban (pakai SIM fisik).
- Warm-up 7 hari: 2 hari idle → ramp harian 20→36→65→117→210→378→680→bebas; state persist di DB (restart tidak reset).
- Jeda gaussian 1.5–5 dtk + 3 dtk chat baru + ~30ms/karakter (simulasi mengetik); serialized global.
- Cap: 8/menit, 200/jam, 1500/hari; circuit breaker 150/hari; tolak duplikat >3x/jam; kirim hanya 08.00–21.00 WIB.
- Auth state TIDAK PERNAH dihapus saat disconnect transient; 401 tunggal ≠ logout (butuh 5x beruntun); 440 (connection-replaced) → berhenti total, jangan reconnect; re-pairing dibatasi (itu sinyal ban); JID dikanonikalisasi (migrasi LID 2024).
- Risk score: +poin saat disconnect/gagal kirim; kill switch otomatis saat skor ≥ 100; /pengaturan (owner) tampilkan status, pairing code, antrian, risk, tombol reset & hentikan darurat.
**Yang belum:** live-test butuh nomor cadangan + pairing (user). Track 1 (official) tetap target utama untuk kebutuhan kritis.
- Bukti: `bun run check` 0 error, build lolos; PoC logika (warm-up cap, delay gaussian, normalize, JID) semua lolos; PoC antrian DB + risk readback lolos; modul baileys load tanpa crash.
**Track 1 — Official: WhatsApp Business Cloud API (target utama)**
- Butuh: akun Meta Developer (gratis) → buat app → tambah produk WhatsApp → WABA → 1 nomor HP cadangan (tidak aktif di WA) → token permanen (system user).
- PoC TANPA nomor cadangan: Meta kasih nomor tes gratis → kirim ke maks 5 nomor HP terdaftar. Bukti works dulu sebelum beli kartu perdana.
- Kita cuma KIRIM notifikasi (order selesai, reminder piutang) → tidak perlu webhook incoming, setup simpel.
- Template message (kategori utility, biasanya auto-approve): `order_selesai`, `reminder_piutang_h3`, `reminder_piutang_telat`.
- Biaya jujur: 1000 percakapan/bulan GRATIS; toko seukuran FD (±100–300 notif/bln) praktis gratis selamanya. Lewat itu ±Rp400/pesan.
- Kode: `src/lib/server/notify/whatsapp-cloud.ts` (ganti stub), kredensial di env (`WA_PHONE_NUMBER_ID`, `WA_TOKEN`).

**Track 2 — Unofficial fallback: Baileys (dibangun kalau official mentok)**
- Dipakai jika: registrasi Meta Developer gagal / nomor ditolak / display name tidak diapprove / butuh jalan cepat.
- Arsitektur: service Node kecil (`wa-gateway/`, pakai Baileys) jalan di server yang sama; FD kirim request HTTP lokal → service teruskan ke WA. Session (QR/pairing code) disimpan di server, pairing sekali saja.
- Aturan aman (wajib): NOMOR KHUSUS untuk gateway (JANGAN nomor utama toko); jeda antar pesan; warm-up nomor baru (mulai dari sedikit pesan); pantau status koneksi di dashboard FD; siap migrasi ke official kapan saja.
- Risiko jujur: unofficial = melanggar ToS WhatsApp → nomor bisa di-ban sementara/permanen. Itu alasan track 1 tetap target utama dan nomor gateway selalu nomor cadangan.
- Kode: `wa-gateway/` + `src/lib/server/notify/whatsapp-baileys.ts`.
- Switch provider di settings: `WA_PROVIDER = cloud | baileys | off`. Fan-out notifikasi: WA (provider aktif) → Telegram → email.

### C. Portal Order Online (Fase 4 inti)
- Form publik `/order-baru`: nama, no WA, jenis cetakan, upload file desain, catatan → order status `baru` + kode tracking.
- Guest tracking via kode (`/lacak`); customer login lihat order sendiri (Fase 4 sisanya).
- Order masuk → push Telegram ke admin (sudah ada infrastrukturnya).

### D. Reminder Piutang Otomatis Terjadwal
- Cron tiap pagi (07:00): piutang H-3, H-1, dan telat → kirim otomatis via channel aktif (WA → Telegram → email fallback).
- Anti-spam tetap via tabel reminders (sudah ada). Semua terkirim tercatat di `/notifikasi`.
- Butuh server 24/7 (cron) — ikut Fase 5 / opsi hosting.

### G. Improvement batch (2026-10-05) — STATUS: G1 ✅ SELESAI, lanjut G2
Koreksi 2026-10-05: kasir SUDAH punya pilih pelanggan (baru/lama) + DP otomatis jadi piutang
(`dibayar` parsial → sisa masuk `receivables`). Jadi bukan backlog.
**G1 — Kasir: diskon + kembalian ✅ SELESAI (2026-10-05).** Kolom baru `orders`:
`subtotal`, `discount_type` (rp/pct), `discount_rp`, `kembalian`; `total` = subtotal − diskon.
Form: input diskon Rp/% + live kembalian (cash boleh lebih bayar; non-cash tidak).
Invoice: breakdown Subtotal → Diskon → Total → Dibayar → Kembalian → Sisa.
PoC end-to-end via server lokal: 10% × Rp100rb + cash Rp100rb → total Rp90rb,
kembalian Rp10rb, payment tercatat Rp90rb; diskon Rp5rb + bayar Rp20rb/45rb →
piutang amount 45rb paid 20rb; validasi diskon > subtotal ditolak. Data PoC dibersihkan.
**G2 — Janji selesai order ✅ SELESAI (2026-10-05).** Kolom `orders.janji_selesai`
(ISO date, nullable; beda dari jatuh tempo piutang). Input di kasir + bisa diubah inline
di halaman order (action `?/janji`, owner/admin/operator). Badge "Telat janji" (danger)
di tabel order, card mobile, dan dashboard "Order terbaru"; order telat naik ke atas urutan.
PoC: order janji kemarin → badge muncul 2x (tabel+card), janji besok → tidak; ubah via
action → jadi telat; tanggal invalid ditolak. Data PoC dibersihkan.
**G3 — Reminder piutang otomatis ✅ SELESAI (2026-10-05).** Job
`src/lib/server/jobs/reminder-piutang.ts` (`bun run reminder`) memanggil
`kirimReminderPiutang()` yang sudah ada. Perbaikan: hanya tandai reminder terkirim
bila ada kanal berhasil (atau tidak ada kanal sama sekali); bila semua kanal gagal →
coba lagi besok (return `gagal`). Cron runtime `fd-reminder-piutang` tiap hari 07:00 WIB.
PoC: run 1 → terkirim 3; run 2 → terkirim 0 (idempotent, tidak dobel); log notifikasi
tercatat; jalan dari direktori mana pun (chdir otomatis). Data PoC dibersihkan.
**G4 — Katalog: breakdown rumus ✅ SELESAI (2026-10-05).** Modul murni `src/lib/katalog.ts`:
`hitungKatalog()` menghasilkan total + breakdown rumus. Kasir: pilih item → input
ukuran/jumlah → deskripsi otomatis menyertakan rumus ("…(Rp25.000/m² × 2 × 1 m)") →
tampil di invoice. Minimum charge & harga reseller DICABUT atas permintaan user
(2026-10-05, "gausah dulu") — kolom DB di-drop, kode dibersihkan.
PoC: hitung meter & pcs benar + rumus tampil.
**G5 — Keuangan ✅ SELESAI (2026-10-05).** Tabel `expenses` (tanggal, kategori, jumlah,
catatan) + halaman /pengeluaran (tambah/hapus, total bulan ini). Tabel `shifts` +
halaman /shift ("Tutup Kasir"): buka shift (cash awal) → tutup (cash fisik); sistem hitung
cash masuk otomatis dari pembayaran cash selama shift → selisih. Dashboard: kartu
"Laba bersih hari ini" (omzet − pengeluaran). Nav: Pengeluaran, Tutup Kasir.
PoC: tambah/validasi pengeluaran; buka→tutup shift (awal 100rb + masuk 25rb = fisik
125rb → selisih 0); buka ganda ditolak; nav & kartu dashboard tampil. Data PoC dibersihkan.
**G6 — Output ✅ SELESAI (2026-10-05).** Export CSV: `GET /api/export?jenis=omzet&periode=harian|mingguan|bulanan`
dan `?jenis=piutang` (owner/admin; separator `;`, BOM UTF-8, tombol "Unduh CSV" di
halaman Laporan & Piutang). Struk thermal: route `/kasir/struk/[id]` (58mm, monospace,
tombol Cetak 58mm) + tombol "Struk 58mm" di invoice. Loader invoice diekstrak ke
`src/lib/server/invoice.ts` (dipakai invoice + struk + email).
PoC: CSV omzet/piutang header + data benar; struk render 58mm; invoice tetap 200;
tanpa login ditolak. Build lolos.
Urutan eksekusi: G1 → G2 → G3 → G4 → G5 → G6. Testing via lokal + API + `bun run check`
+ build (preview publik masih mati — verifikasi ulang via publik setelah token relaunch).

### F. Landing page publik ✅ SELESAI (2026-10-04)
- Route `/` publik (tanpa login; staff login tetap redirect ke dashboard/order via hooks).
- Ikuti formula riset: top bar WA → header sticky → hero (H1 + CTA WA + harga mulai) → trust strip 4 item → grid layanan dari katalog DB (tiap kartu deep-link WA prefilled) → kenapa FD → cara order 5 langkah → daftar harga (data DB asli) → galeri → FAQ accordion → CTA final → footer → sticky WA bar mobile.
- Anti AI slop: tanpa emoji (Lucide), warna solid navy #002b57 + aksen oranye, Inter, teks ringkas.
- WA: 089507370805 (wa.me/6289507370805); alamat & jam buka TIDAK dikarang — tertulis "tanya via WhatsApp".
- Bukti: `/` HTTP 200 (45KB), 14 link WA bernomor benar, harga asli DB (Rp25.000 banner dst), semua section ter-render.
- Revisi 2026-10-04 (feedback user): logo FD monogram SVG dipakai di header + favicon (ganti logo Svelte); semua tombol WA pakai logo WhatsApp asli & link Telegram pakai logo Telegram asli (komponen `WhatsappIcon`/`TelegramIcon` dari path simple-icons); tombol "Tanya-tanya dulu" dihapus untuk kurangi repetisi CTA; section "Lokasi & Jam Buka" ditambah (placeholder jujur — butuh alamat & jam buka asli dari user); info Telegram @FD_printing_bot di CTA final + footer.
- Cron tiap pagi (07:00): piutang H-3, H-1, dan telat → kirim otomatis via channel aktif (WA → Telegram → email fallback).
- Anti-spam tetap via tabel reminders (sudah ada). Semua terkirim tercatat di `/notifikasi`.
- Butuh server 24/7 (cron) — ikut Fase 5 / opsi hosting.

### E. Bot Telegram Pelanggan (self-service)
- Bot terpisah/dual-mode dari bot admin: `/start` → daftarkan chat ID ke data pelanggan.
- Pelanggan cek status order sendiri via kode tracking → kurangi chat "punyaku udah jadi belum?".
- Tetap terkunci: hanya bisa lihat order miliknya sendiri.

### F. Backlog disetujui (tahap berikutnya)
- **Login Google untuk customer** — Better Auth social provider (Google OAuth): daftar/masuk 1 klik, kurangi hambatan registrasi. Perlu: Google Cloud Console → OAuth client ID/secret (gratis).
- **Admin lebih lengkap** — ide: kelola harga grosir/reseller per pelanggan, laporan per pelanggan, audit log aktivitas staff, export laporan (CSV/PDF), dashboard perbandingan periode.
- **Landing page publik yang bagus** — halaman depan (`/`) didesain ulang ala lynk.id: hero + layanan + katalog/price list publik + cara order + kontak/WA. Jadi etalase toko, bukan sekadar redirect login.
- Hasil riset best-practice 5 fitur: `~/workspace/research_notes/fd-print-shop-feature-best-practices-20261004-1710/report.md`.

## Prinsip Data

- Tiap pembayaran tercatat tepat sekali di `payments`; laporan selalu dihitung
  dari tabel, tidak pernah input manual.
- Piutang lunas tidak pernah dihapus.
- Operator tidak pernah lihat harga/omzet.

## Anti-Halu Checklist (dibaca sebelum tiap sesi kerja)

1. Cek PLAN.md — fase & checklist mana yang aktif.
2. Tidak ada fitur di luar fase aktif tanpa persetujuan user.
3. UI: tanpa emoji (Lucide saja), warna solid, teks seperlunya.
4. Setiap klaim "selesai" harus ada bukti jalan (build lolos / demo).
