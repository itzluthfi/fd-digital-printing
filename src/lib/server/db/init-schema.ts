import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = process.env.DB_PATH ?? './data/app.db';
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);

sqlite.exec(`
CREATE TABLE IF NOT EXISTS "user" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"name" TEXT NOT NULL,
	"email" TEXT NOT NULL UNIQUE,
	"email_verified" INTEGER DEFAULT 0 NOT NULL,
	"image" TEXT,
	"telegram_chat_id" TEXT,
	"role" TEXT DEFAULT 'customer' NOT NULL,
	"created_at" INTEGER NOT NULL,
	"updated_at" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "session" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"expires_at" INTEGER NOT NULL,
	"token" TEXT NOT NULL UNIQUE,
	"created_at" INTEGER NOT NULL,
	"updated_at" INTEGER NOT NULL,
	"ip_address" TEXT,
	"user_agent" TEXT,
	"user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"account_id" TEXT NOT NULL,
	"provider_id" TEXT NOT NULL,
	"user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
	"access_token" TEXT,
	"refresh_token" TEXT,
	"id_token" TEXT,
	"access_token_expires_at" INTEGER,
	"refresh_token_expires_at" INTEGER,
	"scope" TEXT,
	"password" TEXT,
	"created_at" INTEGER NOT NULL,
	"updated_at" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"identifier" TEXT NOT NULL,
	"value" TEXT NOT NULL,
	"expires_at" INTEGER NOT NULL,
	"created_at" INTEGER,
	"updated_at" INTEGER
);

CREATE TABLE IF NOT EXISTS "customers" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"name" TEXT NOT NULL,
	"phone" TEXT NOT NULL,
	"email" TEXT,
	"telegram_chat_id" TEXT,
	"notes" TEXT,
	"created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "orders" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"code" TEXT UNIQUE,
	"customer_id" INTEGER REFERENCES "customers"("id"),
	"description" TEXT NOT NULL,
	"file_url" TEXT,
	"status" TEXT DEFAULT 'baru' NOT NULL,
	"subtotal" REAL DEFAULT 0 NOT NULL,
	"discount_type" TEXT,
	"discount_rp" REAL DEFAULT 0 NOT NULL,
	"total" REAL DEFAULT 0 NOT NULL,
	"kembalian" REAL DEFAULT 0 NOT NULL,
	"janji_selesai" TEXT,
	"created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "payments" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"order_id" INTEGER REFERENCES "orders"("id"),
	"method" TEXT NOT NULL,
	"amount" REAL NOT NULL,
	"paid_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "receivables" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"customer_id" INTEGER NOT NULL REFERENCES "customers"("id"),
	"order_id" INTEGER REFERENCES "orders"("id"),
	"amount" REAL NOT NULL,
	"paid_amount" REAL DEFAULT 0 NOT NULL,
	"due_date" TEXT NOT NULL,
	"status" TEXT DEFAULT 'belum_lunas' NOT NULL,
	"created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "reminders" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"receivable_id" INTEGER NOT NULL REFERENCES "receivables"("id"),
	"kind" TEXT NOT NULL,
	"sent_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "notification_logs" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"channel" TEXT NOT NULL,
	"target" TEXT NOT NULL,
	"customer_name" TEXT,
	"order_id" INTEGER REFERENCES "orders"("id"),
	"title" TEXT NOT NULL,
	"status" TEXT DEFAULT 'skipped' NOT NULL,
	"error" TEXT,
	"created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "price_items" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"name" TEXT NOT NULL,
	"category" TEXT,
	"image_url" TEXT,
	"unit" TEXT DEFAULT 'pcs' NOT NULL,
	"price" REAL DEFAULT 0 NOT NULL,
	"is_active" INTEGER DEFAULT 1 NOT NULL,
	"sort_order" INTEGER DEFAULT 0 NOT NULL,
	"created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "settings" (
	"key" TEXT PRIMARY KEY NOT NULL,
	"value" TEXT,
	"updated_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "expenses" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"tanggal" TEXT NOT NULL,
	"kategori" TEXT NOT NULL,
	"jumlah" REAL DEFAULT 0 NOT NULL,
	"catatan" TEXT,
	"created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "shifts" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"dibuka_at" TEXT NOT NULL,
	"dibuka_oleh" TEXT,
	"cash_awal" REAL DEFAULT 0 NOT NULL,
	"ditutup_at" TEXT,
	"ditutup_oleh" TEXT,
	"cash_masuk" REAL,
	"cash_fisik" REAL,
	"selisih" REAL,
	"catatan" TEXT
);

CREATE TABLE IF NOT EXISTS "wa_sessions" (
	"id" TEXT PRIMARY KEY NOT NULL,
	"phone" TEXT NOT NULL,
	"name" TEXT,
	"mode" TEXT DEFAULT 'bot' NOT NULL,
	"last_message" TEXT,
	"last_activity_at" TEXT NOT NULL,
	"draft_order" TEXT,
	"created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "wa_messages" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"session_id" TEXT NOT NULL,
	"sender" TEXT NOT NULL,
	"message" TEXT NOT NULL,
	"created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "wa_outbox" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"to" TEXT NOT NULL,
	"text" TEXT NOT NULL,
	"status" TEXT DEFAULT 'queued' NOT NULL,
	"scheduled_at" TEXT NOT NULL,
	"attempts" INTEGER DEFAULT 0 NOT NULL,
	"last_error" TEXT,
	"created_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "wa_meta" (
	"key" TEXT PRIMARY KEY NOT NULL,
	"value" TEXT NOT NULL,
	"updated_at" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "machines" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"slug" TEXT NOT NULL UNIQUE,
	"nama" TEXT NOT NULL,
	"kategori" TEXT NOT NULL,
	"kategori_label" TEXT NOT NULL,
	"tagline" TEXT NOT NULL,
	"foto" TEXT NOT NULL,
	"status_operasional" TEXT DEFAULT 'Aktif Beroperasi' NOT NULL,
	"fungsi_kegunaan" TEXT NOT NULL,
	"jenis_pekerjaan" TEXT DEFAULT '[]' NOT NULL,
	"produk_dihasilkan" TEXT DEFAULT '[]' NOT NULL,
	"bahan_diproses" TEXT DEFAULT '[]' NOT NULL,
	"spesifikasi" TEXT DEFAULT '[]' NOT NULL,
	"contoh_hasil_cetak" TEXT DEFAULT '[]' NOT NULL,
	"keunggulan_utama" TEXT DEFAULT '[]' NOT NULL,
	"sort_order" INTEGER DEFAULT 0 NOT NULL,
	"is_active" INTEGER DEFAULT 1 NOT NULL,
	"created_at" TEXT NOT NULL,
	"updated_at" TEXT NOT NULL
);
`);

