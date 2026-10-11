import { sqlite } from './db';
import { botSendDocument, ownerIds } from './bot/api';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { resolve, join } from 'node:path';

export interface BackupResult {
	ok: boolean;
	filePath?: string;
	fileName?: string;
	fileSizeBytes?: number;
	fileSizeFormatted?: string;
	error?: string;
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Bersihkan backup lokal yang lebih tua dari maxAgeDays (default: 7 hari).
 */
export function cleanupOldBackups(backupDir: string, maxAgeDays = 7): number {
	try {
		if (!existsSync(backupDir)) return 0;
		const now = Date.now();
		const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
		let deletedCount = 0;

		const files = readdirSync(backupDir);
		for (const file of files) {
			if (!file.endsWith('.sqlite') && !file.endsWith('.db')) continue;
			const fullPath = join(backupDir, file);
			const stat = statSync(fullPath);
			if (now - stat.mtimeMs > maxAgeMs) {
				unlinkSync(fullPath);
				deletedCount++;
			}
		}
		return deletedCount;
	} catch (err) {
		console.warn('[backup] Gagal cleanup backup lama:', err);
		return 0;
	}
}

/**
 * Melakukan snapshot database SQLite konsisten menggunakan 'VACUUM INTO'.
 * Aman dijalankan saat server aktif (hot backup).
 */
export function createDatabaseBackup(): BackupResult {
	try {
		const backupDir = resolve('./data/backups');
		if (!existsSync(backupDir)) {
			mkdirSync(backupDir, { recursive: true });
		}

		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		const yyyy = now.getFullYear();
		const mm = pad(now.getMonth() + 1);
		const dd = pad(now.getDate());
		const hh = pad(now.getHours());
		const mi = pad(now.getMinutes());
		const ss = pad(now.getSeconds());

		const fileName = `backup-fd-printing-${yyyy}${mm}${dd}-${hh}${mi}${ss}.sqlite`;
		const targetPath = join(backupDir, fileName);

		// SQLite VACUUM INTO membuat salinan bersih tanpa fragmen data kosong
		const escapedPath = targetPath.replace(/'/g, "''");
		sqlite.run(`VACUUM INTO '${escapedPath}'`);

		if (!existsSync(targetPath)) {
			return { ok: false, error: 'File backup tidak tercipta setelah VACUUM INTO.' };
		}

		const stat = statSync(targetPath);
		const sizeBytes = stat.size;
		const sizeFormatted = formatBytes(sizeBytes);

		// Cleanup backup lama di disk lokal (> 7 hari)
		cleanupOldBackups(backupDir, 7);

		return {
			ok: true,
			filePath: targetPath,
			fileName,
			fileSizeBytes: sizeBytes,
			fileSizeFormatted: sizeFormatted
		};
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error('[backup] Error saat VACUUM INTO:', err);
		return { ok: false, error: msg };
	}
}

/**
 * Kirim snapshot database ke Telegram Owner.
 * Jika targetChatId diisi, kirim ke ID tersebut. Jika tidak, kirim ke seluruh daftar Owner.
 */
export async function sendDatabaseBackupToTelegram(
	targetChatId?: number | string
): Promise<{ success: boolean; sentCount: number; message: string }> {
	const backup = createDatabaseBackup();
	if (!backup.ok || !backup.filePath || !backup.fileName) {
		return {
			success: false,
			sentCount: 0,
			message: `Gagal membuat snapshot database: ${backup.error ?? 'Unknown error'}`
		};
	}

	const targets = targetChatId ? [String(targetChatId)] : ownerIds();
	if (targets.length === 0) {
		return {
			success: false,
			sentCount: 0,
			message: 'Tidak ada ID Telegram Owner yang terdaftar untuk menerima file backup.'
		};
	}

	const nowStr = new Date().toLocaleString('id-ID', {
		timeZone: 'Asia/Jakarta',
		dateStyle: 'full',
		timeStyle: 'medium'
	});

	const caption =
		`📦 <b>SNAPSHOT BACKUP DATABASE FD PRINTING</b>\n\n` +
		`📅 <b>Waktu:</b> ${nowStr} WIB\n` +
		`📁 <b>File:</b> <code>${backup.fileName}</code>\n` +
		`⚖️ <b>Ukuran:</b> <code>${backup.fileSizeFormatted}</code>\n` +
		`🛡️ <b>Metode:</b> SQLite <code>VACUUM INTO</code> (Konsisten & Aman)\n\n` +
		`<i>File ini adalah cadangan data offline toko FD Digital Printing. Simpan file ini di tempat aman untuk disaster recovery.</i>`;

	let sentCount = 0;
	for (const id of targets) {
		const ok = await botSendDocument(id, backup.filePath, caption);
		if (ok) sentCount++;
	}

	return {
		success: sentCount > 0,
		sentCount,
		message: `Backup berhasil dikirim ke ${sentCount}/${targets.length} Owner (${backup.fileName}, ${backup.fileSizeFormatted}).`
	};
}
