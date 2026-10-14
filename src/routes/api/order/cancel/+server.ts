import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { orders } from '#lib/server/db/schema';
import { checkRateLimit, extractClientIp } from '#lib/server/ratelimit';
import { hasNullByte } from '#lib/server/sanitizer';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		// 🛡️ Rate limit: Maksimal 5 percobaan pembatalan per 60 detik per IP (Anti-Brute Force)
		const clientIp = extractClientIp(request, getClientAddress);
		const rateResult = checkRateLimit('order-cancel', clientIp, 5, 60_000);
		if (!rateResult.allowed) {
			return json(
				{ success: false, message: 'Terlalu banyak permintaan pembatalan. Silakan tunggu sebentar.' },
				{ status: 429 }
			);
		}

		const body = await request.json().catch(() => ({}));
		if (hasNullByte(body.code)) {
			return json({ success: false, message: 'Kode order mengandung karakter tidak valid.' }, { status: 400 });
		}

		const code = String(body.code || '').trim().toUpperCase();

		if (!code || !/^[A-Z0-9-]{4,20}$/.test(code)) {
			return json({ success: false, message: 'Format kode order tidak valid.' }, { status: 400 });
		}

		const [order] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
		if (!order) {
			return json({ success: false, message: 'Pesanan tidak ditemukan.' }, { status: 404 });
		}

		if (order.status !== 'baru') {
			return json(
				{
					success: false,
					message: `Pesanan berstatus "${order.status}" tidak dapat dibatalkan.`
				},
				{ status: 400 }
			);
		}

		await db.update(orders).set({ status: 'batal' }).where(eq(orders.id, order.id));

		return json({
			success: true,
			message: `Pesanan ${code} berhasil dibatalkan.`
		});
	} catch (err) {
		console.error('[order cancel] Error:', err);
		return json({ success: false, message: 'Gagal membatalkan pesanan.' }, { status: 500 });
	}
};
