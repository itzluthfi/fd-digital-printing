import { describe, expect, it } from 'bun:test';
import {
	formatRupiah,
	rupiah,
	tgl,
	tglWaktu,
	METODE_LABEL,
	STATUS_LABEL,
	ROLE_LABEL,
	STATUS_URUTAN
} from '../../src/lib/format';

describe('Format Utility (Unit Test)', () => {
	describe('rupiah()', () => {
		it('harus memformat angka ke representasi mata uang Rupiah', () => {
			const res = rupiah(15000);
			expect(res).toContain('Rp');
			expect(res).toContain('15.000');
		});

		it('harus menangani nilai 0, null, dan undefined dengan aman', () => {
			expect(rupiah(0)).toContain('Rp0');
			expect(rupiah(null)).toContain('Rp0');
			expect(rupiah(undefined)).toContain('Rp0');
		});

		it('harus membulatkan nilai desimal', () => {
			const res = rupiah(12500.8);
			expect(res).toContain('12.501');
		});
	});

	describe('tgl() & tglWaktu()', () => {
		it('harus mengembalikan "-" jika nilai ISO kosong, null, atau undefined', () => {
			expect(tgl(null)).toBe('-');
			expect(tgl(undefined)).toBe('-');
			expect(tgl('')).toBe('-');
			expect(tglWaktu(null)).toBe('-');
		});

		it('harus memformat tanggal ISO valid ke format Indonesia', () => {
			const sampleIso = '2026-10-29T10:00:00.000Z';
			const hasilTgl = tgl(sampleIso);
			expect(hasilTgl).not.toBe('-');
			expect(hasilTgl).toContain('2026');
		});
	});

	describe('Label & Urutan Status', () => {
		it('memiliki pemetaan metode pembayaran yang lengkap', () => {
			expect(METODE_LABEL.cash).toBe('Tunai');
			expect(METODE_LABEL.transfer).toBe('Transfer');
			expect(METODE_LABEL.qris).toBe('QRIS');
			expect(METODE_LABEL.piutang).toBe('Piutang');
		});

		it('memiliki pemetaan role yang tepat', () => {
			expect(ROLE_LABEL.owner).toBe('Owner');
			expect(ROLE_LABEL.admin).toBe('Admin');
			expect(ROLE_LABEL.operator).toBe('Operator');
			expect(ROLE_LABEL.customer).toBe('Pelanggan');
		});

		it('memiliki urutan siklus status order percetakan yang runtut', () => {
			expect(STATUS_URUTAN).toEqual([
				'baru',
				'diproses',
				'selesai',
				'diambil',
				'kadaluarsa',
				'batal'
			]);
		});
	});
});

