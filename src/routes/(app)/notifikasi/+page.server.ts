import { error, fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

import { db } from '#lib/server/db';
import { notificationLogs } from '#lib/server/db/schema';
import { sendTelegram } from '#lib/server/notify/telegram';
import { sendWhatsApp } from '#lib/server/notify/whatsapp';
import { sendEmail, emailLayout } from '#lib/server/email';

export const load: PageServerLoad = async ({ locals }) => {
	const role = locals.user?.role ?? 'customer';
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');

	const logs = await db
		.select()
		.from(notificationLogs)
		.orderBy(desc(notificationLogs.createdAt))
		.limit(200);

	return { logs };
};

export const actions: Actions = {
	retry: async ({ request, locals }) => {
		const role = locals.user?.role ?? 'customer';
		if (role !== 'owner' && role !== 'admin') return fail(403, { message: 'Akses ditolak.' });

		const f = await request.formData();
		const logId = Number(f.get('logId'));
		if (!logId) return fail(400, { message: 'ID log tidak valid.' });

		const log = await db.select().from(notificationLogs).where(eq(notificationLogs.id, logId)).get();
		if (!log) return fail(404, { message: 'Log tidak ditemukan.' });

		let ok = false;
		let errMsg: string | null = null;

		try {
			if (log.channel === 'telegram') {
				ok = await sendTelegram(log.target, `<b>${log.title}</b>\nNotifikasi ulang.`);
				if (!ok) errMsg = 'Telegram API menolak pengiriman ulang.';
			} else if (log.channel === 'whatsapp') {
				ok = await sendWhatsApp(log.target, `*${log.title}*\nNotifikasi ulang.`);
				if (!ok) errMsg = 'Gateway WhatsApp menolak pengiriman ulang.';
			} else if (log.channel === 'email') {
				await sendEmail({
					to: log.target,
					subject: `${log.title} — FD Digital Printing`,
					html: emailLayout(log.title, `<p>${log.title}</p>`),
					text: log.title
				});
				ok = true;
			}

			if (ok) {
				await db
					.update(notificationLogs)
					.set({ status: 'sent', error: null })
					.where(eq(notificationLogs.id, logId));
				return { ok: true, message: 'Notifikasi berhasil dikirim ulang!' };
			} else {
				await db
					.update(notificationLogs)
					.set({ status: 'failed', error: errMsg })
					.where(eq(notificationLogs.id, logId));
				return fail(400, { message: errMsg ?? 'Gagal mengirim ulang notifikasi.' });
			}
		} catch (e) {
			const err = e instanceof Error ? e.message : 'Kesalahan pengiriman ulang.';
			await db
				.update(notificationLogs)
				.set({ status: 'failed', error: err })
				.where(eq(notificationLogs.id, logId));
			return fail(500, { message: err });
		}
	}
};
