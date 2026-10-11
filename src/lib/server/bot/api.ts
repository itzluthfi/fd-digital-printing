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
	keyboard?: InlineKeyboard
): Promise<boolean> {
	const params: Record<string, unknown> = {
		chat_id: chatId,
		text,
		parse_mode: 'HTML',
		disable_web_page_preview: true
	};
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

import { getSettingSync, sanitizeTelegramIds } from '../settings';

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

export async function botUnpinChatMessage(chatId: number | string, messageId?: number): Promise<boolean> {
	const params: Record<string, unknown> = { chat_id: chatId };
	if (messageId) params.message_id = messageId;
	return (await botApi('unpinChatMessage', params)) !== null;
}

/**
 * Daftar ID Telegram admin.
 * Membaca dari pengaturan database (settings) secara realtime, digabung & fallback ke ADMIN_TELEGRAM_IDS di .env.
 */
export function adminIds(): string[] {
	const dbIds = getSettingSync('telegram_admin_ids');
	const envIds = process.env.ADMIN_TELEGRAM_IDS;
	const combined = [dbIds, envIds].filter(Boolean).join(',');
	return sanitizeTelegramIds(combined);
}

export function isAdmin(tgId: number | string): boolean {
	return adminIds().includes(String(tgId));
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
