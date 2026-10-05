import { json } from '@sveltejs/kit';
import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db';
import { orders, payments } from '#lib/server/db/schema';
import { esc, notifyAdmins } from '#lib/server/bot/api';
import { rupiah } from '#lib/format';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'k9x2mPqR4nL7jW3vY6tZ1aB5cD0eFgh';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const rawBody = await request.text();
		const sigHeader = request.headers.get('x-goqris-signature') || '';
		const timestampHeader = request.headers.get('x-goqris-timestamp') || '';

		// Verifikasi Signature HMAC jika header tersedia
		if (sigHeader && WEBHOOK_SECRET) {
			try {
				let expectedSignature = '';
				if (sigHeader.includes('v1=')) {
					// Format t=<timestamp>,v1=<signature>
					const parts = sigHeader.split(',');
					const tPart = parts.find((p) => p.startsWith('t='))?.replace('t=', '') || timestampHeader;
					const v1Part = parts.find((p) => p.startsWith('v1='))?.replace('v1=', '') || '';
					const payloadToSign = `${tPart}.${rawBody}`;
					expectedSignature = crypto
						.createHmac('sha256', WEBHOOK_SECRET)
						.update(payloadToSign)
						.digest('hex');

					if (
						!v1Part ||
						v1Part.length !== expectedSignature.length ||
						!crypto.timingSafeEqual(Buffer.from(v1Part), Buffer.from(expectedSignature))
					) {
						console.warn('[webhook goqris] Invalid signature v1');
						return json({ success: false, message: 'Invalid signature' }, { status: 401 });
					}
				} else {
					// Format direct HMAC hex
					expectedSignature = crypto
						.createHmac('sha256', WEBHOOK_SECRET)
						.update(rawBody)
						.digest('hex');

					if (
						sigHeader.length !== expectedSignature.length ||
						!crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expectedSignature))
					) {
						console.warn('[webhook goqris] Invalid raw signature');
						return json({ success: false, message: 'Invalid signature' }, { status: 401 });
					}
				}
			} catch (err) {
				console.error('[webhook goqris] Error checking signature:', err);
				return json({ success: false, message: 'Signature verification error' }, { status: 401 });
			}
		}

		const data = JSON.parse(rawBody);
		const orderCode = String(data.order_id || data.orderId || data.code || '').trim();
		const amount = Number(data.amount || data.total || 0);
		const status = String(data.status || '').toUpperCase();

		console.log(`[webhook goqris] Menerima webhook untuk order ${orderCode}, status: ${status}, amount: ${amount}`);

		if (!orderCode) {
			return json({ success: false, message: 'order_id diperlukan' }, { status: 400 });
		}

		// Cari order berdasarkan kode
		const [order] = await db.select().from(orders).where(eq(orders.code, orderCode)).limit(1);
		if (!order) {
			console.warn(`[webhook goqris] Order ${orderCode} tidak ditemukan di database.`);
			return json({ success: false, message: 'Order tidak ditemukan' }, { status: 404 });
		}

		if (status === 'PAID' || status === 'SUCCESS') {
			// Cek apakah pembayaran sudah dicatat sebelumnya
			const existingPayments = await db
				.select()
				.from(payments)
				.where(eq(payments.orderId, order.id))
				.limit(1);

			if (existingPayments.length === 0) {
				// Catat pembayaran
				await db.insert(payments).values({
					orderId: order.id,
					method: 'qris',
					amount: amount || order.total,
					paidAt: new Date().toISOString()
				});

				// Update status order ke 'diproses'
				await db
					.update(orders)
					.set({ status: 'diproses' })
					.where(eq(orders.id, order.id));

				// Kirim notifikasi Telegram ke Admin
				try {
					await notifyAdmins(
						`<b>[PEMBAYARAN QRIS DITERIMA]</b>\n` +
							`Kode: <code>${order.code}</code>\n` +
							`Total: <b>${rupiah(amount || order.total)}</b>\n` +
							`Status: <b>Lunas (Diproses)</b>\n` +
							`Gateway: <b>GoQRIS Mutasi Otomatis</b>`
					);
				} catch (tgErr) {
					console.error('[webhook goqris] Gagal kirim notif telegram:', tgErr);
				}
			}
		}

		return json({ success: true, message: 'Webhook berhasil diproses' });
	} catch (error) {
		console.error('[webhook goqris] Error handling webhook:', error);
		return json({ success: false, message: 'Internal server error' }, { status: 500 });
	}
};
