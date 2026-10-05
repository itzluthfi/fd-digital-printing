/**
 * Klien AI gateway (OpenAI-compatible /v1) untuk fitur AI kasir.
 * Key HANYA dibaca dari env AI_GATEWAY_KEY di server — tidak pernah ke browser.
 */
import { postJson } from './http';

const baseUrl = () => (process.env.AI_GATEWAY_URL ?? 'https://mj9.sir-l.web.id/v1').replace(/\/$/, '');
const apiKey = () => process.env.AI_GATEWAY_KEY;
const textModel = () => process.env.AI_TEXT_MODEL ?? 'cf/@cf/meta/llama-3.1-8b-instruct-fp8-fast';
const visionModel = () => process.env.AI_VISION_MODEL ?? 'ag/gemini-3.6-flash-low';

export function aiConfigured(): boolean {
	return Boolean(apiKey());
}

export function aiModels(): { text: string; vision: string } {
	return { text: textModel(), vision: visionModel() };
}

/** Buang pembungkus markdown ```json ... ``` bila ada. */
function stripFences(s: string): string {
	const t = s.trim();
	const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
	return m ? m[1].trim() : t;
}

type ChatMessage = {
	role: 'system' | 'user';
	content:
		| string
		| ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[];
};

async function chatJson(messages: ChatMessage[], model: string, maxTokens = 400): Promise<unknown | null> {
	const key = apiKey();
	if (!key) return null;
	// Model vision kadang bandel (balas prosa walau diminta JSON) — coba ulang maks 3x.
	for (let attempt = 1; attempt <= 3; attempt++) {
		const msgs =
			attempt === 1
				? messages
				: [
						...messages,
						{
							role: 'user',
							content: 'Responsmu sebelumnya bukan JSON valid. Ulangi SEKARANG: keluarkan HANYA JSON, tanpa teks lain.'
						} as ChatMessage
					];
		const r = await chatOnce(msgs, model, maxTokens, key);
		if (r !== null) return r;
	}
	return null;
}

/** Ambil substring JSON ({...}) dari teks bila ada. */
function extractJson(s: string): string {
	const t = stripFences(s).trim();
	const start = t.indexOf('{');
	const end = t.lastIndexOf('}');
	if (start >= 0 && end > start) return t.slice(start, end + 1);
	return t;
}

async function chatOnce(
	messages: ChatMessage[],
	model: string,
	maxTokens: number,
	key: string
): Promise<unknown | null> {
	try {
		const { status, text: raw } = await postJson(
			`${baseUrl()}/chat/completions`,
			{ model, stream: false, temperature: 0, max_tokens: maxTokens, messages },
			75000,
			{ authorization: `Bearer ${key}` }
		);
		if (status !== 200) {
			console.error('[ai] gateway error:', status, raw.slice(0, 200));
			return null;
		}
		const data = JSON.parse(raw) as {
			choices?: { message?: { content?: string } }[];
			error?: unknown;
		};
		const content = data.choices?.[0]?.message?.content?.trim();
		if (!content) return null;
		try {
			return JSON.parse(extractJson(content));
		} catch {
			console.error('[ai] bukan JSON:', content.slice(0, 200));
			return null;
		}
	} catch (e) {
		console.error('[ai] network error:', String(e).slice(0, 200));
		return null;
	}
}

const PARSE_SYSTEM = `Kamu ekstrak info order cetakan dari ucapan kasir (Bahasa Indonesia).
Balas HANYA JSON valid, tanpa teks lain. Schema:
{"description": string, "total": number, "customer_name": string|null}
Aturan:
- description: ringkasan pesanan yang rapi (cth: "Cetak banner 2x1 m, 2 pcs").
- total: angka rupiah SAJA (cth: "seratus ribu"→100000, "lima puluh ribu"→50000, "satu juta"→1000000, "dua ratus lima puluh ribu"→250000). Jika tidak disebut, 0.
- customer_name: nama pelanggan bila disebut (cth: "buat pak budi"→"Pak Budi"), atau null.`;

