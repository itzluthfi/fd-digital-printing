/**
 * Landing Page & Company Profile FD Digital Printing (tanpa login).
 * Terintegrasi dengan database harga & data company profile resmi.
 */
import { asc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

import { db } from '#lib/server/db';
import { priceItems } from '#lib/server/db/schema';
import { getProductSlug, getProductUrl } from '#lib/products';
import {
	COMPANY_INFO,
	DESKRIPSI_PERUSAHAAN,
	SEJARAH_PERUSAHAAN,
	LAYANAN_PERCETAKAN,
	FAQ_PERCETAKAN
} from '#lib/data/company';
import { DAFTAR_MESIN } from '#lib/data/mesin';

export const load: PageServerLoad = async ({ locals }) => {
	const rawItems = await db
		.select({
			id: priceItems.id,
			name: priceItems.name,
			category: priceItems.category,
			imageUrl: priceItems.imageUrl,
			unit: priceItems.unit,
			price: priceItems.price
		})
		.from(priceItems)
		.where(eq(priceItems.isActive, true))
		.orderBy(asc(priceItems.sortOrder), asc(priceItems.name));

	const items = rawItems.map((item) => ({
		...item,
		slug: getProductSlug(item),
		url: getProductUrl(item)
	}));

	return {
		items,
		company: COMPANY_INFO,
		deskripsi: DESKRIPSI_PERUSAHAAN,
		sejarah: SEJARAH_PERUSAHAAN,
		layanan: LAYANAN_PERCETAKAN,
		daftarMesin: DAFTAR_MESIN,
		faq: FAQ_PERCETAKAN,
		user: locals.user
	};
};
