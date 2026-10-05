/**
 * Invoice / struk print-friendly + kirim via email.
 */
import { fail } from '@sveltejs/kit';

import { emailLayout, sendEmail } from '#lib/server/email';
import { invoiceGuard, loadInvoiceData } from '#lib/server/invoice';
import { QRIS_URL, qrisTersedia } from '#lib/server/settings';
import { rupiah } from '#lib/format';

export const load = async ({ locals, params }) => {
	invoiceGuard(locals);
	const data = await loadInvoiceData(Number(params.id));
	return { ...data, qrisUrl: qrisTersedia() ? QRIS_URL : null };
};

export const actions = {
	email: async ({ locals, params }) => {
		invoiceGuard(locals);
		const id = Number(params.id);
		const { order, customer, totalDibayar, sisa } = await loadInvoiceData(id);
		if (!customer?.email) return fail(400, { message: 'Pelanggan belum punya email.' });

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
