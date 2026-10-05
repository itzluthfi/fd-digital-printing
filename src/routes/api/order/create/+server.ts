import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { customers, orders, priceItems } from '#lib/server/db/schema';
import { buatKodeOrder } from '#lib/server/order-code';
import { esc, notifyAdmins } from '#lib/server/bot/api';
import { rupiah } from '#lib/format';
import { decodeProductId } from '#lib/products';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const rawId = body.productId;
		let productId: number | null = null;

		if (typeof rawId === 'number') {
			productId = rawId;
		} else if (typeof rawId === 'string') {
			productId = /^\d+$/.test(rawId) ? Number(rawId) : decodeProductId(rawId);
		}

		if (!productId) {
			return json({ success: false, message: 'ID produk tidak valid' }, { status: 400 });
		}

		const nama = String(body.nama ?? '').trim();
		const telepon = String(body.telepon ?? '').trim().replace(/[^0-9+]/g, '');
		const email = String(body.email ?? '').trim();
		const fileUrl = String(body.fileUrl ?? '').trim();
		const notes = String(body.notes ?? '').trim();
		const finishing = String(body.finishing ?? '').trim();
		const panjang = Number(body.panjang ?? 1);
		const lebar = Number(body.lebar ?? 1);
		const qty = Math.max(1, Number(body.qty ?? 1));

		if (!nama) return json({ success: false, message: 'Nama lengkap wajib diisi.' }, { status: 400 });
		if (!telepon || telepon.length < 8) {
			return json({ success: false, message: 'Nomor WhatsApp tidak valid.' }, { status: 400 });
		}

		const [item] = await db.select().from(priceItems).where(eq(priceItems.id, productId)).limit(1);
		if (!item) return json({ success: false, message: 'Produk tidak ditemukan.' }, { status: 404 });

		// Hitung subtotal & total
		let calculatedSubtotal = 0;
		if (item.unit === 'meter') {
			const p = Math.max(0.1, panjang);
			const l = Math.max(0.1, lebar);
			const luasM2 = Math.max(1, p * l);
			calculatedSubtotal = Math.round(item.price * luasM2 * qty);
		} else {
			calculatedSubtotal = Math.round(item.price * qty);
		}

		if (calculatedSubtotal <= 0) {
			return json({ success: false, message: 'Total harga tidak valid.' }, { status: 400 });
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

		const code = buatKodeOrder();

		// Rincian deskripsi
		let desc = '';
		if (item.unit === 'meter') {
			desc = `${item.name} (${panjang}x${lebar}m) x ${qty} pcs`;
		} else {
			desc = `${item.name} x ${qty} ${item.unit}`;
		}
		if (finishing) {
			desc += ` [Finishing: ${finishing}]`;
		}

		await db.insert(orders).values({
			code,
			customerId,
			description: desc,
			fileUrl: fileUrl || null,
			status: 'baru',
			subtotal: calculatedSubtotal,
			total: calculatedSubtotal,
			discountRp: 0
		});

		// Push notifikasi ke Admin Telegram
		try {
			const tgMsg =
				`<b>[ORDER PRODUK VIA WEB]</b>\n` +
				`Kode: <code>${code}</code>\n` +
				`Pelanggan: <b>${esc(nama)}</b> (${esc(telepon)})\n\n` +
				`<b>Item Pesanan:</b>\n` +
				`• ${esc(desc)} = <b>${rupiah(calculatedSubtotal)}</b>\n\n` +
				`Total: <b>${rupiah(calculatedSubtotal)}</b>\n` +
				`Metode: <b>QRIS DINAMIS</b>\n` +
				(fileUrl ? `File/Desain: ${esc(fileUrl)}\n` : `File: <i>Belum ada / kirim via WA</i>\n`) +
				(notes ? `Catatan: ${esc(notes)}\n` : '') +
				`\nStatus: <b>Menunggu Pembayaran / Validasi Kasir</b>`;

			await notifyAdmins(tgMsg);
		} catch (err) {
			console.error('[order create api] Gagal kirim telegram:', err);
		}

		// Integrasi GoQRIS (jika GOQRIS_API_KEY terpasang)
		let goqrisData: Record<string, unknown> | null = null;
		try {
			const { createGoQrisTransaction } = await import('#lib/server/goqris');
			const gqRes = await createGoQrisTransaction({
				amount: calculatedSubtotal,
				orderCode: code,
				itemName: `${item.name} (${code})`,
				customerName: nama,
				customerPhone: telepon
			});
			if (gqRes?.success && gqRes?.data) {
				goqrisData = gqRes.data as Record<string, unknown>;
			}
		} catch (gqErr) {
			console.warn('[order create] Gagal generate GoQRIS:', gqErr);
		}

		return json({
			success: true,
			orderCode: code,
			total: calculatedSubtotal,
			goqris: goqrisData
		});
	} catch (err) {
		console.error('[order create api] Error:', err);
		return json({ success: false, message: 'Gagal membuat pesanan.' }, { status: 500 });
	}
};
