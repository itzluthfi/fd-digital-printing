/**
 * Notifikasi Telegram FD Digital Printing via Bot API.
 *
 * Token dibaca dari env TELEGRAM_BOT_TOKEN — jangan pernah hardcode token di kode.
 * Bot API Telegram gratis tanpa limit pengiriman.
 *
 * Setup: buat bot di @BotFather, simpan token di env, pelanggan /start ke bot
 * supaya kita dapat chat_id mereka.
 */

/** Cek apakah notifikasi Telegram sudah bisa dipakai (token tersedia). */
export function telegramConfigured(): boolean {
	return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

/**
 * Kirim pesan teks ke satu chat_id.
 * @returns true jika Telegram menerima pesan (ok:true), false jika gagal / token belum diset.
 */
import { postJson } from '../http';

export async function sendTelegram(chatId: string | number, text: string): Promise<boolean> {
	const token = process.env.TELEGRAM_BOT_TOKEN;
	if (!token) {
		console.warn('[telegram] TELEGRAM_BOT_TOKEN belum diset — pesan dilewati.');
		return false;
	}

	const { status, text: raw } = await postJson(
		`https://api.telegram.org/bot${token}/sendMessage`,
		{ chat_id: chatId, text, parse_mode: 'HTML' }
	);

	if (status !== 200) {
		console.error('[telegram] gagal kirim:', raw.slice(0, 200));
		return false;
	}
	return true;
}
