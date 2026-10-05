import { and, gte, sql } from 'drizzle-orm';
import { db } from '#lib/server/db';
import { orders, payments } from '#lib/server/db/schema';

/**
 * Sequential Unique Code Generator (Sistem Collision-Free Recycling ala Digitz-Shop)
 *
 * Mengalokasikan kode unik urut terkecil (+1 s/d +999).
 * - Transaksi PENDING ('baru') hanya mengunci slot selama jendela 20 menit.
 * - Pembayaran PAID yang terjadi < 45 menit lalu dijaga agar mutasi tidak bentrok.
 * - Jika tidak ada bentrok pada nominal yang sama, pelanggan selalu mendapatkan +1 Rp!
 */
export async function getNextSequentialUniqueCode(subtotal: number): Promise<{ uniqueCode: number; total: number }> {
	// Khusus subtotal 0 (mis. item demo/test Rp 0), total cukup Rp 1
	if (subtotal <= 0) {
		return { uniqueCode: 1, total: 1 };
	}

	const now = new Date();
	const windowPendingIso = new Date(now.getTime() - 20 * 60 * 1000).toISOString();
	const windowPaidIso = new Date(now.getTime() - 45 * 60 * 1000).toISOString();

	// Ambil semua total transaksi pending yang aktif
	const pendingOrders = await db
		.select({ total: orders.total })
		.from(orders)
		.where(
			and(
				sql`${orders.status} = 'baru'`,
				gte(orders.createdAt, windowPendingIso)
			)
		);

	// Ambil semua mutasi pembayaran dalam 45 menit terakhir
	const recentPayments = await db
		.select({ amount: payments.amount })
		.from(payments)
		.where(gte(payments.paidAt, windowPaidIso));

	const usedTotals = new Set<number>();
	for (const o of pendingOrders) {
		if (o.total) usedTotals.add(Math.round(o.total));
	}
	for (const p of recentPayments) {
		if (p.amount) usedTotals.add(Math.round(p.amount));
	}

	// Cari urutan kode unik terkecil yang belum terpakai (mulai dari +1 sampai +999)
	for (let code = 1; code <= 999; code++) {
		const candidateTotal = subtotal + code;
		if (!usedTotals.has(candidateTotal)) {
			return { uniqueCode: code, total: candidateTotal };
		}
	}

	// Fallback jika slot 1..999 penuh (sangat jarang)
	const fallback = Math.floor(Math.random() * 999) + 1;
	return { uniqueCode: fallback, total: subtotal + fallback };
}
