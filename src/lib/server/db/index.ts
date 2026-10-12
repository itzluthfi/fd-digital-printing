import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

import * as schema from './schema';

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

export const db = drizzle(sqlite, { schema });
