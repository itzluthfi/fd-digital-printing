import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { orders, payments } from '#lib/server/db/schema';

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code')?.trim();
	if (!code) {
		return json({ success: false, message: 'Parameter code diperlukan' }, { status: 400 });
	}

	const [order] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
	if (!order) {
		return json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
	}

	// Cek apakah ada record pembayaran sukses di tabel payments
	const paymentRows = await db
		.select()
		.from(payments)
		.where(eq(payments.orderId, order.id))
		.limit(1);

	// Status dianggap lunas jika status sudah maju (diproses/selesai/diambil) ATAU ada row payments
	const isPaid = order.status !== 'baru' || paymentRows.length > 0;

	return json({
		success: true,
		code: order.code,
		status: order.status,
		isPaid,
		total: order.total,
		createdAt: order.createdAt
	});
};
