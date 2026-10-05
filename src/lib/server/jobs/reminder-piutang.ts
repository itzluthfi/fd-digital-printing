#!/usr/bin/env bun
/**
 * Job: reminder piutang otomatis (H-3, H-1, telat).
 *
 * Dijalankan via cron tiap pagi 07:00 WIB:
 *   bun src/lib/server/jobs/reminder-piutang.ts
 *
 * Idempotent: anti-spam via tabel `reminders` (satu kind per piutang hanya
 * dikirim sekali bila ada kanal berhasil; bila semua kanal gagal, dicoba
 * lagi esok hari). Aman dijalankan manual kapan saja.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Pastikan cwd = root proyek agar ./data/app.db (atau DB_PATH) ketemu,
// di mana pun script ini dipanggil.
process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..'));

const { kirimReminderPiutang } = await import('../piutang');

const mulai = Date.now();
try {
	const hasil = await kirimReminderPiutang();
	console.log(JSON.stringify({ ok: true, ...hasil, ms: Date.now() - mulai }));
	process.exit(0);
} catch (e) {
	console.error(JSON.stringify({ ok: false, error: String(e).slice(0, 300) }));
	process.exit(1);
}
