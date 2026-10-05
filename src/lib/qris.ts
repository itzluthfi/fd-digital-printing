/**
 * Generator QRIS Dinamis Standar Bank Indonesia / ASPI (EMVCo).
 * Mengubah QRIS Statis menjadi QRIS Dinamis dengan menyematkan tag nominal (Tag 54)
 * dan checksum CRC16-CCITT yang valid.
 */

export const DEFAULT_STATIC_QRIS =
	'00020101021126580014ID.GO.QRIS.WWW011893600999002119827302150895073708055204541153033605802ID5919FD_DIGITAL_PRINTING6008SIDOARJO61056125462070703A016304';

/** Standar masa berlaku QRIS Dinamis: 15 menit (900 detik) */
export const QRIS_EXPIRY_SECONDS = 15 * 60;

/**
 * Hitung checksum CRC16-CCITT (Standar ISO/IEC 13239 & EMVCo QRIS).
 */
export function crc16(str: string): string {
	let crc = 0xffff;
	for (let i = 0; i < str.length; i++) {
		crc ^= str.charCodeAt(i) << 8;
		for (let j = 0; j < 8; j++) {
			if ((crc & 0x8000) !== 0) {
				crc = ((crc << 1) ^ 0x1021) & 0xffff;
			} else {
				crc = (crc << 1) & 0xffff;
			}
		}
	}
	return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generate string payload QRIS Dinamis dengan nominal transaksi terkunci otomatis (Tag 54).
 * Ketika dipindai oleh BCA, Mandiri, BRI, BNI, Dana, GoPay, OVO, ShopeePay, dll.,
 * nominal langsung muncul dan tidak bisa diubah oleh pengguna.
 */
export function makeDynamicQris(amount: number, staticQr = DEFAULT_STATIC_QRIS): string {
	let clean = (staticQr || DEFAULT_STATIC_QRIS).trim();

	// Hapus CRC lama jika ada (dimulai dengan 6304)
	const crcIdx = clean.lastIndexOf('6304');
	if (crcIdx !== -1) {
		clean = clean.substring(0, crcIdx);
	}

	// Ubah Point of Initiation Method: 11 (Statis) -> 12 (Dinamis)
	clean = clean.replace('010211', '010212');

	// Cari posisi tag 58 (Country Code ID)
	const t58 = clean.indexOf('5802ID');
	if (t58 === -1) {
		return staticQr;
	}

	const before58 = clean.substring(0, t58);
	const after58 = clean.substring(t58);

	// Format Tag 54: ID(54) + Panjang(2 digit) + Nominal(bulat)
	const amtStr = String(Math.max(1, Math.round(amount)));
	const tag54 = '54' + String(amtStr.length).padStart(2, '0') + amtStr;

	const raw = before58 + tag54 + after58 + '6304';
	return raw + crc16(raw);
}

/**
 * URL gambar QR code beresolusi tinggi siap scan & unduh.
 */
export function getDynamicQrisImageUrl(amount: number, staticQr?: string): string {
	const payload = makeDynamicQris(amount, staticQr);
	return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(payload)}`;
}
