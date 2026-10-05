/**
 * Pembuatan akun staff oleh Owner (tidak lewat registrasi publik).
 * Password di-hash dengan scrypt bawaan Better Auth, lalu disimpan
 * langsung ke tabel user + account (provider credential).
 */
import { hashPassword } from 'better-auth/crypto';

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
