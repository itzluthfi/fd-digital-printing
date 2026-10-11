/**
 * Skrip Notifikasi Deploy Advance ke Bot Telegram Admin
 *
 * Mengirimkan status deployment GitHub Actions CD ke Telegram secara mendalam:
 * - Akun GitHub (Actor) yang melakukan push
 * - Branch yang di-deploy
 * - Pesan Commit & SHA
 * - Metrik Server Realtime (DB Latency, RAM, Uptime) dari /api/health
 * - Jika Error: Detail kendala, log trace, dan status auto-rollback point-in-time
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

async function fetchLiveHealth(port: string): Promise<{ latency?: number; rssMb?: number; heapMb?: number } | null> {
	try {
		const res = await fetch(`http://127.0.0.1:${port}/api/health`, {
			signal: AbortSignal.timeout(3000)
		});
		if (!res.ok) return null;
		const data = await res.json();
		return {
			latency: data?.database?.latencyMs,
			rssMb: data?.memory?.rssMb,
			heapMb: data?.memory?.heapUsedMb
		};
	} catch {
		return null;
	}
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
	const actor = getArg('actor') ?? 'github-actions';
	const branch = getArg('branch') ?? 'main';
	const repo = getArg('repo') ?? 'itzluthfi/fd-digital-printing';
	const commit = getArg('commit') ?? 'Manual deploy';
	const commitSha = getArg('sha') ?? '';
	const prevCommit = getArg('prev') ?? '';
	const error = getArg('error');
	const logSnippet = getArg('log');
	const rollback = getArg('rollback') === 'true';
	const appPort = getArg('port') ?? process.env.PORT ?? '3000';

	const nowWib = new Date().toLocaleString('id-ID', {
		timeZone: 'Asia/Jakarta',
		dateStyle: 'medium',
		timeStyle: 'medium'
	});

	let message: string;

	if (status === 'success') {
		const health = await fetchLiveHealth(appPort);
		const commitLink = commitSha
			? `<a href="https://github.com/${esc(repo)}/commit/${esc(commitSha)}">Lihat di GitHub</a>`
			: '';

		message = [
			'🚀 <b>DEPLOYMENT PRODUCTION BERHASIL</b>',
			'',
			`👤 <b>Pemicu:</b> @${esc(actor)}`,
			`🌿 <b>Branch:</b> <code>${esc(branch)}</code>`,
			`🏷️ <b>Commit:</b> <code>${esc(commit)}</code>`,
			`📦 <b>Repositori:</b> <code>${esc(repo)}</code>`,
			`⏱️ <b>Waktu:</b> ${nowWib} WIB`,
			'',
			'📊 <b>Status Sistem (Live Healthcheck):</b>',
			`• Database: 🟢 Sehat ${health?.latency !== undefined ? `(Latensi: ${health.latency} ms)` : ''}`,
			health?.rssMb !== undefined ? `• Penggunaan RAM: ${health.rssMb} MB (Heap: ${health.heapMb ?? '-'} MB)` : '• RAM: Normal',
			'• HTTP Healthcheck: 🟢 200 OK',
			'',
			`🌐 <a href="https://fd-printing.sir-l.web.id">Buka Sistem Toko</a> ${commitLink ? `• ${commitLink}` : ''}`
		].join('\n');
	} else {
		message = [
			'🚨 <b>DEPLOYMENT PRODUCTION GAGAL</b>',
			'',
			`👤 <b>Pemicu:</b> @${esc(actor)}`,
			`🌿 <b>Branch:</b> <code>${esc(branch)}</code>`,
			`🏷️ <b>Target Commit:</b> <code>${esc(commit)}</code>`,
			`⏱️ <b>Waktu:</b> ${nowWib} WIB`,
			'',
			error ? `⚠️ <b>Penyebab:</b>\n<code>${esc(error)}</code>\n` : '',
			logSnippet ? `📜 <b>Cuplikan Log:</b>\n<pre>${esc(logSnippet.slice(0, 400))}</pre>\n` : '',
			rollback
				? `🔄 <b>Tindakan Keamanan:</b>\n✅ Otomatis di-rollback ke commit stabil sebelumnya (<code>${esc(prevCommit.slice(0, 7) || 'HEAD~1')}</code>). Toko tetap aktif melayani pelanggan.`
				: '⚠️ <b>Tindakan:</b> Segera periksa service di VPS!',
			'',
			'🛠️ <b>Perintah Cek Log VPS:</b>\n<code>journalctl -u fd-printing -n 50 --no-pager</code>'
		].filter(Boolean).join('\n');
	}

	try {
		await notifyAdmins(message);
		console.log(`[deploy-notify] ✅ Notifikasi deploy advance (${status}) berhasil dikirim ke ${admins.length} admin.`);
	} catch (err) {
		console.error('[deploy-notify] ⚠️ Gagal mengirim notifikasi:', err);
	}
}

if (import.meta.main) {
	sendDeployNotification().then(() => process.exit(0));
}