// Inisialisasi katalog default jika kosong
const countPrice = sqlite.query('SELECT count(*) as count FROM price_items').get() as { count: number };
if (countPrice.count === 0) {
	const priceRows = [
		// 1. STIKER
		{ name: 'Stiker A3+ Bontak (Chromo)', category: 'Stiker', unit: 'lembar', price: 4600, sortOrder: 10, imageUrl: '/landing-stiker.jpg' },
		{ name: 'Stiker A3+ Bontak + Cutting (Kiss Cut)', category: 'Stiker', unit: 'lembar', price: 13000, sortOrder: 11, imageUrl: '/landing-stiker.jpg' },
		{ name: 'Stiker A3+ Vinyl Waterproof', category: 'Stiker', unit: 'lembar', price: 6000, sortOrder: 12, imageUrl: '/landing-stiker.jpg' },
		{ name: 'Stiker A3+ Vinyl + Cutting (Kiss Cut)', category: 'Stiker', unit: 'lembar', price: 14000, sortOrder: 13, imageUrl: '/landing-stiker.jpg' },
		{ name: 'Stiker Vinyl Meteran (Camel)', category: 'Stiker', unit: 'meter', price: 55000, sortOrder: 14, imageUrl: '/landing-stiker.jpg' },
		{ name: 'Stiker Vinyl Meteran (Ritrama)', category: 'Stiker', unit: 'meter', price: 65000, sortOrder: 15, imageUrl: '/landing-stiker.jpg' },
		{ name: 'Stiker Vinyl Meteran (Oneway Vision)', category: 'Stiker', unit: 'meter', price: 65000, sortOrder: 16, imageUrl: '/landing-stiker.jpg' },
		{ name: 'Stiker Vinyl Meteran (Transparan)', category: 'Stiker', unit: 'meter', price: 75000, sortOrder: 17, imageUrl: '/landing-stiker.jpg' },
		{ name: 'Stiker Vinyl Meteran (Blackout)', category: 'Stiker', unit: 'meter', price: 80000, sortOrder: 18, imageUrl: '/landing-stiker.jpg' },
		{ name: 'Laminasi Doff / Glossy A3+', category: 'Stiker', unit: 'lembar', price: 4000, sortOrder: 19, imageUrl: '/mesin-laminasi.jpg' },
		{ name: 'Laminasi Meteran Doff / Glossy', category: 'Stiker', unit: 'meter', price: 25000, sortOrder: 20, imageUrl: '/mesin-laminasi.jpg' },
		{ name: 'Jasa Cutting Meteran (Plotter Contour)', category: 'Stiker', unit: 'meter', price: 25000, sortOrder: 21, imageUrl: '/mesin-cutting.jpg' },

		// 2. DIGITAL PRINT
		{ name: 'HVS 100gr A3+', category: 'Digital Print', unit: 'lembar', price: 3100, sortOrder: 30, imageUrl: '/landing-offset.jpg' },
		{ name: 'Art Paper 150gr A3+', category: 'Digital Print', unit: 'lembar', price: 3600, sortOrder: 31, imageUrl: '/landing-offset.jpg' },
		{ name: 'Art Carton 210gr A3+', category: 'Digital Print', unit: 'lembar', price: 3700, sortOrder: 32, imageUrl: '/landing-offset.jpg' },
		{ name: 'Art Carton 230gr A3+', category: 'Digital Print', unit: 'lembar', price: 3800, sortOrder: 33, imageUrl: '/landing-offset.jpg' },
		{ name: 'Art Carton 260gr A3+', category: 'Digital Print', unit: 'lembar', price: 3900, sortOrder: 34, imageUrl: '/landing-offset.jpg' },
		{ name: 'Albatros 200gr Matte', category: 'Digital Print', unit: 'meter', price: 62000, sortOrder: 35, imageUrl: '/landing-hero.jpg' },

		// 3. MEDIA PROMOSI
		{ name: 'X Banner 60x160cm Flexi China 280gr', category: 'Media Promosi', unit: 'set', price: 43000, sortOrder: 40, imageUrl: '/banner-avatar.png' },
		{ name: 'X Banner 60x160cm Flexi Korchin 380gr', category: 'Media Promosi', unit: 'set', price: 48000, sortOrder: 41, imageUrl: '/banner-avatar.png' },
		{ name: 'X Banner 60x160cm Flexi Korea 440gr', category: 'Media Promosi', unit: 'set', price: 53000, sortOrder: 42, imageUrl: '/banner-avatar.png' },
		{ name: 'X Banner 60x160cm Albatros 200gr', category: 'Media Promosi', unit: 'set', price: 80000, sortOrder: 43, imageUrl: '/banner-avatar.png' },

		{ name: 'Y Banner 80x180cm Flexi China 280gr', category: 'Media Promosi', unit: 'set', price: 65000, sortOrder: 44, imageUrl: '/banner-avatar.png' },
		{ name: 'Y Banner 80x180cm Flexi Korchin 380gr', category: 'Media Promosi', unit: 'set', price: 75000, sortOrder: 45, imageUrl: '/banner-avatar.png' },
		{ name: 'Y Banner 80x180cm Flexi Korea 440gr', category: 'Media Promosi', unit: 'set', price: 79000, sortOrder: 46, imageUrl: '/banner-avatar.png' },
		{ name: 'Y Banner 80x180cm Albatros 200gr', category: 'Media Promosi', unit: 'set', price: 125000, sortOrder: 47, imageUrl: '/banner-avatar.png' },

		{ name: 'Roll Banner 60x160cm Flexi China 280gr', category: 'Media Promosi', unit: 'set', price: 160000, sortOrder: 48, imageUrl: '/banner-avatar.png' },
		{ name: 'Roll Banner 60x160cm Flexi Korchin 380gr', category: 'Media Promosi', unit: 'set', price: 180000, sortOrder: 49, imageUrl: '/banner-avatar.png' },
		{ name: 'Roll Banner 60x160cm Flexi Korea 440gr', category: 'Media Promosi', unit: 'set', price: 185000, sortOrder: 50, imageUrl: '/banner-avatar.png' },
		{ name: 'Roll Banner 60x160cm Albatros 200gr', category: 'Media Promosi', unit: 'set', price: 190000, sortOrder: 51, imageUrl: '/banner-avatar.png' },

		{ name: 'Roll Banner 85x200cm Flexi China 280gr', category: 'Media Promosi', unit: 'set', price: 200000, sortOrder: 52, imageUrl: '/banner-avatar.png' },
		{ name: 'Roll Banner 85x200cm Flexi Korchin 380gr', category: 'Media Promosi', unit: 'set', price: 205000, sortOrder: 53, imageUrl: '/banner-avatar.png' },
		{ name: 'Roll Banner 85x200cm Flexi Korea 440gr', category: 'Media Promosi', unit: 'set', price: 210000, sortOrder: 54, imageUrl: '/banner-avatar.png' },
		{ name: 'Roll Banner 85x200cm Albatros 200gr', category: 'Media Promosi', unit: 'set', price: 265000, sortOrder: 55, imageUrl: '/banner-avatar.png' },

		{ name: 'Tripod Banner A3', category: 'Media Promosi', unit: 'set', price: 125000, sortOrder: 56, imageUrl: '/banner-avatar.png' },
		{ name: 'Tripod Banner A2', category: 'Media Promosi', unit: 'set', price: 145000, sortOrder: 57, imageUrl: '/banner-avatar.png' },
		{ name: 'Tripod Banner A1', category: 'Media Promosi', unit: 'set', price: 180000, sortOrder: 58, imageUrl: '/banner-avatar.png' },
		{ name: 'Tripod Banner A0', category: 'Media Promosi', unit: 'set', price: 280000, sortOrder: 59, imageUrl: '/banner-avatar.png' },

		{ name: 'Mockup Polyfoam A3', category: 'Media Promosi', unit: 'pcs', price: 25000, sortOrder: 60, imageUrl: '/landing-hero.jpg' },
		{ name: 'Mockup Polyfoam A2', category: 'Media Promosi', unit: 'pcs', price: 45000, sortOrder: 61, imageUrl: '/landing-hero.jpg' },
		{ name: 'Mockup Polyfoam A1', category: 'Media Promosi', unit: 'pcs', price: 80000, sortOrder: 62, imageUrl: '/landing-hero.jpg' },
		{ name: 'Mockup Polyfoam A0', category: 'Media Promosi', unit: 'pcs', price: 180000, sortOrder: 63, imageUrl: '/landing-hero.jpg' },

		{ name: 'Event Desk Portable', category: 'Media Promosi', unit: 'pcs', price: 1100000, sortOrder: 64, imageUrl: '/banner-avatar.png' },

		// 4. MERCHANDISE
		{ name: 'Pin Peniti 45mm', category: 'Merchandise', unit: 'pcs', price: 5000, sortOrder: 70, imageUrl: '/logo.png' },
		{ name: 'Pin Peniti 58mm', category: 'Merchandise', unit: 'pcs', price: 6000, sortOrder: 71, imageUrl: '/logo.png' },
		{ name: 'Gantungan Kunci 45mm', category: 'Merchandise', unit: 'pcs', price: 7500, sortOrder: 72, imageUrl: '/logo.png' },
		{ name: 'Gantungan Kunci 58mm', category: 'Merchandise', unit: 'pcs', price: 8000, sortOrder: 73, imageUrl: '/logo.png' },
		{ name: 'Kipas Kertas Promosi', category: 'Merchandise', unit: 'pcs', price: 7000, sortOrder: 74, imageUrl: '/landing-offset.jpg' },
		{ name: 'Mug Putih Keramik Custom', category: 'Merchandise', unit: 'pcs', price: 28500, sortOrder: 75, imageUrl: '/logo.png' },

		// 5. STATIONERY
		{ name: 'Kartu Nama Bisnis (1 Box = 100 pcs)', category: 'Stationery', unit: 'box', price: 25000, sortOrder: 80, imageUrl: '/landing-offset.jpg' },
		{ name: 'Stempel Flash Lingkaran Diameter 2,5cm', category: 'Stationery', unit: 'pcs', price: 65000, sortOrder: 81, imageUrl: '/logo.png' },
		{ name: 'Stempel Flash Lingkaran Diameter 3,2cm', category: 'Stationery', unit: 'pcs', price: 65000, sortOrder: 82, imageUrl: '/logo.png' },
		{ name: 'Stempel Flash Lingkaran Diameter 4,2cm', category: 'Stationery', unit: 'pcs', price: 75000, sortOrder: 83, imageUrl: '/logo.png' },
		{ name: 'Stempel Flash Oval Diameter 4,2cm', category: 'Stationery', unit: 'pcs', price: 75000, sortOrder: 84, imageUrl: '/logo.png' },
		{ name: 'Stempel Flash Oval Diameter 4,8cm', category: 'Stationery', unit: 'pcs', price: 80000, sortOrder: 85, imageUrl: '/logo.png' },
		{ name: 'Stempel Flash Persegi Panjang 5x2,5cm', category: 'Stationery', unit: 'pcs', price: 65000, sortOrder: 86, imageUrl: '/logo.png' },
		{ name: 'Stempel Flash Persegi Panjang 5x3cm', category: 'Stationery', unit: 'pcs', price: 75000, sortOrder: 87, imageUrl: '/logo.png' },
		{ name: 'Id Card PVC', category: 'Stationery', unit: 'pcs', price: 7000, sortOrder: 88, imageUrl: '/logo.png' },
		{ name: 'Tali Lanyard Printing', category: 'Stationery', unit: 'pcs', price: 12000, sortOrder: 89, imageUrl: '/logo.png' },

		// TESTING ITEM
		{ name: 'Test Pembayaran QRIS (Testing Rp 1)', category: 'Testing', unit: 'pcs', price: 1, sortOrder: 99, imageUrl: '/logo.png' }
	];

	const insertStmt = sqlite.prepare(`
		INSERT INTO price_items (name, category, unit, price, is_active, sort_order, image_url, created_at)
		VALUES (?, ?, ?, ?, 1, ?, ?, datetime('now'))
	`);

	for (const p of priceRows) {
		insertStmt.run(p.name, p.category, p.unit, p.price, p.sortOrder, p.imageUrl);
	}
}

console.log('✅ SQLite schema and default catalog initialized successfully.');
