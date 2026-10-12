/**
 * Pengaturan toko — khusus owner.
 * Mengelola QRIS statis, integrasi WhatsApp, dan konfigurasi Telegram Dinamis.
 */
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import {
	QRIS_FILE,
	QRIS_URL,
	getTelegramSettings,
	qrisTersedia,
	sanitizeTelegramIds,
	setSetting,
	getSetting,
	getHeartbeatUrl,
	pingHeartbeat
} from '#lib/server/settings';
import { whatsappStatus } from '#lib/server/notify/whatsapp';
import { waMetaGet, waMetaSet, getWaProviderName, startBaileysConnection, disconnectBaileys, requestBaileysPairingCode } from '#lib/server/wa/provider';
import { waResetRisk } from '#lib/server/wa/baileys';
import { db } from '#lib/server/db';
import { waOutbox } from '#lib/server/db/schema';
import { count, eq } from 'drizzle-orm';
import { botConfigured, botSendMessage, esc, syncTelegramBotCommands } from '#lib/server/bot/api';
import { getGitHubConfig } from '#lib/server/github';
import { sendDatabaseBackupToTelegram } from '#lib/server/backup';

const MAKS_BYTE = 2 * 1024 * 1024; // 2 MB
const TIPE_OK = ['image/png', 'image/jpeg'];

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'owner') throw error(403, 'Akses ditolak');

	const wa = await whatsappStatus();
	const [queued] = await db.select({ n: count() }).from(waOutbox).where(eq(waOutbox.status, 'queued'));
	const [sent] = await db.select({ n: count() }).from(waOutbox).where(eq(waOutbox.status, 'sent'));
	const [failed] = await db.select({ n: count() }).from(waOutbox).where(eq(waOutbox.status, 'failed'));

	const telegram = await getTelegramSettings();
	const github = await getGitHubConfig();
	const heartbeatUrl = await getHeartbeatUrl();

	// Konfigurasi AI Gateway (Nine-Router)
	const aiGatewayUrl = (await getSetting('ai_gateway_url')) || 'https://mj9.sir-l.web.id/v1';
	const aiGatewayKey = (await getSetting('ai_gateway_key')) || '';
	const aiTextModel = (await getSetting('ai_text_model')) || 'openai/gpt-4o-mini';
	const aiVisionModel = (await getSetting('ai_vision_model')) || 'openai/gpt-4o-mini';

	return {
		qrisAda: qrisTersedia(),
		qrisUrl: QRIS_URL,
		wa,
		waProvider: getWaProviderName(),
		waQueue: { queued: queued?.n ?? 0, sent: sent?.n ?? 0, failed: failed?.n ?? 0 },
		waPairingCode: (await waMetaGet('pairing_code')) ?? '',
		waQrDataUrl: (await waMetaGet('qr_data_url')) ?? '',
		waBotNumber: (await waMetaGet('bot_number')) ?? '',
		waKillSwitch: (await waMetaGet('kill_switch')) === '1',
		waRisk: Number((await waMetaGet('risk_score')) ?? 0),
		telegram,
		github,
		heartbeatUrl,
		aiGateway: {
			url: aiGatewayUrl,
			key: aiGatewayKey,
			textModel: aiTextModel,
			visionModel: aiVisionModel
		},
		botActive: botConfigured()
	};
};

