import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sqlite } from '#lib/server/db';
import { checkRateLimit, extractClientIp } from '#lib/server/ratelimit';

export const GET: RequestHandler = async ({ request, locals, url, getClientAddress }) => {
	const clientIp = extractClientIp(request, getClientAddress);
	const isLocal = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost';

	// 🛡️ Rate limit akses publik: Maksimal 60 request per menit per IP
	if (!isLocal) {
		const rateResult = checkRateLimit('api-health', clientIp, 60, 60_000);
		if (!rateResult.allowed) {
			return json({ status: 'rate_limited' }, { status: 429 });
		}
	}

	const startTime = performance.now();
	let dbHealthy = false;
	let dbError: string | null = null;

	try {
		const row = sqlite.query<{ healthy: number }, []>('SELECT 1 as healthy').get();
		dbHealthy = row?.healthy === 1;
	} catch (err) {
		dbHealthy = false;
		dbError = err instanceof Error ? err.message : String(err);
	}

	const latencyMs = Math.round((performance.now() - startTime) * 100) / 100;

	// Cek apakah pengakses berhak melihat detail diagnostik server (Localhost, Admin, atau Token)
	const secretToken = process.env.BETTER_AUTH_SECRET;
	const isAuthed =
		isLocal ||
		locals.user?.role === 'owner' ||
		locals.user?.role === 'admin' ||
		(secretToken && request.headers.get('x-health-token') === secretToken) ||
		(secretToken && url.searchParams.get('token') === secretToken);

	const mem = process.memoryUsage();

	// 🛡️ Minimalisasi Info Disclosure: Pengunjung publik hanya melihat status "ok"
	const payload = isAuthed
		? {
				status: dbHealthy ? 'ok' : 'degraded',
				timestamp: new Date().toISOString(),
				uptimeSeconds: Math.floor(process.uptime()),
				database: {
					status: dbHealthy ? 'healthy' : 'unhealthy',
					latencyMs,
					...(dbError ? { error: dbError } : {})
				},
				memory: {
					rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
					heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10
				},
				integrations: {
					auth: Boolean(process.env.BETTER_AUTH_SECRET),
					telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
					resend: Boolean(process.env.RESEND_API_KEY),
					aiGateway: Boolean(process.env.AI_GATEWAY_KEY),
					waProvider: process.env.WA_PROVIDER ?? 'off'
				}
			}
		: {
				status: dbHealthy ? 'ok' : 'degraded',
				timestamp: new Date().toISOString()
			};

	return json(payload, {
		status: dbHealthy ? 200 : 503,
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};
