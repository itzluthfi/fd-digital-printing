/**
 * Status kesiapan kanal notifikasi — untuk widget dashboard.
 * Tidak pernah mengembalikan nilai token/key, hanya status boolean.
 */
import { emailConfigured } from '../email';
import { telegramConfigured } from './telegram';
import { whatsappConfigured } from './whatsapp';

/** Cache hasil getMe Telegram 5 menit agar dashboard tidak memanggil API tiap load. */
import { getJson } from '../http';

let telegramCache: { at: number; ok: boolean } | null = null;

async function telegramLive(): Promise<boolean> {
	if (!telegramConfigured()) return false;
	const now = Date.now();
	if (telegramCache && now - telegramCache.at < 5 * 60 * 1000) return telegramCache.ok;
	try {
		const { status } = await getJson(
			`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getMe`,
			8000
		);
		const ok = status === 200;
		telegramCache = { at: now, ok };
		return ok;
	} catch {
		telegramCache = { at: now, ok: false };
		return false;
	}
}

export type KanalStatus = {
	/** 'ok' = terhubung & bisa dipakai, 'belum' = belum terkonfigurasi / tidak live */
	telegram: 'ok' | 'belum';
	email: 'ok' | 'belum';
	whatsapp: 'ok' | 'belum';
};

export async function getKanalStatus(): Promise<KanalStatus> {
	const [tg] = await Promise.all([telegramLive()]);
	return {
		telegram: tg ? 'ok' : 'belum',
		email: emailConfigured() ? 'ok' : 'belum',
		whatsapp: whatsappConfigured() ? 'ok' : 'belum'
	};
}
