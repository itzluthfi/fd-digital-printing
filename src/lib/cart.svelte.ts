/**
 * Shopping Cart Store (E-Commerce Printku Style)
 * Mengelola keranjang belanja kustom cetak dengan persistensi LocalStorage.
 */

export type CartItem = {
	id: string;
	productId: number;
	name: string;
	category?: string;
	unit: string;
	price: number;
	panjang?: number;
	lebar?: number;
	qty: number;
	finishing?: string;
	fileUrl?: string;
	notes?: string;
	subtotal: number;
	imageUrl?: string;
};

const STORAGE_KEY = 'fd_printing_cart';
const isBrowser = typeof window !== 'undefined';

class CartStore {
	items = $state<CartItem[]>([]);

	constructor() {
		if (isBrowser) {
			this.load();
			window.addEventListener('storage', (e) => {
				if (e.key === STORAGE_KEY) this.load();
			});
		}
	}

	load() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				this.items = Array.isArray(parsed) ? parsed : [];
			}
		} catch {
			this.items = [];
		}
	}

	save() {
		if (!isBrowser) return;
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
			window.dispatchEvent(new CustomEvent('fd:cart-updated'));
		} catch (e) {
			console.warn('[cart] Gagal menyimpan keranjang:', e);
		}
	}

	addItem(item: Omit<CartItem, 'id'>): string {
		const id = 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
		const newItem: CartItem = { ...item, id };
		this.items = [...this.items, newItem];
		this.save();
		return id;
	}

	removeItem(id: string) {
		this.items = this.items.filter((i) => i.id !== id);
		this.save();
	}

	updateQty(id: string, newQty: number) {
		const validQty = Math.max(1, Math.min(50000, Math.round(newQty)));
		this.items = this.items.map((i) => {
			if (i.id !== id) return i;
			let subtotal = 0;
			if (i.unit === 'meter') {
				const p = Math.max(0.1, i.panjang || 1);
				const l = Math.max(0.1, i.lebar || 1);
				const luasM2 = Math.max(1, p * l);
				subtotal = Math.round(i.price * luasM2 * validQty);
			} else {
				subtotal = Math.round(i.price * validQty);
			}
			return { ...i, qty: validQty, subtotal };
		});
		this.save();
	}

	clearCart() {
		this.items = [];
		this.save();
	}

	get count(): number {
		return this.items.reduce((sum, item) => sum + item.qty, 0);
	}

	get itemCount(): number {
		return this.items.length;
	}

	get total(): number {
		return this.items.reduce((sum, item) => sum + item.subtotal, 0);
	}
}

export const cart = new CartStore();
