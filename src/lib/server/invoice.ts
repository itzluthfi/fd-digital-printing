/**
 * Data invoice/struk per order — dipakai halaman invoice & struk thermal.
 */
import { error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';

import { db } from './db';
import { customers, orders, payments, receivables } from './db/schema';

export function invoiceGuard(locals: App.Locals) {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');
}

export async function loadInvoiceData(id: number) {
	if (!Number.isFinite(id)) throw error(404, 'Invoice tidak ditemukan.');

	const [order] = await db.select().from(orders).where(eq(orders.id, id));
	if (!order) throw error(404, 'Invoice tidak ditemukan.');

	const [customer] = order.customerId
		? await db.select().from(customers).where(eq(customers.id, order.customerId))
		: [null];

	const bayar = await db.select().from(payments).where(eq(payments.orderId, id));
	const [piutang] = await db
		.select({
			sisa: sql<number>`coalesce(sum(${receivables.amount} - ${receivables.paidAmount}), 0)`,
			dueDate: sql<string | null>`min(${receivables.dueDate})`
		})
		.from(receivables)
		.where(sql`${receivables.orderId} = ${id} and ${receivables.status} = 'belum_lunas'`);

	const totalDibayar = bayar.reduce((s, p) => s + p.amount, 0);

	return {
		order,
		customer,
		payments: bayar,
		totalDibayar,
		sisa: piutang.sisa,
		dueDate: piutang.dueDate
	};
}
