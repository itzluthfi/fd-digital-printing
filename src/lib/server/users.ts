/**
 * Manajemen Pengguna & Staf FD Digital Printing.
 * Mengelola pembuatan, edit data, reset password, dan sinkronisasi role & Telegram ID.
 */
import { hashPassword } from 'better-auth/crypto';
import { and, eq, inArray } from 'drizzle-orm';

import { db } from './db';
import { account, user } from './db/schema';
import { setSetting } from './settings';
import { syncTelegramBotCommands } from './bot/api';

export type UserRole = 'owner' | 'admin' | 'operator' | 'customer';
export type StaffRole = 'owner' | 'admin' | 'operator';

/**
 * Sinkronkan seluruh staf yang memiliki Telegram Chat ID ke pengaturan bot Telegram.
 */
export async function syncAllStaffToTelegram(): Promise<void> {
	try {
		const staffRows = await db
			.select({
				name: user.name,
				role: user.role,
				tgId: user.telegramChatId
			})
			.from(user)
			.where(inArray(user.role, ['owner', 'admin', 'operator']));

		const staffList = staffRows
			.filter((r) => r.tgId && /^-?\d+$/.test(r.tgId.trim()))
			.map((r) => ({
				id: r.tgId!.trim(),
				name: r.name,
				role: (r.role === 'admin' ? 'kasir' : r.role) as 'owner' | 'kasir' | 'operator'
			}));

		await setSetting('telegram_staff_list', JSON.stringify(staffList));
		await syncTelegramBotCommands().catch(() => {});
	} catch (err) {
		console.warn('[users] Gagal sinkronisasi staf ke Telegram:', err);
	}
}

export async function createStaffUser(input: {
	name: string;
	email: string;
	password: string;
	role: StaffRole;
	telegramChatId?: string | null;
}): Promise<string> {
	if (input.password.length < 8) throw new Error('Password minimal 8 karakter.');
	const id = crypto.randomUUID();
	const now = new Date();
	const hashed = await hashPassword(input.password);

	await db.insert(user).values({
		id,
		name: input.name,
		email: input.email.toLowerCase().trim(),
		emailVerified: true,
		role: input.role,
		telegramChatId: input.telegramChatId?.trim() || null,
		createdAt: now,
		updatedAt: now
	});

	await db.insert(account).values({
		id: crypto.randomUUID(),
		accountId: id,
		providerId: 'credential',
		userId: id,
		password: hashed,
		createdAt: now,
		updatedAt: now
	});

	if (input.telegramChatId) {
		await syncAllStaffToTelegram();
	}

	return id;
}

export async function updateStaffUser(input: {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	telegramChatId?: string | null;
	password?: string | null;
}): Promise<void> {
	const now = new Date();
	const email = input.email.toLowerCase().trim();

	// 1. Update data dasar pengguna
	await db
		.update(user)
		.set({
			name: input.name.trim(),
			email,
			role: input.role,
			telegramChatId: input.telegramChatId?.trim() || null,
			updatedAt: now
		})
		.where(eq(user.id, input.id));

	// 2. Jika password baru diberikan, update credential di tabel account
	if (input.password && input.password.trim().length > 0) {
		if (input.password.length < 8) {
			throw new Error('Password baru minimal 8 karakter.');
		}
		const hashed = await hashPassword(input.password);

		const acc = await db
			.select()
			.from(account)
			.where(and(eq(account.userId, input.id), eq(account.providerId, 'credential')))
			.get();

		if (acc) {
			await db
				.update(account)
				.set({ password: hashed, updatedAt: now })
				.where(eq(account.id, acc.id));
		} else {
			await db.insert(account).values({
				id: crypto.randomUUID(),
				accountId: input.id,
				providerId: 'credential',
				userId: input.id,
				password: hashed,
				createdAt: now,
				updatedAt: now
			});
		}
	}

	// 3. Sinkronkan ke Telegram
	await syncAllStaffToTelegram();
}

export async function upsertStaffUser(input: {
	name: string;
	email: string;
	password: string;
	role: StaffRole;
	telegramChatId?: string | null;
}): Promise<string> {
	if (input.password.length < 8) throw new Error('Password minimal 8 karakter.');
	const email = input.email.toLowerCase().trim();
	const existing = await db.select().from(user).where(eq(user.email, email)).get();
	const hashed = await hashPassword(input.password);
	const now = new Date();

	if (existing) {
		await db
			.update(user)
			.set({
				name: input.name,
				role: input.role,
				telegramChatId: input.telegramChatId?.trim() || null,
				updatedAt: now
			})
			.where(eq(user.id, existing.id));

		const acc = await db
			.select()
			.from(account)
			.where(and(eq(account.userId, existing.id), eq(account.providerId, 'credential')))
			.get();

		if (acc) {
			await db
				.update(account)
				.set({ password: hashed, updatedAt: now })
				.where(eq(account.id, acc.id));
		} else {
			await db.insert(account).values({
				id: crypto.randomUUID(),
				accountId: existing.id,
				providerId: 'credential',
				userId: existing.id,
				password: hashed,
				createdAt: now,
				updatedAt: now
			});
		}

		await syncAllStaffToTelegram();
		return existing.id;
	}

	return createStaffUser(input);
}
