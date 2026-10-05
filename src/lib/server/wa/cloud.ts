/**
 * Provider WhatsApp Business Cloud API (official).
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Butuh env: WA_CLOUD_TOKEN (token akses), WA_CLOUD_PHONE_ID (ID nomor bisnis).
 * Catatan: di luar 24 jam jendela chat, pesan harus pakai template yang
 * sudah disetujui Meta — kirim teks biasa hanya untuk balasan dalam jendela.
 */
import { postJson } from '../http';

const API_VERSION = 'v21.0';

export function cloudConfigured(): boolean {
	return Boolean(process.env.WA_CLOUD_TOKEN && process.env.WA_CLOUD_PHONE_ID);
}

export async function cloudSend(to: string, text: string): Promise<boolean> {
	const token = process.env.WA_CLOUD_TOKEN;
	const phoneId = process.env.WA_CLOUD_PHONE_ID;
	if (!token || !phoneId) return false;
	try {
		const { status, text: raw } = await postJson(
			`https://graph.facebook.com/${API_VERSION}/${phoneId}/messages`,
			{
				messaging_product: 'whatsapp',
				to,
				type: 'text',
				text: { body: text }
			},
			25000,
			{ authorization: `Bearer ${token}` }
		);
		if (status !== 200) {
			console.error('[wa:cloud] gagal:', status, raw.slice(0, 200));
			return false;
		}
		return true;
	} catch (e) {
		console.error('[wa:cloud] network error:', String(e).slice(0, 200));
		return false;
	}
}
