/**
 * POST /api/ai/parse — ubah transkrip suara kasir menjadi field order.
 * Body: { transcript: string }
 * Hanya owner/admin. Key AI tidak pernah keluar dari server.
 */
import { json } from '@sveltejs/kit';

import { aiConfigured, aiModels, aiParseOrder } from '#lib/server/ai';

export async function POST({ request, locals }: { request: Request; locals: App.Locals }) {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') return json({ error: 'Akses ditolak.' }, { status: 403 });
	if (!aiConfigured()) return json({ error: 'AI belum dikonfigurasi (AI_GATEWAY_KEY).' }, { status: 503 });

	let body: { transcript?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Body tidak valid.' }, { status: 400 });
	}
	const transcript = String(body.transcript ?? '').trim().slice(0, 500);
	if (!transcript) return json({ error: 'Transkrip kosong.' }, { status: 400 });

	const hasil = await aiParseOrder(transcript);
	if (!hasil) return json({ error: 'AI gagal memahami ucapan. Coba lagi.' }, { status: 502 });
	return json({ ...hasil, model: aiModels().text });
}
