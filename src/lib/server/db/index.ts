import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import * as schema from './schema';
import { DEFAULT_MACHINES, DEFAULT_PRICE_ITEMS } from './default-data';

const dbPath = process.env.DB_PATH ?? './data/app.db';
// bun:sqlite membuat file DB otomatis, tapi foldernya harus sudah ada.
// (Penting untuk fresh clone & CI: folder data/ masuk .gitignore.)
mkdirSync(dirname(dbPath), { recursive: true });
export const sqlite = new Database(dbPath);

// Pastikan kolom telegram_chat_id ada di tabel user tanpa perlu migrasi manual
try {
	sqlite.run('ALTER TABLE user ADD COLUMN telegram_chat_id TEXT;');
} catch {
	// Kolom sudah ada
}

// Auto-migration untuk tabel sesi & pesan WhatsApp
try {
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS wa_sessions (
			id TEXT PRIMARY KEY,
			phone TEXT NOT NULL,
			name TEXT,
			mode TEXT NOT NULL DEFAULT 'bot',
			last_message TEXT,
			last_activity_at TEXT NOT NULL,
			draft_order TEXT,
			created_at TEXT NOT NULL
		);
	`);
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS wa_messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			session_id TEXT NOT NULL,
			sender TEXT NOT NULL,
			message TEXT NOT NULL,
			created_at TEXT NOT NULL
		);
	`);
} catch {
	// Tabel sudah ada
}

// Auto-seed untuk tabel machines & price_items jika kosong
try {
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS machines (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			nama TEXT NOT NULL,
			kategori TEXT NOT NULL,
			kategori_label TEXT NOT NULL,
			tagline TEXT NOT NULL,
			foto TEXT NOT NULL,
			status_operasional TEXT DEFAULT 'Aktif Beroperasi' NOT NULL,
			fungsi_kegunaan TEXT NOT NULL,
			jenis_pekerjaan TEXT DEFAULT '[]' NOT NULL,
			produk_dihasilkan TEXT DEFAULT '[]' NOT NULL,
			bahan_diproses TEXT DEFAULT '[]' NOT NULL,
			spesifikasi TEXT DEFAULT '[]' NOT NULL,
			contoh_hasil_cetak TEXT DEFAULT '[]' NOT NULL,
			keunggulan_utama TEXT DEFAULT '[]' NOT NULL,
			sort_order INTEGER DEFAULT 0 NOT NULL,
			is_active INTEGER DEFAULT 1 NOT NULL,
			created_at TEXT NOT NULL,
			updated_at TEXT NOT NULL
		);
	`);
	sqlite.run(`
		CREATE TABLE IF NOT EXISTS price_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			name TEXT NOT NULL,
			category TEXT,
			image_url TEXT,
			unit TEXT DEFAULT 'pcs' NOT NULL,
			price REAL DEFAULT 0 NOT NULL,
			is_active INTEGER DEFAULT 1 NOT NULL,
			sort_order INTEGER DEFAULT 0 NOT NULL,
			created_at TEXT NOT NULL
		);
	`);

	const countMachines = sqlite.query('SELECT count(*) as count FROM machines').get() as { count: number } | null;
	if (countMachines && countMachines.count === 0) {
		const insertMachineStmt = sqlite.prepare(`
			INSERT INTO machines (
				slug, nama, kategori, kategori_label, tagline, foto, status_operasional,
				fungsi_kegunaan, jenis_pekerjaan, produk_dihasilkan, bahan_diproses,
				spesifikasi, contoh_hasil_cetak, keunggulan_utama, sort_order, is_active, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
		`);
		for (let i = 0; i < DEFAULT_MACHINES.length; i++) {
			const m = DEFAULT_MACHINES[i];
			insertMachineStmt.run(
				m.slug,
				m.nama,
				m.kategori,
				m.kategoriLabel,
				m.tagline,
				m.foto,
				m.statusOperasional,
				m.fungsiKegunaan,
				JSON.stringify(m.jenisPekerjaan),
				JSON.stringify(m.produkDihasilkan),
				JSON.stringify(m.bahanDiproses),
				JSON.stringify(m.spesifikasi),
				JSON.stringify(m.contohHasilCetak),
				JSON.stringify(m.keunggulanUtama),
				m.sortOrder ?? i + 1
			);
		}
	}

	const countPrice = sqlite.query('SELECT count(*) as count FROM price_items').get() as { count: number } | null;
	if (countPrice && countPrice.count === 0) {
		const insertPriceStmt = sqlite.prepare(`
			INSERT INTO price_items (name, category, unit, price, is_active, sort_order, image_url, created_at)
			VALUES (?, ?, ?, ?, 1, ?, ?, datetime('now'))
		`);
		for (const p of DEFAULT_PRICE_ITEMS) {
			insertPriceStmt.run(p.name, p.category, p.unit, p.price, p.sortOrder, p.imageUrl);
		}
	}
} catch (e) {
	console.error('Auto-seed default data error:', e);
}

export const db = drizzle(sqlite, { schema });
