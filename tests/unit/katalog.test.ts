import { describe, it, expect } from 'bun:test';
import { hitungKatalog, type KatalogItem } from '#lib/katalog';

describe('Kalkulator Harga Katalog Percetakan (Unit Test)', () => {
	const spandukItem: KatalogItem = {
		price: 25000,
		unit: 'meter'
	};

	const stikerItem: KatalogItem = {
		price: 8000,
		unit: 'lembar'
	};

	const mugItem: KatalogItem = {
		price: 15000,
		unit: 'pcs'
	};

	it('menghitung harga spanduk meter persegi berdasarkan panjang dan lebar', () => {
		const res = hitungKatalog(spandukItem, { panjang: 3, lebar: 2 });
		// 3m x 2m = 6m² * 25.000 = 150.000
		expect(res.total).toBe(150000);
		expect(res.rumus).toContain('Rp25.000/m² × 3 × 2 m');
	});

	it('menghitung harga spanduk dengan ukuran desimal', () => {
		const res = hitungKatalog(spandukItem, { panjang: 1.5, lebar: 2 });
		// 1.5m x 2m = 3m² * 25.000 = 75.000
		expect(res.total).toBe(75000);
		expect(res.rumus).toContain('1.5 × 2 m');
	});

	it('menghitung produk berbasis kuantitas per lembar (A3+)', () => {
		const res = hitungKatalog(stikerItem, { qty: 10 });
		// 10 lembar * 8.000 = 80.000
		expect(res.total).toBe(80000);
		expect(res.rumus).toContain('Rp8.000 × 10 lembar');
	});

	it('menghitung produk merchandise per pcs', () => {
		const res = hitungKatalog(mugItem, { qty: 5 });
		// 5 pcs * 15.000 = 75.000
		expect(res.total).toBe(75000);
		expect(res.rumus).toContain('Rp15.000 × 5 pcs');
	});

	it('menangani input dimensi nol (0) atau kosong dengan menghasilkan total Rp 0', () => {
		const resMeter = hitungKatalog(spandukItem, { panjang: 0, lebar: 2 });
		expect(resMeter.total).toBe(0);

		const resQty = hitungKatalog(stikerItem, { qty: 0 });
		expect(resQty.total).toBe(0);
	});

	it('mencegah nilai dimensi negatif dan mengamankan input menjadi 0', () => {
		const res = hitungKatalog(spandukItem, { panjang: -5, lebar: 2 });
		expect(res.total).toBe(0);
	});

	it('menangani input non-numerik (string/undefined) secara aman dengan fallback ke 0', () => {
		const res = hitungKatalog(spandukItem, {
			panjang: undefined,
			lebar: ('abc' as unknown as number)
		});
		expect(res.total).toBe(0);
	});

	it('menghasilkan teks breakdown rumus yang rapi untuk dicetak ke invoice', () => {
		const res = hitungKatalog(spandukItem, { panjang: 4, lebar: 1 });
		expect(res.rumus).toBe('Rp25.000/m² × 4 × 1 m');
		expect(res.total).toBe(100000);
	});
});
