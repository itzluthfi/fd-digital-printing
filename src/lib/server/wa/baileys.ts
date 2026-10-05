/**
 * Provider Baileys (unofficial) — dengan anti-ban bawaan.
 *
 * ATURAN KERAS (dari riset operator produksi 2024–2026):
 * - WAJIB nomor cadangan, BUKAN nomor utama/pribadi.
 * - Warm-up 7 hari: 2 hari idle, lalu ramp 20→36→65→117→210→378→680→bebas.
 * - Jeda gaussian antar pesan, serialized global, circuit breaker 150/hari.
 * - Jangan pernah hapus auth state saat disconnect transient.
 * - Re-pairing adalah sinyal ban — dibatasi & dicatat.
 *
 * Risiko ban TIDAK PERNAH nol untuk klien unofficial. Untuk kebutuhan
 * mission-critical, pakai provider `cloud` (official).
 */
import {
	DisconnectReason,
	fetchLatestBaileysVersion,
	makeWASocket,
	useMultiFileAuthState,
	type WASocket
} from '@whiskeysockets/baileys';
import { and, asc, count, eq, lte, or, sql } from 'drizzle-orm';

import { db } from '../db';
import { waMeta, waOutbox } from '../db/schema';
import {
	RATE_LIMITS,
	canonicalJid,
	dailyCap,
	isBusinessHours,
	normalizePhone,
	sendDelayMs,
	toJid,
	warmupDay
} from './antiban';
import { waMetaGet, waMetaSet, type WaStatus } from './provider';

const AUTH_DIR = './data/wa-auth';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let sock: WASocket | null = null;
let workerStarted = false;
let workerBusy = false;
let consecutive401 = 0;
let reconnectedAt = 0;
let pairingInFlight = false;

/* ---------------- state helpers ---------------- */

async function getDaily(): Promise<{ date: string; sent: number }> {
	const today = new Date().toISOString().slice(0, 10);
	const date = (await waMetaGet('sent_date')) ?? '';
	const sent = Number((await waMetaGet('sent_today')) ?? 0);
	if (date !== today) {
		await waMetaSet('sent_date', today);
		await waMetaSet('sent_today', '0');
		return { date: today, sent: 0 };
	}
	return { date, sent };
}

async function bumpRisk(points: number, reason: string): Promise<void> {
	const cur = Number((await waMetaGet('risk_score')) ?? 0);
	const next = cur + points;
	await waMetaSet('risk_score', String(next));
	console.warn(`[wa:baileys] risk +${points} (${reason}) → ${next}`);
	// Kill switch otomatis: hentikan pengiriman sampai owner meninjau.
	if (next >= 100 && (await waMetaGet('kill_switch')) !== '1') {
		await waMetaSet('kill_switch', '1');
		console.error('[wa:baileys] KILL SWITCH AKTIF — pengiriman dihentikan. Tinjau di /pengaturan.');
	}
}

/* ---------------- socket lifecycle ---------------- */

