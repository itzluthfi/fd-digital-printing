import { describe, it, expect } from 'bun:test';
import { hasNullByte, validateText, validatePhone } from '#lib/server/sanitizer';

describe('Sanitasi & Validasi Input Keamanan Server (Unit Test)', () => {
	it('hasNullByte() > mendeteksi null byte string biasa dan unicode \\u0000', () => {
		expect(hasNullByte('admin\0evil')).toBe(true);
		expect(hasNullByte('normal_string')).toBe(false);
		expect(hasNullByte(null)).toBe(false);
	});

	it('validateText() > menolak input string yang mengandung null byte injection', () => {
		const res = validateText('bad\0input', { fieldName: 'Nama', maxLength: 50 });
		expect(res.valid).toBe(false);
		expect(res.error).toContain('null byte');
	});

	it('validateText() > meloloskan teks valid dan membersihkan leading/trailing spasi', () => {
		const res = validateText('  FD Printing Sidoarjo  ', { fieldName: 'Nama Toko', maxLength: 50 });
		expect(res.valid).toBe(true);
		expect(res.value).toBe('FD Printing Sidoarjo');
	});

	it('validateText() > memvalidasi field required yang kosong atau hanya spasi', () => {
		const resEmpty = validateText('', { fieldName: 'Catatan', maxLength: 100, required: true });
		expect(resEmpty.valid).toBe(false);
		expect(resEmpty.error).toContain('wajib diisi');

		const resSpaces = validateText('   ', { fieldName: 'Catatan', maxLength: 100, required: true });
		expect(resSpaces.valid).toBe(false);
		expect(resSpaces.error).toContain('tidak boleh hanya berisi spasi');
	});

	it('validateText() > menolak teks yang melebihi batas maxLength (mencegah DoS payload)', () => {
		const longText = 'A'.repeat(55);
		const res = validateText(longText, { fieldName: 'Kode', maxLength: 50 });
		expect(res.valid).toBe(false);
		expect(res.error).toContain('terlalu panjang');
	});

	it('validateText() > memvalidasi panjang minimum teks (minLength)', () => {
		const res = validateText('abc', { fieldName: 'Password', maxLength: 50, minLength: 6 });
		expect(res.valid).toBe(false);
		expect(res.error).toContain('terlalu pendek');
	});

	it('validateText() > memblokir karakter injeksi HTML seperti <script> atau tag bersarang', () => {
		const res = validateText('<script>alert("xss")</script>', {
			fieldName: 'Nama Pemesan',
			maxLength: 100,
			disallowHtml: true
		});
		expect(res.valid).toBe(false);
		expect(res.error).toContain('tidak boleh mengandung tag HTML');
	});

	it('validatePhone() > memvalidasi nomor telepon valid Indonesia (08xxx / +62xxx)', () => {
		const res1 = validatePhone('081234567890');
		expect(res1.valid).toBe(true);
		expect(res1.value).toBe('081234567890');

		const res2 = validatePhone('+6281234567890');
		expect(res2.valid).toBe(true);
		expect(res2.value).toBe('+6281234567890');
	});

	it('validatePhone() > menolak format nomor telepon tidak valid atau terlalu pendek/panjang', () => {
		const resShort = validatePhone('1234');
		expect(resShort.valid).toBe(false);
		expect(resShort.error).toContain('tidak valid (harus 8 - 20 digit angka)');

		const resEmpty = validatePhone('');
		expect(resEmpty.valid).toBe(false);
		expect(resEmpty.error).toContain('wajib diisi');
	});
});
