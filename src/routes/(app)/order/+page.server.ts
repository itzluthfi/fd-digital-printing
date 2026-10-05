import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { STATUS_LABEL, STATUS_URUTAN } from '#lib/format';
import { db } from '#lib/server/db';
import { customers, orders } from '#lib/server/db/schema';
import { notifyCustomer } from '#lib/server/notify';
import { esc, notifyAdmins } from '#lib/server/bot/api';

const BOLEH = ['owner', 'admin', 'operator'];

export const load: PageServerLoad = async ({ locals }) => {
	const role = locals.user?.role ?? 'customer';
	if (!BOLEH.includes(role)) throw error(403, 'Akses ditolak');

	const rows = await db
		.select({
			id: orders.id,
			code: orders.code,
			description: orders.description,
			status: orders.status,
			total: orders.total,
			createdAt: orders.createdAt,
			customerName: customers.name,
			customerPhone: customers.phone
		})
		.from(orders)
		.leftJoin(customers, eq(orders.customerId, customers.id));

	// Urut: antrean dulu (baru → diproses → selesai → diambil), terbaru di atas
	rows.sort(
		(a, b) =>
			STATUS_URUTAN.indexOf(a.status) - STATUS_URUTAN.indexOf(b.status) ||
			b.createdAt.localeCompare(a.createdAt)
	);

	return { role, isOperator: role === 'operator', orders: rows };
};

export const actions: Actions = {
	/** Majukan status satu tahap: baru → diproses → selesai → diambil. */
	lanjut: async ({ request, locals }) => {
		const role = locals.user?.role;
		if (!role || !BOLEH.includes(role)) return fail(403, { message: 'Akses ditolak.' });

		const data = await request.formData();
		const id = Number(data.get('orderId'));
		if (!id) return fail(400, { message: 'Order tidak valid.' });

		const cur = await db
			.select({
				id: orders.id,
				code: orders.code,
				status: orders.status,
				description: orders.description,
				customerName: customers.name,
				customerPhone: customers.phone,
				customerEmail: customers.email,
				customerTelegramChatId: customers.telegramChatId
			})
			.from(orders)
			.leftJoin(customers, eq(orders.customerId, customers.id))
			.where(eq(orders.id, id))
			.get();
		if (!cur) return fail(404, { message: 'Order tidak ditemukan.' });

		const idx = STATUS_URUTAN.indexOf(cur.status);
		if (idx < 0 || idx >= STATUS_URUTAN.length - 1)
			return fail(400, { message: 'Order sudah di tahap akhir.' });
		const next = STATUS_URUTAN[idx + 1] as (typeof STATUS_URUTAN)[number];

		await db.update(orders).set({ status: next }).where(eq(orders.id, id));

		// Status menjadi 'selesai' → kabari pelanggan (satu pintu: Telegram/WA/email)
		if (next === 'selesai' && cur.customerName) {
			await notifyCustomer(
				{
					name: cur.customerName,
					phone: cur.customerPhone,
					email: cur.customerEmail,
					telegramChatId: cur.customerTelegramChatId
				},
				{
					title: 'Cetakan selesai',
					text: `Halo ${cur.customerName}, pesanan '${cur.description}' sudah SELESAI dan siap diambil di FD Digital Printing. Terima kasih.`
				},
				{ orderId: id }
			);
		}

		// Push ke admin: status order berubah
		notifyAdmins(
			`<b>Order #${id} → ${STATUS_LABEL[next]}</b>\n${esc(cur.description)} — ${esc(cur.customerName ?? '-')}`
		).catch(() => {});

		return { ok: true, orderId: id, status: next, label: STATUS_LABEL[next] };
	},

	/** Kirim ulang notifikasi "cetakan selesai" ke pelanggan (hanya untuk order selesai/diambil). */
	kirimUlang: async ({ request, locals }) => {
		const role = locals.user?.role;
		if (!role || !BOLEH.includes(role)) return fail(403, { message: 'Akses ditolak.' });

		const data = await request.formData();
		const id = Number(data.get('orderId'));
		if (!id) return fail(400, { message: 'Order tidak valid.' });

		const cur = await db
			.select({
				id: orders.id,
				code: orders.code,
				status: orders.status,
				description: orders.description,
				customerName: customers.name,
				customerPhone: customers.phone,
				customerEmail: customers.email,
				customerTelegramChatId: customers.telegramChatId
			})
			.from(orders)
			.leftJoin(customers, eq(orders.customerId, customers.id))
			.where(eq(orders.id, id))
			.get();
		if (!cur) return fail(404, { message: 'Order tidak ditemukan.' });
		if (cur.status !== 'selesai' && cur.status !== 'diambil')
			return fail(400, { message: 'Hanya order yang sudah selesai yang bisa dikirimi notifikasi ulang.' });
		if (!cur.customerName) return fail(400, { message: 'Order ini tidak punya data pelanggan.' });

		const hasil = await notifyCustomer(
			{
				name: cur.customerName,
				phone: cur.customerPhone,
				email: cur.customerEmail,
				telegramChatId: cur.customerTelegramChatId
			},
			{
				title: 'Cetakan selesai',
				text: `Halo ${cur.customerName}, pesanan '${cur.description}' sudah SELESAI dan siap diambil di FD Digital Printing. Terima kasih.`
			},
			{ orderId: id }
		);

		const terkirim = Object.values(hasil).filter(Boolean).length;
		if (terkirim === 0)
			return fail(400, {
				message: 'Tidak ada channel yang berhasil mengirim. Cek halaman Notifikasi untuk detailnya.'
			});
		return { ok: true, orderId: id, terkirim };
	}
};
