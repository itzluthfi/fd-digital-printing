/**
 * Skrip Notifikasi Deploy ke Bot Telegram Admin
 *
 * Dipanggil oleh GitHub Actions CD / pipeline deploy setelah selesai proses update.
 *
 * Penggunaan CLI:
 *   bun src/lib/server/jobs/notify-deploy.ts --status=success --commit="584b9da - feat: mascot Dipi"
 *   bun src/lib/server/jobs/notify-deploy.ts --status=failed --commit="abc1234 - fix: bug" --error="Healthcheck timeout"
 */
import { adminIds, botConfigured, esc, notifyAdmins } from '../bot/api';

function getArg(flag: string): string | undefined {
	const prefix = `--${flag}=`;
	const match = process.argv.find((arg) => arg.startsWith(prefix));
	if (match) return match.slice(prefix.length).trim();
	const idx = process.argv.indexOf(`--${flag}`);
	if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1].trim();
	return undefined;
}

export async function sendDeployNotification(): Promise<void> {
	if (!botConfigured()) {
		console.log('[deploy-notify] ℹ️ TELEGRAM_BOT_TOKEN belum diset, notifikasi dilewati.');
		return;
	}

	const admins = adminIds();
	if (admins.length === 0) {
		console.log('[deploy-notify] ℹ️ ADMIN_TELEGRAM_IDS kosong, notifikasi dilewati.');
		return;
	}

	const status = getArg('status') ?? 'success';
	const commit = getArg('commit') ?? 'Manual deploy';
	const error = getArg('error');
	const rollback = getArg('rollback') === 'true';

	const nowWib = new Date().toLocaleString('id-ID', {
		timeZone: 'Asia/Jakarta',
		dateStyle: 'medium',
		timeStyle: 'medium'
	});

	let message: string;

	if (status === 'success') {
		message = [
			'🚀 <b>DEPLOY PRODUCTION BERHASIL</b>',
			'',
			`🏷️ <b>Commit:</b> <code>${esc(commit)}</code>`,
			`⏱️ <b>Waktu:</b> ${nowWib} WIB`,
			'✅ <b>Healthcheck:</b> Server & Database Healthy',
			'',
			'🌐 <a href="https://fd.sir-l.web.id">Buka Sistem Toko</a>'
		].join('\n');
	} else {
		message = [
			'❌ <b>DEPLOY PRODUCTION GAGAL</b>',
			'',
			`🏷️ <b>Target Commit:</b> <code>${esc(commit)}</code>`,
			`⏱️ <b>Waktu:</b> ${nowWib} WIB`,
			error ? `⚠️ <b>Error:</b> <code>${esc(error)}</code>` : '',
			rollback ? '🔄 <b>Tindakan:</b> Otomatis di-rollback ke commit sebelumnya!' : '⚠️ <b>Tindakan:</b> Periksa status service di VPS!',
			'',
			'Harap segera cek log server: <code>journalctl -u fd-printing -n 50</code>'
		].filter(Boolean).join('\n');
	}

	try {
		await notifyAdmins(message);
		console.log(`[deploy-notify] ✅ Notifikasi deploy (${status}) berhasil dikirim ke ${admins.length} admin.`);
	} catch (err) {
		console.error('[deploy-notify] ⚠️ Gagal mengirim notifikasi:', err);
	}
}

if (import.meta.main) {
	sendDeployNotification().then(() => process.exit(0));
}
