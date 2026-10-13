import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { customers, orders, priceItems } from '#lib/server/db/schema';
import { buatKodeOrder } from '#lib/server/order-code';
import { esc, notifyAdmins } from '#lib/server/bot/api';
import { rupiah } from '#lib/format';
import { decodeProductId } from '#lib/products';
import { getNextSequentialUniqueCode } from '#lib/server/unique-code';

// In-Memory Rate Limiter per Client IP (Maksimal 15 order per 60 detik)
const ipOrderRateLimit = new Map<string, { count: number; resetTime: number }>();

function checkOrderRateLimit(ip: string): boolean {
	const now = Date.now();
	const record = ipOrderRateLimit.get(ip);

	if (!record || now > record.resetTime) {
		ipOrderRateLimit.set(ip, { count: 1, resetTime: now + 60_000 });
		return true;
	}

	if (record.count >= 15) {
		return false;
	}

	record.count++;
	return true;
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		// 🛡️ Lapisan 1: Rate Limiting per-IP (Anti-DoS / Anti-Spam)
		let clientIp = 'unknown';
		try {
			clientIp = getClientAddress() || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
		} catch (_) {
			clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
		}

		if (!checkOrderRateLimit(clientIp)) {
			console.warn(`[order create] Rate limit exceeded from IP: ${clientIp}`);
			return json(
				{ success: false, message: 'Terlalu banyak permintaan order dalam waktu singkat. Silakan tunggu 1 menit.' },
				{ status: 429 }
			);
		}

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

		const nama = String(body.nama ?? '').trim().slice(0, 100);
		const telepon = String(body.telepon ?? '').trim().replace(/[^0-9+]/g, '').slice(0, 20);
		const email = String(body.email ?? '').trim().slice(0, 100);
		const rawFileUrl = String(body.fileUrl ?? '').trim();
		const notes = String(body.notes ?? '').trim().slice(0, 500);
		const finishing = String(body.finishing ?? '').trim().slice(0, 100);

		// 🛡️ Lapisan 2: Strict Quantity Validation (Anti Negative / Float / Giant Integer)
		const rawQty = Number(body.qty);
		if (!Number.isInteger(rawQty) || rawQty < 1 || rawQty > 50000) {
			return json(
				{ success: false, message: 'Kuantitas (qty) harus berupa bilangan bulat positif (1 - 50.000).' },
				{ status: 400 }
			);
		}
		const qty = rawQty;

		// 🛡️ Lapisan 3: Strict Metric Bounds (Panjang & Lebar 0.1m - 50m)
		const rawPanjang = Number(body.panjang ?? 1);
		const rawLebar = Number(body.lebar ?? 1);
		if (isNaN(rawPanjang) || isNaN(rawLebar) || rawPanjang <= 0 || rawLebar <= 0) {
			return json({ success: false, message: 'Ukuran panjang dan lebar harus berupa angka positif.' }, { status: 400 });
		}
		const panjang = Math.min(50, Math.max(0.1, Number(rawPanjang.toFixed(2))));
		const lebar = Math.min(50, Math.max(0.1, Number(rawLebar.toFixed(2))));

		// 🛡️ Lapisan 4: Anti-Stored XSS Link Sanitizer untuk fileUrl
		let cleanFileUrl: string | null = null;
		if (rawFileUrl) {
			// Hanya izinkan protokol aman http:// atau https://
			if (/^https?:\/\//i.test(rawFileUrl) && !/[<>"'`;\s]/i.test(rawFileUrl)) {
				cleanFileUrl = rawFileUrl.slice(0, 500);
			} else {
				return json(
					{ success: false, message: 'Format tautan file tidak aman. Harus diawali dengan http:// atau https://' },
					{ status: 400 }
				);
			}
		}

		if (!nama) return json({ success: false, message: 'Nama lengkap wajib diisi.' }, { status: 400 });
		if (!telepon || telepon.length < 8) {
			return json({ success: false, message: 'Nomor WhatsApp tidak valid (minimal 8 digit).' }, { status: 400 });
		}

		const [item] = await db.select().from(priceItems).where(eq(priceItems.id, productId)).limit(1);
		if (!item) return json({ success: false, message: 'Produk tidak ditemukan.' }, { status: 404 });

		// Hitung subtotal & total
		let calculatedSubtotal = 0;
		if (item.unit === 'meter') {
			const luasM2 = Math.max(1, panjang * lebar);
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

		// Alokasikan kode unik urut (+1 s/d +999) ala Digitz-Shop
		const { uniqueCode, total: calculatedTotal } = await getNextSequentialUniqueCode(calculatedSubtotal);

		await db.insert(orders).values({
			code,
			customerId,
			description: desc,
			fileUrl: cleanFileUrl,
			status: 'baru',
			subtotal: calculatedSubtotal,
			total: calculatedTotal,
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
				(cleanFileUrl ? `File/Desain: ${esc(cleanFileUrl)}\n` : `File: <i>Belum ada / kirim via WA</i>\n`) +
				(notes ? `Catatan: ${esc(notes)}\n` : '') +
				`\nStatus: <b>Menunggu Pembayaran / Validasi Kasir</b>`;

			await notifyAdmins(tgMsg);
		} catch (err) {
			console.error('[order create api] Gagal kirim telegram:', err);
		}

		// Integrasi GoQRIS (jika GOQRIS_API_KEY terpasang)
		let goqrisData: Record<string, unknown> | null = null;
		let goqrisError: string | null = null;
		try {
			const { createGoQrisTransaction } = await import('#lib/server/goqris');
			const gqRes = await createGoQrisTransaction({
				amount: calculatedTotal,
				orderCode: code,
				itemName: `${item.name} (${code})`,
				customerName: nama,
				customerPhone: telepon
			});
			if (gqRes?.success && gqRes?.data) {
				goqrisData = gqRes.data as Record<string, unknown>;
			} else {
				goqrisError = gqRes?.message || 'GoQRIS belum merespons';
				console.warn('[order create] GoQRIS gagal:', goqrisError);
			}
		} catch (gqErr) {
			goqrisError = String(gqErr);
			console.warn('[order create] Gagal generate GoQRIS:', gqErr);
		}

		return json({
			success: true,
			orderCode: code,
			subtotal: calculatedSubtotal,
			uniqueCode,
			total: calculatedTotal,
			goqris: goqrisData,
			goqrisError
		});
	} catch (err) {
		console.error('[order create api] Error:', err);
		return json({ success: false, message: 'Gagal membuat pesanan.' }, { status: 500 });
	}
};
