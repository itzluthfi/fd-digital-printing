/**
 * Kelola data pelanggan + total piutang aktif per pelanggan.
 * Hapus diblokir bila pelanggan masih punya riwayat order/piutang.
 */
import { error, fail } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';

import { db } from '#lib/server/db';
import { customers, orders, receivables } from '#lib/server/db/schema';

function guard(locals: App.Locals) {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');
}

function bersih(v: FormDataEntryValue | null): string | null {
	const s = String(v ?? '').trim();
	return s === '' ? null : s;
}

export const load = async ({ locals }) => {
	guard(locals);

	const daftar = await db
		.select({
			id: customers.id,
			name: customers.name,
			phone: customers.phone,
			email: customers.email,
			telegramChatId: customers.telegramChatId,
			notes: customers.notes,
			piutang: sql<number>`coalesce((
				select sum(${receivables.amount} - ${receivables.paidAmount})
				from ${receivables}
				where ${receivables.customerId} = ${customers.id}
				  and ${receivables.status} = 'belum_lunas'
			), 0)`
		})
		.from(customers)
		.orderBy(asc(customers.name));

	return { customers: daftar };
};

export const actions = {
	tambah: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		const phone = String(f.get('phone') ?? '').trim();
		if (!name) return fail(400, { message: 'Nama wajib diisi.' });
		if (!phone) return fail(400, { message: 'Telepon wajib diisi.' });

		const [row] = await db
			.insert(customers)
			.values({
				name,
				phone,
				email: bersih(f.get('email')),
				telegramChatId: bersih(f.get('telegramChatId')),
				notes: bersih(f.get('notes'))
			})
			.returning();
		return { customer: row };
	},

	ubah: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const id = Number(f.get('id'));
		if (!Number.isFinite(id)) return fail(400, { message: 'ID tidak valid.' });
		const name = String(f.get('name') ?? '').trim();
		const phone = String(f.get('phone') ?? '').trim();
		if (!name) return fail(400, { message: 'Nama wajib diisi.' });
		if (!phone) return fail(400, { message: 'Telepon wajib diisi.' });

		const [row] = await db
			.update(customers)
			.set({
				name,
				phone,
				email: bersih(f.get('email')),
				telegramChatId: bersih(f.get('telegramChatId')),
				notes: bersih(f.get('notes'))
			})
			.where(eq(customers.id, id))
			.returning();
		if (!row) return fail(404, { message: 'Pelanggan tidak ditemukan.' });
		return { customer: row };
	},

	hapus: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const id = Number(f.get('id'));
		if (!Number.isFinite(id)) return fail(400, { message: 'ID tidak valid.' });

		const [o] = await db
			.select({ total: sql<number>`count(*)` })
			.from(orders)
			.where(eq(orders.customerId, id));
		if (o.total > 0)
			return fail(400, { message: 'Tidak bisa dihapus: pelanggan masih punya riwayat order.' });

		const [r] = await db
			.select({ total: sql<number>`count(*)` })
			.from(receivables)
			.where(eq(receivables.customerId, id));
		if (r.total > 0)
			return fail(400, { message: 'Tidak bisa dihapus: pelanggan masih punya piutang.' });

		await db.delete(customers).where(eq(customers.id, id));
		return { deletedId: id };
	}
};
