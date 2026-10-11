import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sqlite } from '#lib/server/db';

export const GET: RequestHandler = async () => {
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
	const mem = process.memoryUsage();

	const payload = {
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
	};

	return json(payload, {
		status: dbHealthy ? 200 : 503,
		headers: {
			'Cache-Control': 'no-cache, no-store, must-revalidate'
		}
	});
};
