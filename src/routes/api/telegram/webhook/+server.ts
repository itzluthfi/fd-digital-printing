/**
 * Webhook Telegram untuk bot admin FD Digital Printing.
 * POST /api/telegram/webhook
 *
 * Keamanan:
 * - Wajib header X-Telegram-Bot-Api-Secret-Token == env TELEGRAM_WEBHOOK_SECRET.
 * - Setiap update dicek: pengirim harus ada di ADMIN_TELEGRAM_IDS.
 * - Selalu jawab 200 secepatnya agar Telegram tidak retry berkali-kali.
 */
import { handleUpdate } from '#lib/server/bot/admin';

export async function POST({ request }: { request: Request }): Promise<Response> {
	const secret = request.headers.get('x-telegram-bot-api-secret-token');
	const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
	if (!expected || secret !== expected) {
		return new Response('forbidden', { status: 403 });
	}
	try {
		const update = await request.json();
		// Tangani di background, langsung jawab OK ke Telegram.
		handleUpdate(update).catch((e) => console.error('[bot] webhook error:', String(e).slice(0, 300)));
	} catch {
		return new Response('bad request', { status: 400 });
	}
	return new Response('ok');
}

export function GET(): Response {
	return new Response('ok');
}
