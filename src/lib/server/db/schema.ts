import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Pelanggan (langganan & walk-in) */
export const customers = sqliteTable('customers', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	phone: text('phone').notNull(),
	email: text('email'),
	telegramChatId: text('telegram_chat_id'),
	notes: text('notes'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

/** Order cetakan: baru → diproses → selesai → diambil */
export const orders = sqliteTable('orders', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	code: text('code').unique(),
	customerId: integer('customer_id').references(() => customers.id),
	description: text('description').notNull(),
	fileUrl: text('file_url'),
	status: text('status', {
		enum: ['baru', 'diproses', 'selesai', 'diambil']
	})
		.notNull()
		.default('baru'),
	subtotal: real('subtotal').notNull().default(0),
	discountType: text('discount_type', { enum: ['rp', 'pct'] }),
	discountRp: real('discount_rp').notNull().default(0),
	total: real('total').notNull().default(0),
	kembalian: real('kembalian').notNull().default(0),
	/** Janji selesai pengerjaan (ISO date) — beda dari jatuh tempo piutang. */
	janjiSelesai: text('janji_selesai'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

/** Setiap pembayaran tercatat sekali — sumber kebenaran omzet */
export const payments = sqliteTable('payments', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	orderId: integer('order_id').references(() => orders.id),
	method: text('method', {
		enum: ['cash', 'transfer', 'qris', 'piutang']
	}).notNull(),
	amount: real('amount').notNull(),
	paidAt: text('paid_at').notNull().$defaultFn(() => new Date().toISOString())
});

/** Piutang: termin & kredit offline. Lunas = status berubah, BUKAN dihapus */
export const receivables = sqliteTable('receivables', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	customerId: integer('customer_id')
		.references(() => customers.id)
		.notNull(),
	orderId: integer('order_id').references(() => orders.id),
	amount: real('amount').notNull(),
	paidAmount: real('paid_amount').notNull().default(0),
	dueDate: text('due_date').notNull(),
	status: text('status', { enum: ['belum_lunas', 'lunas'] })
		.notNull()
		.default('belum_lunas'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

/** Log reminder piutang terkirim — cegah spam notifikasi ganda */
export const reminders = sqliteTable('reminders', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	receivableId: integer('receivable_id')
		.references(() => receivables.id)
		.notNull(),
	kind: text('kind', { enum: ['h-3', 'h-1', 'telat'] }).notNull(),
	sentAt: text('sent_at').notNull().$defaultFn(() => new Date().toISOString())
});

/** Log setiap percobaan pengiriman notifikasi — terlihat di halaman /notifikasi */
export const notificationLogs = sqliteTable('notification_logs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	channel: text('channel', { enum: ['telegram', 'whatsapp', 'email'] }).notNull(),
	target: text('target').notNull(),
	customerName: text('customer_name'),
	orderId: integer('order_id').references(() => orders.id),
	title: text('title').notNull(),
	status: text('status', { enum: ['sent', 'failed', 'skipped'] })
		.notNull()
		.default('skipped'),
	error: text('error'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

/** Katalog harga cetakan — dasar hitung otomatis di kasir */
export const priceItems = sqliteTable('price_items', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	category: text('category'),
	unit: text('unit', { enum: ['meter', 'pcs', 'lembar', 'paket'] })
		.notNull()
		.default('pcs'),
	price: real('price').notNull().default(0),
	/** Minimum charge per hitung (0 = tidak ada). */
	minCharge: real('min_charge').notNull().default(0),
	/** Harga khusus reseller/grosir (null = ikut harga normal). Tidak tampil publik. */
	resellerPrice: real('reseller_price'),
	isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

/** Pengaturan key-value toko (mis. gambar QRIS) */
export const settings = sqliteTable('settings', {
	key: text('key').primaryKey(),
	value: text('value'),
	updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

/* ------------------------------------------------------------------ */
/* Better Auth — tabel auth (dikelola via drizzle adapter)             */
/* ------------------------------------------------------------------ */

export const user = sqliteTable('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	role: text('role', { enum: ['owner', 'admin', 'operator', 'customer'] })
		.notNull()
		.default('customer'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const session = sqliteTable('session', {
	id: text('id').primaryKey(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	token: text('token').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' })
});

export const account = sqliteTable('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	password: text('password'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const verification = sqliteTable('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
});

/* ---------------- WhatsApp ---------------- */

/** Antrian pesan WA keluar — diproses berurutan oleh worker dengan jeda anti-ban. */
export const waOutbox = sqliteTable('wa_outbox', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	to: text('to').notNull(),
	text: text('text').notNull(),
	status: text('status', { enum: ['queued', 'sending', 'sent', 'failed', 'cancelled'] })
		.notNull()
		.default('queued'),
	/** Kapan boleh dikirim (untuk warm-up / jam operasional). */
	scheduledAt: text('scheduled_at').notNull().$defaultFn(() => new Date().toISOString()),
	attempts: integer('attempts').notNull().default(0),
	lastError: text('last_error'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

/** Key-value untuk state WA: warm-up, counter harian, risk score, kill switch. */
export const waMeta = sqliteTable('wa_meta', {
	key: text('key').primaryKey(),
	value: text('value').notNull(),
	updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
});

/* ---------------- Keuangan: pengeluaran & shift kasir ---------------- */

/** Pengeluaran operasional toko (bahan baku, listrik, gaji, dll). */
export const expenses = sqliteTable('expenses', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	tanggal: text('tanggal').notNull(),
	kategori: text('kategori').notNull(),
	jumlah: real('jumlah').notNull().default(0),
	catatan: text('catatan'),
	createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString())
});

/** Rekap shift kasir: cash awal vs cash fisik saat tutup. */
export const shifts = sqliteTable('shifts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	dibukaAt: text('dibuka_at').notNull().$defaultFn(() => new Date().toISOString()),
	dibukaOleh: text('dibuka_oleh'),
	cashAwal: real('cash_awal').notNull().default(0),
	ditutupAt: text('ditutup_at'),
	ditutupOleh: text('ditutup_oleh'),
	cashMasuk: real('cash_masuk'),
	cashFisik: real('cash_fisik'),
	selisih: real('selisih'),
	catatan: text('catatan')
});
