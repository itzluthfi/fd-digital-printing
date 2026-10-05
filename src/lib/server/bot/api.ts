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

/** Daftar ID Telegram admin dari env ADMIN_TELEGRAM_IDS (koma-dipisah). */
export function adminIds(): string[] {
	return (process.env.ADMIN_TELEGRAM_IDS ?? '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

export function isAdmin(tgId: number | string): boolean {
	return adminIds().includes(String(tgId));
}

/**
 * Kirim pesan push ke semua admin (fire-and-forget — kegagalan tidak melempar).
 * Dipakai untuk: order baru, perubahan status order, pembayaran piutang.
 */
export async function notifyAdmins(text: string): Promise<void> {
	const ids = adminIds();
	if (ids.length === 0 || !botConfigured()) return;
	await Promise.allSettled(ids.map((id) => botSendMessage(id, text)));
}