async function initSocket(): Promise<void> {
	if (sock) return;
	const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
	let version: [number, number, number];
	try {
		const v = await fetchLatestBaileysVersion();
		version = v.version;
	} catch {
		version = [2, 3000, 1027934701];
	}

	sock = makeWASocket({
		version,
		auth: state,
		// Minimal: jangan broadcast presence (presence spam = vektor ban)
		markOnlineOnConnect: false,
		syncFullHistory: false,
		generateHighQualityLinkPreview: false
	});

	sock.ev.on('creds.update', saveCreds);

	// Pairing code untuk server headless (bila belum terdaftar)
	const pairNumber = (process.env.WA_PAIR_NUMBER ?? '').replace(/[^0-9]/g, '');
	if (pairNumber && !state.creds.registered && !pairingInFlight) {
		pairingInFlight = true;
		try {
			const code = await sock.requestPairingCode(normalizePhone(pairNumber));
			await waMetaSet('pairing_code', code);
			await waMetaSet('pairing_at', new Date().toISOString());
			console.log('[wa:baileys] pairing code tersedia — lihat di /pengaturan');
		} catch (e) {
			console.error('[wa:baileys] pairing gagal:', String(e).slice(0, 150));
		} finally {
			pairingInFlight = false;
		}
	}

	sock.ev.on('connection.update', async (u) => {
		const { connection, lastDisconnect } = u;
		if (connection === 'open') {
			consecutive401 = 0;
			reconnectedAt = Date.now();
			await waMetaSet('connected_at', new Date().toISOString());
			await waMetaSet('pairing_code', '');
			console.log('[wa:baileys] terhubung');
		}
		if (connection === 'close') {
			const code = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output
				?.statusCode;
			console.warn('[wa:baileys] koneksi tertutup, code:', code);
			// JANGAN PERNAH hapus auth state di sini (transient close ≠ logout)
			if (code === DisconnectReason.loggedOut) {
				consecutive401++;
				await bumpRisk(25, `loggedOut #${consecutive401}`);
				if (consecutive401 >= 5) {
					console.error('[wa:baileys] 5x 401 beruntun — sesi dianggap logout, perlu pairing ulang.');
					sock = null;
					return;
				}
			} else if (code === DisconnectReason.connectionReplaced) {
				// 440 = sesi diambil alih perangkat lain → JANGAN reconnect (fatal)
				console.error('[wa:baileys] koneksi digantikan (440) — berhenti, jangan reconnect.');
				sock = null;
				return;
			} else {
				await bumpRisk(5, `disconnect ${code ?? '?'}`);
			}
			sock = null;
			// Reconnect dengan backoff; re-pairing dibatasi karena itu sinyal ban
			await sleep(15000);
			if (!sock) await initSocket().catch((e) => console.error('[wa:baileys] reconnect gagal:', String(e).slice(0, 150)));
		}
	});
}

/* ---------------- queue worker ---------------- */

