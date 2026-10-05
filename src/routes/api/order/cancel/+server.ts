import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { orders } from '#lib/server/db/schema';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json().catch(() => ({}));
		const code = String(body.code || '').trim().toUpperCase();

		if (!code) {
			return json({ success: false, message: 'Kode order wajib diisi.' }, { status: 400 });
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
