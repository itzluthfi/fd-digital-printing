/**
 * Seeder data dummy FD Digital Printing.
 * Data realistis toko printing: pelanggan, order, pembayaran, piutang.
 * Idempotent: hapus semua data dulu baru isi ulang (khusus dev).
 *
 * Jalankan: bun run db:seed
 */
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';

import { customers, orders, payments, priceItems, receivables } from './schema';

const sqlite = new Database(process.env.DB_PATH ?? './data/app.db');
const db = drizzle(sqlite);

const DAY = 86_400_000;
const now = Date.now();
const iso = (t: number) => new Date(t).toISOString();
const daysAgo = (n: number) => iso(now - n * DAY);
const daysAhead = (n: number) => iso(now + n * DAY);

// Bersihkan dulu (urutan FK)
sqlite.exec('DELETE FROM payments; DELETE FROM receivables; DELETE FROM orders; DELETE FROM customers; DELETE FROM price_items;');

const customerRows = [
	{ name: 'Budi Santoso', phone: '081234567801', notes: 'Langganan, biasa cetak banner' },
	{ name: 'Siti Rahayu', phone: '081234567802', notes: null },
	{ name: 'PT Maju Bersama', phone: '081234567803', notes: 'Korporat, termin 14 hari' },
	{ name: 'Andi Wijaya', phone: '081234567804', notes: null },
	{ name: 'Dewi Lestari', phone: '081234567805', notes: 'Reseller undangan' },
	{ name: 'Toko Berkah Jaya', phone: '081234567806', notes: 'Langganan stiker' },
	{ name: 'Rina Marlina', phone: '081234567807', notes: null },
	{ name: 'Hendra Gunawan', phone: '081234567808', notes: 'Kredit offline, maks 3 hari' }
];

const customerIds: number[] = [];
for (const c of customerRows) {
	const r = db.insert(customers).values({ ...c, createdAt: daysAgo(60) }).returning({ id: customers.id }).get();
	customerIds.push(r.id);
}
const [budi, siti, maju, andi, dewi, berkah, rina, hendra] = customerIds;

type OrderSeed = {
	customer: number;
	description: string;
	status: 'baru' | 'diproses' | 'selesai' | 'diambil';
	total: number;
	createdDaysAgo: number;
	pay?: { method: 'cash' | 'transfer' | 'qris' | 'piutang'; amount: number; paidDaysAgo: number }[];
	receivable?: { amount: number; paidAmount: number; dueInDays: number; status: 'belum_lunas' | 'lunas' };
};

const orderSeeds: OrderSeed[] = [
	{ customer: budi, description: 'Cetak banner 3x2m — grand opening', status: 'diambil', total: 450000, createdDaysAgo: 6, pay: [{ method: 'qris', amount: 450000, paidDaysAgo: 6 }] },
	{ customer: siti, description: 'Cetak brosur A4 500 lbr', status: 'diambil', total: 750000, createdDaysAgo: 5, pay: [{ method: 'transfer', amount: 750000, paidDaysAgo: 5 }] },
	{ customer: maju, description: 'Cetak kartu nama 10 box + kop surat', status: 'selesai', total: 1200000, createdDaysAgo: 4, pay: [{ method: 'piutang', amount: 500000, paidDaysAgo: 4 }], receivable: { amount: 1200000, paidAmount: 500000, dueInDays: 10, status: 'belum_lunas' } },
	{ customer: andi, description: 'Cetak stiker vinyl 100 pcs', status: 'diambil', total: 300000, createdDaysAgo: 4, pay: [{ method: 'cash', amount: 300000, paidDaysAgo: 4 }] },
	{ customer: dewi, description: 'Cetak undangan 200 pcs', status: 'diproses', total: 600000, createdDaysAgo: 2 },
	{ customer: berkah, description: 'Cetak paper bag 200 pcs', status: 'diproses', total: 900000, createdDaysAgo: 2, pay: [{ method: 'piutang', amount: 0, paidDaysAgo: 2 }], receivable: { amount: 900000, paidAmount: 0, dueInDays: -2, status: 'belum_lunas' } },
	{ customer: rina, description: 'Cetak poster A3 50 lbr', status: 'baru', total: 250000, createdDaysAgo: 1 },
	{ customer: hendra, description: 'Cetak spanduk 5x1m', status: 'selesai', total: 375000, createdDaysAgo: 1, pay: [{ method: 'piutang', amount: 0, paidDaysAgo: 1 }], receivable: { amount: 375000, paidAmount: 0, dueInDays: 2, status: 'belum_lunas' } },
	{ customer: budi, description: 'Cetak X-banner 2 pcs', status: 'baru', total: 240000, createdDaysAgo: 0 },
	{ customer: siti, description: 'Cetak kalender dinding 2027 — 100 pcs', status: 'diambil', total: 1500000, createdDaysAgo: 10, pay: [{ method: 'transfer', amount: 1500000, paidDaysAgo: 3 }], receivable: { amount: 1500000, paidAmount: 1500000, dueInDays: -3, status: 'lunas' } },
	{ customer: maju, description: 'Cetak company profile 50 buku', status: 'diambil', total: 2500000, createdDaysAgo: 12, pay: [{ method: 'transfer', amount: 1000000, paidDaysAgo: 12 }, { method: 'transfer', amount: 1500000, paidDaysAgo: 8 }] },
	{ customer: dewi, description: 'Cetak amplop kondangan 300 pcs', status: 'diambil', total: 450000, createdDaysAgo: 3, pay: [{ method: 'qris', amount: 450000, paidDaysAgo: 3 }] }
];

