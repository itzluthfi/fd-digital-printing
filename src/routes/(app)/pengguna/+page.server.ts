/**
 * Kelola pengguna & staf — KHUSUS owner.
 * Mendukung tambah staf, edit profil, ganti role, reset password, dan integrasi Telegram Chat ID.
 */
import { error, fail } from '@sveltejs/kit';
import { and, asc, eq, ne } from 'drizzle-orm';

import { db } from '#lib/server/db';
import { account, session, user } from '#lib/server/db/schema';
import { createStaffUser, updateStaffUser, type StaffRole, type UserRole } from '#lib/server/users';
import type { Actions, PageServerLoad } from './$types';

const ROLE_VALID: UserRole[] = ['owner', 'admin', 'operator', 'customer'];

function guard(locals: App.Locals) {
	if (locals.user?.role !== 'owner') throw error(403, 'Akses ditolak');
}

export const load: PageServerLoad = async ({ locals }) => {
	guard(locals);
	const daftar = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			telegramChatId: user.telegramChatId,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt
		})
		.from(user)
		.orderBy(asc(user.createdAt));
	return { users: daftar, selfId: locals.user!.id };
};

export const actions: Actions = {
	tambah: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		const email = String(f.get('email') ?? '').trim();
		const password = String(f.get('password') ?? '');
		const role = String(f.get('role') ?? '') as StaffRole;
		const telegramChatId = String(f.get('telegramChatId') ?? '').trim();

		if (!name) return fail(400, { message: 'Nama wajib diisi.' });
		if (!email || !email.includes('@')) return fail(400, { message: 'Email tidak valid.' });
		if (password.length < 8) return fail(400, { message: 'Password minimal 8 karakter.' });
		if (!['owner', 'admin', 'operator'].includes(role)) return fail(400, { message: 'Role tidak valid.' });
		if (telegramChatId && !/^-?\d+$/.test(telegramChatId)) {
			return fail(400, { message: 'Telegram Chat ID harus berupa angka.' });
		}

		const ada = await db.select({ id: user.id }).from(user).where(eq(user.email, email.toLowerCase()));
		if (ada.length > 0) return fail(400, { message: 'Email sudah terdaftar.' });

		try {
			const id = await createStaffUser({ name, email, password, role, telegramChatId });
			const [row] = await db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					telegramChatId: user.telegramChatId,
					emailVerified: user.emailVerified,
					createdAt: user.createdAt
				})
				.from(user)
				.where(eq(user.id, id));
			return { user: row };
		} catch (e) {
			return fail(500, { message: e instanceof Error ? e.message : 'Gagal membuat akun.' });
		}
	},

	update: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const id = String(f.get('id') ?? '').trim();
		const name = String(f.get('name') ?? '').trim();
		const email = String(f.get('email') ?? '').trim();
		let role = String(f.get('role') ?? '') as UserRole;
		const telegramChatId = String(f.get('telegramChatId') ?? '').trim();
		const password = String(f.get('password') ?? '');

		if (!id) return fail(400, { message: 'ID pengguna tidak valid.' });
		if (!name) return fail(400, { message: 'Nama tidak boleh kosong.' });
		if (!email || !email.includes('@')) return fail(400, { message: 'Email tidak valid.' });
		if (!ROLE_VALID.includes(role)) return fail(400, { message: 'Role tidak valid.' });

		// Jika mengedit akun sendiri, tidak boleh menurunkan role owner
		if (id === locals.user!.id) {
			role = 'owner';
		}

		if (telegramChatId && !/^-?\d+$/.test(telegramChatId)) {
			return fail(400, { message: 'Telegram Chat ID harus berupa angka.' });
		}

		if (password && password.length > 0 && password.length < 8) {
			return fail(400, { message: 'Password baru minimal 8 karakter.' });
		}

		// Pastikan email tidak dipakai oleh user lain
		const duplikat = await db
			.select({ id: user.id })
			.from(user)
			.where(and(eq(user.email, email.toLowerCase()), ne(user.id, id)))
			.get();
		if (duplikat) {
			return fail(400, { message: 'Email ini sudah digunakan oleh akun lain.' });
		}

		try {
			await updateStaffUser({
				id,
				name,
				email,
				role,
				telegramChatId,
				password: password || null
			});

			const [row] = await db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					telegramChatId: user.telegramChatId,
					emailVerified: user.emailVerified,
					createdAt: user.createdAt
				})
				.from(user)
				.where(eq(user.id, id));

			return { ok: true, user: row, message: `Data akun ${name} berhasil diperbarui.` };
		} catch (e) {
			return fail(500, { message: e instanceof Error ? e.message : 'Gagal memperbarui akun.' });
		}
	},

	hapus: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const id = String(f.get('id') ?? '');
		if (!id) return fail(400, { message: 'ID tidak valid.' });
		if (id === locals.user!.id) return fail(400, { message: 'Tidak bisa menghapus akun sendiri.' });

		// Bersihkan sesi + kredensial dulu (FK ke user)
		await db.delete(session).where(eq(session.userId, id));
		await db.delete(account).where(eq(account.userId, id));
		const [row] = await db.delete(user).where(eq(user.id, id)).returning({ id: user.id });
		if (!row) return fail(404, { message: 'Pengguna tidak ditemukan.' });
		return { deletedId: id };
	}
};
