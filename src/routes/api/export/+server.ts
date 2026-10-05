/**
 * Export CSV — omzet & piutang. Format Excel-friendly (separator `;`, BOM UTF-8).
 * Guard: owner/admin.
 */
import { error } from '@sveltejs/kit';
import { desc, eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

import { db } from '#lib/server/db';
import { customers, orders, payments, receivables } from '#lib/server/db/schema';
import { METODE_LABEL } from '#lib/format';

function guard(locals: App.Locals) {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');
}

/** Escape satu sel CSV (separator `;`). */
function sel(v: unknown): string {
	const s = String(v ?? '');
	return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvFile(nama: string, header: string[], baris: unknown[][]): Response {
	const isi = '\uFEFF' + [header, ...baris].map((r) => r.map(sel).join(';')).join('\r\n');
	return new Response(isi, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${nama}"`
		}
	});
}

function rangeStart(periode: string): string {
	const d = new Date();
	if (periode === 'mingguan') {
		const day = (d.getDay() + 6) % 7;
		d.setDate(d.getDate() - day);
		d.setHours(0, 0, 0, 0);
	} else if (periode === 'bulanan') {
		d.setDate(1);
		d.setHours(0, 0, 0, 0);
	} else {
		d.setHours(0, 0, 0, 0);
	}
	return d.toISOString();
}

export const GET: RequestHandler = async ({ locals, url }) => {
	guard(locals);
	const jenis = url.searchParams.get('jenis') ?? 'omzet';

	if (jenis === 'piutang') {
		const rows = await db
			.select({
				id: receivables.id,
				nama: customers.name,
				telepon: customers.phone,
				total: receivables.amount,
				dibayar: receivables.paidAmount,
				jatuhTempo: receivables.dueDate,
				status: receivables.status
			})
			.from(receivables)
			.leftJoin(customers, eq(receivables.customerId, customers.id))
			.orderBy(desc(receivables.id));
		return csvFile(
			`piutang-${new Date().toISOString().slice(0, 10)}.csv`,
			['ID', 'Pelanggan', 'Telepon', 'Total', 'Dibayar', 'Sisa', 'Jatuh tempo', 'Status'],
			rows.map((r) => [
				r.id,
				r.nama ?? '-',
				r.telepon ?? '-',
				r.total,
				r.dibayar,
				Math.max(0, r.total - r.dibayar),
				r.jatuhTempo.slice(0, 10),
				r.status === 'lunas' ? 'Lunas' : 'Belum lunas'
			])
		);
	}

	// Default: omzet per periode
	const periode = ['harian', 'mingguan', 'bulanan'].includes(url.searchParams.get('periode') ?? '')
		? (url.searchParams.get('periode') as string)
		: 'harian';
	const rows = await db
		.select({
			paidAt: payments.paidAt,
			kode: orders.code,
			nama: customers.name,
			deskripsi: orders.description,
			metode: payments.method,
			jumlah: payments.amount
		})
		.from(payments)
		.leftJoin(orders, eq(payments.orderId, orders.id))
		.leftJoin(customers, eq(orders.customerId, customers.id))
		.where(sql`${payments.paidAt} >= ${rangeStart(periode)}`)
		.orderBy(desc(payments.paidAt));
	return csvFile(
		`omzet-${periode}-${new Date().toISOString().slice(0, 10)}.csv`,
		['Tanggal', 'Kode order', 'Pelanggan', 'Deskripsi', 'Metode', 'Jumlah'],
		rows.map((r) => [
			r.paidAt.slice(0, 16).replace('T', ' '),
			r.kode ?? '-',
			r.nama ?? '-',
			r.deskripsi ?? '-',
			METODE_LABEL[r.metode] ?? r.metode,
			r.jumlah
		])
	);
};
