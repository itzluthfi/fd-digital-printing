/**
 * Kasir — input transaksi cepat.
 * Satu submit: insert orders → payments (jika dibayar>0) → receivables (jika sisa>0).
 */
import { error, fail, redirect } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';

import { db } from '#lib/server/db';
import { customers, orders, payments, priceItems, receivables } from '#lib/server/db/schema';
import { QRIS_URL, qrisTersedia } from '#lib/server/settings';
import { buatKodeOrder } from '#lib/server/order-code';
import { esc, notifyAdmins } from '#lib/server/bot/api';
import { rupiah } from '#lib/format';

const METODE_VALID = ['cash', 'transfer', 'qris', 'piutang'];

function defaultDueDate(): string {
	const d = new Date();
	d.setDate(d.getDate() + 3);
	return d.toISOString().slice(0, 10);
}

export const load = async ({ locals }) => {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');

	const daftar = await db
		.select({ id: customers.id, name: customers.name, phone: customers.phone })
		.from(customers)
		.orderBy(asc(customers.name));

	const riwayat = await db
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
		.orderBy(desc(payments.paidAt))
		.limit(20);

	return {
		customers: daftar,
		defaultDueDate: defaultDueDate(),
		riwayat,
		qrisUrl: qrisTersedia() ? QRIS_URL : null,
		katalog: await db
			.select({
				id: priceItems.id,
				name: priceItems.name,
				unit: priceItems.unit,
				price: priceItems.price,
				minCharge: priceItems.minCharge,
				resellerPrice: priceItems.resellerPrice
			})
			.from(priceItems)
			.where(eq(priceItems.isActive, true))
			.orderBy(asc(priceItems.sortOrder), asc(priceItems.name))
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const role = locals.user?.role;
		if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');

		const f = await request.formData();
		const pelangganId = String(f.get('pelangganId') ?? '');
		const namaBaru = String(f.get('namaBaru') ?? '').trim();
		const teleponBaru = String(f.get('teleponBaru') ?? '').trim();
		const description = String(f.get('description') ?? '').trim();
		const subtotal = Number(f.get('total') ?? 0);
		const discountTypeRaw = String(f.get('discountType') ?? '');
		const discountValue = Number(f.get('discountValue') ?? 0);
		const methodRaw = String(f.get('method') ?? '');
		const dibayar = Number(f.get('dibayar') ?? 0);
		const dueDate = String(f.get('dueDate') ?? '');
		const janjiSelesai = String(f.get('janjiSelesai') ?? '').trim();

		if (!description) return fail(400, { message: 'Deskripsi wajib diisi.' });
		if (!Number.isFinite(subtotal) || subtotal <= 0)
			return fail(400, { message: 'Subtotal harus lebih dari 0.' });
		if (!METODE_VALID.includes(methodRaw)) return fail(400, { message: 'Metode bayar tidak valid.' });
		const method = methodRaw as 'cash' | 'transfer' | 'qris' | 'piutang';

		// Diskon: Rp langsung atau % dari subtotal
		let discountType: 'rp' | 'pct' | null = null;
		let discountRp = 0;
		if (discountValue > 0) {
			if (discountTypeRaw === 'pct') {				if (!Number.isFinite(discountValue) || discountValue <= 0 || discountValue > 100)
					return fail(400, { message: 'Diskon % harus 1–100.' });
				discountType = 'pct';
				discountRp = Math.round((subtotal * discountValue) / 100);
			} else {
				if (!Number.isFinite(discountValue) || discountValue <= 0)
					return fail(400, { message: 'Diskon Rp harus lebih dari 0.' });
				discountType = 'rp';
				discountRp = Math.round(discountValue);
			}
			if (discountRp >= subtotal)
				return fail(400, { message: 'Diskon tidak boleh melebihi subtotal.' });
		}
		const total = subtotal - discountRp;

		if (!Number.isFinite(dibayar) || dibayar < 0)
			return fail(400, { message: 'Dibayar harus 0 atau lebih.' });
		// Non-cash tidak boleh lebih bayar; cash boleh (kembalian)
		if (method !== 'cash' && dibayar > total)
			return fail(400, { message: 'Dibayar melebihi total.' });
		const efektifDibayar = Math.min(dibayar, total);
		const kembalian = method === 'cash' ? Math.max(0, dibayar - total) : 0;

		// Janji selesai pengerjaan (opsional, format YYYY-MM-DD)
		if (janjiSelesai && !/^\d{4}-\d{2}-\d{2}$/.test(janjiSelesai))
			return fail(400, { message: 'Format janji selesai tidak valid.' });

		let customerId: number;
		if (pelangganId === 'baru') {
			if (!namaBaru) return fail(400, { message: 'Nama pelanggan baru wajib diisi.' });
			if (!teleponBaru) return fail(400, { message: 'Telepon pelanggan baru wajib diisi.' });
			const [row] = await db
				.insert(customers)
				.values({ name: namaBaru, phone: teleponBaru })
				.returning({ id: customers.id });
			customerId = row.id;
		} else {
			customerId = Number(pelangganId);
			if (!Number.isFinite(customerId)) return fail(400, { message: 'Pilih pelanggan.' });
			const ada = await db
				.select({ id: customers.id })
				.from(customers)
				.where(eq(customers.id, customerId));
			if (ada.length === 0) return fail(400, { message: 'Pelanggan tidak ditemukan.' });
		}

		const sisa = total - efektifDibayar;

		const [order] = await db
			.insert(orders)
			.values({
				code: buatKodeOrder(),
				customerId,
				description,
				subtotal,
				discountType,
				discountRp,
				total,
				kembalian,
				janjiSelesai: janjiSelesai || null,
				status: 'baru'
			})
			.returning({ id: orders.id, code: orders.code });

		if (efektifDibayar > 0) {
			await db.insert(payments).values({ orderId: order.id, method, amount: efektifDibayar });
		}

		if (sisa > 0) {
			await db.insert(receivables).values({
				customerId,
				orderId: order.id,
				amount: total,
				paidAmount: efektifDibayar,
				dueDate: (dueDate || defaultDueDate()) + 'T00:00:00.000Z',
				status: 'belum_lunas'
			});
		}

		// Push ke admin: order baru masuk
		const [cust] = await db
			.select({ name: customers.name })
			.from(customers)
			.where(eq(customers.id, customerId));
		notifyAdmins(
			`<b>Order baru ${order.code ?? `#${order.id}`}</b>\n${esc(description)}\n${esc(cust?.name ?? '-')} • <b>${rupiah(total)}</b> • ${method}`
		).catch(() => {});

		throw redirect(303, `/kasir/invoice/${order.id}`);
	}
};
