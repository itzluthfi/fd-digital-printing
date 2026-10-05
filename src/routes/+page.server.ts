/**
 * Landing page publik FD Digital Printing (tanpa login).
 * Harga diambil langsung dari katalog aktif di database.
 */
import { asc, eq } from 'drizzle-orm';

import { db } from '#lib/server/db';
import { priceItems } from '#lib/server/db/schema';

export const load = async () => {
	const items = await db
		.select({
			name: priceItems.name,
			category: priceItems.category,
			unit: priceItems.unit,
			price: priceItems.price
		})
		.from(priceItems)
		.where(eq(priceItems.isActive, true))
		.orderBy(asc(priceItems.sortOrder), asc(priceItems.name));
	return { items };
};
