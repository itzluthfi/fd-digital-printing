import { desc, eq, or, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { db } from '#lib/server/db';
import { customers, orders } from '#lib/server/db/schema';
import { COMPANY_INFO } from '#lib/data/company';

export const load: PageServerLoad = async ({ url, locals }) => {
	const query = url.searchParams.get('q')?.trim() || '';
	let foundOrders: any[] = [];

	if (query) {
		const cleanQuery = query.toUpperCase();
		// Cari berdasarkan kode order (exact atau like) atau nomor HP
		const rows = await db
			.select({
				id: orders.id,
				code: orders.code,
				status: orders.status,
				description: orders.description,
				total: orders.total,
				fileUrl: orders.fileUrl,
				createdAt: orders.createdAt,
				customerName: customers.name,
				customerPhone: customers.phone
			})
			.from(orders)
			.leftJoin(customers, eq(orders.customerId, customers.id))
			.where(
				or(
					eq(orders.code, cleanQuery),
					sql`${orders.code} LIKE ${'%' + cleanQuery + '%'}`,
					sql`${customers.phone} LIKE ${'%' + query + '%'}`
				)
			)
			.orderBy(desc(orders.createdAt))
			.limit(10);

		foundOrders = rows;
	}

	return {
		query,
		orders: foundOrders,
		company: COMPANY_INFO,
		user: locals.user
	};
};
