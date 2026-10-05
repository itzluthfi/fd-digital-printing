/**
 * Invoice / struk print-friendly + kirim via email.
 */
import { error, fail } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';

import { db } from '#lib/server/db';
import { customers, orders, payments, receivables } from '#lib/server/db/schema';
import { emailLayout, sendEmail } from '#lib/server/email';
import { QRIS_URL, qrisTersedia } from '#lib/server/settings';
import { rupiah } from '#lib/format';

function guard(locals: App.Locals) {
	const role = locals.user?.role;
	if (role !== 'owner' && role !== 'admin') throw error(403, 'Akses ditolak');
}

export const load = async ({ locals, params }) => {
	guard(locals);
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(404, 'Invoice tidak ditemukan.');

	const [order] = await db.select().from(orders).where(eq(orders.id, id));
	if (!order) throw error(404, 'Invoice tidak ditemukan.');

	const [customer] = order.customerId
		? await db.select().from(customers).where(eq(customers.id, order.customerId))
		: [null];

	const bayar = await db.select().from(payments).where(eq(payments.orderId, id));
	const [piutang] = await db
		.select({
			sisa: sql<number>`coalesce(sum(${receivables.amount} - ${receivables.paidAmount}), 0)`,
			dueDate: sql<string | null>`min(${receivables.dueDate})`
		})
		.from(receivables)
		.where(sql`${receivables.orderId} = ${id} and ${receivables.status} = 'belum_lunas'`);

	const totalDibayar = bayar.reduce((s, p) => s + p.amount, 0);

	return {
		order,
		customer,
		payments: bayar,
		totalDibayar,
		sisa: piutang.sisa,
		dueDate: piutang.dueDate,
		qrisUrl: qrisTersedia() ? QRIS_URL : null
	};
};

export const actions = {
	email: async ({ locals, params }) => {
		guard(locals);
		const id = Number(params.id);
		const [order] = await db.select().from(orders).where(eq(orders.id, id));
		if (!order) return fail(404, { message: 'Order tidak ditemukan.' });

		const [customer] = order.customerId
			? await db.select().from(customers).where(eq(customers.id, order.customerId))
			: [null];
		if (!customer?.email) return fail(400, { message: 'Pelanggan belum punya email.' });

		const bayar = await db.select().from(payments).where(eq(payments.orderId, id));
		const totalDibayar = bayar.reduce((s, p) => s + p.amount, 0);
		const sisa = order.total - totalDibayar;

		const isi = `
<p>Yth. ${customer.name},</p>
<p>Terima kasih telah mencetak di FD Digital Printing. Berikut rincian invoice:</p>
<table style="border-collapse:collapse;width:100%">
<tr><td style="padding:6px 0">No. order</td><td><b>#${order.id}</b></td></tr>
<tr><td style="padding:6px 0">Deskripsi</td><td>${order.description}</td></tr>
<tr><td style="padding:6px 0">Total</td><td><b>${rupiah(order.total)}</b></td></tr>
<tr><td style="padding:6px 0">Sudah dibayar</td><td>${rupiah(totalDibayar)}</td></tr>
<tr><td style="padding:6px 0">Sisa</td><td><b>${rupiah(sisa)}</b></td></tr>
</table>
${sisa > 0 ? `<p>Mohon lunasi sisa pembayaran sebesar <b>${rupiah(sisa)}</b>.</p>` : `<p>Pembayaran lunas. Terima kasih.</p>`}`;

		await sendEmail({
			to: customer.email,
			subject: `Invoice #${order.id} — FD Digital Printing`,
			html: emailLayout(`Invoice #${order.id}`, isi)
		});
		return { ok: true };
	}
};
