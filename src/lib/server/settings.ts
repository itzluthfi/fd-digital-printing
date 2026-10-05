/**
 * Pengaturan key-value toko (tabel settings).
 * Dipakai mis. untuk menyimpan status upload gambar QRIS.
 */
import { existsSync } from 'node:fs';
import { eq } from 'drizzle-orm';

import { db } from './db';
import { settings } from './db/schema';

export async function getSetting(key: string): Promise<string | null> {
	const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
	return row?.value ?? null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
	await db
		.insert(settings)
		.values({ key, value, updatedAt: new Date().toISOString() })
		.onConflictDoUpdate({
			target: settings.key,
			set: { value, updatedAt: new Date().toISOString() }
		});
}

/** Gambar QRIS statis toko — diunggah owner lewat halaman Pengaturan. */
export const QRIS_FILE = 'static/uploads/qris.png';
export const QRIS_URL = '/uploads/qris.png';

export function qrisTersedia(): boolean {
	return existsSync(QRIS_FILE);
}
