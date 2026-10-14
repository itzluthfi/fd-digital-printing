/**
 * Modul Sanitasi & Validasi Input Keamanan Server.
 * Menutup celah:
 * - Null-Byte Injection (\0) -> HTTP 400
 * - Reflected/Stored XSS (<script>, <svg>, dll)
 * - Oversize DoS (Payload 100KB+)
 * - Format nomor telepon & tautan URL aman
 */

export interface ValidationResult<T = string> {
	valid: boolean;
	value?: T;
	error?: string;
}

/**
 * Cek dan tolak keberadaan karakter null-byte (\0).
 */
export function hasNullByte(val: unknown): boolean {
	if (typeof val !== 'string') return false;
	return val.includes('\0') || val.includes('\u0000');
}

/**
 * Sanitasi dan validasi teks umum (nama, notes, email, dll).
 */
export function validateText(
	raw: unknown,
	options: {
		fieldName: string;
		maxLength: number;
		minLength?: number;
		required?: boolean;
		disallowHtml?: boolean;
	}
): ValidationResult<string> {
	const { fieldName, maxLength, minLength = 0, required = false, disallowHtml = true } = options;

	if (raw === null || raw === undefined || raw === '') {
		if (required) {
			return { valid: false, error: `${fieldName} wajib diisi.` };
		}
		return { valid: true, value: '' };
	}

	if (typeof raw !== 'string') {
		return { valid: false, error: `Format ${fieldName} tidak valid.` };
	}

	// 1. Cek Null-Byte
	if (hasNullByte(raw)) {
		return { valid: false, error: `${fieldName} mengandung karakter ilegal (null byte).` };
	}

	const trimmed = raw.trim();

	// 2. Cek Required setelah trim
	if (required && trimmed.length === 0) {
		return { valid: false, error: `${fieldName} tidak boleh hanya berisi spasi.` };
	}

	// 3. Cek Panjang Maksimal (Tolak 400 jika melebihi batas, bukan dipotong diam-diam)
	if (trimmed.length > maxLength) {
		return {
			valid: false,
			error: `${fieldName} terlalu panjang (maksimal ${maxLength} karakter).`
		};
	}

	// 4. Cek Panjang Minimal
	if (minLength > 0 && trimmed.length < minLength) {
		return {
			valid: false,
			error: `${fieldName} terlalu pendek (minimal ${minLength} karakter).`
		};
	}

	// 5. Cek Karakter HTML / Tag Injeksi jika diminta
	if (disallowHtml && /[<>]/.test(trimmed)) {
		return {
			valid: false,
			error: `${fieldName} tidak boleh mengandung tag HTML atau karakter < dan >.`
		};
	}

	return { valid: true, value: trimmed };
}

/**
 * Validasi nomor telepon / WhatsApp Indonesia yang aman.
 */
export function validatePhone(raw: unknown): ValidationResult<string> {
	if (hasNullByte(raw)) {
		return { valid: false, error: 'Nomor telepon mengandung karakter ilegal.' };
	}

	const rawStr = String(raw ?? '').trim();
	if (!rawStr) {
		return { valid: false, error: 'Nomor WhatsApp wajib diisi.' };
	}

	if (rawStr.length > 30) {
		return { valid: false, error: 'Nomor WhatsApp terlalu panjang.' };
	}

	const digitsOnly = rawStr.replace(/[^0-9+]/g, '');

	if (digitsOnly.length < 8 || digitsOnly.length > 20) {
		return {
			valid: false,
			error: 'Nomor WhatsApp tidak valid (harus 8 - 20 digit angka).'
		};
	}

	return { valid: true, value: digitsOnly };
}

/**
 * Validasi URL file/desain (hanya mengizinkan http/https yang bersih).
 */
export function validateSafeUrl(raw: unknown): ValidationResult<string | null> {
	if (raw === null || raw === undefined || raw === '') {
		return { valid: true, value: null };
	}

	if (typeof raw !== 'string') {
		return { valid: false, error: 'Format tautan file tidak valid.' };
	}

	if (hasNullByte(raw)) {
		return { valid: false, error: 'Tautan file mengandung karakter ilegal.' };
	}

	const trimmed = raw.trim();
	if (!trimmed) return { valid: true, value: null };

	if (trimmed.length > 500) {
		return { valid: false, error: 'Tautan file terlalu panjang (maksimal 500 karakter).' };
	}

	if (!/^https?:\/\//i.test(trimmed) || /[<>"'`;\s]/i.test(trimmed)) {
		return {
			valid: false,
			error: 'Tautan file harus diawali dengan http:// atau https:// dan tidak boleh berisi spasi atau karakter ilegal.'
		};
	}

	return { valid: true, value: trimmed };
}
