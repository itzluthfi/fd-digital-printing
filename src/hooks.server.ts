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

const PUBLIC = [
	'/',
	'/pesan',
	'/produk',
	'/layanan',
	'/sign-in',
	'/sign-up',
	'/forgot-password',
	'/reset-password',
	'/verify-email'
];
const STAFF_ROLES = ['owner', 'admin', 'operator'];
const ADMIN_ROLES = ['owner', 'admin'];
const ADMIN_ONLY = ['/dashboard', '/kasir', '/piutang', '/pelanggan', '/laporan', '/notifikasi', '/pengeluaran', '/shift'];

function isPublic(path: string): boolean {
	if (path === '/') return true;
	if (path.startsWith('/pesan')) return true;
	if (path.startsWith('/produk') || path.startsWith('/layanan')) return true;
	if (path.startsWith('/api/auth')) return true;
	if (path.startsWith('/api/telegram/webhook')) return true; // webhook bot
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

	// Sudah login tapi buka halaman auth → arahkan ke beranda
	if (path === '/sign-in' || path === '/sign-up') {
		if (role === 'operator') throw redirect(303, '/order');
		if (role === 'owner' || role === 'admin') throw redirect(303, '/dashboard');
		throw redirect(303, '/');
	}

	// Proteksi rute admin/keuangan (hanya owner & admin)
	if (ADMIN_ONLY.some((p) => path === p || path.startsWith(p + '/'))) {
		if (!role || !ADMIN_ROLES.includes(role)) {
			throw redirect(303, role === 'operator' ? '/order' : '/');
		}
	}

	// Katalog harga: owner, admin, operator boleh akses
	if (path === '/harga' || path.startsWith('/harga/')) {
		if (!role || !STAFF_ROLES.includes(role)) {
			throw redirect(303, '/');
		}
	}

	// Antrean order: owner, admin, operator boleh akses
	if (path === '/order' || path.startsWith('/order/')) {
		if (!role || !STAFF_ROLES.includes(role)) {
			throw redirect(303, '/');
		}
	}

	// Kelola staf & pengaturan: khusus owner
	if (path === '/pengguna' || path.startsWith('/pengguna/') || path === '/pengaturan' || path.startsWith('/pengaturan/')) {
		if (role !== 'owner') {
			throw redirect(303, '/dashboard');
		}
	}

	return resolve(event);
};
