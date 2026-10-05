import { error, fail, redirect } from '@sveltejs/kit';
import { asc, eq, ne } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

import { db } from '#lib/server/db';
import { customers, orders, priceItems } from '#lib/server/db/schema';
import { buatKodeOrder } from '#lib/server/order-code';
import { esc, notifyAdmins } from '#lib/server/bot/api';
import { QRIS_URL } from '#lib/server/settings';
import { rupiah } from '#lib/format';
import { decodeProductId, getProductSlug, getProductUrl, slugify } from '#lib/products';

export const load: PageServerLoad = async ({ params, locals }) => {
	const rawParam = params.id.trim();
	let productId: number | null = null;
	let shouldRedirectToCanonical = false;

	// 1. Cek apakah ini raw integer ID (/produk/1)
	if (/^\d+$/.test(rawParam)) {
		productId = Number(rawParam);
		shouldRedirectToCanonical = true;
	} else {
		// 2. Dekripsi token obfuscated (/produk/cetak-banner-mm-bohi2h)
		productId = decodeProductId(rawParam);
	}

	let item: typeof priceItems.$inferSelect | undefined;

	if (productId && Number.isFinite(productId)) {
		const [found] = await db
			.select()
			.from(priceItems)
			.where(eq(priceItems.id, productId))
			.limit(1);
		item = found;
	}

	// 3. Fallback jika nama slug dicari manual tanpa hash
	if (!item) {
		const allItems = await db.select().from(priceItems).where(eq(priceItems.isActive, true));
		item = allItems.find((p) => {
			const s = slugify(p.name);
			return rawParam === s || rawParam.startsWith(s + '-');
		});
		if (item) shouldRedirectToCanonical = true;
	}

	if (!item) throw error(404, 'Produk tidak ditemukan');

	// Keamanan & SEO: Redirect URL mentah /produk/1 ke URL slug terenkripsi
	const canonicalSlug = getProductSlug(item);
	if (shouldRedirectToCanonical || rawParam !== canonicalSlug) {
		throw redirect(301, `/produk/${canonicalSlug}`);
	}

	const rawOtherItems = await db
		.select({
			id: priceItems.id,
			name: priceItems.name,
			price: priceItems.price,
			unit: priceItems.unit,
			imageUrl: priceItems.imageUrl
		})
		.from(priceItems)
		.where(eq(priceItems.isActive, true))
		.limit(6);

	const otherItems = rawOtherItems.map((p) => ({
		...p,
		url: getProductUrl(p),
		slug: getProductSlug(p)
	}));

	return {
		item,
		otherItems,
		canonicalSlug,
		qrisUrl: QRIS_URL,
		user: locals.user
	};
};

export const actions: Actions = {
	checkout: async ({ request, params }) => {
		const f = await request.formData();
		const rawParam = params.id.trim();
		let id = /^\d+$/.test(rawParam) ? Number(rawParam) : decodeProductId(rawParam);

		if (!id) {
			const allItems = await db.select().from(priceItems).where(eq(priceItems.isActive, true));
			const found = allItems.find((p) => rawParam.includes(slugify(p.name)));
			if (found) id = found.id;
		}

		const nama = String(f.get('nama') ?? '').trim();
		const telepon = String(f.get('telepon') ?? '').trim().replace(/[^0-9+]/g, '');
		const email = String(f.get('email') ?? '').trim();
		const fileUrl = String(f.get('fileUrl') ?? '').trim();
		const notes = String(f.get('notes') ?? '').trim();
		const finishing = String(f.get('finishing') ?? '').trim();
		const panjang = Number(f.get('panjang') ?? 1);
		const lebar = Number(f.get('lebar') ?? 1);
		const qty = Math.max(1, Number(f.get('qty') ?? 1));
		const paymentMethod = String(f.get('paymentMethod') ?? 'qris');

		if (!nama) return fail(400, { message: 'Nama lengkap wajib diisi.' });
		if (!telepon || telepon.length < 8) return fail(400, { message: 'Nomor WhatsApp tidak valid.' });
		if (!id) return fail(404, { message: 'Produk tidak ditemukan.' });

		const [item] = await db.select().from(priceItems).where(eq(priceItems.id, id)).limit(1);
		if (!item) return fail(404, { message: 'Produk tidak ditemukan.' });

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

		if (calculatedSubtotal <= 0) return fail(400, { message: 'Total harga tidak valid.' });

		// Customer
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
				`<b>[ORDER PRODUK BARU]</b>\n` +
				`Kode: <code>${code}</code>\n` +
				`Pelanggan: <b>${esc(nama)}</b> (${esc(telepon)})\n\n` +
				`<b>Layanan:</b>\n` +
				`• ${esc(desc)} = <b>${rupiah(calculatedSubtotal)}</b>\n\n` +
				`Total: <b>${rupiah(calculatedSubtotal)}</b>\n` +
				`Metode: <b>${paymentMethod.toUpperCase()}</b>\n` +
				(fileUrl ? `File/Desain: ${esc(fileUrl)}\n` : `File: <i>Belum ada / dibantu toko</i>\n`) +
				(notes ? `Catatan: ${esc(notes)}\n` : '') +
				`\nStatus: <b>Baru (Menunggu Konfirmasi)</b>`;

			await notifyAdmins(tgMsg);
		} catch (err) {
			console.error('[produk checkout] Gagal kirim telegram:', err);
		}

		throw redirect(303, `/pesan/sukses/${code}`);
	}
};
