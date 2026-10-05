/**
 * Struk thermal 58mm — data sama dengan invoice.
 */
import { invoiceGuard, loadInvoiceData } from '#lib/server/invoice';

export const load = async ({ locals, params }) => {
	invoiceGuard(locals);
	return loadInvoiceData(Number(params.id));
};
