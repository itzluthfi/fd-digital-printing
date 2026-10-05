import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { orders, payments } from '#lib/server/db/schema';
import { checkGoQrisPayment } from '#lib/server/goqris';
import { notifyAdmins } from '#lib/server/bot/api';
import { rupiah } from '#lib/format';

export const GET: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code')?.trim();
	if (!code) {
		return json({ success: false, message: 'Parameter code diperlukan' }, { status: 400 });
	}

	const [order] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
	if (!order) {
		return json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
	}

	// 1. Cek apakah ada record pembayaran sukses di tabel payments
	const paymentRows = await db
		.select()
		.from(payments)
		.where(eq(payments.orderId, order.id))
		.limit(1);

	let isPaid = ['diproses', 'selesai', 'diambil'].includes(order.status) || paymentRows.length > 0;
	let isCancelled = order.status === 'batal';
	let isExpired = order.status === 'kadaluarsa';

	// 2. Jika status masih 'baru' dan belum terverifikasi lunas:
	if (!isPaid && !isCancelled && !isExpired && order.code) {
		const elapsed = Date.now() - new Date(order.createdAt).getTime();
		const EXPIRY_MS = 15 * 60 * 1000; // Sesi QRIS: 15 menit

		// Cek realtime ke gateway GoQRIS
		try {
			const gqStatus = await checkGoQrisPayment(order.code, order.total);
			if (gqStatus?.success && gqStatus?.paid === true) {
				isPaid = true;

				// Simpan pembayaran ke database
				await db.insert(payments).values({
					orderId: order.id,
					method: 'qris',
					amount: order.total,
					paidAt: new Date().toISOString()
				});

				// Update order status ke 'diproses'
				await db.update(orders).set({ status: 'diproses' }).where(eq(orders.id, order.id));

				// Kirim notifikasi Telegram ke Admin
				try {
					await notifyAdmins(
						`<b>[PEMBAYARAN QRIS DITERIMA]</b>\n` +
							`Kode: <code>${order.code}</code>\n` +
							`Total: <b>${rupiah(order.total)}</b>\n` +
							`Status: <b>Lunas (Validasi Gateway)</b>\n` +
							`Gateway: <b>GoQRIS Auto-Mutasi</b>`
					);
				} catch (tgErr) {
					console.error('[status api] Gagal kirim telegram:', tgErr);
				}
			}
		} catch (err) {
			console.warn('[status api] Gagal cek GoQRIS realtime:', err);
		}

		// Jika tetap belum bayar dan sudah melewati 15 menit, otomatis tutup QRIS & tandai kadaluarsa
		if (!isPaid && elapsed > EXPIRY_MS) {
			isExpired = true;
			await db.update(orders).set({ status: 'kadaluarsa' }).where(eq(orders.id, order.id));
		}
	}

	const elapsedMs = Date.now() - new Date(order.createdAt).getTime();
	const remainingSec = Math.max(0, Math.floor((15 * 60 * 1000 - elapsedMs) / 1000));
	const finalStatus = isPaid
		? order.status === 'baru'
			? 'diproses'
			: order.status
		: isExpired
			? 'kadaluarsa'
			: isCancelled
				? 'batal'
				: order.status;

	return json({
		success: true,
		code: order.code,
		status: finalStatus,
		isPaid,
		isExpired,
		isCancelled,
		timeLeftSeconds: isPaid || isCancelled || isExpired ? 0 : remainingSec,
		total: order.total,
		createdAt: order.createdAt
	});
};
