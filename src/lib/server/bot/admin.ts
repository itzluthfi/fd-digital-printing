/**
 * Bot FD Digital Printing — SATU bot dua mode.
 *
 * - Admin (ID ter-whitelist): menu publik + panel admin (/order, /piutang,
 *   /laporan, /pelanggan, ubah status via tombol).
 * - Publik (semua user): /lacak kode order, /harga katalog, /info toko.
 *
 * Push otomatis ke admin: order baru, perubahan status, pembayaran piutang
 * (via notifyAdmins di api.ts, dipanggil dari server actions).
 */
import { asc, desc, eq, or, sql } from 'drizzle-orm';

import { db } from '../db';
import { customers, orders, payments, priceItems, receivables } from '../db/schema';
import { notifyCustomer } from '../notify';
import { createGoQrisTransaction, checkGoQrisPayment } from '#lib/server/goqris';
import { buatKodeOrder } from '#lib/server/order-code';
import { METODE_LABEL, STATUS_LABEL, STATUS_URUTAN, rupiah, tgl } from '#lib/format';
import {
	botAnswerCallback,
	botDeleteMessage,
	botEditCaption,
	botEditMessage,
	botSendMessage,
	botSendPhoto,
	esc,
	isAdmin,
	notifyAdmins,
	type InlineKeyboard
} from './api';
import { getNextSequentialUniqueCode } from '#lib/server/unique-code';

const BASE_URL = (process.env.PUBLIC_BASE_URL ?? 'https://fd-printing.sir-l.web.id').replace(/\/$/, '');
const BANNER_URL = `${BASE_URL}/banner-avatar.png`;

const MENU: InlineKeyboard = [
	[
		{ text: 'Order Aktif', callback_data: 'm:orders' },
		{ text: 'Piutang', callback_data: 'm:piutang' }
	],
	[
		{ text: 'Laporan Hari Ini', callback_data: 'm:laporan' },
		{ text: 'Pelanggan', callback_data: 'm:pelanggan' }
	],
	[{ text: 'Pratinjau Menu Publik', callback_data: 'p:menu' }]
];

const BACK: InlineKeyboard = [[{ text: 'Menu Utama', callback_data: 'm:menu' }]];

/* ---------------- Menu publik (semua user) ---------------- */

const WA_NUMBER = '6289507370805';
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo FD Digital Printing, saya mau tanya-tanya dulu.')}`;

const PUBLIC_MENU: InlineKeyboard = [
	[
		{ text: '🛒 Buat Pesanan Baru', callback_data: 'p:order' },
		{ text: 'Profil & Riwayat', callback_data: 'p:profil' }
	],
	[
		{ text: 'Layanan & Tarif', callback_data: 'p:layanan' },
		{ text: 'Info Toko', callback_data: 'p:info' }
	],
	[
		{ text: 'Lacak Order Manual', callback_data: 'p:lacak' },
		{ text: 'Chat WhatsApp', url: WA_LINK }
	]
];

const PUBLIC_BACK: InlineKeyboard = [[{ text: 'Menu Utama', callback_data: 'p:menu' }]];

