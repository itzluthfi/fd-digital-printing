/**
 * Kelola pengguna — KHUSUS owner.
 * Staff dibuat oleh owner via createStaffUser (bukan registrasi publik).
 */
import { error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';

import { db } from '#lib/server/db';
import { account, session, user } from '#lib/server/db/schema';
import { createStaffUser, type StaffRole } from '#lib/server/users';

const ROLE_VALID: StaffRole[] = ['owner', 'admin', 'operator'];

function guard(locals: App.Locals) {
	if (locals.user?.role !== 'owner') throw error(403, 'Akses ditolak');
}

export const load = async ({ locals }) => {
	guard(locals);
	const daftar = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.role,
			emailVerified: user.emailVerified,
			createdAt: user.createdAt
		})
		.from(user)
		.orderBy(asc(user.createdAt));
	return { users: daftar, selfId: locals.user!.id };
};

export const actions = {
	tambah: async ({ request, locals }) => {
		guard(locals);
		const f = await request.formData();
		const name = String(f.get('name') ?? '').trim();
		const email = String(f.get('email') ?? '').trim();
		const password = String(f.get('password') ?? '');
		const role = String(f.get('role') ?? '') as StaffRole;

		if (!name) return fail(400, { message: 'Nama wajib diisi.' });
		if (!email || !email.includes('@')) return fail(400, { message: 'Email tidak valid.' });
		if (password.length < 8) return fail(400, { message: 'Password minimal 8 karakter.' });
		if (!ROLE_VALID.includes(role)) return fail(400, { message: 'Role tidak valid.' });

		const ada = await db.select({ id: user.id }).from(user).where(eq(user.email, email.toLowerCase()));
		if (ada.length > 0) return fail(400, { message: 'Email sudah terdaftar.' });

		try {
			const id = await createStaffUser({ name, email, password, role });
			const [row] = await db
				.select({
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
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
