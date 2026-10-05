import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import {
	catatPembayaran,
	getPiutang,
	getRiwayatBayar,
	kirimReminderPiutang,
	type MetodeBayar
} from '#lib/server/piutang';
import { notifyAdmins } from '#lib/server/bot/api';
import { rupiah } from '#lib/format';

export const load: PageServerLoad = async ({ locals }) => {
	const role = locals.user?.role ?? 'customer';
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');

	const piutang = await getPiutang();
	const orderIds = piutang.map((p) => p.orderId).filter((x): x is number => x != null);
	const riwayat = await getRiwayatBayar(orderIds);
	return { piutang, riwayat };
};

export const actions: Actions = {
	/** Catat pembayaran: insert payments + update paidAmount; lunas = status berubah, baris tetap ada. */
	bayar: async ({ request, locals }) => {
		const role = locals.user?.role;
		if (role !== 'owner' && role !== 'admin') return fail(403, { message: 'Akses ditolak.' });

		const fd = await request.formData();
		const receivableId = Number(fd.get('receivableId'));
		const amount = Number(fd.get('amount'));
		const method = String(fd.get('method') ?? '');
		if (!receivableId) return fail(400, { message: 'Piutang tidak valid.' });
		if (!['cash', 'transfer', 'qris'].includes(method))
			return fail(400, { message: 'Metode bayar tidak valid.' });

		try {
			const hasil = await catatPembayaran(receivableId, amount, method as MetodeBayar);
			// Push ke admin: pembayaran piutang masuk
			notifyAdmins(
				`<b>Pembayaran piutang #${receivableId}</b>\n${rupiah(amount)} via ${method}` +
					(hasil.status === 'lunas' ? ' — <b>LUNAS</b>' : '')
			).catch(() => {});
			return { ok: true, receivableId, ...hasil };
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Gagal mencatat pembayaran.' });
		}
	},

	/** Kirim reminder untuk semua piutang yang waktunya tiba (anti-spam via tabel reminders). */
	kirimReminder: async ({ locals }) => {
		const role = locals.user?.role;
		if (role !== 'owner' && role !== 'admin') return fail(403, { message: 'Akses ditolak.' });
		const hasil = await kirimReminderPiutang();
		return { ok: true, ...hasil };
	},

	/** Kirim reminder 'telat' untuk satu baris. */
	ingatkan: async ({ request, locals }) => {
		const role = locals.user?.role;
		if (role !== 'owner' && role !== 'admin') return fail(403, { message: 'Akses ditolak.' });

		const fd = await request.formData();
		const receivableId = Number(fd.get('receivableId'));
		if (!receivableId) return fail(400, { message: 'Piutang tidak valid.' });

		const hasil = await kirimReminderPiutang([receivableId]);
		if (hasil.terkirim === 0)
			return fail(400, { message: 'Reminder tidak perlu dikirim (belum waktunya atau sudah dikirim).' });
		return { ok: true, ...hasil };
	}
};
