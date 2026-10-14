/**
 * In-Memory Rate Limiter Terpusat dengan Mekanisme Auto-Pruning.
 * Mencegah DoS, spamming form, dan kebocoran memori (Memory Leak).
 */

interface RateLimitRecord {
	count: number;
	resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Bersihkan entri yang sudah kadaluarsa setiap 3 menit secara otomatis
const PRUNE_INTERVAL_MS = 3 * 60 * 1000;
let lastPrune = Date.now();

function pruneExpiredRecords(): void {
	const now = Date.now();
	if (now - lastPrune < PRUNE_INTERVAL_MS) return;

	lastPrune = now;
	for (const [key, record] of rateLimitStore.entries()) {
		if (now > record.resetTime) {
			rateLimitStore.delete(key);
		}
	}
}

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetInMs: number;
}

/**
 * Periksa apakah request dalam limit.
 * @param prefix Namespace limit (contoh: "order-create", "ai-chat", "order-cancel")
 * @param identifier Kunci unik pemohon (biasanya IP klien)
 * @param maxHits Batas maksimal request yang diizinkan dalam rentang waktu
 * @param windowMs Rentang waktu dalam milidetik (contoh: 60_000 untuk 1 menit)
 */
export function checkRateLimit(
	prefix: string,
	identifier: string,
	maxHits: number,
	windowMs: number
): RateLimitResult {
	pruneExpiredRecords();

	const key = `${prefix}:${identifier}`;
	const now = Date.now();
	const record = rateLimitStore.get(key);

	if (!record || now > record.resetTime) {
		rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
		return {
			allowed: true,
			remaining: maxHits - 1,
			resetInMs: windowMs
		};
	}

	if (record.count >= maxHits) {
		return {
			allowed: false,
			remaining: 0,
			resetInMs: Math.max(0, record.resetTime - now)
		};
	}

	record.count++;
	return {
		allowed: true,
		remaining: maxHits - record.count,
		resetInMs: Math.max(0, record.resetTime - now)
	};
}

/**
 * Ekstrak IP klien secara andal di balik reverse proxy (Nginx, Cloudflare).
 */
export function extractClientIp(request: Request, getClientAddress?: () => string): string {
	try {
		// 1. Cek header Cloudflare jika ada
		const cfIp = request.headers.get('cf-connecting-ip');
		if (cfIp) return cfIp.trim();

		// 2. Cek X-Real-IP dari Nginx
		const realIp = request.headers.get('x-real-ip');
		if (realIp) return realIp.trim();

		// 3. Cek X-Forwarded-For (ambil IP pertama = client asal)
		const forwarded = request.headers.get('x-forwarded-for');
		if (forwarded) {
			const client = forwarded.split(',')[0]?.trim();
			if (client) return client;
		}

		// 4. Fallback ke getClientAddress SvelteKit
		if (getClientAddress) {
			const addr = getClientAddress();
			if (addr) return addr;
		}
	} catch {
		// Ignore
	}

	return '127.0.0.1';
}
