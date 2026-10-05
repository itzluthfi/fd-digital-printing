/**
 * Hitung harga katalog — pure function (mudah di-test).
 * Menghasilkan total + breakdown rumus untuk ditempel ke deskripsi/invoice.
 */
import { rupiah } from './format';

export type KatalogItem = {
	price: number;
	unit: 'meter' | 'pcs' | 'lembar' | 'paket' | string;
};

export type KatalogInput = {
	panjang?: number;
	lebar?: number;
	qty?: number;
};

export type KatalogHasil = {
	total: number;
	/** Breakdown rumus, siap ditempel ke deskripsi/invoice */
	rumus: string;
};

export function hitungKatalog(item: KatalogItem, input: KatalogInput): KatalogHasil {
	let total: number;
	let rumus: string;
	if (item.unit === 'meter') {
		const p = Math.max(0, Number(input.panjang) || 0);
		const l = Math.max(0, Number(input.lebar) || 0);
		total = Math.round(item.price * p * l);
		rumus = `${rupiah(item.price)}/m² × ${p} × ${l} m`;
	} else {
		const q = Math.max(0, Number(input.qty) || 0);
		total = Math.round(item.price * q);
		rumus = `${rupiah(item.price)} × ${q} ${item.unit}`;
	}
	return { total, rumus };
}
