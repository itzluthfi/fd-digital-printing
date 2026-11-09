import type { PageServerLoad } from './$types';
import { COMPANY_INFO } from '#lib/data/company';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		company: COMPANY_INFO,
		user: locals.user
	};
};
