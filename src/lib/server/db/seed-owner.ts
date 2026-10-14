/**
 * Buat atau reset akun Demo untuk FD Digital Printing.
 * Jalankan: bun run db:seed:owner
 */
import { upsertStaffUser } from '../users';

// 🛡️ Jangan izinkan seeding akun demo sembarangan di environment non-local tanpa flag eksplisit
const isDev = process.env.NODE_ENV !== 'production';
const allowSeed = isDev || process.env.SEED_DEMO_ACCOUNTS === 'true';

if (!allowSeed && process.env.SEED_DEMO_ACCOUNTS !== 'force') {
	console.log('[seed-owner] ℹ️ Seeding akun demo dibatalkan demi keamanan (set SEED_DEMO_ACCOUNTS=true jika diperlukan).');
	process.exit(0);
}

const defaultPassword = process.env.DEMO_STAFF_PASSWORD || 'admin123';

const accounts = [
	{ name: 'Owner Toko', email: 'owner@fd.local', password: defaultPassword, role: 'owner' as const },
	{ name: 'Admin Toko', email: 'admin@fd.local', password: defaultPassword, role: 'admin' as const },
	{ name: 'Operator Cetak', email: 'operator@fd.local', password: defaultPassword, role: 'operator' as const }
];

for (const a of accounts) {
	const id = await upsertStaffUser(a);
	console.log(`Akun ${a.role} siap: ${a.email} (id: ${id})`);
}

