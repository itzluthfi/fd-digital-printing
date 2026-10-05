/**
 * Dashboard owner/admin — ringkasan harian toko.
 * Omzet dihitung dari payments.paidAt (sumber kebenaran tunggal).
 */
import { and, asc, desc, eq, inArray, lte, ne, or, sql } from 'drizzle-orm';

import { db } from '#lib/server/db';
import { customers, expenses, orders, payments, receivables } from '#lib/server/db/schema';
import { getKanalStatus } from '#lib/server/notify/status';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;
	const isCustomer = user?.role === 'customer';

	// ---- JIKA USER ADALAH CUSTOMER / PELANGGAN ----
	if (isCustomer && user) {
		const userEmail = user.email.toLowerCase().trim();
		const userName = user.name.trim();

		// Temukan ID customer di database
		const matchedCustomers = await db
			.select()
			.from(customers)
			.where(
				or(
					sql`lower(${customers.email}) = ${userEmail}`,
					sql`lower(${customers.name}) = ${userName.toLowerCase()}`
				)
			);

		const customerIds = matchedCustomers.map((c) => c.id);

		let customerOrders: any[] = [];
		if (customerIds.length > 0) {
			customerOrders = await db
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
				.where(inArray(orders.customerId, customerIds))
				.orderBy(desc(orders.createdAt));
		}

		// Hitung statistik pelanggan
		const totalOrders = customerOrders.length;
		const activeOrders = customerOrders.filter((o) => o.status !== 'diambil').length;
		const completedOrders = customerOrders.filter((o) => o.status === 'diambil').length;
		const totalSpent = customerOrders
			.filter((o) => o.status !== 'baru')
			.reduce((sum, o) => sum + (o.total ?? 0), 0);

		return {
			isCustomer: true,
			user,
			customerStats: {
				totalOrders,
				activeOrders,
				completedOrders,
				totalSpent
			},
			customerOrders,
			customerProfile: {
				name: user.name,
				email: user.email,
				phone: matchedCustomers[0]?.phone ?? '-'
			},
			stats: null,
			orderTerbaru: [],
			tempoTerdekat: [],
			kanal: null
		};
	}

	// ---- JIKA USER ADALAH OWNER / ADMIN / STAF ----
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
		.select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })		.from(payments)
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
			janjiSelesai: orders.janjiSelesai,
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

	const [biaya] = await db
		.select({ total: sql<number>`coalesce(sum(${expenses.jumlah}), 0)` })
		.from(expenses)
		.where(eq(expenses.tanggal, now.toISOString().slice(0, 10)));

	return {
		isCustomer: false,
		customerStats: null,
		customerOrders: [],
		customerProfile: null,
		stats: {
			omzetHariIni: omzet.total,
			pengeluaranHariIni: biaya.total,
			labaBersih: omzet.total - biaya.total,
			orderAktif: aktif.total,
			piutangAktif: piutang.total,
			tempo7Hari: tempo.total
		},
		orderTerbaru,
		tempoTerdekat,
		kanal: await getKanalStatus()
	};
};
