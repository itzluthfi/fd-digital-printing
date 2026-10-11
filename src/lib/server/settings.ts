/**
 * Pengaturan key-value toko (tabel settings).
 * Menyimpan konfigurasi dinamis: QRIS toko, integrasi Telegram, dan preferensi sistem.
 */
import { existsSync } from 'node:fs';
import { eq } from 'drizzle-orm';

import { db, sqlite } from './db';
import { settings } from './db/schema';

export async function getSetting(key: string): Promise<string | null> {
	const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
	return row?.value ?? null;
}

/** Pembacaan sinkron super-cepat via bun:sqlite (berguna saat pemrosesan webhook & bot callback). */
export function getSettingSync(key: string): string | null {
	try {
		const row = sqlite.query<{ value: string | null }, [string]>('SELECT value FROM settings WHERE key = ? LIMIT 1').get(key);
		return row?.value ?? null;
	} catch {
		return null;
	}
}

export async function setSetting(key: string, value: string | null): Promise<void> {
	await db
		.insert(settings)
		.values({ key, value, updatedAt: new Date().toISOString() })
		.onConflictDoUpdate({
			target: settings.key,
			set: { value, updatedAt: new Date().toISOString() }
		});
}

/** Gambar QRIS statis toko — diunggah owner lewat halaman Pengaturan. */
export const QRIS_FILE = 'static/uploads/qris.png';
export const QRIS_URL = '/uploads/qris.png';

export function qrisTersedia(): boolean {
	return existsSync(QRIS_FILE);
}

/* ------------------------------------------------------------------ */
/* Telegram & Komunitas Settings                                      */
/* ------------------------------------------------------------------ */

export type TelegramSettings = {
	adminIds: string[];
	adminGroupId: string;
	publicChannelId: string;
	discussionGroupId: string;
	featureGroupButtons: boolean;
	featureAutoPin: boolean;
	featureAutoWelcome: boolean;
	welcomeText: string;
};

export const DEFAULT_WELCOME_TEXT =
	'Halo <b>{name}</b>, selamat datang di Komunitas FD Digital Printing! 👋\n' +
	'Silakan cek daftar harga & portofolio di pesan tersemat (pinned), atau langsung tanyakan kebutuhan cetakmu di sini ya!';

/**
 * Mengambil konfigurasi Telegram toko.
 * Mengutamakan nilai di database (settings), dengan fallback ke environment variables.
 */
export async function getTelegramSettings(): Promise<TelegramSettings> {
	const dbAdminIds = await getSetting('telegram_admin_ids');
	const adminGroupId = (await getSetting('telegram_admin_group_id')) ?? '';
	const publicChannelId = (await getSetting('telegram_public_channel_id')) ?? '';
	const discussionGroupId = (await getSetting('telegram_discussion_group_id')) ?? '';

	const featureGroupButtons = (await getSetting('telegram_feature_group_buttons')) ?? '1';
	const featureAutoPin = (await getSetting('telegram_feature_auto_pin')) ?? '1';
	const featureAutoWelcome = (await getSetting('telegram_feature_auto_welcome')) ?? '1';
	const welcomeText = (await getSetting('telegram_welcome_text')) ?? DEFAULT_WELCOME_TEXT;

	// Parse admin IDs: gabungkan database + env, lalu bersihkan dan deduplikasi
	const rawAdminString = [dbAdminIds, process.env.ADMIN_TELEGRAM_IDS].filter(Boolean).join(',');
	const adminIds = sanitizeTelegramIds(rawAdminString);

	return {
		adminIds,
		adminGroupId: adminGroupId.trim(),
		publicChannelId: publicChannelId.trim(),
		discussionGroupId: discussionGroupId.trim(),
		featureGroupButtons: featureGroupButtons !== '0',
		featureAutoPin: featureAutoPin !== '0',
		featureAutoWelcome: featureAutoWelcome !== '0',
		welcomeText
	};
}

/** Membersihkan string daftar ID Telegram (koma/spasi/baris baru) menjadi array unik */
export function sanitizeTelegramIds(input: string | null | undefined): string[] {
	if (!input) return [];
	const items = input
		.split(/[\s,\n\r]+/)
		.map((s) => s.trim())
		.filter((s) => /^-?\d+$/.test(s)); // ID berupa angka positif atau negatif (grup)
	return Array.from(new Set(items));
}
