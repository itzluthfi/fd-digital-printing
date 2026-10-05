/**
 * Proteksi route per role.
 *
 * Publik: /sign-in, /sign-up, /forgot-password, /reset-password,
 * /verify-email, /api/auth/*, file statis.
 * Login → / mengarah ke /dashboard (owner/admin) atau /order (operator).
 */
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';

import { auth } from '#lib/server/auth';

const PUBLIC = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/verify-email'];
const STAFF_ONLY = ['/dashboard', '/kasir', '/piutang', '/pelanggan', '/laporan', '/notifikasi', '/harga'];

function isPublic(path: string): boolean {
	if (path === '/') return true;
	if (path.startsWith('/api/auth')) return true;
	if (path.startsWith('/api/telegram/webhook')) return true; // webhook bot (proteksi via secret header)
	if (path.startsWith('/_app/')) return true;
	if (/\/[^/]+\.[^/]+$/.test(path)) return true; // file statis
	return PUBLIC.some((p) => path === p || path.startsWith(p + '/'));
}

export const handle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	const path = event.url.pathname;
	const role = session?.user?.role as string | undefined;

	if (!session) {
		if (!isPublic(path)) throw redirect(303, '/sign-in');
		return resolve(event);
	}

	// Sudah login tapi buka halaman auth → lempar ke beranda
	if (path === '/sign-in' || path === '/sign-up') throw redirect(303, '/');

	if (path === '/') {
		throw redirect(303, role === 'operator' ? '/order' : '/dashboard');
	}

	if (STAFF_ONLY.some((p) => path === p || path.startsWith(p + '/'))) {
		if (role !== 'owner' && role !== 'admin') throw redirect(303, '/order');
	}
	if (path === '/pengguna' || path.startsWith('/pengguna/')) {
		if (role !== 'owner') throw redirect(303, '/dashboard');
	}
	if (path === '/pengaturan' || path.startsWith('/pengaturan/')) {
		if (role !== 'owner') throw redirect(303, '/dashboard');
	}
	// /order: owner, admin, operator boleh

	return resolve(event);
};
