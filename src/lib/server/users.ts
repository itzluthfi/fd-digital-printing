/**
 * Pembuatan akun staff oleh Owner (tidak lewat registrasi publik).
 * Password di-hash dengan scrypt bawaan Better Auth, lalu disimpan
 * langsung ke tabel user + account (provider credential).
 */
import { hashPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';

import { db } from './db';
import { account, user } from './db/schema';

export type StaffRole = 'owner' | 'admin' | 'operator';

export async function createStaffUser(input: {
	name: string;
	email: string;
	password: string;
	role: StaffRole;
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
	return id;
}

export async function upsertStaffUser(input: {
	name: string;
	email: string;
	password: string;
	role: StaffRole;
}): Promise<string> {
	if (input.password.length < 8) throw new Error('Password minimal 8 karakter.');
	const email = input.email.toLowerCase().trim();
	const existing = await db.select().from(user).where(eq(user.email, email)).get();
	const hashed = await hashPassword(input.password);
	const now = new Date();

	if (existing) {
		await db
			.update(user)
			.set({ name: input.name, role: input.role, updatedAt: now })
			.where(eq(user.id, existing.id))
			.run();

		const acc = await db
			.select()
			.from(account)
			.where(and(eq(account.userId, existing.id), eq(account.providerId, 'credential')))
			.get();

		if (acc) {
			await db
				.update(account)
				.set({ password: hashed, updatedAt: now })
				.where(eq(account.id, acc.id))
				.run();
		} else {
			await db
				.insert(account)
				.values({
					id: crypto.randomUUID(),
					accountId: existing.id,
					providerId: 'credential',
					userId: existing.id,
					password: hashed,
					createdAt: now,
					updatedAt: now
				})
				.run();
		}
		return existing.id;
	}

	return createStaffUser(input);
}
