/**
 * POST /api/ai/scan — baca foto struk menjadi field order.
 * Body: { image: string (base64 murni), mime: string }
 * Hanya owner/admin. Key AI tidak pernah keluar dari server.
 */
import { json } from '@sveltejs/kit';

import { aiConfigured, aiModels, aiScanStruk } from '#lib/server/ai';

const MAX_B64 = 5 * 1024 * 1024; // ~3.7MB gambar asli

export async function POST({ request, locals }: { request: Request; locals: App.Locals }) {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') return json({ error: 'Akses ditolak.' }, { status: 403 });
	if (!aiConfigured()) return json({ error: 'AI belum dikonfigurasi (AI_GATEWAY_KEY).' }, { status: 503 });

	let body: { image?: string; mime?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Body tidak valid.' }, { status: 400 });
	}
	const image = String(body.image ?? '');
	const mime = String(body.mime ?? '');
	if (!image || !['image/jpeg', 'image/png', 'image/webp'].includes(mime))
		return json({ error: 'Gambar tidak valid (jpg/png/webp).' }, { status: 400 });
	if (image.length > MAX_B64) return json({ error: 'Gambar terlalu besar.' }, { status: 400 });

	const hasil = await aiScanStruk(image, mime);
	if (!hasil) return json({ error: 'AI gagal membaca struk. Coba foto yang lebih jelas.' }, { status: 502 });
	return json({ ...hasil, model: aiModels().vision });
}
