import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

import { db } from '#lib/server/db';
import { customers, orders, payments } from '#lib/server/db/schema';
import { QRIS_URL, qrisTersedia } from '#lib/server/settings';

export const load: PageServerLoad = async ({ params }) => {
	const code = params.code.trim().toUpperCase();

	const [orderRow] = await db
		.select({
			id: orders.id,
			code: orders.code,
			description: orders.description,
			status: orders.status,
			subtotal: orders.subtotal,
			total: orders.total,
			fileUrl: orders.fileUrl,
			createdAt: orders.createdAt,
			customerName: customers.name,
			customerPhone: customers.phone
		})
		.from(orders)
		.leftJoin(customers, eq(orders.customerId, customers.id))
		.where(eq(orders.code, code))
		.limit(1);

	if (!orderRow) {
		throw error(404, `Pesanan dengan kode ${code} tidak ditemukan.`);
	}

	const paymentList = await db
		.select()
		.from(payments)
		.where(eq(payments.orderId, orderRow.id));

	return {
		order: orderRow,
		payments: paymentList,
		qrisTersedia: qrisTersedia(),
		qrisUrl: QRIS_URL
	};
};
