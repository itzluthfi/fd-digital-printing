/**
 * Buat akun Owner awal untuk FD Digital Printing (dev).
 * Jalankan: bun run db:seed:owner
 * Email/password bisa diubah via argumen: bun run db:seed:owner -- email pass
 */
import { createStaffUser } from '../users';

const email = process.argv[2] ?? 'owner@fd.local';
const password = process.argv[3] ?? 'admin123';

const id = await createStaffUser({ name: 'Owner', email, password, role: 'owner' });
console.log(`Owner dibuat: ${email} (id ${id})`);
