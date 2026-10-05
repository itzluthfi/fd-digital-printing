/**
 * Guest Order History (Local Storage ala Gacoan / E-Commerce Modern)
 * Menyimpan daftar kode pesanan yang dibuat pelanggan di browser/HP ini
 * tanpa mewajibkan pendaftaran atau login akun.
 */

export type GuestOrder = {
	code: string;
	name: string;
	desc?: string;
	total: number;
	createdAt: string;
	status?: string;
};

const STORAGE_KEY = 'fd_guest_orders';

export function getGuestOrders(): GuestOrder[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function saveGuestOrder(order: GuestOrder): void {
	if (typeof window === 'undefined') return;
	try {
		const existing = getGuestOrders().filter((o) => o.code !== order.code);
		const updated = [order, ...existing].slice(0, 20); // simpan 20 order terakhir
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		window.dispatchEvent(new CustomEvent('fd:orders-updated'));
	} catch (e) {
		console.warn('[guest-orders] Gagal simpan ke localStorage:', e);
	}
}

export function removeGuestOrder(code: string): void {
	if (typeof window === 'undefined') return;
	try {
		const updated = getGuestOrders().filter((o) => o.code !== code);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		window.dispatchEvent(new CustomEvent('fd:orders-updated'));
	} catch (e) {
		console.warn('[guest-orders] Gagal hapus dari localStorage:', e);
	}
}
