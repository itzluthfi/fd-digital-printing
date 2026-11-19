# FD Digital Printing 🖨️

Sistem otomasi operasional dan e-commerce percetakan modern berbasis **SvelteKit**, **Bun**, **Docker**, dan **GitHub Actions CI/CD**. Aplikasi ini mencakup katalog produk, kalkulator harga otomatis, kasir POS thermal, pelacakan antrean order, manajemen piutang, dan notifikasi omnichannel (Telegram, WhatsApp, Email).

---

## 📋 Daftar Isi

1. [Teknologi & Arsitektur](#-teknologi--arsitektur)
2. [Fitur Utama](#-fitur-utama)
3. [Cara Menjalankan Cepat (Quick Start)](#-cara-menjalankan-cepat-quick-start)
   - [Opsi A: Menjalankan via Docker & Docker Compose (Direkomendasikan)](#opsi-a-menjalankan-via-docker--docker-compose-direkomendasikan)
   - [Opsi B: Menjalankan secara Lokal dengan Bun](#opsi-b-menjalankan-secara-lokal-dengan-bun)
4. [Akun Pengujian & Akses Peran (RBAC)](#-akun-pengujian--akses-peran-rbac)
5. [Otomatisasi Pengujian & Quality Assurance](#-otomatisasi-pengujian--quality-assurance)
6. [Pipeline CI/CD (GitHub Actions)](#-pipeline-cicd-github-actions)
7. [Variabel Lingkungan (.env)](#-variabel-lingkungan-env)
8. [Struktur Proyek](#-struktur-proyek)

---

## ⚡ Teknologi & Arsitektur

- **Runtime & Package Manager:** [Bun](https://bun.sh) v1.4+ (Ultra-fast JavaScript/TypeScript engine).
- **Frontend & Fullstack Framework:** [SvelteKit](https://kit.svelte.dev) dengan Svelte 5 Runes & Tailwind CSS v4.
- **Database & ORM:** SQLite (`bun:sqlite`, zero-config & self-contained) + [Drizzle ORM](https://orm.drizzle.team).
- **Authentication:** Better Auth (Session-based, RBAC, proteksi rute server-side).
- **Containerization:** Docker Multi-stage build (`oven/bun:1-slim`) & Docker Compose multi-service.
- **Testing Suite:** Bun Test (Unit & Integration) + Playwright (End-to-End Browser Testing dengan visual report & Telegram bot progress).

---

## 🌟 Fitur Utama

- **Katalog & Kalkulator Cetak:** Estimasi otomatis berdasarkan ukuran (panjang × lebar), bahan banner/stiker/offset, dan opsi finishing.
- **Kasir POS Cepat:** Diskon nominal/persen, kalkulasi kembalian instan, QRIS statis, struk thermal 58mm, dan cetak invoice PDF.
- **Pipeline Antrean Order:** Pelacakan siklus hidup `baru → diproses → selesai → diambil` dengan estimasi tenggat waktu.
- **Buku Piutang & Pengingat Tempo:** Pencatatan cicilan bertahap serta notifikasi pengingat via Telegram/WhatsApp/Email.
- **Manajemen Shift & Keuangan:** Buka/tutup kasir, rekap selisih uang fisik, serta dashboard laba bersih otomatis.

---

## 🚀 Cara Menjalankan Cepat (Quick Start)

### Opsi A: Menjalankan via Docker & Docker Compose (Direkomendasikan)

Aplikasi telah dikontainerisasi secara multi-stage sehingga dapat langsung dijalankan tanpa perlu menginstal dependensi lokal:

```bash
# 1. Clone repositori
git clone https://github.com/itzluthfi/fd-digital-printing.git
cd fd-digital-printing

# 2. Jalankan aplikasi dan database PostgreSQL via Docker Compose
docker compose up -d

# 3. Periksa status kontainer
docker compose ps
```

Aplikasi langsung aktif di browser pada: **`http://localhost:3000`**  
*(Skema database SQLite dan data katalog awal otomatis diinisialisasi oleh `docker-entrypoint.sh`)*.

Untuk menghentikan kontainer:
```bash
docker compose down
```

---

### Opsi B: Menjalankan secara Lokal dengan Bun

Pastikan Anda telah menginstal [Bun](https://bun.sh) (v1.4 ke atas):

```bash
# 1. Clone dan install dependensi
git clone https://github.com/itzluthfi/fd-digital-printing.git
cd fd-digital-printing
bun install

# 2. Siapkan Environment & Database
cp .env.example .env
bun run db:init      # Inisialisasi skema tabel SQLite di data/app.db
bun run db:seed      # Mengisi data awal katalog dan dummy transaksi (opsional)

# 3. Jalankan development server
bun run dev
```

Buka **`http://localhost:5173`** di browser Anda.

---

## 👥 Akun Pengujian & Akses Peran (RBAC)

Setelah menjalankan `bun run db:seed` atau saat kontainer aktif, akun berikut dapat langsung digunakan untuk login di `/sign-in`:

| Peran (*Role*) | Email | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Owner** | `owner@fd.local` | `admin123` | Akses penuh: keuangan, omzet, kelola user staf, dan pengaturan sistem. |
| **Admin** | `admin@fd.local` | `admin123` | Operasional toko: kasir POS, antrean order, CRM pelanggan, dan katalog harga. |
| **Operator** | `operator@fd.local` | `admin123` | Produksi: hanya melihat antrean cetak dan update status pengerjaan mesin. |
| **Customer** | `customer@fd.local` | `admin123` | Publik: riwayat order mandiri dan unduh invoice/struk digital. |

---

## 🧪 Otomatisasi Pengujian & Quality Assurance

Proyek ini menerapkan pengujian piramida lengkap (*Test Pyramid*):

```bash
# 1. Menjalankan Unit Tests (Kalkulator harga, rumus finishing, format rupiah)
bun run test:unit

# 2. Menjalankan Integration Tests (Autentikasi role, proteksi rute kasir & API)
bun run test:integration

# 3. Menjalankan End-to-End (E2E) Browser Tests (Playwright Chromium)
bun run test:e2e

# 4. Mengompilasi Laporan Resmi PDF & Arsip Screenshot
bun run test:report
```

> **Fitur Baru Realtime Telegram Reporter:** Saat pengujian Playwright E2E berjalan di CI/CD, bot Telegram otomatis menampilkan *realtime progress loading bar* `[████████░░░░] %` dan nama fitur yang sedang diuji detik per detik.

---

## 🔄 Pipeline CI/CD (GitHub Actions)

Berkas konfigurasi: **`.github/workflows/ci.yml`**

1. **Trigger:** Otomatis berjalan pada setiap `push` dan `pull_request` di branch `main` dan `luthfi_dev`.
2. **Stage 1 (Code Quality & Build):** Type-checking TypeScript (`svelte-check`) dan verifikasi kompilasi produksi.
3. **Stage 2 (Unit & Integration Tests):** Menjalankan 28 test suites pengujian logika bisnis dan validasi kasir.
4. **Stage 3 (E2E Testing & Reporting):** Menjalankan Playwright di browser headless Chromium, mengambil screenshot fitur, dan mengunggah artifak resmi laporan PDF eksekutif (`e2e-visual-report`).

---

## ⚙️ Variabel Lingkungan (.env)

| Variabel | Wajib | Keterangan |
| :--- | :---: | :--- |
| `BETTER_AUTH_SECRET` | **Ya** | Kunci token enkripsi sesi otentikasi (string minimal 32 karakter). |
| `BETTER_AUTH_URL` | **Ya** | URL dasar aplikasi (contoh: `http://localhost:3000` atau URL domain). |
| `DB_PATH` | Opsional | Lokasi penyimpanan database SQLite (default: `./data/app.db`). |
| `TELEGRAM_BOT_TOKEN` | Opsional | Token Bot Telegram dari [@BotFather](https://t.me/BotFather) untuk notifikasi laporan. |
| `TELEGRAM_DEV_CHAT_ID` | Opsional | ID Chat/Grup Telegram target distribusi laporan pengujian. |

---

## 📁 Struktur Proyek

```text
fd-digital-printing/
├── .github/workflows/         # Pipeline Continuous Integration (ci.yml)
├── src/
│   ├── routes/                # SvelteKit Routing (Kasir, Order, Piutang, Laporan, API)
│   └── lib/
│       ├── server/db/         # Skema Drizzle ORM, inisialisasi SQLite, dan seeder
│       ├── server/notify/     # Omnichannel dispatcher (Telegram, WhatsApp, Email)
│       └── katalog.ts         # Logika komputasi harga cetak murni (pure function)
├── tests/
│   ├── unit/                  # Pengujian unit kalkulasi harga dan format
│   ├── integration/           # Pengujian integrasi otentikasi dan proteksi peran
│   └── e2e/                   # Skenario pengujian browser Playwright
├── scripts/
│   ├── telegram-realtime-reporter.ts  # Custom Playwright realtime progress reporter
│   └── generate-and-send-e2e-report.ts # Kompilasi PDF eksekutif & screenshot ZIP
├── Dockerfile                 # Multi-stage production build (Bun v1-slim)
├── compose.yaml               # Orkestrasi multi-service (App + PostgreSQL)
└── docker-entrypoint.sh       # Script boot kontainer otomatis
```

---

## 📄 Lisensi & Kontribusi

Dikembangkan oleh **Muhammad Luthfi** (`itzluthfi`) untuk keperluan implementasi praktikum DevOps & Penjaminan Mutu Perangkat Lunak.
