/**
 * POST /api/ai/assistant — "otak" Dipi (AI Web Copilot FD Printing).
 * ------------------------------------------------------------------
 * STATUS: skeleton + mock. Frontend (DipiChat.svelte) sudah bisa dites
 * end-to-end dengan mock ini. Untuk produksi, sambungkan ke nine-router
 * (OpenAI-compatible di https://mj9.sir-l.web.id/v1) dengan tool-calling,
 * ikuti TODO di bawah.
 *
 * Cara pakai: copy file ini menjadi
 *   src/routes/api/ai/assistant/+server.ts
 */
import { json, type RequestHandler } from '@sveltejs/kit';

// ------------------------------------------------------------------
// 1) SYSTEM PROMPT (draft)
// ------------------------------------------------------------------
const SYSTEM_PROMPT = `Kamu Dipi, asisten AI FD Digital Printing (Sidoarjo).
Jawab santai, ramah, Bahasa Indonesia kasual, singkat maksimal 3 kalimat.
Kamu BISA memanggil tool: kalkulasi_cetak (hitung harga), cek_status_order
(cek status cetakan by kode order), info_toko (jam buka/alamat).
JANGAN pernah menebak harga — selalu pakai tool kalkulasi_cetak.
JANGAN tampilkan data pelanggan lain. Kalau tidak tahu, arahkan ke WhatsApp toko.`;

// ------------------------------------------------------------------
// 2) TOOL SCHEMAS (OpenAI function-calling format)
// ------------------------------------------------------------------
const TOOLS = [
	{
		type: 'function',
		function: {
			name: 'kalkulasi_cetak',
			description: 'Hitung estimasi harga cetak dari ukuran dan jumlah.',
			parameters: {
				type: 'object',
				properties: {
					produk: { type: 'string', description: 'mis. banner, stiker, brosur' },
					panjang_m: { type: 'number' },
					lebar_m: { type: 'number' },
					qty: { type: 'number' }
				},
				required: ['produk', 'panjang_m', 'lebar_m', 'qty']
			}
		}
	},
	{
		type: 'function',
		function: {
			name: 'cek_status_order',
			description: 'Cek status produksi dari kode order, mis. FD-A1B2C3.',
			parameters: {
				type: 'object',
				properties: { kode: { type: 'string' } },
				required: ['kode']
			}
		}
	},
	{
		type: 'function',
		function: {
			name: 'info_toko',
			description: 'Info jam buka, alamat, kontak toko.',
			parameters: {
				type: 'object',
				properties: {
					topik: { type: 'string', enum: ['jam_buka', 'alamat', 'kontak'] }
				},
				required: ['topik']
			}
		}
	}
];

// ------------------------------------------------------------------
// 3) MOCK (fallback sampai nine-router disambung)
// ------------------------------------------------------------------
function mockBrain(message: string) {
	const msg = message.toLowerCase();
	if (/(jam|buka|tutup)/.test(msg))
		return {
			reply: 'Toko buka Senin–Sabtu 10.00–02.00, Minggu 10.00–18.00 kak!',
			mood: 'idle',
			cards: []
		};
	if (/(alamat|lokasi|dimana)/.test(msg))
		return {
			reply: 'Kami di Jl. Raya Wadungasri No. 42, Waru, Sidoarjo. Peta ada di bawah halaman utama!',
			mood: 'idle',
			cards: []
		};
	const kode = msg.match(/fd-[a-z0-9]{4,}/i);
	if (kode)
		return {
			reply: `Kode ${kode[0].toUpperCase()} kuterima! (SIMULASI — sambungkan DB untuk status asli.)`,
			mood: 'thinking',
			cards: [
				{
					kind: 'order',
					title: `Order ${kode[0].toUpperCase()}`,
					rows: [{ label: 'Status', value: 'Diproses (simulasi)' }],
					note: 'Hubungkan tool cek_status_order ke database.'
				}
			]
		};
	return {
		reply: 'Siap! Tanya harga cetak (mis. "banner 2x1"), lacak order (mis. "FD-A1B2C3"), atau jam buka toko.',
		mood: 'idle',
		cards: []
	};
}

// ------------------------------------------------------------------
// 4) HANDLER
// ------------------------------------------------------------------
export const POST: RequestHandler = async ({ request }) => {
	const { message } = await request.json().catch(() => ({ message: '' }));

	// TODO PRODUKSI:
	// 1. Ambil key dari env (JANGAN hardcode!):
	//      const key = process.env.NINE_ROUTER_KEY;
	// 2. POST ke nine-router (OpenAI-compatible):
	//      fetch('https://mj9.sir-l.web.id/v1/chat/completions', {
	//        method: 'POST',
	//        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
	//        body: JSON.stringify({
	//          model: 'cf/@cf/meta/llama-3.1-8b-instruct-fp8-fast',
	//          messages: [
	//            { role: 'system', content: SYSTEM_PROMPT },
	//            { role: 'user', content: String(message) }
	//          ],
	//          tools: TOOLS
	//        })
	//      })
	// 3. Loop eksekusi tool-call:
	//      - kalkulasi_cetak → baca tarif dari DB/tabel harga (min. luas 1 m²)
	//      - cek_status_order → query tabel orders by kode (rate-limit: maks 10x/menit/IP,
	//        JANGAN bocorkan data order milik kode lain)
	//      - info_toko → konstanta (jam/alamat sudah terverifikasi Google Maps)
	// 4. Kembalikan { reply, mood, cards } — mood: idle|happy|thinking|surprised.
	//
	// CATATAN KEAMANAN:
	// - Rate-limit endpoint ini (mis. @sveltejs/kit + limiter sederhana).
	// - Jangan teruskan API key ke browser. Semua key hanya di server.
	// - Validasi input: batasi panjang pesan (mis. 500 char).

	return json(mockBrain(String(message ?? '')));
};
