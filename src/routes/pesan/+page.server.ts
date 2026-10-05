import { fail, redirect } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

import { db } from '#lib/server/db';
import { customers, orders, priceItems } from '#lib/server/db/schema';
import { buatKodeOrder } from '#lib/server/order-code';
import { esc, notifyAdmins } from '#lib/server/bot/api';
import { QRIS_URL, qrisTersedia } from '#lib/server/settings';
import { rupiah } from '#lib/format';

export const load: PageServerLoad = async () => {
	const items = await db
		.select({
			id: priceItems.id,
			name: priceItems.name,
			category: priceItems.category,
			unit: priceItems.unit,
			price: priceItems.price
		})
		.from(priceItems)
		.where(eq(priceItems.isActive, true))
		.orderBy(asc(priceItems.sortOrder), asc(priceItems.name));

	return {
		items,
		qrisTersedia: qrisTersedia(),
		qrisUrl: QRIS_URL
	};
};

export const actions: Actions = {
	checkout: async ({ request }) => {
		const f = await request.formData();
		const nama = String(f.get('nama') ?? '').trim();
		const telepon = String(f.get('telepon') ?? '').trim().replace(/[^0-9+]/g, '');
		const email = String(f.get('email') ?? '').trim();
		const fileUrl = String(f.get('fileUrl') ?? '').trim();
		const notes = String(f.get('notes') ?? '').trim();
		const paymentMethod = String(f.get('paymentMethod') ?? 'qris');
		const cartJson = String(f.get('cartItems') ?? '[]');

		if (!nama) return fail(400, { message: 'Nama lengkap wajib diisi.' });
		if (!telepon || telepon.length < 8) return fail(400, { message: 'Nomor WhatsApp tidak valid.' });

		let cart: Array<{
			name: string;
			unit: string;
			price: number;
			panjang?: number;
			lebar?: number;
			qty: number;
			subtotal: number;
		}> = [];

		try {
			cart = JSON.parse(cartJson);
		} catch {
			return fail(400, { message: 'Format keranjang belanja tidak valid.' });
		}

		if (!Array.isArray(cart) || cart.length === 0) {
			return fail(400, { message: 'Keranjang belanja masih kosong. Pilih produk terlebih dahulu.' });
		}

		const grandTotal = cart.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);
		if (grandTotal <= 0) {
			return fail(400, { message: 'Total pesanan harus lebih dari Rp 0.' });
		}

		// Cari atau buat customer
		const [existingCustomer] = await db
			.select()
			.from(customers)
			.where(eq(customers.phone, telepon))
			.limit(1);

		let customerId: number;
		if (existingCustomer) {
			customerId = existingCustomer.id;
			if (email && !existingCustomer.email) {
				await db.update(customers).set({ email }).where(eq(customers.id, customerId));
			}
		} else {
			const [inserted] = await db
				.insert(customers)
				.values({
					name: nama,
					phone: telepon,
					email: email || null
				})
				.returning({ id: customers.id });
			customerId = inserted.id;
		}

		// Generate kode unik order
		const code = buatKodeOrder();

		// Rincian deskripsi
		const descLines = cart.map((it) => {
			if (it.unit === 'meter' && it.panjang && it.lebar) {
				return `${it.name} (${it.panjang}x${it.lebar}m) x ${it.qty} = ${rupiah(it.subtotal)}`;
			}
			return `${it.name} x ${it.qty} ${it.unit} = ${rupiah(it.subtotal)}`;
		});
		const fullDescription = descLines.join('; ');

		// Insert order
		await db.insert(orders).values({
			code,
			customerId,
			description: fullDescription,
			fileUrl: fileUrl || null,
			status: 'baru',
			subtotal: grandTotal,
			total: grandTotal,
			discountRp: 0
		});

		// Push notifikasi ke Admin Telegram Toko
		try {
			const tgLines = cart.map((it) => {
				if (it.unit === 'meter' && it.panjang && it.lebar) {
					return `• ${esc(it.name)} (${it.panjang}x${it.lebar}m) x ${it.qty} = <b>${rupiah(it.subtotal)}</b>`;
				}
				return `• ${esc(it.name)} x ${it.qty} ${it.unit} = <b>${rupiah(it.subtotal)}</b>`;
			});

			const tgMsg =
				`<b>[ORDER WEB BARU]</b>\n` +
				`Kode: <code>${code}</code>\n` +
				`Pelanggan: <b>${esc(nama)}</b> (${esc(telepon)})\n\n` +
				`<b>Rincian Item:</b>\n` +
				`${tgLines.join('\n')}\n\n` +
				`Total: <b>${rupiah(grandTotal)}</b>\n` +
				`Metode: <b>${paymentMethod.toUpperCase()}</b>\n` +
				(fileUrl ? `File/Desain: ${esc(fileUrl)}\n` : `File: <i>Belum ada / dibantu toko</i>\n`) +
				(notes ? `Catatan: ${esc(notes)}\n` : '') +
				`\nStatus: <b>Baru (Menunggu Konfirmasi)</b>`;

			await notifyAdmins(tgMsg);
		} catch (err) {
			console.error('[checkout] Gagal kirim notifikasi telegram:', err);
		}

		throw redirect(303, `/pesan/sukses/${code}`);
	}
};
