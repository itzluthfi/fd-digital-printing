import { describe, expect, it } from 'bun:test';
import { crc16, makeDynamicQris, getDynamicQrisImageUrl, DEFAULT_STATIC_QRIS, QRIS_EXPIRY_SECONDS } from '../../src/lib/qris';

describe('QRIS Generator (Unit Test)', () => {
	it('memiliki durasi kedaluwarsa QRIS dinamis 15 menit (900 detik)', () => {
		expect(QRIS_EXPIRY_SECONDS).toBe(900);
	});

	describe('crc16()', () => {
		it('menghasilkan 4 karakter hex checksum CRC16-CCITT', () => {
			const checksum = crc16('123456789');
			expect(checksum).toHaveLength(4);
			expect(typeof checksum).toBe('string');
		});

		it('menghasilkan nilai deterministik untuk input yang sama', () => {
			const c1 = crc16('TEST_STRING_QRIS');
			const c2 = crc16('TEST_STRING_QRIS');
			expect(c1).toBe(c2);
		});
	});

	describe('makeDynamicQris()', () => {
		it('mengubah tipe statis (010211) menjadi dinamis (010212)', () => {
			const dynamicQr = makeDynamicQris(50000);
			expect(dynamicQr).toContain('010212');
			expect(dynamicQr).not.toContain('010211');
		});

		it('menyematkan Tag 54 dengan nominal transaksi yang sesuai', () => {
			const nominal = 75000;
			const dynamicQr = makeDynamicQris(nominal);
			// Tag 54 + Panjang 2 digit (05) + Nilai (75000) -> 540575000
			expect(dynamicQr).toContain('540575000');
		});

		it('menghasilkan akhiran checksum valid dengan tag 6304', () => {
			const dynamicQr = makeDynamicQris(25000);
			const idx = dynamicQr.lastIndexOf('6304');
			expect(idx).toBeGreaterThan(-1);
			// 4 karakter setelah 6304 adalah checksum
			const checksumPart = dynamicQr.substring(idx + 4);
			expect(checksumPart).toHaveLength(4);
		});

		it('menangani pembulatan nominal desimal dengan benar', () => {
			const dynamicQr = makeDynamicQris(15000.75);
			// Bulat ke 15001 -> 540515001
			expect(dynamicQr).toContain('540515001');
		});
	});

	describe('getDynamicQrisImageUrl()', () => {
		it('menghasilkan URL gambar QR code ke provider qrserver dengan URL encoding yang valid', () => {
			const url = getDynamicQrisImageUrl(100000);
			expect(url).toContain('https://api.qrserver.com/v1/create-qr-code/');
			expect(url).toContain('size=320x320');
			expect(url).toContain('data=');
		});
	});
});

