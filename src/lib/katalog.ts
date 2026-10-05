/**
 * Hitung harga katalog — pure function (mudah di-test).
 * Mendukung: harga reseller, minimum charge, breakdown rumus untuk invoice.
 */
import { rupiah } from './format';

export type KatalogItem = {
	price: number;
	unit: 'meter' | 'pcs' | 'lembar' | 'paket' | string;
	minCharge: number;
	resellerPrice: number | null;
};

export type KatalogInput = {
	panjang?: number;
	lebar?: number;
	qty?: number;
};

export type KatalogHasil = {
	/** Total akhir setelah min charge */
	total: number;
	/** Breakdown rumus, siap ditempel ke deskripsi/invoice */
	rumus: string;
	/** Harga satuan yang dipakai */
	hargaSatuan: number;
	pakaiReseller: boolean;
	kenaMinCharge: boolean;
};

export function hitungKatalog(
	item: KatalogItem,
	input: KatalogInput,
	pakaiReseller = false
): KatalogHasil {
	const pakaiResellerAktif =
		pakaiReseller && item.resellerPrice != null && item.resellerPrice > 0;
	const hargaSatuan = pakaiResellerAktif ? (item.resellerPrice as number) : item.price;

	let dasar: number;
	let rumus: string;
	if (item.unit === 'meter') {
		const p = Math.max(0, Number(input.panjang) || 0);
		const l = Math.max(0, Number(input.lebar) || 0);
		dasar = Math.round(hargaSatuan * p * l);
		rumus = `${rupiah(hargaSatuan)}/m² × ${p} × ${l} m`;
	} else {
		const q = Math.max(0, Number(input.qty) || 0);
		dasar = Math.round(hargaSatuan * q);
		rumus = `${rupiah(hargaSatuan)} × ${q} ${item.unit}`;
	}

	const kenaMinCharge = item.minCharge > 0 && dasar > 0 && dasar < item.minCharge;
	const total = kenaMinCharge ? Math.round(item.minCharge) : dasar;

	return {
		total,
		rumus: kenaMinCharge ? `${rumus} = ${rupiah(dasar)} → min. charge ${rupiah(item.minCharge)}` : rumus,
		hargaSatuan,
		pakaiReseller: pakaiResellerAktif,
		kenaMinCharge
	};
}