/** Sapaan + tanggal/jam WIB ala menu bot modern. */
function salam(nama: string): string {
	const now = new Date();
	const tz = 'Asia/Jakarta';
	const hari = now.toLocaleDateString('id-ID', { timeZone: tz, weekday: 'long' });
	const tanggal = now.toLocaleDateString('id-ID', { timeZone: tz, day: 'numeric', month: 'long', year: 'numeric' });
	const jam = now.toLocaleTimeString('id-ID', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
	const sapa = nama ? `Halo, <b>${esc(nama)}</b>!` : 'Halo!';
	return `${sapa}\n${hari}, ${tanggal} • ${jam} WIB`;
}

function publicMenuText(nama: string): { text: string; keyboard: InlineKeyboard } {
	return {
		text:
			`${salam(nama)}\n\n` +
			`<b>Selamat datang di FD Digital Printing!</b>\n` +
			`<i>Cetak cepat, hasil hebat. Banner • Stiker • Brosur • Kartu Nama • Foto</i>\n\n` +
			`Pilih menu di bawah ini:`,
		keyboard: PUBLIC_MENU
	};
}

async function profilText(chatId: number, namaTelegram: string): Promise<{ text: string; keyboard: InlineKeyboard }> {
	const [c] = await db
		.select()
		.from(customers)
		.where(eq(customers.telegramChatId, String(chatId)));

	if (!c) {
		return {
			text:
				`<b>Profil & Riwayat Pelanggan</b>\n\n` +
				`Halo <b>${esc(namaTelegram || 'Kak')}</b>!\n` +
				`Akun Telegram Anda belum ditautkan ke riwayat pesanan.\n\n` +
				`💡 <b>Sinkronisasi Riwayat Otomatis:</b>\n` +
				`Ketik nomor WhatsApp Anda di chat ini (misal: <code>081234567890</code>), seluruh riwayat order web & kasir Anda akan otomatis muncul di sini tanpa kode pelacakan!\n\n` +
				`Atau langsung pesan cetakan baru di bawah:`,
			keyboard: [
				[{ text: '🛒 Buat Pesanan Baru', callback_data: 'p:order' }],
				[{ text: '🔍 Lacak via Kode', callback_data: 'p:lacak' }],
				[{ text: '🏠 Menu Utama', callback_data: 'p:menu' }]
			]
		};
	}

	const orderList = await db
		.select()
		.from(orders)
		.where(eq(orders.customerId, c.id))
		.orderBy(desc(orders.id))
		.limit(6);

	let riwayat = 'Belum ada riwayat pesanan.';
	const orderButtons: InlineKeyboard = [];

	if (orderList.length > 0) {
		riwayat = orderList
			.map(
				(o) =>
					`• <b>${esc(o.code ?? `#${o.id}`)}</b> [${STATUS_LABEL[o.status] ?? o.status}]\n  ${esc(o.description)}\n  Total: <b>${rupiah(o.total)}</b>`
			)
			.join('\n\n');

		for (const o of orderList.slice(0, 3)) {
			if (o.code) {
				orderButtons.push([{ text: `🔍 Detail ${o.code} (${STATUS_LABEL[o.status] ?? o.status})`, callback_data: `p:cek:${o.code}` }]);
			}
		}
	}

	return {
		text:
			`<b>Profil & Riwayat Pelanggan</b>\n\n` +
			`Nama: <b>${esc(c.name)}</b>\n` +
			`No. Telepon: <code>${esc(c.phone ?? '-')}</code>\n\n` +
			`<b>Daftar Pesanan Anda:</b>\n\n${riwayat}`,
		keyboard: [
			...orderButtons,
			[{ text: '🛒 Pesan Layanan Lagi', callback_data: 'p:order' }],
			[{ text: '🏠 Menu Utama', callback_data: 'p:menu' }]
		]
	};
}

async function orderChooseItemText(): Promise<{ text: string; keyboard: InlineKeyboard }> {
	const items = await db.select().from(priceItems).where(eq(priceItems.isActive, true)).orderBy(asc(priceItems.sortOrder));
	if (items.length === 0) {
		return { text: 'Katalog layanan belum tersedia saat ini.', keyboard: PUBLIC_BACK };
	}
	const keyboard: InlineKeyboard = items.map((i) => [
		{ text: `${i.name} — ${rupiah(i.price)}${i.unit === 'meter' ? '/m²' : `/${i.unit}`}`, callback_data: `p:ord:${i.id}` }
	]);
	keyboard.push([{ text: '« Kembali ke Menu', callback_data: 'p:menu' }]);

	return {
		text:
			`🛒 <b>Pilih Layanan Printing:</b>\n\n` +
			`Silakan klik salah satu produk di bawah untuk melanjutkan pemesanan & generate QRIS instan:`,
		keyboard
	};
}

async function orderChooseQtyText(itemId: number): Promise<{ text: string; keyboard: InlineKeyboard }> {
	const [item] = await db.select().from(priceItems).where(eq(priceItems.id, itemId)).limit(1);
	if (!item) return { text: 'Item tidak ditemukan.', keyboard: PUBLIC_BACK };

	const isMeter = item.unit === 'meter';
	const qtyOptions = isMeter ? [1, 2, 3, 6] : [1, 2, 5, 10];

	const rows: InlineKeyboard = [];
	for (let i = 0; i < qtyOptions.length; i += 2) {
		const row = [
			{ text: `${qtyOptions[i]} ${isMeter ? 'm² (1x1m)' : item.unit}`, callback_data: `p:qty:${item.id}:${qtyOptions[i]}` }
		];
		if (i + 1 < qtyOptions.length) {
			row.push({ text: `${qtyOptions[i + 1]} ${isMeter ? 'm² (2x1m dsb)' : item.unit}`, callback_data: `p:qty:${item.id}:${qtyOptions[i + 1]}` });
		}
		rows.push(row);
	}
	rows.push([{ text: '« Pilih Produk Lain', callback_data: 'p:order' }]);

	return {
		text:
			`<b>Konfirmasi Jumlah / Ukuran:</b>\n\n` +
			`Produk: <b>${esc(item.name)}</b>\n` +
			`Harga Dasar: <b>${rupiah(item.price)}</b> / ${item.unit}\n\n` +
			`Pilih jumlah pesanan Anda:`,
		keyboard: rows
	};
}

async function processBotOrderAndSendQris(chatId: number, itemId: number, qty: number, namaUser: string): Promise<void> {
	const [item] = await db.select().from(priceItems).where(eq(priceItems.id, itemId)).limit(1);
	if (!item) {
		await botSendMessage(chatId, 'Item tidak ditemukan.', PUBLIC_BACK);
		return;
	}

	const subtotal = Math.round(item.price * qty);
	// Alokasikan kode unik urut (+1 s/d +999) ala Digitz-Shop
	const { uniqueCode, total } = await getNextSequentialUniqueCode(subtotal);

	let [c] = await db.select().from(customers).where(eq(customers.telegramChatId, String(chatId))).limit(1);
	let customerId: number;
	if (c) {
		customerId = c.id;
	} else {
		const [newC] = await db.insert(customers).values({
			name: namaUser || 'Pelanggan Telegram',
			phone: `tg_${chatId}`,
			telegramChatId: String(chatId)
		}).returning({ id: customers.id });
		customerId = newC.id;
	}

	const code = buatKodeOrder();
	const desc = `${item.name} x ${qty} ${item.unit}`;

	await db.insert(orders).values({
		code,
		customerId,
		description: desc,
		status: 'baru',
		subtotal,
		total,
		discountRp: 0
	});

	notifyAdmins(
		`<b>[ORDER BARU VIA TELEGRAM BOT]</b>\n` +
		`Kode: <code>${code}</code>\n` +
		`Pemesan: <b>${esc(namaUser || 'Pelanggan')}</b> (ID: <code>${chatId}</code>)\n` +
		`Item: <b>${esc(desc)}</b>\n` +
		`Total: <b>${rupiah(total)}</b> (termasuk kode unik ${rupiah(uniqueCode)})\n` +
		`Metode: <b>QRIS Dinamis</b>`
	).catch(() => {});

	let qrUrl = '';
	try {
		const gqRes = await createGoQrisTransaction({
			amount: total,
			orderCode: code,
			itemName: `${item.name} (${code})`,
			customerName: namaUser || 'Pelanggan Telegram'
		});
		if (gqRes?.success && gqRes.data) {
			const codeString = gqRes.data.qris_code || gqRes.data.qris_string;
			if (gqRes.data.qr_image || gqRes.data.qr_image_url) {
				qrUrl = String(gqRes.data.qr_image || gqRes.data.qr_image_url);
			} else if (codeString) {
				qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=8&data=${encodeURIComponent(String(codeString))}`;
			}
		}
	} catch (err) {
		console.warn('[bot order] GoQRIS error:', err);
	}

	if (!qrUrl) {
		qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&margin=8&data=https://fd-printing.sir-l.web.id/pesan/sukses/${code}`;
	}

	const caption =
		`🛍️ <b>PESANAN BERHASIL DIBUAT!</b>\n\n` +
		`Kode Order: <code>${code}</code>\n` +
		`Item: <b>${esc(desc)}</b>\n` +
		`Subtotal: <b>${rupiah(subtotal)}</b>\n` +
		`Kode Unik: <b>+${rupiah(uniqueCode)}</b> <i>(verifikasi otomatis)</i>\n` +
		`━━━━━━━━━━━━━━━━━━━━\n` +
		`TOTAL TAGIHAN: <b>${rupiah(total)}</b>\n\n` +
		`📱 <i>Silakan scan QRIS di atas dengan m-banking atau e-wallet (GoPay, BCA, Mandiri, Dana, SeaBank, dll).\n` +
		`⚠️ Transfer tepat <b>${rupiah(total)}</b> agar mutasi terdeteksi otomatis.</i>`;

	const keyboard: InlineKeyboard = [
		[{ text: '🔄 Cek Status Pembayaran', callback_data: `p:chk:${code}` }],
		[
			{ text: '🌐 Buka di Web', url: `https://fd-printing.sir-l.web.id/pesan/sukses/${code}` },
			{ text: '❌ Batalkan', callback_data: `p:batal:${code}` }
		],
		[{ text: '🏠 Menu Utama', callback_data: 'p:menu' }]
	];

	await botSendPhoto(chatId, qrUrl, caption, keyboard);
}

async function handleCheckPaymentFromBot(chatId: number, messageId: number | undefined, code: string, callbackId: string): Promise<void> {
	const [order] = await db.select().from(orders).where(eq(orders.code, code)).limit(1);
	if (!order) {
		await botAnswerCallback(callbackId, 'Pesanan tidak ditemukan.');
		return;
	}

	const [p] = await db.select().from(payments).where(eq(payments.orderId, order.id)).limit(1);
	let isPaid = order.status !== 'baru' || Boolean(p);

	if (!isPaid) {
		const gq = await checkGoQrisPayment(order.code || '', order.total);
		if (gq?.success && gq?.paid === true) {
			isPaid = true;
			await db.insert(payments).values({
				orderId: order.id,
				method: 'qris',
				amount: order.total,
				paidAt: new Date().toISOString()
			});
			await db.update(orders).set({ status: 'diproses' }).where(eq(orders.id, order.id));
			notifyAdmins(
				`<b>[PEMBAYARAN QRIS BOT DITERIMA]</b>\n` +
				`Kode: <code>${order.code}</code>\n` +
				`Total: <b>${rupiah(order.total)}</b>\n` +
				`Status: <b>Lunas</b>`
			).catch(() => {});
		}
	}

	if (isPaid) {
		await botAnswerCallback(callbackId, '✅ Pembayaran terkonfirmasi lunas!');
		const textLunas =
			`🎉 <b>PEMBAYARAN DITERIMA & LUNAS!</b>\n\n` +
			`Kode Order: <code>${order.code}</code>\n` +
			`Item: <b>${esc(order.description)}</b>\n` +
			`Total: <b>${rupiah(order.total)}</b> [LUNAS VIA QRIS]\n` +
			`Status: <b>DIPROSES (MASUK PRODUKSI)</b>\n\n` +
			`Terima kasih! Pesanan Anda sudah masuk antrean produksi. Pantau perkembangannya kapan saja di menu "Profil & Riwayat".`;

		const keyboard: InlineKeyboard = [
			[{ text: '📦 Lihat di Profil & Riwayat', callback_data: 'p:profil' }],
			[{ text: '🏠 Menu Utama', callback_data: 'p:menu' }]
		];

		if (messageId) {
			const ok = await botEditCaption(chatId, messageId, textLunas, keyboard);
			if (!ok) await botSendMessage(chatId, textLunas, keyboard);
		} else {
			await botSendMessage(chatId, textLunas, keyboard);
		}
	} else {
		await botAnswerCallback(callbackId, `⚠️ Pembayaran belum terdeteksi. Pastikan transfer tepat ${rupiah(order.total)}.`, true);
	}
}

async function handleCekOrderDetailFromBot(chatId: number, messageId: number | undefined, code: string, callbackId: string): Promise<void> {
	await botAnswerCallback(callbackId);
	const text = await lacakText(code);
	const keyboard: InlineKeyboard = [
		[{ text: '🌐 Buka di Web / Bayar QRIS', url: `https://fd-printing.sir-l.web.id/pesan/sukses/${code}` }],
		[{ text: '« Kembali ke Riwayat', callback_data: 'p:profil' }]
	];
	await botSendMessage(chatId, text, keyboard);
}

async function lacakText(code: string): Promise<string> {
	const c = code.trim().toUpperCase();
	if (!/^FD-[A-Z0-9]{6}$/.test(c))
		return `Format kode salah. Contoh: <code>/lacak FD-A1B2C3</code>\nKode tertera di nota / invoice kamu.`;
	const [r] = await db
		.select({ code: orders.code, description: orders.description, status: orders.status, createdAt: orders.createdAt })
		.from(orders)
		.where(eq(orders.code, c));
	if (!r) return `Order <b>${esc(c)}</b> tidak ditemukan. Periksa lagi kodenya.`;
	return (
		`<b>Order ${esc(r.code ?? '')}</b>\n` +
		`${esc(r.description)}\n\n` +
		`Status: <b>${STATUS_LABEL[r.status] ?? r.status}</b>\n` +
		`Tanggal order: ${tgl((r.createdAt ?? '').slice(0, 10))}`
	);
}

async function hargaText(): Promise<string> {
	const rows = await db
		.select({ name: priceItems.name, unit: priceItems.unit, price: priceItems.price })
		.from(priceItems)
		.where(eq(priceItems.isActive, true))
		.orderBy(priceItems.sortOrder, priceItems.name);
	if (rows.length === 0) return 'Katalog harga belum tersedia.';
	const lines = rows.map((r) => `• ${esc(r.name)} — <b>${rupiah(r.price)}</b>/${r.unit}`);
	return `<b>Katalog Harga FD Digital Printing</b>\n\n${lines.join('\n')}\n\n<i>Harga dapat berubah. Hubungi admin untuk penawaran khusus.</i>`;
}

function infoText(): string {
	return (
		`<b>FD Digital Printing</b>\n\n` +
		`Alamat: Jl. Raya Wadungasri No. 42, Waru, Sidoarjo\n` +
		`Jam Buka: Senin–Sabtu: 10.00–02.00 • Minggu: 10.00–18.00\n\n` +
		`Order & info: balas chat ini atau /lacak untuk cek status order.\n\n` +
		`Ketik /menu untuk kembali.`
	);
}

function bantuanText(admin: boolean): string {
	const publik =
		`/lacak <kode> — cek status order\n` +
		`/harga — katalog harga\n` +
		`/info — info toko\n` +
		`/menu — menu utama`;
	const adm = admin
		? `\n\n<b>Khusus admin:</b>\n/order — order aktif\n/piutang — piutang\n/laporan — omzet hari ini\n/pelanggan — pelanggan`
		: '';
	return `<b>Perintah bot</b>\n\n${publik}${adm}`;
}

type OrderStatus = (typeof STATUS_URUTAN)[number];

function nextStatus(s: string): OrderStatus | null {
	const i = STATUS_URUTAN.indexOf(s as OrderStatus);
	if (i < 0 || i >= STATUS_URUTAN.length - 1) return null;
	return STATUS_URUTAN[i + 1];
}

async function menuText(nama = ''): Promise<{ text: string; keyboard: InlineKeyboard }> {
	const aktif = await db
		.select({ n: sql<number>`count(*)` })
		.from(orders)
		.where(sql`${orders.status} != 'diambil'`);
	const telat = await db
		.select({ n: sql<number>`count(*)` })
		.from(receivables)
		.where(sql`${receivables.status} = 'belum_lunas'`);
	return {
		text:
			`${salam(nama)}\n\n` +
			`<b>FD Digital Printing — Panel Admin</b>\n` +
			`📋 Order aktif: <b>${aktif[0]?.n ?? 0}</b> | 💳 Piutang belum lunas: <b>${telat[0]?.n ?? 0}</b>\n\n` +
			`👇 Silakan pilih menu di bawah:`,
		keyboard: MENU
	};
}

async function ordersText(): Promise<{ text: string; keyboard: InlineKeyboard }> {
	const rows = await db
		.select({
			id: orders.id,
			description: orders.description,
			status: orders.status,
			total: orders.total,
			name: customers.name
		})
		.from(orders)
		.leftJoin(customers, eq(orders.customerId, customers.id))
		.where(sql`${orders.status} != 'diambil'`)
		.orderBy(desc(orders.id))
		.limit(10);
	if (rows.length === 0) return { text: 'Tidak ada order aktif. Semua sudah diambil.', keyboard: BACK };
	const lines = rows.map(
		(r) =>
			`#${r.id} ${esc(r.description)} — ${esc(r.name ?? '-')}\n` +
			`${rupiah(r.total)} • <b>${STATUS_LABEL[r.status] ?? r.status}</b>`
	);
	const keyboard: InlineKeyboard = rows.map((r) => [
		{ text: `#${r.id} ${STATUS_LABEL[r.status] ?? r.status}`, callback_data: `ord:${r.id}` }
	]);
	keyboard.push([{ text: '🏠 Menu utama', callback_data: 'm:menu' }]);
	return { text: `<b>Order aktif</b>\n\n${lines.join('\n\n')}\n\nPilih order untuk detail:`, keyboard };
}

async function orderDetailText(id: number): Promise<{ text: string; keyboard: InlineKeyboard } | null> {
	const [r] = await db
		.select({
			id: orders.id,
			description: orders.description,
			status: orders.status,
			total: orders.total,
			name: customers.name,
			phone: customers.phone
		})
		.from(orders)
		.leftJoin(customers, eq(orders.customerId, customers.id))
		.where(eq(orders.id, id));
	if (!r) return null;
	const next = nextStatus(r.status);
	const keyboard: InlineKeyboard = [];
	if (next) {
		keyboard.push([
			{ text: `✅ Tandai: ${STATUS_LABEL[next]}`, callback_data: `adv:${r.id}` }
		]);
	}
	if (r.status === 'selesai' || r.status === 'diambil') {
		keyboard.push([{ text: '📢 Kirim notif ke pelanggan', callback_data: `ntf:${r.id}` }]);
	}
	keyboard.push([{ text: '« Order aktif', callback_data: 'm:orders' }]);
	return {
		text:
			`<b>Order #${r.id}</b>\n` +
			`${esc(r.description)}\n\n` +
			`Pelanggan: ${esc(r.name ?? '-')} (${esc(r.phone ?? '-')})\n` +
			`Total: <b>${rupiah(r.total)}</b>\n` +
			`Status: <b>${STATUS_LABEL[r.status] ?? r.status}</b>`,
		keyboard
	};
}

/** Majukan status order (dipakai bot & bisa dipakai ulang). Mengembalikan status baru. */
export async function advanceOrder(id: number): Promise<{ ok: boolean; status?: string; message: string }> {
	const [cur] = await db
		.select({
			id: orders.id,
			status: orders.status,
			description: orders.description,
			name: customers.name,
			phone: customers.phone,
			email: customers.email,
			telegramChatId: customers.telegramChatId
		})
		.from(orders)
		.leftJoin(customers, eq(orders.customerId, customers.id))
		.where(eq(orders.id, id));
	if (!cur) return { ok: false, message: 'Order tidak ditemukan.' };
	const next = nextStatus(cur.status);
	if (!next) return { ok: false, message: 'Order sudah di tahap akhir.' };
	await db.update(orders).set({ status: next }).where(eq(orders.id, id));
	if (next === 'selesai' && cur.name) {
		await notifyCustomer(
			{ name: cur.name, phone: cur.phone, email: cur.email, telegramChatId: cur.telegramChatId },
			{
				title: 'Cetakan selesai',
				text: `pesanan "${cur.description}" sudah SELESAI dan bisa diambil di FD Digital Printing. Terima kasih!`
			}
		);
	}
	return { ok: true, status: next, message: `Order #${id} → ${STATUS_LABEL[next]}.` };
}

async function piutangText(): Promise<{ text: string; keyboard: InlineKeyboard }> {
	const rows = await db
		.select({
			id: receivables.id,
			amount: receivables.amount,
			paidAmount: receivables.paidAmount,
			dueDate: receivables.dueDate,
			name: customers.name
		})
		.from(receivables)
		.leftJoin(customers, eq(receivables.customerId, customers.id))
		.where(eq(receivables.status, 'belum_lunas'))
		.orderBy(desc(receivables.id))
		.limit(10);
	if (rows.length === 0) return { text: 'Tidak ada piutang. Semua lunas.', keyboard: BACK };
	const totalSisa = rows.reduce((a, r) => a + (r.amount - r.paidAmount), 0);
	const lines = rows.map(
		(r) =>
			`#${r.id} ${esc(r.name ?? '-')} — sisa <b>${rupiah(r.amount - r.paidAmount)}</b>\n` +
			`Jatuh tempo: ${tgl(r.dueDate)}`
	);
	const keyboard: InlineKeyboard = rows.map((r) => [
		{ text: `#${r.id} ${esc((r.name ?? '').slice(0, 18))}`, callback_data: `piu:${r.id}` }
	]);
	keyboard.push([{ text: '🏠 Menu utama', callback_data: 'm:menu' }]);
	return {
		text: `<b>Piutang belum lunas</b> (total sisa: <b>${rupiah(totalSisa)}</b>)\n\n${lines.join('\n\n')}`,
		keyboard
	};
}

async function piutangDetailText(id: number): Promise<{ text: string; keyboard: InlineKeyboard } | null> {
	const [r] = await db
		.select({
			id: receivables.id,
			amount: receivables.amount,
			paidAmount: receivables.paidAmount,
			dueDate: receivables.dueDate,
			name: customers.name,
			phone: customers.phone,
			email: customers.email,
			telegramChatId: customers.telegramChatId
		})
		.from(receivables)
		.leftJoin(customers, eq(receivables.customerId, customers.id))
		.where(eq(receivables.id, id));
	if (!r) return null;
	return {
		text:
			`<b>Piutang #${r.id}</b> — ${esc(r.name ?? '-')}\n` +
			`Total: ${rupiah(r.amount)} | Sudah bayar: ${rupiah(r.paidAmount)}\n` +
			`Sisa: <b>${rupiah(r.amount - r.paidAmount)}</b>\n` +
			`Jatuh tempo: ${tgl(r.dueDate)}`,
		keyboard: [
			[{ text: 'Kirim reminder ke pelanggan', callback_data: `rem:${r.id}` }],
			[{ text: '« Piutang', callback_data: 'm:piutang' }]
		]
	};
}

async function laporanText(): Promise<string> {
	const today = new Date().toISOString().slice(0, 10);
	const rows = await db
		.select({ method: payments.method, total: sql<number>`sum(${payments.amount})`, n: sql<number>`count(*)` })
		.from(payments)
		.where(sql`substr(${payments.paidAt}, 1, 10) = ${today}`)
		.groupBy(payments.method);
	const omzet = rows.reduce((a, r) => a + (r.total ?? 0), 0);
	const lines = rows.map(
		(r) => `${METODE_LABEL[r.method] ?? r.method}: <b>${rupiah(r.total)}</b> (${r.n}x)`
	);
	return (
		`<b>Laporan hari ini</b> (${tgl(today)})\n\n` +
		(lines.length ? lines.join('\n') : 'Belum ada pembayaran hari ini.') +
		`\n\nTotal omzet: <b>${rupiah(omzet)}</b>`
	);
}

async function pelangganText(): Promise<string> {
	const rows = await db
		.select({ id: customers.id, name: customers.name, phone: customers.phone })
		.from(customers)
		.orderBy(desc(customers.id))
		.limit(10);
	if (rows.length === 0) return 'Belum ada pelanggan.';
	return `<b>Pelanggan terbaru</b>\n\n` + rows.map((r) => `#${r.id} ${esc(r.name)} — ${esc(r.phone ?? '-')}`).join('\n');
}

type TgUser = { id: number; first_name?: string };
type TgMessage = { message_id: number; chat: { id: number }; text?: string; from?: TgUser };
type TgCallback = { id: string; message?: TgMessage; data?: string; from?: TgUser };
type TgUpdate = { message?: TgMessage; callback_query?: TgCallback };

async function answer(
	chatId: number,
	messageId: number | undefined,
	view: { text: string; keyboard?: InlineKeyboard },
	callbackId?: string
) {
	if (callbackId) await botAnswerCallback(callbackId);
	if (messageId) {
		const ok = await botEditMessage(chatId, messageId, view.text, view.keyboard);
		if (ok) return;
	}
	await botSendMessage(chatId, view.text, view.keyboard);
}

async function handleCallback(
	chatId: number,
	messageId: number | undefined,
	data: string,
	callbackId: string,
	admin: boolean,
	nama = ''
) {
	const [cmd, arg] = data.split(':');
	// Callback publik — boleh untuk semua user
	if (cmd === 'p') {
		const parts = data.split(':');
		const action = parts[1];

		if (action === 'menu') {
			await botAnswerCallback(callbackId);
			const v = publicMenuText(nama);
			if (messageId) {
				await botDeleteMessage(chatId, messageId);
			}
			await botSendPhoto(chatId, BANNER_URL, v.text, v.keyboard);
			return;
		} else if (action === 'order') {
			await botAnswerCallback(callbackId);
			const v = await orderChooseItemText();
			await answer(chatId, messageId, v);
		} else if (action === 'ord') {
			await botAnswerCallback(callbackId);
			const itemId = Number(parts[2]);
			const v = await orderChooseQtyText(itemId);
			await answer(chatId, messageId, v);
		} else if (action === 'qty') {
			await botAnswerCallback(callbackId, 'Membuat pesanan & QRIS...');
			const itemId = Number(parts[2]);
			const qty = Number(parts[3]);
			await processBotOrderAndSendQris(chatId, itemId, qty, nama);
		} else if (action === 'chk') {
			const code = parts[2];
			await handleCheckPaymentFromBot(chatId, messageId, code, callbackId);
		} else if (action === 'cek') {
			const code = parts[2];
			await handleCekOrderDetailFromBot(chatId, messageId, code, callbackId);
		} else if (action === 'batal') {
			const code = parts[2];
			await botAnswerCallback(callbackId, 'Pesanan dibatalkan.');
			await botSendMessage(chatId, `Pesanan <code>${code}</code> telah dibatalkan.`, PUBLIC_BACK);
		} else if (action === 'lacak') {
			await botAnswerCallback(callbackId);
			await botSendMessage(chatId, `🔍 <b>Lacak Status Order</b>\n\nKetik langsung:\n<code>/lacak KODE_ORDER</code>\nContoh: <code>/lacak FD-A1B2C3</code>\n\n<i>Kode order tertera pada nota / invoice kuitansi Anda.</i>`, PUBLIC_BACK);
		} else if (action === 'layanan' || action === 'harga') {
			const keyboard: InlineKeyboard = [
				[{ text: '🛒 Buat Pesanan Baru', callback_data: 'p:order' }],
				[{ text: '💬 Chat WhatsApp Toko', url: WA_LINK }],
				[{ text: '🏠 Menu Utama', callback_data: 'p:menu' }]
			];
			await answer(chatId, messageId, { text: await hargaText(), keyboard }, callbackId);
		} else if (action === 'profil') {
			const v = await profilText(chatId, nama);
			await answer(chatId, messageId, v, callbackId);
		} else if (action === 'info') {
			const keyboard: InlineKeyboard = [
				[{ text: '📍 Buka Google Maps', url: 'https://maps.google.com/?q=FD+Digital+Printing+Wadungasri' }],
				[{ text: '🏠 Menu Utama', callback_data: 'p:menu' }]
			];
			await answer(chatId, messageId, { text: infoText(), keyboard }, callbackId);
		} else {
			await botAnswerCallback(callbackId, 'Menu tidak dikenal.');
		}
		return;
	}
	// Callback admin — khusus whitelist
	if (!admin) {
		await botAnswerCallback(callbackId, 'Maaf, menu ini khusus admin.');
		return;
	}
	switch (cmd) {
		case 'm': {
			if (arg === 'menu') {
				const v = await menuText(nama);
				await answer(chatId, messageId, v, callbackId);
			} else if (arg === 'orders') {
				const v = await ordersText();
				await answer(chatId, messageId, v, callbackId);
			} else if (arg === 'piutang') {
				const v = await piutangText();
				await answer(chatId, messageId, v, callbackId);
			} else if (arg === 'laporan') {
				await answer(chatId, messageId, { text: await laporanText(), keyboard: BACK }, callbackId);
			} else if (arg === 'pelanggan') {
				await answer(chatId, messageId, { text: await pelangganText(), keyboard: BACK }, callbackId);
			} else {
				await botAnswerCallback(callbackId, 'Menu tidak dikenal.');
			}
			break;
		}
		case 'ord': {
			const v = await orderDetailText(Number(arg));
			if (!v) await botAnswerCallback(callbackId, 'Order tidak ditemukan.');
			else await answer(chatId, messageId, v, callbackId);
			break;
		}
		case 'adv': {
			const r = await advanceOrder(Number(arg));
			await botAnswerCallback(callbackId, r.message);
			const v = await orderDetailText(Number(arg));
			if (v) await answer(chatId, messageId, v);
			// Push ke admin lain bahwa status berubah
			break;
		}
		case 'ntf': {
			const [cur] = await db
				.select({
					description: orders.description,
					name: customers.name,
					phone: customers.phone,
					email: customers.email,
					telegramChatId: customers.telegramChatId
				})
				.from(orders)
				.leftJoin(customers, eq(orders.customerId, customers.id))
				.where(eq(orders.id, Number(arg)));
			if (cur?.name) {
				const hasil = await notifyCustomer(
					{ name: cur.name, phone: cur.phone, email: cur.email, telegramChatId: cur.telegramChatId },
					{
						title: 'Cetakan selesai',
						text: `pesanan "${cur.description}" sudah SELESAI dan bisa diambil di FD Digital Printing. Terima kasih!`
					}
				);
				const okAny = Object.values(hasil).some(Boolean);
				await botAnswerCallback(callbackId, okAny ? 'Notifikasi terkirim.' : 'Gagal / tidak ada channel.');
			} else {
				await botAnswerCallback(callbackId, 'Pelanggan tidak ditemukan.');
			}
			break;
		}
		case 'piu': {
			const v = await piutangDetailText(Number(arg));
			if (!v) await botAnswerCallback(callbackId, 'Piutang tidak ditemukan.');
			else await answer(chatId, messageId, v, callbackId);
			break;
		}
		case 'rem': {
			const [r] = await db
				.select({
					amount: receivables.amount,
					paidAmount: receivables.paidAmount,
					dueDate: receivables.dueDate,
					name: customers.name,
					phone: customers.phone,
					email: customers.email,
					telegramChatId: customers.telegramChatId
				})
				.from(receivables)
				.leftJoin(customers, eq(receivables.customerId, customers.id))
				.where(eq(receivables.id, Number(arg)));
			if (r?.name) {
				const hasil = await notifyCustomer(
					{ name: r.name, phone: r.phone, email: r.email, telegramChatId: r.telegramChatId },
					{
						title: 'Pengingat pembayaran',
						text:
							`sisa piutang Anda sebesar ${rupiah(r.amount - r.paidAmount)} ` +
							`jatuh tempo ${tgl(r.dueDate)}. Mohon segera dilunasi. Terima kasih!`
					}
				);
				const okAny = Object.values(hasil).some(Boolean);
				await botAnswerCallback(callbackId, okAny ? 'Reminder terkirim.' : 'Gagal / tidak ada channel.');
			} else {
				await botAnswerCallback(callbackId, 'Data tidak ditemukan.');
			}
			break;
		}
		default:
			await botAnswerCallback(callbackId, 'Perintah tidak dikenal.');
	}
}

/** Router utama update Telegram. Mengembalikan 200 secepatnya — panggil tanpa await. */
export async function handleUpdate(update: TgUpdate): Promise<void> {
	try {
		const admin = isAdmin(update.callback_query?.from?.id ?? update.message?.from?.id ?? 0);
		if (update.callback_query) {
			const cb = update.callback_query;
			const chatId = cb.message?.chat.id;
			if (!chatId || !cb.data) return;
			await handleCallback(chatId, cb.message?.message_id, cb.data, cb.id, admin, cb.from?.first_name ?? '');
			return;
		}
		const msg = update.message;
		if (!msg?.text || !msg.from) return;
		const chatId = msg.chat.id;
		const text = msg.text.trim();
		const [cmdRaw, argRaw] = text.split(/\s+/, 2);
		const cmd = cmdRaw.toLowerCase().replace(/@.*$/, '');
		// ---- Perintah publik (semua user, termasuk admin) ----
		switch (cmd) {
			case '/start':
			case '/menu': {
				if (admin) {
					const v = await menuText(msg.from.first_name ?? '');
					await botSendPhoto(chatId, BANNER_URL, v.text, v.keyboard);
				} else {
					const v = publicMenuText(msg.from.first_name ?? '');
					await botSendPhoto(chatId, BANNER_URL, v.text, v.keyboard);
				}
				return;
			}
			case '/lacak': {
				if (!argRaw) {
					await botSendMessage(chatId, `Ketik <code>/lacak KODE</code> — contoh: <code>/lacak FD-A1B2C3</code>`, PUBLIC_BACK);
				} else {
					await botSendMessage(chatId, await lacakText(argRaw), PUBLIC_BACK);
				}
				return;
			}
			case '/layanan':
			case '/harga': {
				const keyboard: InlineKeyboard = [
					[{ text: '💬 Pesan via WhatsApp', url: WA_LINK }],
					[{ text: '🏠 Menu Utama', callback_data: 'p:menu' }]
				];
				await botSendMessage(chatId, await hargaText(), keyboard);
				return;
			}
			case '/profil':
			case '/riwayat': {
				const v = await profilText(chatId, msg.from.first_name ?? '');
				await botSendMessage(chatId, v.text, v.keyboard);
				return;
			}
			case '/info': {
				const keyboard: InlineKeyboard = [
					[{ text: '📍 Buka Google Maps', url: 'https://maps.google.com/?q=FD+Digital+Printing+Wadungasri' }],
					[{ text: '🏠 Menu Utama', callback_data: 'p:menu' }]
				];
				await botSendMessage(chatId, infoText(), keyboard);
				return;
			}
			case '/bantuan':
			case '/help': {
				await botSendMessage(chatId, bantuanText(admin), admin ? BACK : PUBLIC_BACK);
				return;
			}
		}
		// Sinkronisasi otomatis jika pengguna mengirim nomor HP/WhatsApp
		if (!cmd.startsWith('/')) {
			const cleanPhone = text.replace(/[^0-9]/g, '');
			if (cleanPhone.length >= 9 && cleanPhone.length <= 15) {
				const standardPhone = cleanPhone.startsWith('62') ? '0' + cleanPhone.slice(2) : cleanPhone;
				const altPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

				const [cust] = await db
					.select()
					.from(customers)
					.where(or(eq(customers.phone, standardPhone), eq(customers.phone, altPhone), eq(customers.phone, cleanPhone)))
					.limit(1);

				if (cust) {
					await db.update(customers).set({ telegramChatId: String(chatId) }).where(eq(customers.id, cust.id));
					const v = await profilText(chatId, msg.from.first_name ?? '');
					await botSendMessage(
						chatId,
						`✅ <b>Akun Berhasil Ditautkan!</b>\nNomor <code>${esc(standardPhone)}</code> atas nama <b>${esc(cust.name)}</b> kini terhubung ke akun Telegram ini.\n\n${v.text}`,
						v.keyboard
					);
					return;
				} else {
					await botSendMessage(
						chatId,
						`Nomor <code>${esc(cleanPhone)}</code> belum pernah tercatat di pesanan toko. Jika Anda ingin membuat pesanan baru, silakan gunakan tombol di bawah:`,
						[
							[{ text: '🛒 Buat Pesanan Baru', callback_data: 'p:order' }],
							[{ text: '🏠 Menu Utama', callback_data: 'p:menu' }]
						]
					);
					return;
				}
			}
		}

		// ---- Perintah khusus admin ----
		if (!admin) {
			const v = publicMenuText(msg.from.first_name ?? '');
			await botSendMessage(chatId, `Perintah tidak dikenal.\n\n${v.text}`, v.keyboard);
			return;
		}
		switch (cmd) {
			case '/order': {
				if (argRaw && /^\d+$/.test(argRaw)) {
					const v = await orderDetailText(Number(argRaw));
					await botSendMessage(chatId, v?.text ?? 'Order tidak ditemukan.', v?.keyboard ?? BACK);
				} else {
					const v = await ordersText();
					await botSendMessage(chatId, v.text, v.keyboard);
				}
				break;
			}
			case '/piutang': {
				const v = await piutangText();
				await botSendMessage(chatId, v.text, v.keyboard);
				break;
			}
			case '/laporan': {
				await botSendMessage(chatId, await laporanText(), BACK);
				break;
			}
			case '/pelanggan': {
				await botSendMessage(chatId, await pelangganText(), BACK);
				break;
			}
			default: {
				const v = await menuText(msg.from.first_name ?? '');
				await botSendMessage(chatId, `Perintah tidak dikenal.\n\n${v.text}`, v.keyboard);
			}
		}
	} catch (e) {
		console.error('[bot] handleUpdate error:', String(e).slice(0, 300));
	}
}
