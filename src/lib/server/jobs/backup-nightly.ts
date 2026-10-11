/**
 * Nightly Database Backup Job
 * Dijalankan setiap malam via cron (misal jam 02:00 WIB) atau systemd timer.
 * Membuat snapshot VACUUM INTO dan mengirimkan file dokumen SQLite ke Telegram Owner.
 */
import { sendDatabaseBackupToTelegram } from '../backup';
import { pingHeartbeat } from '../settings';

async function main() {
	console.log(`[cron:backup] Memulai proses backup database SQLite pada ${new Date().toISOString()}...`);
	const res = await sendDatabaseBackupToTelegram();
	if (res.success) {
		console.log(`[cron:backup] SUKSES: ${res.message}`);
		await pingHeartbeat();
		process.exit(0);
	} else {
		console.error(`[cron:backup] GAGAL: ${res.message}`);
		process.exit(1);
	}
}

main().catch((err) => {
	console.error('[cron:backup] Fatal error:', err);
	process.exit(1);
});
