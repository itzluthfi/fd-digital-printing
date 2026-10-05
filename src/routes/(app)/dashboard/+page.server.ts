/**
 * Dashboard owner/admin — ringkasan harian toko.
 * Omzet dihitung dari payments.paidAt (sumber kebenaran tunggal).
 */
import { and, asc, desc, eq, lte, ne, sql } from 'drizzle-orm';

import { db } from '#lib/server/db';
import { customers, orders, payments, receivables } from '#lib/server/db/schema';
import { getKanalStatus } from '#lib/server/notify/status';

export const load = async () => {
	const now = new Date();
	const startToday = new Date(now);
	startToday.setHours(0, 0, 0, 0);
	const startTodayIso = startToday.toISOString();

	// Jatuh tempo: mulai hari ini s/d +7 hari (akhir hari)
	const limit = new Date(now);
	limit.setDate(limit.getDate() + 7);
	limit.setHours(23, 59, 59, 999);
	const limitIso = limit.toISOString();

	const [omzet] = await db
		.select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
		.from(payments)
		.where(sql`${payments.paidAt} >= ${startTodayIso}`);

	const [aktif] = await db
		.select({ total: sql<number>`count(*)` })
		.from(orders)
		.where(ne(orders.status, 'diambil'));

	const [piutang] = await db
		.select({ total: sql<number>`coalesce(sum(${receivables.amount} - ${receivables.paidAmount}), 0)` })
		.from(receivables)
		.where(eq(receivables.status, 'belum_lunas'));

	const [tempo] = await db
		.select({ total: sql<number>`count(*)` })
		.from(receivables)
		.where(
			and(eq(receivables.status, 'belum_lunas'), lte(receivables.dueDate, limitIso))
		);

	const orderTerbaru = await db
		.select({
			id: orders.id,
			description: orders.description,
			status: orders.status,
			total: orders.total,
			createdAt: orders.createdAt,
			customerName: customers.name
		})
		.from(orders)
		.leftJoin(customers, eq(orders.customerId, customers.id))
		.orderBy(desc(orders.createdAt))
		.limit(5);

	const tempoTerdekat = await db
		.select({
			id: receivables.id,
			amount: receivables.amount,
			paidAmount: receivables.paidAmount,
			dueDate: receivables.dueDate,
			customerName: customers.name
		})
		.from(receivables)
		.innerJoin(customers, eq(receivables.customerId, customers.id))
		.where(eq(receivables.status, 'belum_lunas'))
		.orderBy(asc(receivables.dueDate))
		.limit(5);

	return {
		stats: {
			omzetHariIni: omzet.total,
			orderAktif: aktif.total,
			piutangAktif: piutang.total,
			tempo7Hari: tempo.total
		},
		orderTerbaru,
		tempoTerdekat,
		kanal: await getKanalStatus()
	};
};
