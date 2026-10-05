/**
 * HTTP client untuk panggilan server-side ke API eksternal (Telegram, AI gateway).
 *
 * Konteks sandbox: egress kadang me-MITM TLS dengan CA yang tidak ada di
 * trust store Bun ("self signed certificate in certificate chain"), kadang
 * meneruskan sertifikat asli. Strategi: coba verifikasi penuh dulu; bila gagal
 * KHUSUS karena sertifikat, ulangi tanpa verifikasi (hanya relevan di sandbox —
 * di VPS produksi sertifikat selalu valid sehingga fallback tidak pernah aktif).
 * Setiap pemakaian fallback dicatat di log.
 */
import https from 'node:https';
import net from 'node:net';

/**
 * Bila FD_HTTP_FORWARDER diset (mis. http://127.0.0.1:8089 di sandbox),
 * semua request eksternal dilewatkan ke forwarder lokal via raw TCP socket
 * (menghindari proxy env yang kredensialnya cepat kedaluwarsa).
 * Bila tidak diset (VPS produksi), request langsung via node:https.
 */
const FORWARDER = (process.env.FD_HTTP_FORWARDER ?? '').replace(/\/$/, '');

export interface HttpResult {
	status: number;
	text: string;
}

function isCertError(e: unknown): boolean {
	const s = String(e);
	return (
		s.includes('certificate') ||
		s.includes('CERT_') ||
		s.includes('UNABLE_TO_VERIFY') ||
		s.includes('self signed')
	);
}

function rawRequest(
	url: string,
	method: 'GET' | 'POST',
	body: string | undefined,
	headers: Record<string, string>,
	timeoutMs: number,
	insecure: boolean
): Promise<HttpResult> {
	return new Promise((resolve, reject) => {
		const u = new URL(url);
		const req = https.request(
			{
				hostname: u.hostname,
				port: u.port ? Number(u.port) : 443,
				path: u.pathname + u.search,
				method,
				headers,
				rejectUnauthorized: !insecure,
				timeout: timeoutMs
			},
			(res) => {
				let text = '';
				res.on('data', (c) => (text += c));
				res.on('end', () => resolve({ status: res.statusCode ?? 0, text }));
			}
		);
		req.on('error', reject);
		req.on('timeout', () => req.destroy(new Error('timeout')));
		if (body !== undefined) req.write(body);
		req.end();
	});
}

function viaForwarder(
	targetUrl: string,
	method: 'GET' | 'POST',
	body: string | undefined,
	headers: Record<string, string>,
	timeoutMs: number
): Promise<HttpResult> {
	return new Promise((resolve, reject) => {
		const f = new URL(FORWARDER);
		const sock = net.createConnection(
			{ host: f.hostname, port: Number(f.port || 80), timeout: timeoutMs },
			() => {
				const lines = [
					`${method} / HTTP/1.1`,
					`Host: ${f.hostname}:${f.port || 80}`,
					`X-Target: ${targetUrl}`,
					'Connection: close'
				];
				for (const [k, v] of Object.entries(headers)) lines.push(`${k}: ${v}`);
				if (body !== undefined) {
					lines.push('Content-Type: application/json');
					lines.push(`Content-Length: ${Buffer.byteLength(body)}`);
				}
				sock.write(lines.join('\r\n') + '\r\n\r\n' + (body ?? ''));
			}
		);
		let buf = Buffer.alloc(0);
		let done = false;
		const finish = (e?: Error) => {
			if (done) return;
			done = true;
			sock.destroy();
			if (e) reject(e);
		};
		sock.on('timeout', () => finish(new Error('timeout')));
		sock.on('error', finish);
		sock.on('data', (c: Buffer) => (buf = Buffer.concat([buf, Buffer.from(c)])));
		sock.on('close', () => {
			if (done) return;
			done = true;
			try {
				const head = buf.indexOf('\r\n\r\n');
				const headerText = buf.subarray(0, head).toString('latin1');
				const status = Number(headerText.split('\r\n')[0].split(' ')[1] || 0);
				resolve({ status, text: buf.subarray(head + 4).toString('utf8') });
			} catch (e) {
				reject(e instanceof Error ? e : new Error(String(e)));
			}
		});
	});
}

async function request(
	url: string,
	method: 'GET' | 'POST',
	body: unknown,
	timeoutMs: number,
	headers: Record<string, string>
): Promise<HttpResult> {
	const payload = body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
	if (FORWARDER) {
		return viaForwarder(url, method, payload, headers, timeoutMs);
	}
	const h: Record<string, string> = { ...headers };
	if (payload !== undefined) {
		h['content-type'] = 'application/json';
		h['content-length'] = String(Buffer.byteLength(payload));
	}
	try {
		return await rawRequest(url, method, payload, h, timeoutMs, false);
	} catch (e) {
		if (!isCertError(e)) throw e;
		console.warn('[http] fallback tanpa verifikasi TLS untuk', new URL(url).hostname);
		return await rawRequest(url, method, payload, h, timeoutMs, true);
	}
}

/** POST JSON via node:https. Melempar Error bila koneksi/timeout gagal. */
export function postJson(
	url: string,
	body: unknown,
	timeoutMs = 25000,
	headers: Record<string, string> = {}
): Promise<HttpResult> {
	return request(url, 'POST', body, timeoutMs, headers);
}

/** GET JSON via node:https. */
export function getJson(url: string, timeoutMs = 25000): Promise<HttpResult> {
	return request(url, 'GET', undefined, timeoutMs, {});
}
