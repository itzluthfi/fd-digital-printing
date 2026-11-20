import { describe, expect, it } from 'bun:test';
import {
	slugify,
	encodeProductId,
	decodeProductId,
	getProductSlug,
	getProductUrl,
	getProductSpecs,
	getProductGallery
} from '../../src/lib/products';

describe('Products & Catalog Helpers (Unit Test)', () => {
	describe('slugify()', () => {
		it('mengubah teks judul menjadi slug URL yang bersih dan lowercase', () => {
			expect(slugify('Cetak Spanduk / Banner Outdoor 280gr')).toBe('cetak-spanduk-banner-outdoor-280gr');
			expect(slugify('Stiker Vinyl A3+ (Waterproof!)')).toBe('stiker-vinyl-a3-waterproof');
		});
	});

	describe('encodeProductId() & decodeProductId() (ID Obfuscation)', () => {
		it('mengenkripsi ID numerik menjadi string acak base36', () => {
			const id = 42;
			const token = encodeProductId(id);
			expect(typeof token).toBe('string');
			expect(token.length).toBeGreaterThan(0);
		});

		it('dapat mendekripsi token kembali ke ID integer asli (Round-trip)', () => {
			const testIds = [1, 5, 42, 999, 12345];
			for (const id of testIds) {
				const token = encodeProductId(id);
				const decoded = decodeProductId(token);
				expect(decoded).toBe(id);
			}
		});

		it('mampu mendekripsi dari slug lengkap dengan prefix nama produk', () => {
			const id = 17;
			const slug = `banner-flexi-korea-${encodeProductId(id)}`;
			expect(decodeProductId(slug)).toBe(id);
		});

		it('mengembalikan null jika token tidak valid atau kosong', () => {
			expect(decodeProductId('')).toBeNull();
			expect(decodeProductId('invalid_token!@#')).toBeNull();
		});
	});

	describe('getProductSlug() & getProductUrl()', () => {
		it('menghasilkan URL produk tanpa mengekspos ID numerik mentah database', () => {
			const item = { id: 7, name: 'Cetak Spanduk Murah' };
			const slug = getProductSlug(item);
			const url = getProductUrl(item);

			expect(slug).toContain('cetak-spanduk-murah-');
			expect(slug).not.toContain('/7');
			expect(url).toBe(`/produk/${slug}`);
		});
	});

	describe('getProductSpecs()', () => {
		it('menyediakan spesifikasi yang sesuai untuk banner / spanduk', () => {
			const specs = getProductSpecs('Spanduk Toko Flexi Frontlite');
			expect(specs.deskripsi).toContain('Flexi Frontlite');
			expect(specs.finishingOptions.length).toBeGreaterThan(0);
			expect(specs.spesifikasi.some((s) => s.label === 'Ketahanan')).toBe(true);
		});

		it('menyediakan spesifikasi yang sesuai untuk stiker', () => {
			const specs = getProductSpecs('Stiker Vinyl Glossy');
			expect(specs.deskripsi).toContain('Stiker Vinyl');
			expect(specs.finishingOptions.some((f) => f.includes('Kiss Cut'))).toBe(true);
		});
	});

	describe('getProductGallery()', () => {
		it('menempatkan custom image di urutan pertama jika ada', () => {
			const gallery = getProductGallery({
				name: 'Banner Custom',
				imageUrl: '/custom-image.webp'
			});
			expect(gallery[0]).toBe('/custom-image.webp');
		});
	});
});