async function processOne(): Promise<boolean> {
	const now = new Date().toISOString();
	const [job] = await db
		.select()
		.from(waOutbox)
		.where(and(eq(waOutbox.status, 'queued'), lte(waOutbox.scheduledAt, now)))
		.orderBy(asc(waOutbox.id))
		.limit(1);
	if (!job) return false;

	// Kill switch / jam operasional
	if ((await waMetaGet('kill_switch')) === '1') return false;
	if (!isBusinessHours()) {
		const next = new Date();
		next.setHours(8, 5, 0, 0);
		if (next.getTime() < Date.now()) next.setDate(next.getDate() + 1);
		await db
			.update(waOutbox)
			.set({ scheduledAt: next.toISOString() })
			.where(eq(waOutbox.id, job.id));
		return false;
	}

	// Warm-up: 2 hari pertama idle total
	const warmStart = await waMetaGet('warmup_started_at');
	if (!warmStart) {
		await waMetaSet('warmup_started_at', new Date().toISOString());
		console.log('[wa:baileys] warm-up dimulai — 2 hari idle.');
		return false;
	}
	const day = warmupDay(new Date(warmStart));
	if (day <= 2) return false; // idle
	const cap = dailyCap(day);
	const daily = await getDaily();
	if (daily.sent >= Math.min(cap, RATE_LIMITS.circuitBreaker)) {
		console.warn(`[wa:baileys] cap harian tercapai (${daily.sent}) — berhenti sampai besok.`);
		return false;
	}

	// Duplikasi: tolak pesan identik >3x/jam
	const hourAgo = new Date(Date.now() - 3600000).toISOString();
	const [dup] = await db
		.select({ n: count() })
		.from(waOutbox)
		.where(
			and(
				eq(waOutbox.text, job.text),
				or(eq(waOutbox.status, 'sent'), eq(waOutbox.status, 'sending')),
				sql`${waOutbox.createdAt} >= ${hourAgo}`
			)
		);
	if ((dup?.n ?? 0) >= RATE_LIMITS.maxIdenticalPerHour) {
		await db
			.update(waOutbox)
			.set({ status: 'cancelled', lastError: 'duplikat >3x/jam (anti-spam)' })
			.where(eq(waOutbox.id, job.id));
		return true;
	}

	if (!sock) {
		await initSocket();
		if (!sock) return false;
	}

	// Throttle 60 dtk setelah reconnect (10% kecepatan)
	const sinceReconnect = Date.now() - reconnectedAt;
	const throttled = reconnectedAt > 0 && sinceReconnect < 60000;

	const seen = await waMetaGet(`seen:${normalizePhone(job.to)}`);
	const isNewChat = !seen;

	await db.update(waOutbox).set({ status: 'sending' }).where(eq(waOutbox.id, job.id));
	try {
		const jid = canonicalJid(toJid(job.to));
		await sock.sendMessage(jid, { text: job.text });
		await db.update(waOutbox).set({ status: 'sent' }).where(eq(waOutbox.id, job.id));
		await waMetaSet('sent_today', String(daily.sent + 1));
		if (isNewChat) await waMetaSet(`seen:${normalizePhone(job.to)}`, '1');
	} catch (e) {
		const msg = String(e).slice(0, 200);
		const attempts = job.attempts + 1;
		await db
			.update(waOutbox)
			.set({
				status: attempts >= 3 ? 'failed' : 'queued',
				attempts,
				lastError: msg,
				scheduledAt: new Date(Date.now() + attempts * 60000).toISOString()
			})
			.where(eq(waOutbox.id, job.id));
		await bumpRisk(10, `gagal kirim: ${msg.slice(0, 60)}`);
		return true;
	}

	// Jeda gaussian antar pesan (anti-ban)
	const delay = sendDelayMs(job.text.length, isNewChat) * (throttled ? 3 : 1);
	await sleep(delay);
	return true;
}

async function workerLoop(): Promise<void> {
	while (true) {
		try {
			const didWork = await processOne();
			if (!didWork) await sleep(5000);
		} catch (e) {
			console.error('[wa:baileys] worker error:', String(e).slice(0, 200));
			await sleep(10000);
		}
	}
}

/** Start socket + worker (idempotent). Dipanggil lazy saat ada pesan masuk antrian. */
export async function ensureBaileysWorker(): Promise<void> {
	if (workerStarted) return;
	workerStarted = true;
	await initSocket().catch((e) => console.error('[wa:baileys] init gagal:', String(e).slice(0, 150)));
	void workerLoop();
}

export async function baileysStatus(): Promise<WaStatus> {
	const pairCode = (await waMetaGet('pairing_code')) ?? '';
	const warmStart = await waMetaGet('warmup_started_at');
	const day = warmStart ? warmupDay(new Date(warmStart)) : 0;
	const [q] = await db.select({ n: count() }).from(waOutbox).where(eq(waOutbox.status, 'queued'));
	const risk = Number((await waMetaGet('risk_score')) ?? 0);
	const killed = (await waMetaGet('kill_switch')) === '1';

	let detail: string;
	if (killed) detail = `KILL SWITCH AKTIF (risk ${risk}) — tinjau manual`;
	else if (pairCode) detail = `Menunggu pairing — kode: ${pairCode}`;
	else if (sock) detail = `Terhubung · warm-up hari ${day} · antrian ${q?.n ?? 0} · risk ${risk}`;
	else detail = `Belum terhubung · warm-up hari ${day} · risk ${risk}`;
	return { provider: 'baileys', connected: Boolean(sock) && !killed, detail };
}

/** Reset risk score & matikan kill switch (manual, owner). */
export async function waResetRisk(): Promise<void> {
	await waMetaSet('risk_score', '0');
	await waMetaSet('kill_switch', '0');
}
