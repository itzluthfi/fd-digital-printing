/**
 * Pengaturan toko — khusus owner.
 * Saat ini: upload gambar QRIS statis untuk pembayaran di kasir & invoice.
 */
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { QRIS_FILE, QRIS_URL, qrisTersedia, setSetting } from '#lib/server/settings';
import { whatsappStatus } from '#lib/server/notify/whatsapp';
import { waMetaGet, waMetaSet } from '#lib/server/wa/provider';
import { waResetRisk } from '#lib/server/wa/baileys';
import { db } from '#lib/server/db';
import { waOutbox } from '#lib/server/db/schema';
import { count, eq } from 'drizzle-orm';

const MAKS_BYTE = 2 * 1024 * 1024; // 2 MB
const TIPE_OK = ['image/png', 'image/jpeg'];

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'owner') throw error(403, 'Akses ditolak');
	const wa = await whatsappStatus();
	const [queued] = await db.select({ n: count() }).from(waOutbox).where(eq(waOutbox.status, 'queued'));
	const [sent] = await db.select({ n: count() }).from(waOutbox).where(eq(waOutbox.status, 'sent'));
	const [failed] = await db.select({ n: count() }).from(waOutbox).where(eq(waOutbox.status, 'failed'));
	return {
		qrisAda: qrisTersedia(),
		qrisUrl: QRIS_URL,
		wa,
		waQueue: { queued: queued?.n ?? 0, sent: sent?.n ?? 0, failed: failed?.n ?? 0 },
		waPairingCode: (await waMetaGet('pairing_code')) ?? '',
		waKillSwitch: (await waMetaGet('kill_switch')) === '1',
		waRisk: Number((await waMetaGet('risk_score')) ?? 0)
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
	}
};
