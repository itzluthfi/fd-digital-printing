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

export type TelegramStaffRole = 'owner' | 'kasir' | 'operator';

export type TelegramStaffMember = {
	id: string;
	name: string;
	role: TelegramStaffRole;
};

export type TelegramSettings = {
	adminIds: string[];
	staffList: TelegramStaffMember[];
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
 * Mengambil daftar staf Telegram dari database/env secara sinkron.
 * Fallback jika staff_list JSON kosong: gunakan daftar telegram_admin_ids dengan role 'owner'.
 */
export function getTelegramStaffListSync(): TelegramStaffMember[] {
	const rawJson = getSettingSync('telegram_staff_list');
	if (rawJson) {
		try {
			const parsed = JSON.parse(rawJson);
			if (Array.isArray(parsed) && parsed.length > 0) {
				return parsed
					.filter((item) => item && typeof item.id === 'string' && /^-?\d+$/.test(item.id))
					.map((item) => ({
						id: String(item.id).trim(),
						name: String(item.name || 'Staf').trim(),
						role: (['owner', 'kasir', 'operator'].includes(item.role) ? item.role : 'operator') as TelegramStaffRole
					}));
			}
		} catch {
			// ignore JSON error, lanjut ke fallback
		}
	}

	// Fallback ke daftar admin lama
	const dbAdminIds = getSettingSync('telegram_admin_ids');
	const envAdminIds = process.env.ADMIN_TELEGRAM_IDS;
	const legacyIds = sanitizeTelegramIds([dbAdminIds, envAdminIds].filter(Boolean).join(','));

	return legacyIds.map((id, index) => ({
		id,
		name: index === 0 ? 'Owner / Utama' : `Admin #${index + 1}`,
		role: 'owner' as TelegramStaffRole
	}));
}

/** Mendapatkan role staf Telegram berdasarkan chat/user ID */
export function getTelegramStaffRoleSync(tgId: number | string): TelegramStaffRole | null {
	const idStr = String(tgId).trim();
	const staffList = getTelegramStaffListSync();
	const found = staffList.find((s) => s.id === idStr);
	return found ? found.role : null;
}

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

	const staffList = getTelegramStaffListSync();
	const adminIds = staffList.filter((s) => s.role === 'owner' || s.role === 'kasir').map((s) => s.id);

	return {
		adminIds,
		staffList,
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
