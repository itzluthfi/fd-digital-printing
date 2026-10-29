import { describe, expect, it, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../../src/lib/server/db/schema';

describe('Database & Orders Flow (Integration Test)', () => {
	let sqlite: Database;
	let db: ReturnType<typeof drizzle>;

	beforeEach(() => {
		// Gunakan database SQLite in-memory murni untuk isolasi setiap tes
		sqlite = new Database(':memory:');
		db = drizzle(sqlite, { schema });

		// Buat skema tabel sesuai arsitektur Drizzle
		sqlite.run(`
			CREATE TABLE customers (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				phone TEXT NOT NULL,
				email TEXT,
				telegram_chat_id TEXT,
				notes TEXT,
				created_at TEXT NOT NULL
			);
		`);

		sqlite.run(`
			CREATE TABLE orders (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				code TEXT UNIQUE,
				customer_id INTEGER REFERENCES customers(id),
				description TEXT NOT NULL,
				file_url TEXT,
				status TEXT NOT NULL DEFAULT 'baru',
				subtotal REAL NOT NULL DEFAULT 0,
				discount_type TEXT,
				discount_rp REAL NOT NULL DEFAULT 0,
				total REAL NOT NULL DEFAULT 0,
				kembalian REAL NOT NULL DEFAULT 0,
				janji_selesai TEXT,
				created_at TEXT NOT NULL
			);
		`);

		sqlite.run(`
			CREATE TABLE payments (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				order_id INTEGER REFERENCES orders(id),
				method TEXT NOT NULL,
				amount REAL NOT NULL,
				paid_at TEXT NOT NULL
			);
		`);

		sqlite.run(`
			CREATE TABLE price_items (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				category TEXT,
				image_url TEXT,
				unit TEXT NOT NULL DEFAULT 'pcs',
				price REAL NOT NULL DEFAULT 0,
				is_active INTEGER NOT NULL DEFAULT 1,
				sort_order INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL
			);
		`);
	});

	it('berhasil menyimpan pelanggan baru (Customer Registration)', async () => {
		const newCustomer = {
			name: 'Budi Santoso',
			phone: '081234567890',
			email: 'budi@example.com',
			notes: 'Langganan spanduk warung',
			createdAt: new Date().toISOString()
		};

		const inserted = await db.insert(schema.customers).values(newCustomer).returning();
		expect(inserted).toHaveLength(1);
		expect(inserted[0].id).toBe(1);
		expect(inserted[0].name).toBe('Budi Santoso');

		const fetched = await db
			.select()
			.from(schema.customers)
			.where(eq(schema.customers.id, inserted[0].id));
		expect(fetched[0].phone).toBe('081234567890');
	});

	it('mengelola siklus order cetak dan relasi pembayarannya (Order Lifecycle)', async () => {
		// 1. Simpan Customer
		const [cust] = await db
			.insert(schema.customers)
			.values({
				name: 'Ahmad Offset',
				phone: '085700001111',
				createdAt: new Date().toISOString()
			})
			.returning();

		// 2. Buat Order baru dengan status 'baru'
		const [ord] = await db
			.insert(schema.orders)
			.values({
				code: 'ORD-20261029-001',
				customerId: cust.id,
				description: 'Cetak Spanduk 3x1 m (Flexi Korea)',
				status: 'baru',
				subtotal: 75000,
				total: 75000,
				createdAt: new Date().toISOString()
			})
			.returning();

		expect(ord.status).toBe('baru');
		expect(ord.total).toBe(75000);

		// 3. Update Status Order menjadi 'diproses' -> 'selesai'
		await db
			.update(schema.orders)
			.set({ status: 'diproses' })
			.where(eq(schema.orders.id, ord.id));

		let [updated] = await db
			.select()
			.from(schema.orders)
			.where(eq(schema.orders.id, ord.id));
		expect(updated.status).toBe('diproses');

		await db
			.update(schema.orders)
			.set({ status: 'selesai' })
			.where(eq(schema.orders.id, ord.id));

		[updated] = await db
			.select()
			.from(schema.orders)
			.where(eq(schema.orders.id, ord.id));
		expect(updated.status).toBe('selesai');

		// 4. Catat Pembayaran QRIS Lunas
		await db.insert(schema.payments).values({
			orderId: ord.id,
			method: 'qris',
			amount: 75000,
			paidAt: new Date().toISOString()
		});

		const paidList = await db
			.select()
			.from(schema.payments)
			.where(eq(schema.payments.orderId, ord.id));
		expect(paidList).toHaveLength(1);
		expect(paidList[0].amount).toBe(75000);
		expect(paidList[0].method).toBe('qris');
	});

	it('dapat mengelola katalog produk cetak (Price Items)', async () => {
		await db.insert(schema.priceItems).values([
			{
				name: 'Flexi Frontlite 280gr',
				category: 'Outdoor',
				unit: 'meter',
				price: 18000,
				isActive: true,
				createdAt: new Date().toISOString()
			},
			{
				name: 'Stiker Vinyl Glossy A3+',
				category: 'Indoor',
				unit: 'lembar',
				price: 10000,
				isActive: true,
				createdAt: new Date().toISOString()
			}
		]);

		const activeItems = await db
			.select()
			.from(schema.priceItems)
			.where(eq(schema.priceItems.isActive, true));

		expect(activeItems).toHaveLength(2);
		expect(activeItems.map((i) => i.name)).toContain('Flexi Frontlite 280gr');
	});
});

