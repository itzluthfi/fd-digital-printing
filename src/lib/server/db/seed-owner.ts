/**
 * Buat atau reset akun Demo untuk FD Digital Printing.
 * Jalankan: bun run db:seed:owner
 */
import { upsertStaffUser } from '../users';

const accounts = [
	{ name: 'Owner Toko', email: 'owner@fd.local', password: 'admin123', role: 'owner' as const },
	{ name: 'Admin Toko', email: 'admin@fd.local', password: 'admin123', role: 'admin' as const },
	{ name: 'Operator Cetak', email: 'operator@fd.local', password: 'admin123', role: 'operator' as const }
];

for (const a of accounts) {
	const id = await upsertStaffUser(a);
	console.log(`Akun ${a.role} siap: ${a.email} (id: ${id})`);
}

