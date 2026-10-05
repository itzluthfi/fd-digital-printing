/**
 * Rekap shift kasir — owner/admin.
 * Buka shift (catat cash awal di laci) → Tutup shift (hitung cash masuk
 * otomatis dari pembayaran cash, bandingkan dengan cash fisik).
 */
import { error, fail } from '@sveltejs/kit';
import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

import { db } from '#lib/server/db';
import { payments, shifts } from '#lib/server/db/schema';

function guard(locals: App.Locals) {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');
}

async function cashMasukSejak(dibukaAt: string): Promise<number> {
	const [r] = await db
		.select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
		.from(payments)
		.where(and(eq(payments.method, 'cash'), sql`${payments.paidAt} >= ${dibukaAt}`));
	return r.total;
}

export const load: PageServerLoad = async ({ locals }) => {
	guard(locals);
	const [aktif] = await db
		.select()
		.from(shifts)
		.where(isNull(shifts.ditutupAt))
		.orderBy(desc(shifts.id))
		.limit(1);
	const riwayat = await db
		.select()
		.from(shifts)
		.where(isNotNull(shifts.ditutupAt))
		.orderBy(desc(shifts.id))
		.limit(20);
	const berjalan = aktif ? await cashMasukSejak(aktif.dibukaAt) : 0;
	return { aktif: aktif ?? null, riwayat, cashMasukBerjalan: berjalan };
};

export const actions: Actions = {
	buka: async ({ request, locals }) => {
		guard(locals);
		const [ada] = await db.select({ id: shifts.id }).from(shifts).where(isNull(shifts.ditutupAt)).limit(1);
		if (ada) return fail(400, { message: 'Masih ada shift yang terbuka. Tutup dulu.' });
		const f = await request.formData();
		const cashAwal = Math.round(Number(f.get('cashAwal') ?? 0));
		if (!Number.isFinite(cashAwal) || cashAwal < 0)
			return fail(400, { message: 'Cash awal tidak valid.' });
		const [row] = await db
			.insert(shifts)
			.values({ dibukaOleh: locals.user?.email ?? null, cashAwal })
			.returning();
		return { shift: row };
	},

	tutup: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const id = Number(f.get('id'));
		const cashFisik = Math.round(Number(f.get('cashFisik') ?? NaN));
		const catatan = String(f.get('catatan') ?? '').trim() || null;
		if (!Number.isFinite(id)) return fail(400, { message: 'Shift tidak valid.' });
		if (!Number.isFinite(cashFisik) || cashFisik < 0)
			return fail(400, { message: 'Cash fisik tidak valid.' });
		const [s] = await db.select().from(shifts).where(eq(shifts.id, id)).limit(1);
		if (!s || s.ditutupAt) return fail(400, { message: 'Shift sudah ditutup / tidak ditemukan.' });
		const masuk = await cashMasukSejak(s.dibukaAt);
		const expected = s.cashAwal + masuk;
		const selisih = cashFisik - expected;
		await db
			.update(shifts)
			.set({
				ditutupAt: new Date().toISOString(),
				ditutupOleh: locals.user?.email ?? null,
				cashMasuk: masuk,
				cashFisik,
				selisih,
				catatan
			})
			.where(eq(shifts.id, id));
		return { ok: true, selisih };
	}
};
