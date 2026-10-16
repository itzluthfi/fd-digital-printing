/**
 * Pembantu rendah Bot API Telegram untuk bot admin FD Digital Printing.
 * Token dibaca dari env TELEGRAM_BOT_TOKEN — jangan pernah hardcode.
 */
import { postJson } from '../http';

function token(): string | undefined {
	return process.env.TELEGRAM_BOT_TOKEN;
}

export function botConfigured(): boolean {
	return Boolean(token());
}

/** Panggil satu method Bot API. Mengembalikan hasil `result` atau null bila gagal. */
export async function botApi<T = unknown>(
	method: string,
	params: Record<string, unknown> = {}
): Promise<T | null> {
	const t = token();
	if (!t) {
		console.warn('[bot] TELEGRAM_BOT_TOKEN belum diset.');
		return null;
	}
	try {
		const { status, text: raw } = await postJson(
			`https://api.telegram.org/bot${t}/${method}`,
			params
		);
		if (status !== 200) {
			console.error('[bot] HTTP', status, method, raw.slice(0, 160));
			return null;
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let data: any = null;
		try {
			data = JSON.parse(raw);
		} catch {
			console.error('[bot] respons bukan JSON:', method, raw.slice(0, 160));
			return null;
		}
		if (!data?.ok) {
			console.error('[bot] API gagal:', method, String(data?.description ?? raw).slice(0, 200));
			return null;
		}
		return (data.result ?? null) as T | null;
	} catch (e) {
		console.error('[bot] network error:', method, String(e).slice(0, 200));
		return null;
	}
}

export type InlineKeyboard = { text: string; callback_data?: string; url?: string }[][];

export async function botSendMessage(
	chatId: number | string,
	text: string,
	keyboard?: InlineKeyboard,
	threadId?: number
): Promise<boolean> {
	const params: Record<string, unknown> = {
		chat_id: chatId,
		text,
		parse_mode: 'HTML',
		disable_web_page_preview: true
	};
	if (threadId) params.message_thread_id = threadId;
	if (keyboard) params.reply_markup = { inline_keyboard: keyboard };
	return (await botApi('sendMessage', params)) !== null;
}

export async function botEditMessage(
	chatId: number | string,
	messageId: number,
	text: string,
	keyboard?: InlineKeyboard
): Promise<boolean> {
	const params: Record<string, unknown> = {
		chat_id: chatId,
		message_id: messageId,
		text,
		parse_mode: 'HTML',
		disable_web_page_preview: true
	};
	if (keyboard) params.reply_markup = { inline_keyboard: keyboard };
	return (await botApi('editMessageText', params)) !== null;
}

export async function botSendPhoto(
	chatId: number | string,
	photo: string,
	caption?: string,
	keyboard?: InlineKeyboard
): Promise<boolean> {
	const params: Record<string, unknown> = {
		chat_id: chatId,
		photo,
		disable_web_page_preview: true
	};
	if (caption) {
		params.caption = caption;
		params.parse_mode = 'HTML';
	}
	if (keyboard) params.reply_markup = { inline_keyboard: keyboard };
	return (await botApi('sendPhoto', params)) !== null;
}

export async function botSendDocument(
	chatId: number | string,
	filePath: string,
	caption?: string
): Promise<boolean> {
	const t = token();
	if (!t) return false;

	try {
		const { openAsBlob } = await import('node:fs');
		const blob = await openAsBlob(filePath);
		const fileName = filePath.split(/[/\\]/).pop() || 'backup.sqlite';

		const formData = new FormData();
		formData.append('chat_id', String(chatId));
		formData.append('document', blob, fileName);
		if (caption) {
			formData.append('caption', caption);
			formData.append('parse_mode', 'HTML');
		}

		const res = await fetch(`https://api.telegram.org/bot${t}/sendDocument`, {
			method: 'POST',
			body: formData
		});
		return res.ok;
	} catch (err) {
		console.error('[bot] botSendDocument error:', err);
		return false;
	}
}

export async function botEditCaption(
	chatId: number | string,
	messageId: number,
	caption: string,
	keyboard?: InlineKeyboard
): Promise<boolean> {
	const params: Record<string, unknown> = {
		chat_id: chatId,
		message_id: messageId,
		caption,
		parse_mode: 'HTML'
	};
	if (keyboard) params.reply_markup = { inline_keyboard: keyboard };
	return (await botApi('editMessageCaption', params)) !== null;
}

export async function botDeleteMessage(chatId: number | string, messageId: number): Promise<boolean> {
	return (await botApi('deleteMessage', { chat_id: chatId, message_id: messageId })) !== null;
}

export async function botAnswerCallback(callbackId: string, text?: string, showAlert = false): Promise<void> {
	await botApi('answerCallbackQuery', { callback_query_id: callbackId, text: text ?? '', show_alert: showAlert });
}

/** Escape teks agar aman dipakai dalam parse_mode HTML. */
export function esc(s: string | null | undefined): string {
	return String(s ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

export async function botSendMessageRaw(
	chatId: number | string,
	text: string,
	keyboard?: InlineKeyboard
): Promise<{ message_id: number } | null> {
	const params: Record<string, unknown> = {
		chat_id: chatId,
		text,
		parse_mode: 'HTML',
		disable_web_page_preview: true
	};
	if (keyboard) params.reply_markup = { inline_keyboard: keyboard };
	return await botApi<{ message_id: number }>('sendMessage', params);
}

export async function botPinChatMessage(
	chatId: number | string,
	messageId: number,
	disableNotification = false
): Promise<boolean> {
	const res = await botApi('pinChatMessage', {
		chat_id: chatId,
		message_id: messageId,
		disable_notification: disableNotification
	});
	return res !== null;
}

export async function botCreateForumTopic(
	chatId: number | string,
	name: string,
	iconColor?: number
): Promise<{ message_thread_id: number; name: string } | null> {
	const params: Record<string, unknown> = {
		chat_id: chatId,
		name
	};
	if (iconColor) params.icon_color = iconColor;
	return await botApi<{ message_thread_id: number; name: string }>('createForumTopic', params);
}

import {
	getSettingSync,
	sanitizeTelegramIds,
	getTelegramStaffListSync,
	getTelegramStaffRoleSync,
	type TelegramStaffRole
} from '../settings';

/**
 * Daftar ID Telegram admin & kasir (yang berhak melihat data finansial & order).
 */
export function adminIds(): string[] {
	const staffList = getTelegramStaffListSync();
	const staffAdminIds = staffList.filter((s) => s.role === 'owner' || s.role === 'kasir').map((s) => s.id);

	const dbIds = getSettingSync('telegram_admin_ids');
	const envIds = process.env.ADMIN_TELEGRAM_IDS;
	const legacyIds = sanitizeTelegramIds([dbIds, envIds].filter(Boolean).join(','));

	return Array.from(new Set([...staffAdminIds, ...legacyIds]));
}

/**
 * Daftar ID Telegram khusus Owner.
 */
export function ownerIds(): string[] {
	const staffList = getTelegramStaffListSync();
	const owners = staffList.filter((s) => s.role === 'owner').map((s) => s.id);
	if (owners.length > 0) return Array.from(new Set(owners));
	// Fallback ke daftar admin jika belum ada staf spesifik role owner
	return adminIds();
}

/** Cek apakah user adalah Owner atau Kasir */
export function isAdmin(tgId: number | string): boolean {
	const role = getTelegramStaffRoleSync(tgId);
	if (role === 'owner' || role === 'kasir') return true;
	return adminIds().includes(String(tgId));
}

/** Cek apakah user adalah Staf (Owner, Kasir, atau Operator Produksi) */
export function isStaff(tgId: number | string): boolean {
	const role = getTelegramStaffRoleSync(tgId);
	return role !== null || isAdmin(tgId);
}

/** Ambil role staf yang terdaftar */
export function getStaffRole(tgId: number | string): TelegramStaffRole | null {
	const role = getTelegramStaffRoleSync(tgId);
	if (role) return role;
	if (isAdmin(tgId)) return 'owner';
	return null;
}

export type NotifyOptions = {
	keyboard?: InlineKeyboard;
	pin?: boolean;
	orderId?: number;
};

/**
 * Kirim pesan push ke semua admin dan grup tim internal (fire-and-forget).
 * Mendukung inline keyboard aksi cepat dan auto-pin pesan penting di grup tim.
 */
export async function notifyAdmins(text: string, options?: NotifyOptions): Promise<void> {
	if (!botConfigured()) return;
	const ids = adminIds();
	const adminGroup = getSettingSync('telegram_admin_group_id')?.trim();
	const autoPin = getSettingSync('telegram_feature_auto_pin') !== '0';
	const showGroupButtons = getSettingSync('telegram_feature_group_buttons') !== '0';

	// 1. Kirim ke admin pribadi
	if (ids.length > 0) {
		await Promise.allSettled(ids.map((id) => botSendMessage(id, text, options?.keyboard)));
	}

	// 2. Kirim ke Grup Tim jika dikonfigurasi (hindari dobel jika ID grup sudah masuk daftar admin)
	if (adminGroup && !ids.includes(adminGroup)) {
		const groupKeyboard = showGroupButtons ? options?.keyboard : undefined;
		const res = await botSendMessageRaw(adminGroup, text, groupKeyboard);
		if (res?.message_id && options?.pin && autoPin) {
			await botPinChatMessage(adminGroup, res.message_id, true).catch(() => {});
		}
	}
}

export type BotCommandItem = {
	command: string;
	description: string;
};

/**
 * Mendaftarkan menu perintah (quick access keyboard saat ketik '/') ke Telegram Bot API
 * dengan Command Scope terpisah per target:
 * 1. Scope Default: Pengguna umum / pembeli
 * 2. Scope Grup Pelanggan: Tanya harga, info toko, bantuan, lacak pesanan (jika diisi)
 * 3. Scope Grup Tim: Antrean cetak, order, info grup
 * 4. Scope Staf Personal:
 *    - Owner & Kasir: Antrean, Order, Laporan Omzet, Piutang
 *    - Operator: Antrean, Order, Bantuan (Laporan omzet disembunyikan sepenuhnya!)
 */
export async function syncTelegramBotCommands(): Promise<{ ok: boolean; message: string }> {
	if (!botConfigured()) {
		return { ok: false, message: 'Bot Telegram belum dikonfigurasi (token kosong).' };
	}

	try {
		// 1. Menu Default (Umum / Pelanggan Baru di Chat Pribadi)
		const publicCommands: BotCommandItem[] = [
			{ command: 'start', description: 'Mulai & Buka Menu Utama' },
			{ command: 'harga', description: 'Katalog Layanan & Daftar Tarif' },
			{ command: 'lokasi', description: 'Alamat Toko & Jam Operasional' },
			{ command: 'bantuan', description: 'Panduan Order & Kontak Admin' }
		];
		await botApi('setMyCommands', {
			commands: publicCommands,
			scope: { type: 'default' }
		});

		// 2. Menu di Grup Diskusi / Komunitas Pelanggan (jika ID grup terdaftar)
		const discGroupId = getSettingSync('telegram_discussion_group_id')?.trim();
		if (discGroupId && /^-?\d+$/.test(discGroupId)) {
			const groupCustomerCommands: BotCommandItem[] = [
				{ command: 'harga', description: 'Info Daftar Harga Cetak' },
				{ command: 'lokasi', description: 'Alamat Toko & Jam Buka' },
				{ command: 'status', description: 'Cek Status Order (Ketik: /status KODE)' },
				{ command: 'bantuan', description: 'Bantuan & Cara Pesan' }
			];
			await botApi('setMyCommands', {
				commands: groupCustomerCommands,
				scope: { type: 'chat', chat_id: discGroupId }
			});
		}

		// 3. Menu di Grup Tim Internal (Operator & Kasir)
		const adminGroupId = getSettingSync('telegram_admin_group_id')?.trim();
		if (adminGroupId && /^-?\d+$/.test(adminGroupId)) {
			const teamGroupCommands: BotCommandItem[] = [
				{ command: 'antrean', description: 'Lihat Antrean Produksi Cetak' },
				{ command: 'order', description: 'Cari & Update Status Pesanan' },
				{ command: 'id', description: 'Cek ID Chat / ID Staf' },
				{ command: 'bantuan', description: 'Panduan Perintah Tim' }
			];
			await botApi('setMyCommands', {
				commands: teamGroupCommands,
				scope: { type: 'chat', chat_id: adminGroupId }
			});
		}

		// 4. Menu Per Staf di Chat Pribadi (Berdasarkan Role)
		const staffList = getTelegramStaffListSync();
		for (const staff of staffList) {
			if (!staff.id || !/^\d+$/.test(staff.id)) continue;

			if (staff.role === 'operator') {
				// Operator Produksi: HANYA fokus cetak. Menu omzet & laporan DISINGKIRKAN dari keyboard!
				const operatorCommands: BotCommandItem[] = [
					{ command: 'antrean', description: 'Antrean Pesanan Siap Cetak' },
					{ command: 'order', description: 'Update Status Produksi' },
					{ command: 'id', description: 'Cek ID Telegram Saya' },
					{ command: 'bantuan', description: 'Panduan Operator Mesin' }
				];
				await botApi('setMyCommands', {
					commands: operatorCommands,
					scope: { type: 'chat', chat_id: staff.id }
				});
			} else if (staff.role === 'owner') {
				// Owner: Menu Lengkap Finansial + ChatOps Deploy ke Production
				const ownerCommands: BotCommandItem[] = [
					{ command: 'antrean', description: 'Antrean Pesanan Cetak' },
					{ command: 'order', description: 'Detail Pesanan & Bukti' },
					{ command: 'laporan', description: 'Rekap Omzet & Kas Hari Ini' },
					{ command: 'piutang', description: 'Daftar Tagihan Pelanggan' },
					{ command: 'rilis', description: 'ChatOps Rilis dev ke Production' },
					{ command: 'backup_db', description: 'Snapshot DB & Kirim Dokumen SQLite' },
					{ command: 'id', description: 'Cek ID Telegram Saya' },
					{ command: 'bantuan', description: 'Bantuan & Perintah Owner' }
				];
				await botApi('setMyCommands', {
					commands: ownerCommands,
					scope: { type: 'chat', chat_id: staff.id }
				});
			} else {
				// Kasir: Menu Operasional & Laporan Kas Toko (Tanpa ChatOps Rilis)
				const kasirCommands: BotCommandItem[] = [
					{ command: 'antrean', description: 'Antrean Pesanan Cetak' },
					{ command: 'order', description: 'Detail Pesanan & Bukti' },
					{ command: 'laporan', description: 'Rekap Omzet & Kas Hari Ini' },
					{ command: 'piutang', description: 'Daftar Tagihan Pelanggan' },
					{ command: 'id', description: 'Cek ID Telegram Saya' },
					{ command: 'bantuan', description: 'Bantuan & Perintah Kasir' }
				];
				await botApi('setMyCommands', {
					commands: kasirCommands,
					scope: { type: 'chat', chat_id: staff.id }
				});
			}
		}

		return { ok: true, message: 'Daftar menu slash (/) berhasil disinkronkan ke Telegram per role & grup.' };
	} catch (err) {
		console.error('[bot] syncTelegramBotCommands error:', err);
		return { ok: false, message: 'Gagal sinkronisasi menu Telegram: ' + String(err) };
	}
}

