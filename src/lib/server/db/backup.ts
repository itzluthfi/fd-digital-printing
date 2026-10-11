/**
 * Skrip Atomic SQLite Backup & Retention Policy
 *
 * Menggunakan fitur bawaan SQLite 3.27+ `VACUUM INTO` via bun:sqlite.
 * Menjamin backup 100% konsisten bahkan saat database sedang sibuk (WAL mode),
 * tanpa menghentikan aplikasi atau lock panjang.
 *
 * Menghapus backup lama yang berusia lebih dari RETENTION_DAYS (default 7 hari).
 *
 * Penggunaan:
 *   bun run db:backup
 *   BACKUP_DIR=/custom/dir bun run db:backup
 */
import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

const RETENTION_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getBackupDir(): string {
	if (process.env.BACKUP_DIR) return process.env.BACKUP_DIR;
	// Di Linux / VPS standar gunakan /backup/fd jika writeable, jika tidak gunakan ./data/backups
	if (process.platform !== 'win32') {
		try {
			mkdirSync('/backup/fd', { recursive: true });
			return '/backup/fd';
		} catch {
			// fallback ke folder data/backups lokal
		}
	}
	return resolve('./data/backups');
}

export function performBackup(): { success: boolean; filePath?: string; sizeFormatted?: string; error?: string } {
	const dbPath = resolve(process.env.DB_PATH ?? './data/app.db');

	if (!existsSync(dbPath)) {
		const err = `Database file tidak ditemukan di: ${dbPath}`;
		console.error(`[backup] ❌ ${err}`);
		return { success: false, error: err };
	}

	const backupDir = getBackupDir();
	mkdirSync(backupDir, { recursive: true });

	// Format nama: app-YYYY-MM-DD-HHmmss.db
	const now = new Date();
	const pad = (n: number) => String(n).padStart(2, '0');
	const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
	const targetFileName = `app-${stamp}.db`;
	const targetPath = join(backupDir, targetFileName);

	console.log(`[backup] 🔄 Memulai atomic backup dari ${dbPath} ke ${targetPath}...`);

	try {
		const sqlite = new Database(dbPath);
		// Path di SQLite VACUUM INTO perlu escaped bila ada petik tunggal dan format slash seragam
		const normalizedTargetPath = targetPath.replace(/\\/g, '/').replace(/'/g, "''");
		sqlite.run(`VACUUM INTO '${normalizedTargetPath}'`);
		sqlite.close();

		const stat = statSync(targetPath);
		const sizeFormatted = formatBytes(stat.size);
		console.log(`[backup] ✅ Backup sukses: ${targetFileName} (${sizeFormatted})`);

		// Bersihkan backup lama > RETENTION_DAYS
		cleanOldBackups(backupDir);

		return { success: true, filePath: targetPath, sizeFormatted };
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		console.error(`[backup] ❌ Gagal membuat backup: ${errorMsg}`);
		return { success: false, error: errorMsg };
	}
}

function cleanOldBackups(dir: string): void {
	try {
		const files = readdirSync(dir);
		const now = Date.now();
		let deletedCount = 0;

		for (const file of files) {
			if (!file.startsWith('app-') || !file.endsWith('.db')) continue;
			const fullPath = join(dir, file);
			const stat = statSync(fullPath);
			const ageDays = (now - stat.mtimeMs) / MS_PER_DAY;

			if (ageDays > RETENTION_DAYS) {
				unlinkSync(fullPath);
				deletedCount++;
				console.log(`[backup] 🧹 Menghapus backup kedaluwarsa (${ageDays.toFixed(1)} hari lalu): ${file}`);
			}
		}

		if (deletedCount > 0) {
			console.log(`[backup] 🧹 Total ${deletedCount} backup lama dibersihkan (retensi ${RETENTION_DAYS} hari).`);
		}
	} catch (err) {
		console.warn(`[backup] ⚠️ Gagal membersihkan backup lama:`, err);
	}
}

// Jalankan otomatis bila dipanggil langsung via CLI
if (import.meta.main) {
	const res = performBackup();
	process.exit(res.success ? 0 : 1);
}
