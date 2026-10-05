/**
 * Integrasi resmi ke Gateway GoQRIS (https://goqris.sir-l.web.id)
 * Mendukung pembuatan Dynamic QRIS resmi ber-nominal pas (Auto-Mutasi GoPay/GoBiz)
 * serta verifikasi webhook callback.
 */

export const GOQRIS_BASE_URL = (process.env.GOQRIS_BASE_URL || 'https://goqris.sir-l.web.id').replace(/\/$/, '');

export function getGoQrisApiKey(): string {
	return (process.env.GOQRIS_API_KEY || '').trim();
}

export type GoQrisResponse = {
	success: boolean;
	message?: string;
	data?: {
		trx_id?: string;
		amount?: number;
		qris_string?: string;
		qr_string?: string;
		qr_image?: string;
		qr_image_url?: string;
		invoice_url?: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
};

/**
 * Buat transaksi QRIS Dinamis ke server GoQRIS
 */
export async function createGoQrisTransaction(params: {
	amount: number;
	orderCode: string;
	itemName: string;
	customerName?: string;
	customerPhone?: string;
}): Promise<GoQrisResponse> {
	const apiKey = getGoQrisApiKey();
	if (!apiKey || apiKey === 'paste_api_key_goqris_anda_disini') {
		console.warn('[GoQRIS] GOQRIS_API_KEY belum diisi dengan key asli di file .env');
		return {
			success: false,
			message: 'GOQRIS_API_KEY belum diisi dengan key asli di file .env'
		};
	}

	const webhookUrl = process.env.BETTER_AUTH_URL
		? `${process.env.BETTER_AUTH_URL}/api/webhook/goqris`
		: 'https://fd-printing.sir-l.web.id/api/webhook/goqris';

	try {
		const res = await fetch(`${GOQRIS_BASE_URL}/create-qris`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': GOQRIS_API_KEY
			},
			body: JSON.stringify({
				amount: Math.round(params.amount),
				trx_id: params.orderCode,
				account_id: 'acc_utama',
				webhook_url: webhookUrl,
				items: [
					{
						name: params.itemName || 'Cetak FD Printing',
						qty: 1,
						price: Math.round(params.amount)
					}
				],
				customer: {
					name: params.customerName || 'Pelanggan',
					phone: params.customerPhone || ''
				}
			})
		});

		const json = await res.json();
		return json;
	} catch (err) {
		console.error('[GoQRIS] Gagal menghubungi server GoQRIS:', err);
		return null;
	}
}

/**
 * Cek status transaksi langsung ke server GoQRIS
 */
export async function checkGoQrisPayment(orderCode: string, amount: number) {
	if (!GOQRIS_API_KEY) return null;
	try {
		const res = await fetch(`${GOQRIS_BASE_URL}/check-payment`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': GOQRIS_API_KEY
			},
			body: JSON.stringify({
				trx_id: orderCode,
				amount: Math.round(amount)
			})
		});
		return await res.json();
	} catch (err) {
		console.error('[GoQRIS] Gagal cek payment:', err);
		return null;
	}
}
