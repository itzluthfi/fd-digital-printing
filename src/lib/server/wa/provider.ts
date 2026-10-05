/**
 * Provider WhatsApp — dipilih via env WA_PROVIDER:
 * - `cloud`   : WhatsApp Business Cloud API (official, butuh WA_CLOUD_TOKEN + WA_CLOUD_PHONE_ID)
 * - `baileys` : Baileys unofficial (butuh nomor cadangan + pairing; risiko ban — baca PLAN.md)
 * - `off`     : nonaktif (default aman)
 */
import { db } from '../db';
import { waMeta, waOutbox } from '../db/schema';
import { eq } from 'drizzle-orm';

export type WaProviderName = 'cloud' | 'baileys' | 'off';

export interface WaStatus {
	provider: WaProviderName;
	/** true bila provider terkonfigurasi & (untuk baileys) terhubung */
	connected: boolean;
	detail: string;
}

export function getWaProviderName(): WaProviderName {
	const v = (process.env.WA_PROVIDER ?? 'off').toLowerCase();
	return v === 'cloud' || v === 'baileys' ? v : 'off';
}

export async function waMetaGet(key: string): Promise<string | null> {
	const [row] = await db.select().from(waMeta).where(eq(waMeta.key, key));
	return row?.value ?? null;
}

export async function waMetaSet(key: string, value: string): Promise<void> {
	await db
		.insert(waMeta)
		.values({ key, value, updatedAt: new Date().toISOString() })
		.onConflictDoUpdate({ target: waMeta.key, set: { value, updatedAt: new Date().toISOString() } });
}

/** Masukkan pesan ke antrian WA. Mengembalikan false bila provider off. */
export async function queueWhatsApp(to: string, text: string): Promise<boolean> {
	if (getWaProviderName() === 'off') return false;
	// Kill switch darurat (diaktifkan otomatis saat risk score tinggi / manual via pengaturan)
	if ((await waMetaGet('kill_switch')) === '1') return false;
	await db.insert(waOutbox).values({
		to,
		text,
		status: 'queued',
		scheduledAt: new Date().toISOString(),
		createdAt: new Date().toISOString()
	});
	// Bangunkan worker (lazy start — aman dipanggil berkali-kali)
	void import('./baileys').then((m) => m.ensureBaileysWorker().catch(() => {}));
	return true;
}

/** Status provider untuk dashboard/pengaturan. */
export async function getWaStatus(): Promise<WaStatus> {
	const provider = getWaProviderName();
	if (provider === 'off') return { provider, connected: false, detail: 'Nonaktif (WA_PROVIDER=off)' };
	if (provider === 'cloud') {
		const ok = Boolean(process.env.WA_CLOUD_TOKEN && process.env.WA_CLOUD_PHONE_ID);
		return {
			provider,
			connected: ok,
			detail: ok ? 'Cloud API terkonfigurasi' : 'WA_CLOUD_TOKEN / WA_CLOUD_PHONE_ID belum diset'
		};
	}
	// baileys
	const m = await import('./baileys');
	return m.baileysStatus();
}