let orderCount = 0, paymentCount = 0, receivableCount = 0;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let seedCodeN = 0;
const seedCode = () => `FD-${String(++seedCodeN).padStart(4, '0')}${CHARS[seedCodeN % CHARS.length]}${CHARS[(seedCodeN * 7) % CHARS.length]}`;
for (const o of orderSeeds) {
	const inserted = db.insert(orders).values({
		code: seedCode(),
		customerId: o.customer,
		description: o.description,
		status: o.status,
		total: o.total,
		createdAt: daysAgo(o.createdDaysAgo)
	}).returning({ id: orders.id }).get();
	orderCount++;

	for (const p of o.pay ?? []) {
		if (p.amount <= 0) continue;
		db.insert(payments).values({
			orderId: inserted.id,
			method: p.method,
			amount: p.amount,
			paidAt: daysAgo(p.paidDaysAgo)
		}).run();
		paymentCount++;
	}

	if (o.receivable) {
		db.insert(receivables).values({
			customerId: o.customer,
			orderId: inserted.id,
			amount: o.receivable.amount,
			paidAmount: o.receivable.paidAmount,
			dueDate: daysAhead(o.receivable.dueInDays),
			status: o.receivable.status,
			createdAt: daysAgo(o.createdDaysAgo)
		}).run();
		receivableCount++;
	}
}

console.log(`Seed selesai: ${customerRows.length} pelanggan, ${orderCount} order, ${paymentCount} pembayaran, ${receivableCount} piutang.`);

// Katalog harga contoh (toko printing)
const priceRows = [
	{ name: 'Cetak banner MM', category: 'Banner', unit: 'meter', price: 25000, sortOrder: 1 },
	{ name: 'Cetak banner Korea', category: 'Banner', unit: 'meter', price: 35000, sortOrder: 2 },
	{ name: 'Stiker vinyl', category: 'Stiker', unit: 'pcs', price: 5000, sortOrder: 3 },
	{ name: 'Stiker chromo', category: 'Stiker', unit: 'lembar', price: 15000, sortOrder: 4 },
	{ name: 'Brosur A4', category: 'Offset', unit: 'lembar', price: 1500, sortOrder: 5 },
	{ name: 'Kartu nama', category: 'Offset', unit: 'paket', price: 50000, sortOrder: 6 },
	{ name: 'Cetak foto', category: 'Foto', unit: 'lembar', price: 10000, sortOrder: 7 },
	{ name: 'Test Pembayaran QRIS', category: 'Testing', unit: 'pcs', price: 1, sortOrder: 8 }
] as const;
for (const p of priceRows) {
	db.insert(priceItems).values({ ...p, isActive: true, createdAt: daysAgo(60) }).run();
}
console.log(`Seed katalog: ${priceRows.length} item harga.`);
