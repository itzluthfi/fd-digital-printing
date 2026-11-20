import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '#lib/server/db';
import { machines } from '#lib/server/db/schema';
import { COMPANY_INFO } from '#lib/data/company';

export const load: PageServerLoad = async ({ locals }) => {
	const dbMachines = await db
		.select()
		.from(machines)
		.where(eq(machines.isActive, true))
		.orderBy(asc(machines.sortOrder), asc(machines.nama));

	const daftarMesin = dbMachines.map((m) => ({
		...m,
		id: m.slug // ensure slug acts as id for anchor links
	}));

	return {
		daftarMesin,
		company: COMPANY_INFO,
		user: locals.user
	};
};