export type ParseOrder = { description: string; total: number; customer_name: string | null };

/** Ubah transkrip suara kasir menjadi field order. */
export async function aiParseOrder(transcript: string): Promise<ParseOrder | null> {
	const r = await chatJson(
		[
			{ role: 'system', content: PARSE_SYSTEM },
			{ role: 'user', content: transcript }
		],
		textModel(),
		300
	);
	if (!r || typeof r !== 'object') return null;
	const o = r as Record<string, unknown>;
	return {
		description: String(o.description ?? '').slice(0, 300),
		total: Number(o.total) > 0 ? Math.round(Number(o.total)) : 0,
		customer_name: o.customer_name ? String(o.customer_name).slice(0, 100) : null
	};
}

const SCAN_EXTRACT_SYSTEM = `You output ONLY valid JSON, no other text.
Schema: {"description": string, "total": number, "items": string[]}
Rules:
- description: neat summary of the receipt in Bahasa Indonesia.
- total: TOTAL amount paid in rupiah, number ONLY (no dots/commas).
- items: important line items (max 8), each a short string.
If unreadable, reply {"description":"","total":0,"items":[]}.`;

export type ScanStruk = { description: string; total: number; items: string[] };

/** Baca foto struk menjadi field order — 2 tahap (vision→teks, teks→JSON) karena
 *  model vision tidak konsisten mematuhi instruksi JSON-only. */
export async function aiScanStruk(imageB64: string, mime: string): Promise<ScanStruk | null> {
	// Tahap 1: vision transkripsi isi struk sebagai teks biasa (ini yang paling stabil).
	const deskripsi = await chatText(
		[
			{
				role: 'user',
				content: [
					{ type: 'text', text: 'Tuliskan SEMUA teks yang terbaca pada foto struk ini, apa adanya.' },
					{ type: 'image_url', image_url: { url: `data:${mime};base64,${imageB64}` } }
				]
			}
		],
		visionModel(),
		500
	);
	if (!deskripsi) return null;

	// Tahap 2: model teks (patuh JSON) ekstrak jadi struktur.
	const r = await chatJson(
		[
			{ role: 'system', content: SCAN_EXTRACT_SYSTEM },
			{ role: 'user', content: `Hasil baca struk:\n${deskripsi}` }
		],
		textModel(),
		400
	);
	if (!r || typeof r !== 'object') return null;
	const o = r as Record<string, unknown>;
	return {
		description: String(o.description ?? '').slice(0, 300),
		total: Number(o.total) > 0 ? Math.round(Number(o.total)) : 0,
		items: Array.isArray(o.items) ? o.items.map(itemToString).filter(Boolean).slice(0, 8) : []
	};
}

/** chat completions yang mengembalikan teks biasa (bukan JSON). */
async function chatText(messages: ChatMessage[], model: string, maxTokens = 500): Promise<string | null> {
	const key = apiKey();
	if (!key) return null;
	try {
		const { status, text } = await postJson(
			`${baseUrl()}/chat/completions`,
			{ model, stream: false, temperature: 0, max_tokens: maxTokens, messages },
			75000,
			{ authorization: `Bearer ${key}` }
		);
		if (status !== 200) return null;
		const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
		return data.choices?.[0]?.message?.content?.trim() || null;
	} catch {
		return null;
	}
}

/** Ubah satu item (string atau object) menjadi string yang rapi. */
function itemToString(it: unknown): string {
	if (typeof it === 'string') return it.slice(0, 120);
	if (it && typeof it === 'object') {
		const o = it as Record<string, unknown>;
		const nama = o.nama ?? o.name ?? o.item ?? o.deskripsi ?? o.description ?? '';
		const qty = o.qty ?? o.jumlah ?? o.quantity ?? '';
		const harga = o.harga ?? o.price ?? o.total ?? '';
		const s = [nama, qty, harga].filter(Boolean).join(' ').trim();
		if (s) return s.slice(0, 120);
		try {
			return JSON.stringify(o).slice(0, 120);
		} catch {
			return '';
		}
	}
	return '';
}
