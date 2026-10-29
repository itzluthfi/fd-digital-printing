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

CREATE TABLE IF NOT EXISTS "wa_messages" (
	"id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	"session_id" TEXT NOT NULL,
	"sender" TEXT NOT NULL,
	"message" TEXT NOT NULL,
	"created_at" TEXT NOT NULL
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
`);

// Inisialisasi katalog default jika kosong
const count = sqlite.query('SELECT count(*) as count FROM price_items').get() as { count: number };
if (count.count === 0) {
	const priceRows = [
		{ name: 'Cetak banner MM', category: 'Banner', unit: 'meter', price: 25000, sortOrder: 1 },
		{ name: 'Cetak banner Korea', category: 'Banner', unit: 'meter', price: 35000, sortOrder: 2 },
		{ name: 'Stiker vinyl', category: 'Stiker', unit: 'pcs', price: 5000, sortOrder: 3 },
		{ name: 'Stiker chromo', category: 'Stiker', unit: 'lembar', price: 15000, sortOrder: 4 },
		{ name: 'Brosur A4', category: 'Offset', unit: 'lembar', price: 1500, sortOrder: 5 },
		{ name: 'Kartu nama', category: 'Offset', unit: 'paket', price: 50000, sortOrder: 6 },
		{ name: 'Cetak foto', category: 'Foto', unit: 'lembar', price: 10000, sortOrder: 7 },
		{ name: 'Test Pembayaran QRIS', category: 'Testing', unit: 'pcs', price: 1, sortOrder: 8 }
	];

	const insertStmt = sqlite.prepare(`
		INSERT INTO price_items (name, category, unit, price, is_active, sort_order, created_at)
		VALUES (?, ?, ?, ?, 1, ?, datetime('now'))
	`);

	for (const p of priceRows) {
		insertStmt.run(p.name, p.category, p.unit, p.price, p.sortOrder);
	}
}

console.log('✅ SQLite schema and default catalog initialized successfully.');
