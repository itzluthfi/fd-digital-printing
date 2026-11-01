import type { PageServerLoad } from './$types';
import { DAFTAR_MESIN } from '#lib/data/mesin';
import { COMPANY_INFO } from '#lib/data/company';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		daftarMesin: DAFTAR_MESIN,
		company: COMPANY_INFO,
		user: locals.user
	};
};
