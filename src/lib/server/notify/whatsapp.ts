/**
 * WhatsApp — dual track: official Cloud API (`cloud`) atau Baileys (`baileys`).
 * Dipilih via env WA_PROVIDER (default `off` = nonaktif, aman).
 *
 * Pengiriman TIDAK langsung — masuk antrian (wa_outbox) agar bisa diberi
 * jeda anti-ban, warm-up, dan circuit breaker. Lihat src/lib/server/wa/.
 */
import { getWaProviderName, getWaStatus, queueWhatsApp } from '../wa/provider';

export function whatsappConfigured(): boolean {
	return getWaProviderName() !== 'off';
}

export async function sendWhatsApp(to: string, text: string): Promise<boolean> {
	const queued = await queueWhatsApp(to, text);
	if (!queued) {
		console.log(`[whatsapp] dilewati — provider off / kill switch aktif (ke: ${to})`);
		return false;
	}
	console.log(`[whatsapp] masuk antrian (ke: ${to})`);
	return true;
}

export async function whatsappStatus() {
	return getWaStatus();
}
