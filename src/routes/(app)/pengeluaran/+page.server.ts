/**
 * Pengeluaran operasional toko — owner/admin.
 * Dipakai dashboard untuk hitung laba bersih (omzet − pengeluaran).
 */
import { error, fail } from '@sveltejs/kit';
import { desc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

import { db } from '#lib/server/db';
import { expenses } from '#lib/server/db/schema';

function guard(locals: App.Locals) {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');
}

function hariIni(): string {
	return new Date().toISOString().slice(0, 10);
}

export const load: PageServerLoad = async ({ locals }) => {
	guard(locals);
	const rows = await db.select().from(expenses).orderBy(desc(expenses.tanggal), desc(expenses.id)).limit(100);
	const [total] = await db
		.select({ total: sql<number>`coalesce(sum(${expenses.jumlah}), 0)` })
		.from(expenses)
		.where(sql`substr(${expenses.tanggal}, 1, 7) = ${hariIni().slice(0, 7)}`);
	return { rows, totalBulanIni: total.total, hariIni: hariIni() };
};

export const actions: Actions = {
	tambah: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const tanggal = String(f.get('tanggal') ?? '').trim() || hariIni();
		const kategori = String(f.get('kategori') ?? '').trim();
		const jumlah = Math.round(Number(f.get('jumlah') ?? 0));
		const catatan = String(f.get('catatan') ?? '').trim() || null;
		if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return fail(400, { message: 'Tanggal tidak valid.' });
		if (!kategori) return fail(400, { message: 'Kategori wajib diisi.' });
		if (!Number.isFinite(jumlah) || jumlah <= 0) return fail(400, { message: 'Jumlah harus lebih dari 0.' });
		const [row] = await db.insert(expenses).values({ tanggal, kategori, jumlah, catatan }).returning();
		return { item: row };
	},

	hapus: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const id = Number(f.get('id'));
		if (!Number.isFinite(id)) return fail(400, { message: 'ID tidak valid.' });
		await db.delete(expenses).where(eq(expenses.id, id));
		return { deletedId: id };
	}
};
