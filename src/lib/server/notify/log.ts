/**
 * Pencatatan percobaan pengiriman notifikasi ke tabel notification_logs.
 * Dipanggil dari notifyCustomer — tidak pernah melempar error agar
 * kegagalan logging tidak mengganggu alur pengiriman utama.
 */
import { randomUUID } from 'crypto';

import { db } from '../db';
import { notificationLogs } from '../db/schema';

export type NotifChannel = 'telegram' | 'whatsapp' | 'email';
export type NotifStatus = 'sent' | 'failed' | 'skipped';

export type LogEntry = {
	channel: NotifChannel;
	target: string;
	customerName?: string | null;
	orderId?: number | null;
	title: string;
	status: NotifStatus;
	error?: string | null;
};

export async function logNotification(entry: LogEntry): Promise<void> {
	try {
		await db.insert(notificationLogs).values({
			channel: entry.channel,
			target: entry.target,
			customerName: entry.customerName ?? null,
			orderId: entry.orderId ?? null,
			title: entry.title,
			status: entry.status,
			error: entry.error ?? null
		});
	} catch (e) {
		console.error('[notif-log] gagal mencatat:', e instanceof Error ? e.message : e);
	}
}

/** idempotency key sederhana bila dibutuhkan pemanggil */
export function newLogId(): string {
	return randomUUID();
}
