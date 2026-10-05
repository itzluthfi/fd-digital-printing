/**
 * Logika buku piutang: daftar, pencatatan pembayaran, dan reminder jatuh tempo.
 * Dipakai oleh action /piutang dan bisa dipanggil langsung (mis. cron).
 *
 * Aturan keras:
 * - Piutang yang lunas hanya berubah status — barisnya TETAP ADA.
 * - Setiap pembayaran tercatat di tabel payments (single source of truth omzet).
 * - Reminder tidak dikirim ganda: tabel reminders mencatat (receivableId, kind).
 */
import { eq, inArray } from 'drizzle-orm';

import { rupiah, tgl } from '#lib/format';
import { db } from './db';
import { customers, orders, payments, receivables, reminders } from './db/schema';
import { notifyCustomer } from './notify';

export type ReminderKind = 'h-3' | 'h-1' | 'telat';
export type MetodeBayar = 'cash' | 'transfer' | 'qris';

/** Selisih hari kalender (abaikan jam): positif = sisa X hari, negatif = telat. */
export function bedaHari(dueDateIso: string, sekarang: Date = new Date()): number {
	const jatuh = new Date(dueDateIso);
	const a = new Date(jatuh.getFullYear(), jatuh.getMonth(), jatuh.getDate());
	const b = new Date(sekarang.getFullYear(), sekarang.getMonth(), sekarang.getDate());
	return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

/** Kind reminder untuk selisih hari, atau null bila belum waktunya. */
export function kindUntukSisa(selisih: number): ReminderKind | null {
	if (selisih === 3) return 'h-3';
	if (selisih === 1) return 'h-1';
	if (selisih < 0) return 'telat';
	return null;
}

export type PiutangRow = {
	id: number;
	amount: number;
	paidAmount: number;
	dueDate: string;
	status: 'belum_lunas' | 'lunas';
	sisa: number;
	selisihHari: number;
	/** Kind reminder yang seharusnya dikirim hari ini (null = belum waktunya). */
	kind: ReminderKind | null;
	/** Kind yang sudah pernah dikirim untuk piutang ini. */
	sentKinds: ReminderKind[];
	customerName: string;
	customerPhone: string | null;
	customerEmail: string | null;
	customerTelegramChatId: string | null;
	orderDescription: string | null;
	orderId: number | null;
};

/** Semua piutang + info pelanggan, order, dan riwayat reminder. */
export async function getPiutang(): Promise<PiutangRow[]> {
	const rows = await db
		.select({
			id: receivables.id,
			amount: receivables.amount,
			paidAmount: receivables.paidAmount,
			dueDate: receivables.dueDate,
			status: receivables.status,
			customerName: customers.name,
			customerPhone: customers.phone,
			customerEmail: customers.email,
			customerTelegramChatId: customers.telegramChatId,
			orderDescription: orders.description,
			orderId: orders.id
		})
		.from(receivables)
		.leftJoin(customers, eq(receivables.customerId, customers.id))
		.leftJoin(orders, eq(receivables.orderId, orders.id));

	const sent = await db.select().from(reminders);
	const sentByReceivable = new Map<number, ReminderKind[]>();
	for (const s of sent) {
		const list = sentByReceivable.get(s.receivableId) ?? [];
		list.push(s.kind as ReminderKind);
		sentByReceivable.set(s.receivableId, list);
	}

	return rows.map((r) => {
		const selisih = bedaHari(r.dueDate);
		return {
			id: r.id,
			amount: r.amount,
			paidAmount: r.paidAmount,
			dueDate: r.dueDate,
			status: r.status,
			sisa: Math.max(0, r.amount - r.paidAmount),
			selisihHari: selisih,
			kind: kindUntukSisa(selisih),
			sentKinds: sentByReceivable.get(r.id) ?? [],
			customerName: r.customerName ?? '-',
			customerPhone: r.customerPhone,
			customerEmail: r.customerEmail,
			customerTelegramChatId: r.customerTelegramChatId,
			orderDescription: r.orderDescription,
			orderId: r.orderId
		};
	});
}

function pesanReminder(r: Pick<PiutangRow, 'customerName' | 'orderDescription' | 'dueDate'>, sisa: number, kind: ReminderKind): string {
	const desk = r.orderDescription ?? 'pesanan';
	if (kind === 'telat') {
		return (
			`Halo ${r.customerName}, sisa tagihan ${rupiah(sisa)} untuk '${desk}' ` +
			`sudah lewat jatuh tempo (${tgl(r.dueDate)}). Mohon segera selesaikan pembayarannya. Terima kasih.`
		);
	}
	if (kind === 'h-1') {
		return (
			`Halo ${r.customerName}, pengingat: sisa tagihan ${rupiah(sisa)} untuk '${desk}' ` +
			`jatuh tempo besok (${tgl(r.dueDate)}). Mohon siapkan pembayarannya. Terima kasih.`
		);
	}
	return (
		`Halo ${r.customerName}, pengingat: sisa tagihan ${rupiah(sisa)} untuk '${desk}' ` +
		`jatuh tempo ${tgl(r.dueDate)}. Terima kasih.`
	);
}

/**
 * Kirim reminder untuk piutang yang waktunya tiba.
 * @param ids bila diisi, hanya proses piutang dengan id itu.
 * @returns jumlah terkirim vs dilewati (belum waktunya / sudah lunas / sudah dikirim).
 */
export async function kirimReminderPiutang(ids?: number[]): Promise<{ terkirim: number; dilewati: number }> {
	const semua = await getPiutang();
	const target = ids?.length ? semua.filter((r) => ids.includes(r.id)) : semua;

	let terkirim = 0;
	let dilewati = 0;
	for (const r of target) {
		if (r.status === 'lunas' || r.sisa <= 0 || !r.kind || r.sentKinds.includes(r.kind)) {
			dilewati++;
			continue;
		}
		await notifyCustomer(
			{
				name: r.customerName,
				phone: r.customerPhone,
				email: r.customerEmail,
				telegramChatId: r.customerTelegramChatId
			},
			{ title: 'Pengingat piutang', text: pesanReminder(r, r.sisa, r.kind) }
		);
		await db.insert(reminders).values({ receivableId: r.id, kind: r.kind });
		terkirim++;
	}
	return { terkirim, dilewati };
}

/**
 * Catat pembayaran piutang: insert ke payments + update paidAmount.
 * Jika sisa jadi 0 → status 'lunas' (baris tetap ada, tidak dihapus).
 */
export async function catatPembayaran(
	receivableId: number,
	amount: number,
	method: MetodeBayar
): Promise<{ paidAmount: number; status: 'belum_lunas' | 'lunas' }> {
	const r = await db.select().from(receivables).where(eq(receivables.id, receivableId)).get();
	if (!r) throw new Error('Piutang tidak ditemukan.');
	if (r.status === 'lunas') throw new Error('Piutang sudah lunas, tidak bisa dibayar lagi.');
	if (!Number.isFinite(amount) || amount <= 0) throw new Error('Jumlah bayar harus lebih dari 0.');
	const sisa = r.amount - r.paidAmount;
	if (amount - sisa > 0.001) throw new Error(`Jumlah bayar melebihi sisa tagihan (${rupiah(sisa)}).`);

	const baru = r.paidAmount + amount;
	const lunas = baru >= r.amount - 0.001;
	await db.insert(payments).values({ orderId: r.orderId, method, amount });
	await db
		.update(receivables)
		.set({ paidAmount: baru, status: lunas ? 'lunas' : 'belum_lunas' })
		.where(eq(receivables.id, receivableId));
	return { paidAmount: baru, status: lunas ? 'lunas' : 'belum_lunas' };
}

/** Riwayat pembayaran untuk order-order yang punya piutang. */
export async function getRiwayatBayar(orderIds: number[]) {
	if (orderIds.length === 0) return [];
	return db
		.select({
			id: payments.id,
			orderId: payments.orderId,
			method: payments.method,
			amount: payments.amount,
			paidAt: payments.paidAt
		})
		.from(payments)
		.where(inArray(payments.orderId, orderIds));
}