export const actions: Actions = {
	/** Upload gambar QRIS toko (PNG/JPG, maks 2 MB). */
	uploadQris: async ({ request, locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });

		const fd = await request.formData();
		const file = fd.get('qris');
		if (!(file instanceof File) || file.size === 0)
			return fail(400, { message: 'Pilih file gambar QRIS dulu.' });
		if (!TIPE_OK.includes(file.type))
			return fail(400, { message: 'Format harus PNG atau JPG.' });
		if (file.size > MAKS_BYTE)
			return fail(400, { message: 'Ukuran file maksimal 2 MB.' });

		try {
			await mkdir('static/uploads', { recursive: true });
			await writeFile(QRIS_FILE, Buffer.from(await file.arrayBuffer()));
			await setSetting('qris_ada', '1');
		} catch {
			return fail(500, { message: 'Gagal menyimpan gambar.' });
		}
		return { ok: true };
	},

	/** Hapus gambar QRIS toko. */
	hapusQris: async ({ locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		try {
			if (existsSync(QRIS_FILE)) await unlink(QRIS_FILE);
			await setSetting('qris_ada', '0');
		} catch {
			return fail(500, { message: 'Gagal menghapus gambar.' });
		}
		return { ok: true };
	},

	/** Simpan pengaturan Telegram & Komunitas Dinamis (tanpa perlu sentuh .env). */
	simpanTelegram: async ({ request, locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });

		const fd = await request.formData();
		const rawAdminIds = String(fd.get('adminIds') ?? '');
		const adminGroupId = String(fd.get('adminGroupId') ?? '').trim();
		const publicChannelId = String(fd.get('publicChannelId') ?? '').trim();
		const discussionGroupId = String(fd.get('discussionGroupId') ?? '').trim();

		const featureGroupButtons = fd.get('featureGroupButtons') === 'on' ? '1' : '0';
		const featureAutoPin = fd.get('featureAutoPin') === 'on' ? '1' : '0';
		const featureAutoWelcome = fd.get('featureAutoWelcome') === 'on' ? '1' : '0';
		const welcomeText = String(fd.get('welcomeText') ?? '').trim();

		// Bersihkan dan deduplikasi ID Admin
		const cleanedAdminIds = sanitizeTelegramIds(rawAdminIds).join(',');
		const staffJsonRaw = String(fd.get('staffJson') ?? '').trim();
		const githubToken = String(fd.get('githubToken') ?? '').trim();
		const githubRepo = String(fd.get('githubRepo') ?? '').trim();

		try {
			if (staffJsonRaw) {
				await setSetting('telegram_staff_list', staffJsonRaw);
			}
			if (githubToken) {
				await setSetting('github_token', githubToken);
			}
			if (githubRepo) {
				await setSetting('github_repo', githubRepo);
			}
			await setSetting('telegram_admin_ids', cleanedAdminIds);
			await setSetting('telegram_admin_group_id', adminGroupId);
			await setSetting('telegram_public_channel_id', publicChannelId);
			await setSetting('telegram_discussion_group_id', discussionGroupId);
			await setSetting('telegram_feature_group_buttons', featureGroupButtons);
			await setSetting('telegram_feature_auto_pin', featureAutoPin);
			await setSetting('telegram_feature_auto_welcome', featureAutoWelcome);
			if (welcomeText) {
				await setSetting('telegram_welcome_text', welcomeText);
			}
			// Auto sync menu bot setelah setting disimpan
			if (botConfigured()) {
				await syncTelegramBotCommands().catch(() => {});
			}
		} catch (err) {
			return fail(500, { message: 'Gagal menyimpan konfigurasi Telegram: ' + String(err) });
		}

		return { ok: true, message: 'Konfigurasi Telegram & Staf berhasil disimpan.' };
	},

	/** Sinkronkan menu slash (/) ke Telegram Bot API */
	sinkronMenuBot: async ({ locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		if (!botConfigured()) {
			return fail(400, { message: 'TELEGRAM_BOT_TOKEN belum diset di server.' });
		}
		const res = await syncTelegramBotCommands();
		if (!res.ok) {
			return fail(500, { message: res.message });
		}
		return { ok: true, message: res.message };
	},

	/** Kirim pesan uji coba ke target yang dipilih untuk memastikan bot terhubung & memiliki izin */
	ujiKirimTelegram: async ({ request, locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		if (!botConfigured()) {
			return fail(400, { message: 'TELEGRAM_BOT_TOKEN belum diset di server.' });
		}

		const fd = await request.formData();
		const target = String(fd.get('target') ?? '');
		const tgSettings = await getTelegramSettings();

		let chatId: string | number | undefined;
		let targetLabel = '';

		if (target === 'admin') {
			chatId = tgSettings.adminIds[0];
			targetLabel = 'Admin Utama (Chat Pribadi)';
		} else if (target === 'grup_tim') {
			chatId = tgSettings.adminGroupId;
			targetLabel = 'Grup Tim Internal';
		} else if (target === 'channel') {
			chatId = tgSettings.publicChannelId;
			targetLabel = 'Channel Etalase Publik';
		} else if (target === 'grup_diskusi') {
			chatId = tgSettings.discussionGroupId;
			targetLabel = 'Grup Diskusi Komentar';
		}

		if (!chatId) {
			return fail(400, { message: `ID untuk ${targetLabel || target} belum diisi di form.` });
		}

		const nowWib = new Date().toLocaleString('id-ID', {
			timeZone: 'Asia/Jakarta',
			dateStyle: 'medium',
			timeStyle: 'medium'
		});

		const testMsg =
			`🤖 <b>UJI COBA KONEKSI BOT TELEGRAM</b>\n\n` +
			`✅ Koneksi berhasil ke <b>${esc(targetLabel)}</b>!\n` +
			`⏱️ Waktu: ${nowWib} WIB\n` +
			`🏷️ ID Chat: <code>${esc(String(chatId))}</code>\n\n` +
			`<i>Pesan ini dikirim otomatis dari Halaman Pengaturan Toko.</i>`;

		try {
			const res = await botSendMessage(chatId, testMsg);
			if (!res) {
				return fail(400, {
					message: `Gagal mengirim ke ${targetLabel}. Pastikan bot sudah diundang dan memiliki hak admin.`
				});
			}
			return { ok: true, message: `Pesan uji coba berhasil terkirim ke ${targetLabel}!` };
		} catch (err) {
			return fail(500, { message: 'Error API Telegram: ' + String(err) });
		}
	},

	/** Reset risk score & matikan kill switch WhatsApp (manual, owner). */
	waResetRisk: async ({ locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		await waResetRisk();
		return { ok: true };
	},

	/** Aktif/matikan kill switch WhatsApp manual. */
	waKillSwitch: async ({ request, locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		const fd = await request.formData();
		await waMetaSet('kill_switch', fd.get('aktif') === '1' ? '1' : '0');
		return { ok: true };
	},

	/** Simpan URL Outbound Heartbeat Ping */
	simpanHeartbeat: async ({ request, locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		const fd = await request.formData();
		const url = String(fd.get('heartbeat_url') ?? '').trim();
		await setSetting('uptime_heartbeat_url', url || null);
		return { ok: true, message: 'URL Heartbeat monitoring berhasil disimpan!' };
	},

	/** Uji coba ping ke URL Heartbeat eksternal */
	ujiPingHeartbeat: async ({ locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		const url = await getHeartbeatUrl();
		if (!url) {
			return fail(400, { message: 'URL Heartbeat belum diisi.' });
		}
		const res = await pingHeartbeat();
		if (res.ok) {
			return { ok: true, message: `✅ Heartbeat ping sukses terkirim ke server monitoring! (Status HTTP ${res.status ?? 200})` };
		}
		return fail(500, { message: `❌ Heartbeat ping gagal: ${res.error ?? 'Status ' + res.status}` });
	},

	/** Eksekusi snapshot backup database SQLite dan kirim langsung ke Telegram Owner */
	backupDatabase: async ({ locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		const res = await sendDatabaseBackupToTelegram();
		if (res.success) {
			return { ok: true, message: res.message };
		}
		return fail(500, { message: res.message });
	},

	/** Simpan Konfigurasi AI Gateway (Nine-Router / OpenAI Compatible) */
	simpanAiGateway: async ({ request, locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		const fd = await request.formData();
		const url = String(fd.get('ai_gateway_url') ?? '').trim();
		const key = String(fd.get('ai_gateway_key') ?? '').trim();
		const textModel = String(fd.get('ai_text_model') ?? '').trim();
		const visionModel = String(fd.get('ai_vision_model') ?? '').trim();

		await setSetting('ai_gateway_url', url || 'https://mj9.sir-l.web.id/v1');
		if (key) {
			await setSetting('ai_gateway_key', key);
		}
		await setSetting('ai_text_model', textModel || 'openai/gpt-4o-mini');
		await setSetting('ai_vision_model', visionModel || 'openai/gpt-4o-mini');

		return { ok: true, message: 'Pengaturan AI Gateway Nine-Router berhasil disimpan!' };
	},

	/** Mulai koneksi WhatsApp Baileys (menghasilkan QR code baru) */
	waStartConnection: async ({ locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		await setSetting('wa_provider', 'baileys');
		try {
			await startBaileysConnection();
			return { ok: true, message: 'WhatsApp Baileys dimulai! Silakan tunggu QR Code muncul.' };
		} catch (err) {
			return fail(500, { message: 'Gagal memulai Baileys: ' + String(err) });
		}
	},

	/** Putuskan sesi WhatsApp Baileys dan hapus kredensial lokal */
	waDisconnect: async ({ locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		try {
			await disconnectBaileys();
			return { ok: true, message: 'WhatsApp berhasil diputuskan dan sesi telah dibersihkan.' };
		} catch (err) {
			return fail(500, { message: 'Gagal memutuskan koneksi: ' + String(err) });
		}
	},

	/** Minta pairing code 8-digit via nomor WhatsApp telepon */
	waRequestPairingCode: async ({ request, locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		const fd = await request.formData();
		const phone = String(fd.get('phone') ?? '').trim();
		if (!phone) {
			return fail(400, { message: 'Nomor telepon WhatsApp wajib diisi.' });
		}

		await setSetting('wa_provider', 'baileys');
		try {
			const code = await requestBaileysPairingCode(phone);
			return { ok: true, message: `Kode Pairing didapat: ${code}`, pairingCode: code };
		} catch (err) {
			return fail(500, { message: 'Gagal meminta kode pairing: ' + String(err) });
		}
	},

	/** Pilih Provider WhatsApp aktif (cloud, baileys, atau off) */
	waSetProvider: async ({ request, locals }) => {
		if (locals.user?.role !== 'owner') return fail(403, { message: 'Akses ditolak.' });
		const fd = await request.formData();
		const provider = String(fd.get('provider') ?? 'off').trim();
		if (!['cloud', 'baileys', 'off'].includes(provider)) {
			return fail(400, { message: 'Provider tidak valid.' });
		}
		await setSetting('wa_provider', provider);
		if (provider === 'baileys') {
			await startBaileysConnection().catch(() => {});
		}
		return { ok: true, message: `Provider WhatsApp diubah menjadi: ${provider}` };
	}
};
