import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWaStatus } from '#lib/server/wa/provider';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const status = await getWaStatus();
	return json(status);
};
