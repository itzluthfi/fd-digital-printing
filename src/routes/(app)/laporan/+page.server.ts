/**
 * Laporan omzet — dihitung selalu dari tabel payments (sumber kebenaran).
 * Periode: harian (hari ini), mingguan (awal minggu ini), bulanan (awal bulan ini).
 */
import { error } from '@sveltejs/kit';
import { desc, eq, sql } from 'drizzle-orm';

import { db } from '#lib/server/db';
import { customers, orders, payments } from '#lib/server/db/schema';
import { METODE_LABEL } from '#lib/format';

const PERIODE = ['harian', 'mingguan', 'bulanan'] as const;
type Periode = (typeof PERIODE)[number];

function rangeStart(periode: Periode): string {
	const d = new Date();
	if (periode === 'harian') {
		d.setHours(0, 0, 0, 0);
	} else if (periode === 'mingguan') {
		// Awal minggu: Senin
		const day = (d.getDay() + 6) % 7;
		d.setDate(d.getDate() - day);
		d.setHours(0, 0, 0, 0);
	} else {
		d.setDate(1);
		d.setHours(0, 0, 0, 0);
	}
	return d.toISOString();
}

export const load = async ({ locals, url }) => {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');

	const p = url.searchParams.get('periode');
	const periode: Periode = PERIODE.includes(p as Periode) ? (p as Periode) : 'harian';
	const mulai = rangeStart(periode);

	const rows = await db
		.select({
			id: payments.id,
			method: payments.method,
			amount: payments.amount,
			paidAt: payments.paidAt,
			description: orders.description,
			orderId: orders.id,
			customerName: customers.name
		})
		.from(payments)
		.leftJoin(orders, eq(payments.orderId, orders.id))
		.leftJoin(customers, eq(orders.customerId, customers.id))
		.where(sql`${payments.paidAt} >= ${mulai}`)
		.orderBy(desc(payments.paidAt));

	const perMetode = Object.keys(METODE_LABEL).map((m) => ({
		method: m,
		label: METODE_LABEL[m],
		total: rows.filter((r) => r.method === m).reduce((s, r) => s + r.amount, 0),
		count: rows.filter((r) => r.method === m).length
	}));
	const grandTotal = rows.reduce((s, r) => s + r.amount, 0);

	return { periode, mulai, rows, perMetode, grandTotal, count: rows.length };
};
