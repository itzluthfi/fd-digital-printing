import { error } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

import { db } from '#lib/server/db';
import { notificationLogs } from '#lib/server/db/schema';

export const load: PageServerLoad = async ({ locals }) => {
	const role = locals.user?.role ?? 'customer';
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');

	const logs = await db
		.select()
		.from(notificationLogs)
		.orderBy(desc(notificationLogs.createdAt))
		.limit(200);

	return { logs };
};
