/**
 * Tipe data Mesin Percetakan FD Digital Printing.
 * Data aktual mesin dikelola dan tersimpan langsung di Database SQLite (tabel 'machines').
 */

export interface SpesifikasiMesin {
	label: string;
	value: string;
}

export interface ContohHasilCetak {
	judul: string;
	deskripsi: string;
	material: string;
	badge: string;
}

export interface MesinPercetakan {
	id: string;
	nama: string;
	kategori: 'outdoor' | 'indoor' | 'laser' | 'cutting' | 'finishing';
	kategoriLabel: string;
	tagline: string;
	foto: string;
	statusOperasional: 'Aktif Beroperasi' | 'Standby Produksi';

	// Fungsi dan kegunaan setiap mesin
	fungsiKegunaan: string;

	// Jenis pekerjaan dan produk yang dapat dihasilkan
	jenisPekerjaan: string[];
	produkDihasilkan: string[];

	// Jenis bahan yang dapat diproses
	bahanDiproses: {
		kategori: string;
		daftar: string[];
	}[];

	// Spesifikasi mesin yang relevan bagi pelanggan
	spesifikasi: SpesifikasiMesin[];

	// Contoh hasil cetak yang dapat dihasilkan
	contohHasilCetak: ContohHasilCetak[];

	keunggulanUtama: string[];
}
