/**
 * Bot CS WhatsApp Cerdas (Maskot Dipi) untuk FD Digital Printing.
 * ---------------------------------------------------------------
 * Terintegrasi dengan:
 * 1. Nine-Router AI Gateway (OpenAI-compatible) untuk dialog dinamis & luwes.
 * 2. Session Memory & RAG (database wa_sessions & wa_messages di SQLite).
 * 3. Human Handover (Eskalasi ke CS Manusia jika diminta pelanggan).
 * 4. Anti-Ban Meta Engine (Presence typing simulation & Gaussian jitter delay).
 * 5. Notifikasi darurat ke Telegram Staf/Owner saat ada permintaan CS Manusia.
 */
import { desc, eq } from 'drizzle-orm';
import type { WASocket } from '@whiskeysockets/baileys';

import { db } from '../db';
import { waMessages, waSessions } from '../db/schema';
import { notifyAdmins } from '../bot/api';
import { aiConfigured } from '../ai';
import { postJson } from '../http';
import { getSettingSync } from '../settings';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface BotReplyResult {
	reply: string;
	cards?: Array<{ title: string; rows: Array<{ label: string; value: string }> }>;
	actions?: Array<{ label: string; url?: string }>;
}

/** Format response asisten Dipi menjadi format chat WhatsApp yang rapi dan profesional */
export function formatAssistantReplyForWa(res: BotReplyResult): string {
	let text = res.reply.trim();

	// Tambahkan rincian kartu harga / pesanan jika ada
	if (res.cards && res.cards.length > 0) {
		for (const card of res.cards) {
			text += `\n\n📌 *${card.title}*:\n` + card.rows.map((r) => `• ${r.label}: *${r.value}*`).join('\n');
		}
	}

	// Tambahkan link aksi jika ada
	if (res.actions && res.actions.length > 0) {
		const webBase = 'https://fd-printing.sir-l.web.id';
		const links = res.actions
			.filter((a) => a.url)
			.map((a) => `👉 ${a.label}: ${a.url?.startsWith('http') ? a.url : webBase + a.url}`);
		if (links.length > 0) {
			text += `\n\n` + links.join('\n');
		}
	}

	return text;
}

/** Panggil API Asisten AI Dipi secara internal */
async function callInternalAssistant(
	message: string,
	history: Array<{ role: 'user' | 'assistant'; text: string }>,
	customerInfo: { nama?: string; telepon?: string }
): Promise<BotReplyResult> {
	const port = process.env.PORT ?? 3000;
	try {
		const { status, text: raw } = await postJson(
			`http://127.0.0.1:${port}/api/ai/assistant`,
			{
				message,
				history,
				customerInfo
			},
			10000
		);

		if (status === 200) {
			const data = JSON.parse(raw) as BotReplyResult;
			if (data.reply) return data;
		}
	} catch {
		// Fallback jika API internal belum aktif atau timeout
	}

	return {
		reply:
			'Halo kak! Dipi siap bantu hitung estimasi cetak banner, stiker, brosur, atau cek status order ya. Mau tanya cetakan apa nih kak?'
	};
}

