/** Format Bahasa Indonesia — dipakai di semua halaman. */

export function rupiah(n: number | null | undefined): string {
	return 'Rp' + Math.round(n ?? 0).toLocaleString('id-ID');
}

export function tgl(iso: string | null | undefined): string {
	if (!iso) return '-';
	return new Date(iso).toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	});
}

export function tglWaktu(iso: string | null | undefined): string {
	if (!iso) return '-';
	return new Date(iso).toLocaleString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/** Label metode bayar untuk UI */
export const METODE_LABEL: Record<string, string> = {
	cash: 'Tunai',
	transfer: 'Transfer',
	qris: 'QRIS',
	piutang: 'Piutang'
};

/** Label status order untuk UI */
export const STATUS_LABEL: Record<string, string> = {
	baru: 'Menunggu Pembayaran',
	diproses: 'Diproses',
	selesai: 'Selesai',
	diambil: 'Sudah Diambil',
	kadaluarsa: 'Kadaluarsa',
	batal: 'Dibatalkan'
};

/** Label role pengguna untuk UI */
export const ROLE_LABEL: Record<string, string> = {
	owner: 'Owner',
	admin: 'Admin',
	operator: 'Operator',
	customer: 'Pelanggan'
};

export const STATUS_URUTAN = ['baru', 'diproses', 'selesai', 'diambil', 'kadaluarsa', 'batal'] as const;
