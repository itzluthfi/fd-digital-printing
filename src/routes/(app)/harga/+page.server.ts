/**
 * Kelola katalog harga cetakan (owner/admin saja — operator tidak boleh lihat harga).
 * Dipakai kasir untuk hitung otomatis: pilih item → input ukuran/jumlah → total.
 */
import { error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { mkdir, writeFile } from 'node:fs/promises';

import { db } from '#lib/server/db';
import { priceItems } from '#lib/server/db/schema';

const SATUAN = ['meter', 'pcs', 'lembar', 'paket'] as const;
const SATUAN_LABEL: Record<string, string> = {
	meter: 'per meter persegi',
	pcs: 'per pcs',
	lembar: 'per lembar',
	paket: 'per paket'
};

function guard(locals: App.Locals) {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');
}

async function saveUploadedProductImage(file: unknown): Promise<string | null> {
	if (!(file instanceof File) || file.size === 0) return null;
	const tipe = file.type.toLowerCase();
	if (!tipe.startsWith('image/')) return null;
	const ext = file.name.split('.').pop() || 'png';
	const safeName = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
	await mkdir('static/uploads/products', { recursive: true });
	await writeFile(`static/uploads/products/${safeName}`, Buffer.from(await file.arrayBuffer()));
	return `/uploads/products/${safeName}`;
}

export const load = async ({ locals }) => {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin' && role !== 'operator') throw error(403, 'Akses ditolak');
	const isStaff = role === 'owner' || role === 'admin';
	const daftar = await db
		.select()
		.from(priceItems)
		.orderBy(asc(priceItems.sortOrder), asc(priceItems.name));
	return { items: daftar, satuanLabel: SATUAN_LABEL, isStaff };
};

export const actions = {
	tambah: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		const unit = String(f.get('unit') ?? 'pcs');
		const price = Math.round(Number(f.get('price') ?? 0));
		if (!name) return fail(400, { message: 'Nama wajib diisi.' });
		if (!(SATUAN as readonly string[]).includes(unit)) return fail(400, { message: 'Satuan tidak valid.' });
		if (!Number.isFinite(price) || price < 0) return fail(400, { message: 'Harga tidak valid.' });

		const imageFile = f.get('imageFile');
		let imageUrl = String(f.get('imageUrl') ?? '').trim() || null;
		const uploadedUrl = await saveUploadedProductImage(imageFile);
		if (uploadedUrl) imageUrl = uploadedUrl;

		const [row] = await db
			.insert(priceItems)
			.values({
				name,
				category: String(f.get('category') ?? '').trim() || null,
				imageUrl,
				unit: unit as (typeof SATUAN)[number],
				price,
				isActive: f.get('isActive') === 'on',
				sortOrder: Number(f.get('sortOrder') ?? 0) || 0
			})
			.returning();
		return { item: row };
	},

	ubah: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const id = Number(f.get('id'));
		if (!Number.isFinite(id)) return fail(400, { message: 'ID tidak valid.' });
		const name = String(f.get('name') ?? '').trim();
		const unit = String(f.get('unit') ?? 'pcs');
		const price = Math.round(Number(f.get('price') ?? 0));
		if (!name) return fail(400, { message: 'Nama wajib diisi.' });
		if (!(SATUAN as readonly string[]).includes(unit)) return fail(400, { message: 'Satuan tidak valid.' });
		if (!Number.isFinite(price) || price < 0) return fail(400, { message: 'Harga tidak valid.' });

		const imageFile = f.get('imageFile');
		let imageUrl = String(f.get('imageUrl') ?? '').trim() || null;
		const uploadedUrl = await saveUploadedProductImage(imageFile);
		if (uploadedUrl) imageUrl = uploadedUrl;

		const [row] = await db
			.update(priceItems)
			.set({
				name,
				category: String(f.get('category') ?? '').trim() || null,
				imageUrl,
				unit: unit as (typeof SATUAN)[number],
				price,
				isActive: f.get('isActive') === 'on',
				sortOrder: Number(f.get('sortOrder') ?? 0) || 0
			})
			.where(eq(priceItems.id, id))
			.returning();
		if (!row) return fail(404, { message: 'Item tidak ditemukan.' });
		return { item: row };
	},

	hapus: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const id = Number(f.get('id'));
		if (!Number.isFinite(id)) return fail(400, { message: 'ID tidak valid.' });
		await db.delete(priceItems).where(eq(priceItems.id, id));
		return { deletedId: id };
	},

	toggle: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const id = Number(f.get('id'));
		if (!Number.isFinite(id)) return fail(400, { message: 'ID tidak valid.' });
		const [cur] = await db.select().from(priceItems).where(eq(priceItems.id, id));
		if (!cur) return fail(404, { message: 'Item tidak ditemukan.' });
		const [row] = await db
			.update(priceItems)
			.set({ isActive: !cur.isActive })
			.where(eq(priceItems.id, id))
			.returning();
		return { item: row };
	}
};