/** Tangani pesan WhatsApp masuk dari pelanggan */
export async function handleIncomingWaMessage(
	sock: WASocket,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	msg: any
): Promise<void> {
	const remoteJid = msg.key?.remoteJid;
	// Abaikan pesan dari diri sendiri, grup (@g.us), atau broadcast status
	if (!remoteJid || msg.key?.fromMe || remoteJid.endsWith('@g.us') || remoteJid === 'status@broadcast') {
		return;
	}

	// Ekstraksi teks pesan
	const text = (
		msg.message?.conversation ||
		msg.message?.extendedTextMessage?.text ||
		msg.message?.imageMessage?.caption ||
		''
	).trim();

	if (!text) return;

	const phone = remoteJid.replace('@s.whatsapp.net', '');
	const pushName = msg.pushName || undefined;
	const now = new Date().toISOString();

	// 1. Ambil atau Buat Sesi Pelanggan di SQLite
	let [session] = await db.select().from(waSessions).where(eq(waSessions.id, remoteJid)).limit(1);

	if (!session) {
		await db.insert(waSessions).values({
			id: remoteJid,
			phone,
			name: pushName,
			mode: 'bot',
			lastMessage: text,
			lastActivityAt: now,
			createdAt: now
		});
		[session] = await db.select().from(waSessions).where(eq(waSessions.id, remoteJid)).limit(1);
	} else {
		await db
			.update(waSessions)
			.set({
				lastMessage: text,
				lastActivityAt: now,
				name: pushName ?? session.name
			})
			.where(eq(waSessions.id, remoteJid));
	}

	// 2. Simpan pesan masuk ke riwayat wa_messages
	await db.insert(waMessages).values({
		sessionId: remoteJid,
		sender: 'customer',
		message: text,
		createdAt: now
	});

	const lower = text.toLowerCase();

	// 3. Perintah Manual Pergantian Mode (#bot / #cs)
	if (lower === '#bot' || lower === 'aktifkan bot' || lower === 'mode bot') {
		await db.update(waSessions).set({ mode: 'bot' }).where(eq(waSessions.id, remoteJid));
		await sock.sendMessage(remoteJid, {
			text: '🤖 *Mode Asisten Otomatis (Dipi) Diaktifkan!*\n\nHalo kak! Ada yang bisa Dipi bantu seputar harga cetak banner, stiker, atau lacak pesanan?'
		});
		await db.insert(waMessages).values({
			sessionId: remoteJid,
			sender: 'bot',
			message: 'Mode asisten otomatis (Dipi) diaktifkan.',
			createdAt: new Date().toISOString()
		});
		return;
	}

	if (lower === '#cs' || lower === '#admin' || lower === 'minta admin') {
		await db.update(waSessions).set({ mode: 'human' }).where(eq(waSessions.id, remoteJid));
		await sock.sendMessage(remoteJid, {
			text: '👤 *Mode CS Manusia Aktif.*\n\nPesan Anda telah diteruskan ke tim kasir & customer service toko. Tim kami akan segera membalas di chat ini ya kak 🙏'
		});
		await notifyAdmins(
			`🚨 <b>PERMINTAAN CS MANUSIA DARI WHATSAPP</b>\n` +
				`📱 Nomor: <code>${phone}</code> (${pushName ?? 'Pelanggan'})\n` +
				`💬 Pesan: "<i>${text}</i>"\n\n` +
				`👉 <i>Silakan buka WhatsApp toko untuk membalas pelanggan.</i>`
		);
		return;
	}

	// 4. Jika sedang dalam Mode CS Manusia (Human), JANGAN dijawab oleh bot otomatis
	if (session.mode === 'human') {
		return;
	}

	// 5. Deteksi Human Handover Intent (Pelanggan ingin berbicara dengan orang asli)
	const isHandoverIntent =
		/(bicara\s*sama\s*admin|orang\s*asli|manusia|bicara\s*cs|hubungi\s*cs|minta\s*cs|komplain|bisa\s*ngomong\s*sama\s*mas|bisa\s*ngomong\s*sama\s*mbak|petugas\s*toko)/i.test(
			lower
		);

	if (isHandoverIntent) {
		await db.update(waSessions).set({ mode: 'human' }).where(eq(waSessions.id, remoteJid));

		const handoverReply =
			'Baik kak, percakapan ini Dipi sambungkan langsung ke Customer Service manusia kami ya. Tim kami akan segera merespon di chat ini 🙏\n\n_(Ketik *#bot* kapan saja jika ingin kembali mengobrol dengan asisten otomatis)_';

		// Anti-ban emulation typing
		await sock.sendPresenceUpdate('composing', remoteJid);
		await sleep(1500);

		await sock.sendMessage(remoteJid, { text: handoverReply });

		await db.insert(waMessages).values({
			sessionId: remoteJid,
			sender: 'bot',
			message: handoverReply,
			createdAt: new Date().toISOString()
		});

		// Notifikasi instan ke Telegram Owner & Kasir
		await notifyAdmins(
			`🚨 <b>ESKALASI CS MANUSIA (WHATSAPP)</b>\n` +
				`📱 Nomor: <code>${phone}</code> (${pushName ?? 'Pelanggan'})\n` +
				`💬 Pesan Customer: "<i>${text}</i>"\n\n` +
				`⚠️ <i>Bot otomatis dinonaktifkan untuk nomor ini. Silakan admin toko merespon via WhatsApp.</i>`
		);
		return;
	}

	// 6. Mode Asisten Bot: Emulasi Mengetik (Anti-Ban presence) & Gaussian Jitter
	try {
		await sock.sendPresenceUpdate('composing', remoteJid);
	} catch {
		// Non-critical
	}

	// Jeda manusiawi acak 1.8s - 3.2s
	const jitter = 1800 + Math.floor(Math.random() * 1400);
	await sleep(jitter);

	// 7. Ambil riwayat percakapan terakhir (maksimal 6 pesan) untuk ingatan konteks RAG
	const recentMessages = await db
		.select()
		.from(waMessages)
		.where(eq(waMessages.sessionId, remoteJid))
		.orderBy(desc(waMessages.id))
		.limit(6);

	const history = recentMessages.reverse().map((m) => ({
		role: (m.sender === 'customer' ? 'user' : 'assistant') as 'user' | 'assistant',
		text: m.message
	}));

	// 8. Dapatkan balasan dari Asisten Dipi (Didukung Nine-Router)
	const aiResult = await callInternalAssistant(text, history, {
		telepon: phone,
		nama: session.name ?? pushName
	});

	const formattedReply = formatAssistantReplyForWa(aiResult);

	// 9. Kirim pesan ke WhatsApp pelanggan
	await sock.sendMessage(remoteJid, { text: formattedReply });

	// 10. Catat pesan balasan bot ke wa_messages
	await db.insert(waMessages).values({
		sessionId: remoteJid,
		sender: 'bot',
		message: formattedReply,
		createdAt: new Date().toISOString()
	});
}

/** Ubah mode sesi antara Bot vs CS Manusia dari Web Admin */
export async function setSessionMode(sessionId: string, mode: 'bot' | 'human'): Promise<void> {
	await db.update(waSessions).set({ mode }).where(eq(waSessions.id, sessionId));
}
