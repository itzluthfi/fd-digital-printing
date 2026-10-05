/**
 * Satu pintu notifikasi pelanggan: WA + Telegram + email.
 * Setiap channel hanya dipakai kalau datanya tersedia & terkonfigurasi.
 * Gagal di satu channel tidak menggagalkan yang lain.
 * Setiap percobaan dicatat ke tabel notification_logs (lihat halaman /notifikasi).
 */
import { emailConfigured, sendEmail, emailLayout } from '../email';
import { telegramConfigured, sendTelegram } from './telegram';
import { sendWhatsApp, whatsappConfigured } from './whatsapp';
import { logNotification, type NotifChannel, type NotifStatus } from './log';

export type NotifyTarget = {
	name?: string | null;
	phone?: string | null;
	email?: string | null;
	telegramChatId?: string | null;
};

export type NotifyMessage = {
	/** Judul singkat — jadi subjek email juga */
	title: string;
	/** Isi teks polos (WA/Telegram) */
	text: string;
	/** Isi HTML opsional (email). Default: text dibungkus layout */
	html?: string;
};

export type NotifyOpts = {
	/** Diisi pemanggil bila notifikasi terkait satu order (untuk log). */
	orderId?: number | null;
};

export async function notifyCustomer(
	target: NotifyTarget,
	message: NotifyMessage,
	opts?: NotifyOpts
): Promise<Record<string, boolean>> {
	const hasil: Record<string, boolean> = {};
	const sapaan = target.name ? `${target.name}, ` : '';
	const orderId = opts?.orderId ?? null;

	async function catat(
		channel: NotifChannel,
		tujuan: string,
		status: NotifStatus,
		error?: string | null
	): Promise<void> {
		await logNotification({
			channel,
			target: tujuan,
			customerName: target.name ?? null,
			orderId,
			title: message.title,
			status,
			error: error ?? null
		});
	}

	/* ---- Telegram ---- */
	if (!target.telegramChatId) {
		await catat('telegram', '-', 'skipped', 'ID chat Telegram pelanggan kosong');
	} else if (!telegramConfigured()) {
		await catat('telegram', target.telegramChatId, 'skipped', 'TELEGRAM_BOT_TOKEN belum diset');
	} else {
		try {
			const ok = await sendTelegram(
				target.telegramChatId,
				`<b>${message.title}</b>\n${sapaan}${message.text}`
			);
			hasil.telegram = ok;
			await catat('telegram', target.telegramChatId, ok ? 'sent' : 'failed', ok ? null : 'Telegram API menolak pesan');
		} catch (e) {
			hasil.telegram = false;
			await catat('telegram', target.telegramChatId, 'failed', e instanceof Error ? e.message : 'Gagal kirim Telegram');
		}
	}

	/* ---- WhatsApp ---- */
	if (!target.phone) {
		await catat('whatsapp', '-', 'skipped', 'Nomor telepon pelanggan kosong');
	} else if (!whatsappConfigured()) {
		await catat('whatsapp', target.phone, 'skipped', 'Provider WA belum aktif (WA_PROVIDER=off)');
	} else {
		try {
			const ok = await sendWhatsApp(target.phone, `*${message.title}*\n${sapaan}${message.text}`);
			hasil.whatsapp = ok;
			await catat('whatsapp', target.phone, ok ? 'sent' : 'failed', ok ? null : 'Gateway WA menolak pesan');
		} catch (e) {
			hasil.whatsapp = false;
			await catat('whatsapp', target.phone, 'failed', e instanceof Error ? e.message : 'Gagal kirim WA');
		}
	}

	/* ---- Email ---- */
	if (!target.email) {
		await catat('email', '-', 'skipped', 'Email pelanggan kosong');
	} else if (!emailConfigured()) {
		await catat('email', target.email, 'skipped', 'RESEND_API_KEY belum diset (mode dev: email hanya dicetak ke terminal)');
		// Tetap kirim via jalur dev agar alur tidak berubah (dicetak ke terminal)
		try {
			await sendEmail({
				to: target.email,
				subject: `${message.title} — FD Digital Printing`,
				html: emailLayout(message.title, message.html ?? `<p>${sapaan}${message.text}</p>`),
				text: `${sapaan}${message.text}`
			});
			hasil.email = true;
		} catch {
			hasil.email = false;
		}
	} else {
		try {
			const res = await sendEmail({
				to: target.email,
				subject: `${message.title} — FD Digital Printing`,
				html: emailLayout(message.title, message.html ?? `<p>${sapaan}${message.text}</p>`),
				text: `${sapaan}${message.text}`
			});
			const err = (res as { error?: unknown })?.error;
			const ok = !err;
			hasil.email = ok;
			await catat(
				'email',
				target.email,
				ok ? 'sent' : 'failed',
				ok ? null : `Resend: ${JSON.stringify(err).slice(0, 200)}`
			);
		} catch (e) {
			hasil.email = false;
			await catat('email', target.email, 'failed', e instanceof Error ? e.message : 'Gagal kirim email');
		}
	}

	return hasil;
}
