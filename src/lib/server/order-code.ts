/** Helper order: kode tracking unik FD-XXXXXX. */
import { Database } from 'bun:sqlite';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function buatKodeOrder(dbPath?: string): string {
	const sqlite = new Database(dbPath ?? process.env.DB_PATH ?? './data/app.db', { readonly: true });
	try {
		const acak = () =>
			Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
		for (let i = 0; i < 10; i++) {
			const code = `FD-${acak()}`;
			const ada = sqlite.query('select 1 from orders where code = ?').get(code);
			if (!ada) return code;
		}
		// Fallback: pakai timestamp bila 10x tabrakan (praktis tidak terjadi)
		return `FD-${Date.now().toString(36).toUpperCase().slice(-6)}`;
	} finally {
		sqlite.close();
	}
}
