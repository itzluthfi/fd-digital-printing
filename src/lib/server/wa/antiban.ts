/**
 * Logika anti-ban WhatsApp — pure functions (mudah di-test, tanpa I/O).
 *
 * Disarikan dari riset operator produksi Baileys 2024–2026:
 * - Warm-up 7 hari: 2 hari idle, lalu ramp 20→36→65→117→210→378→680→bebas.
 * - Jeda gaussian 1.5–5 dtk + 3 dtk untuk chat baru + ~30ms/karakter simulasi mengetik.
 * - Batas: 8/menit, 200/jam, 1500/hari; circuit breaker 150/hari.
 * - Kirim hanya 08.00–21.00 waktu penerima (Asia/Jakarta).
 *
 * Angka-angka ini observasi operator, bukan aturan resmi Meta — risiko ban
 * tidak pernah nol untuk klien unofficial.
 */

/** Cap harian warm-up per hari ke-N (hari 1 = hari pertama kirim). */
export const WARMUP_CAPS = [20, 36, 65, 117, 210, 378, 680];

/** Batas keras — di atas warm-up. */
export const RATE_LIMITS = {
	perMinute: 8,
	perHour: 200,
	perDay: 1500,
	/** Circuit breaker harian: berhenti total bila tercapai. */
	circuitBreaker: 150,
	/** Maks pesan identik per jam (duplikasi = sinyal spam). */
	maxIdenticalPerHour: 3
} as const;

export const BUSINESS_HOURS = { start: 8, end: 21 } as const;

/** Hari warm-up ke-N dari tanggal mulai (1-based). */
export function warmupDay(startedAt: Date, now = new Date()): number {
	const days = Math.floor((now.getTime() - startedAt.getTime()) / 86400000) + 1;
	return Math.max(1, days);
}

/** Cap kirim harian untuk hari warm-up ke-N. Infinity bila warm-up selesai. */
export function dailyCap(day: number): number {
	return day <= WARMUP_CAPS.length ? WARMUP_CAPS[day - 1] : Infinity;
}

/** Gaussian (Box-Muller) dengan mean & stddev — untuk jitter yang natural. */
export function gaussian(mean: number, stddev: number, rand = Math.random): number {
	let u = 0;
	let v = 0;
	while (u === 0) u = rand();
	while (v === 0) v = rand();
	return mean + stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Jeda antar pesan (ms): gaussian 1.5–5 dtk, +3 dtk untuk chat baru,
 * +~30ms per karakter (simulasi mengetik). Selalu >= 1200ms.
 */
export function sendDelayMs(textLength: number, isNewChat: boolean, rand = Math.random): number {
	const base = gaussian(3250, 900, rand); // mean 3.25 dtk, sebaran ~1.5–5 dtk
	const typing = Math.min(textLength * 30, 8000);
	const total = base + typing + (isNewChat ? 3000 : 0);
	return Math.max(1200, Math.round(total));
}

/** Apakah sekarang jam operasional (Asia/Jakarta)? */
export function isBusinessHours(now = new Date()): boolean {
	const fmt = new Intl.DateTimeFormat('en-GB', {
		timeZone: 'Asia/Jakarta',
		hour: 'numeric',
		hour12: false
	});
	const hour = Number(fmt.format(now));
	return hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end;
}

/** Normalisasi nomor ke format internasional tanpa '+' (cth: 6281234567890). */
export function normalizePhone(raw: string): string {
	let n = raw.replace(/[^0-9]/g, '');
	if (n.startsWith('0')) n = '62' + n.slice(1);
	return n;
}

/**
 * Kanonikalisasi JID WhatsApp (migrasi LID 2024):
 * "62812:xx@s.whatsapp.net" → "62812@s.whatsapp.net".
 */
export function canonicalJid(jid: string): string {
	const [user, server] = jid.split('@');
	if (!server) return jid;
	const cleanUser = user.split(':')[0];
	return `${cleanUser}@${server}`;
}

/** JID chat personal dari nomor. */
export function toJid(phone: string): string {
	return `${normalizePhone(phone)}@s.whatsapp.net`;
}
