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
import { desc, eq, sql } from 'drizzle-orm';

import { db } from '../db';
import { customers, orders, payments, priceItems, receivables } from '../db/schema';
import { notifyCustomer } from '../notify';
import { METODE_LABEL, STATUS_LABEL, STATUS_URUTAN, rupiah, tgl } from '#lib/format';
import {
	botAnswerCallback,
	botEditCaption,
	botEditMessage,
	botSendMessage,
	botSendPhoto,
	esc,
	isAdmin,
	type InlineKeyboard
} from './api';

const BASE_URL = (process.env.PUBLIC_BASE_URL ?? 'https://fd-printing.sir-l.web.id').replace(/\/$/, '');
const BANNER_URL = `${BASE_URL}/bot-banner.jpg`;

const MENU: InlineKeyboard = [
	[
		{ text: '📋 Order aktif', callback_data: 'm:orders' },
		{ text: '💳 Piutang', callback_data: 'm:piutang' }
	],
	[
		{ text: '📊 Laporan hari ini', callback_data: 'm:laporan' },
		{ text: '👥 Pelanggan', callback_data: 'm:pelanggan' }
	],
	[{ text: '🔎 Pratinjau menu publik', callback_data: 'p:menu' }]
];

const BACK: InlineKeyboard = [[{ text: '🏠 Menu utama', callback_data: 'm:menu' }]];

/* ---------------- Menu publik (semua user) ---------------- */

const WA_NUMBER = '6289507370805';
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Halo FD Digital Printing, saya mau tanya-tanya dulu.')}`;

const PUBLIC_MENU: InlineKeyboard = [
	[
		{ text: '🔍 Lacak order', callback_data: 'p:lacak' },
		{ text: '💰 Katalog harga', callback_data: 'p:harga' }
	],
	[
		{ text: '🏠 Info toko', callback_data: 'p:info' },
		{ text: '💬 Chat WhatsApp', url: WA_LINK }
	],
	[{ text: '🌐 Buka Website', url: BASE_URL }]
];

const PUBLIC_BACK: InlineKeyboard = [[{ text: '🏠 Menu publik', callback_data: 'p:menu' }]];

/** Sapaan + tanggal/jam WIB ala menu bot modern. */
function salam(nama: string): string {
	const now = new Date();
	const tz = 'Asia/Jakarta';
	const hari = now.toLocaleDateString('id-ID', { timeZone: tz, weekday: 'long' });
	const tanggal = now.toLocaleDateString('id-ID', { timeZone: tz, day: 'numeric', month: 'long', year: 'numeric' });
	const jam = now.toLocaleTimeString('id-ID', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
	const sapa = nama ? `👋 Halo, ${esc(nama)}!` : '👋 Halo!';
	return `${sapa}\n📅 ${hari}, ${tanggal} • ${jam} WIB`;
}

function publicMenuText(nama: string): { text: string; keyboard: InlineKeyboard } {
	return {
		text:
			`${salam(nama)}\n\n` +
			`<b>Selamat datang di FD Digital Printing!</b>\n` +
			`Cetak cepat, hasil hebat. Banner • Stiker • Brosur • Kartu Nama • Foto\n\n` +
			`👇 Silakan pilih menu di bawah, atau ketik langsung:\n` +
			`🔍 /lacak &lt;kode&gt; — cek status order\n` +
			`💰 /harga — katalog harga\n` +
			`🏠 /info — alamat & jam buka`,
		keyboard: PUBLIC_MENU
	};
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
		`<b>🏠 FD Digital Printing</b>\n\n` +
		`📍 Jl. Raya Wadungasri No. 42, Waru, Sidoarjo\n` +
		`🕙 Senin–Sabtu: 10.00–02.00 • Minggu: 10.00–18.00\n\n` +
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
		if (arg === 'menu') {
			await botAnswerCallback(callbackId);
			const v = publicMenuText('');
			// Pratinjau bisa dipicu dari foto menu admin — edit caption dulu, fallback ke pesan teks.
			if (messageId) {
				const ok = await botEditCaption(chatId, messageId, v.text, v.keyboard);
				if (ok) return;
			}
			await answer(chatId, messageId, v);
		} else if (arg === 'lacak') {
			await botAnswerCallback(callbackId);
			await botSendMessage(chatId, `Ketik <code>/lacak KODE</code> — contoh: <code>/lacak FD-A1B2C3</code>\nKode tertera di nota / invoice.`, PUBLIC_BACK);
		} else if (arg === 'harga') {
			await answer(chatId, messageId, { text: await hargaText(), keyboard: PUBLIC_BACK }, callbackId);
		} else if (arg === 'info') {
			await answer(chatId, messageId, { text: infoText(), keyboard: PUBLIC_BACK }, callbackId);
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
			case '/harga': {
				await botSendMessage(chatId, await hargaText(), PUBLIC_BACK);
				return;
			}
			case '/info': {
				await botSendMessage(chatId, infoText(), PUBLIC_BACK);
				return;
			}
			case '/bantuan':
			case '/help': {
				await botSendMessage(chatId, bantuanText(admin), admin ? BACK : PUBLIC_BACK);
				return;
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
