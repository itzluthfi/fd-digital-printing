/**
 * Helper katalog, galeri foto produk, dan spesifikasi percetakan FD Digital Printing.
 * Mendukung multiple foto per produk (ala Shopee/Lynk.id) dan deskripsi teknis bahan.
 */

export const DEFAULT_PRODUCT_GALLERIES: Record<string, string[]> = {
	banner: ['/banner-avatar.png', '/landing-hero.jpg'],
	korea: ['/banner-avatar.png', '/landing-hero.jpg'],
	stiker: ['/landing-stiker.jpg', '/banner-avatar.png'],
	chromo: ['/landing-stiker.jpg', '/banner-avatar.png'],
	brosur: ['/landing-offset.jpg', '/landing-hero.jpg'],
	kartu: ['/landing-offset.jpg', '/landing-hero.jpg'],
	foto: ['/banner-avatar.png', '/landing-offset.jpg'],
	default: ['/banner-avatar.png', '/landing-hero.jpg', '/landing-stiker.jpg', '/landing-offset.jpg']
};

export function getProductGallery(item: { name: string; imageUrl?: string | null }): string[] {
	const n = item.name.toLowerCase();
	let baseList = DEFAULT_PRODUCT_GALLERIES.default;

	if (n.includes('korea')) baseList = DEFAULT_PRODUCT_GALLERIES.korea;
	else if (n.includes('banner') || n.includes('spanduk')) baseList = DEFAULT_PRODUCT_GALLERIES.banner;
	else if (n.includes('chromo')) baseList = DEFAULT_PRODUCT_GALLERIES.chromo;
	else if (n.includes('stiker')) baseList = DEFAULT_PRODUCT_GALLERIES.stiker;
	else if (n.includes('brosur') || n.includes('flyer')) baseList = DEFAULT_PRODUCT_GALLERIES.brosur;
	else if (n.includes('kartu')) baseList = DEFAULT_PRODUCT_GALLERIES.kartu;
	else if (n.includes('foto')) baseList = DEFAULT_PRODUCT_GALLERIES.foto;

	if (item.imageUrl && item.imageUrl.trim().length > 0) {
		const custom = item.imageUrl.trim();
		return [custom, ...baseList.filter((url) => url !== custom)];
	}
	return baseList;
}

export function getProductImageUrl(item: { name: string; imageUrl?: string | null }): string {
	return getProductGallery(item)[0];
}

export type ProductSpecs = {
	deskripsi: string;
	spesifikasi: { label: string; value: string }[];
	finishingOptions: string[];
	instruksi: string;
};

export function getProductSpecs(name: string): ProductSpecs {
	const n = name.toLowerCase();

	if (n.includes('banner') || n.includes('spanduk')) {
		const isKorea = n.includes('korea');
		return {
			deskripsi: isKorea
				? 'Flexi Korea 440gsm dengan serat halus rapat, tebal, tidak mudah sobek, dan hasil cetak warna sangat tajam pekat. Sangat cocok untuk backdrop panggung, pameran premium, dan baliho jangka panjang.'
				: 'Flexi Frontlite standar 280-300gsm berkualitas tinggi. Tahan cuaca outdoor, air hujan, dan sinar matahari terik. Pilihan paling hemat dan populer untuk spanduk toko, event promosi, dan banner pecel lele.',
			spesifikasi: [
				{ label: 'Ketahanan', value: 'Outdoor & Indoor (6-12 bulan)' },
				{ label: 'Bahan', value: isKorea ? 'Flexi Korea 440 gsm' : 'Flexi Frontlite 280-300 gsm' },
				{ label: 'Resolusi Cetak', value: 'High Resolution (Solvent Ink)' },
				{ label: 'Pengerjaan', value: 'Bisa Ditunggu / Kilat (1-3 jam)' }
			],
			finishingOptions: [
				'Mata ayam (ring lubang) di tiap sudut',
				'Kolong pipa / selongsong atas & bawah',
				'Lipat lem keliling (rapi tanpa ring)',
				'Potong pas gambar (tanpa lebihan)'
			],
			instruksi: 'Format file siap cetak: TIFF, PDF, JPG, PSD, atau CDR. Color mode CMYK, resolusi minimal 100-150 dpi ukuran asli. Belum ada desain? Tim kami siap membantu.'
		};
	}

	if (n.includes('stiker')) {
		const isVinyl = n.includes('vinyl');
		return {
			deskripsi: isVinyl
				? 'Stiker Vinyl plastik putih elastis tahan air dan minyak (waterproof). Tidak mudah sobek dan daya rekat kuat. Sangat cocok untuk label botol frozen food, stiker motor/mobil, dan branding produk outdoor.'
				: 'Stiker Chromo berbasis kertas mengkilap (glossy) dengan daya rekat instan. Sangat ekonomis dan cocok untuk label toples kue kering, dos makanan, segel kemasan, dan stiker event indoor.',
			spesifikasi: [
				{ label: 'Ketahanan', value: isVinyl ? 'Anti Air & Minyak (Outdoor/Freezer)' : 'Indoor (Kemasan Kering/Kue)' },
				{ label: 'Bahan', value: isVinyl ? 'Vinyl White Glossy / Matte' : 'Chromo Glossy Paper' },
				{ label: 'Cutting', value: 'Kiss Cut (setengah putus) / Die Cut (putus)' },
				{ label: 'Area Cetak', value: 'Lembar A3+ (31 x 47 cm)' }
			],
			finishingOptions: [
				'Kiss Cut (sudah terpotong bentuk, tinggal kelupas)',
				'Die Cut (potong putus per biji)',
				'Laminasi Glossy (tambah kilap & anti gores)',
				'Laminasi Doff (matte elegan & anti silau)'
			],
			instruksi: 'Sertakan pola garis potong (cutline) jika menggunakan bentuk khusus/die-cut. File disarankan vector PDF/AI/CDR atau PNG transparan resolusi 300 dpi.'
		};
	}

	if (n.includes('brosur') || n.includes('flyer')) {
		return {
			deskripsi: 'Brosur & flyer promosi dicetak di atas kertas Art Paper tebal berkualitas dengan hasil warna cerah mengkilap (glossy). Sangat efektif untuk penyebaran informasi event, menu cafe, dan promosi perumahan.',
			spesifikasi: [
				{ label: 'Kertas', value: 'Art Paper 120 gsm / 150 gsm' },
				{ label: 'Ukuran Standar', value: 'A4 (21 x 29.7 cm) / A5 (14.8 x 21 cm)' },
				{ label: 'Cetak', value: 'Full Color 1 Sisi atau Bolak-balik (2 Sisi)' },
				{ label: 'Warna', value: 'CMYK Offset Quality' }
			],
			finishingOptions: [
				'Tanpa lipat (lembaran datar)',
				'Lipat 2 (setengah)',
				'Lipat 3 (brosur Z-fold / C-fold)'
			],
			instruksi: 'Pastikan ada jarak aman (safe margin) teks minimal 3 mm dari tepi potong. File format PDF, TIFF, atau CDR.'
		};
	}

	if (n.includes('kartu')) {
		return {
			deskripsi: 'Kartu nama profesional menggunakan Art Carton 260 gsm tebal premium. Dikemas rapi dalam kotak box mika plastik tebal isi 100 lembar per box. Tampilan elegan untuk relasi bisnis Anda.',
			spesifikasi: [
				{ label: 'Isi Paket', value: '1 Box = 100 lembar + Kotak Mika' },
				{ label: 'Kertas', value: 'Art Carton 260 gsm Tebal' },
				{ label: 'Ukuran', value: '9 x 5.5 cm (Standar Indonesia)' },
				{ label: 'Hasil Cetak', value: 'Ultra Tajam & Presisi' }
			],
			finishingOptions: [
				'Standar (Tanpa Laminasi)',
				'Laminasi Doff Bolak-balik (Elegan & Halus)',
				'Laminasi Glossy Bolak-balik (Mengkilap Mewah)',
				'Sudut Membulat (Round Corner)'
			],
			instruksi: 'Format file PDF/CDR/AI/PSD resolusi 300 dpi. Safe margin 3 mm agar teks penting tidak terpotong saat pisau potong berjalan.'
		};
	}

	if (n.includes('stempel')) {
		return {
			deskripsi: 'Stempel Flash otomatis modern tanpa bantalan tinta manual. Tinta sudah terserap langsung di dalam karet busa stempel khusus, praktis tinggal tekan dan bisa diisi ulang (refillable).',
			spesifikasi: [
				{ label: 'Tipe', value: 'Stempel Flash Otomatis (Pre-Inked)' },
				{ label: 'Ketahanan Tinta', value: 'Hingga ratusan kali cap' },
				{ label: 'Warna Tinta', value: 'Biru, Merah, Ungu, Hitam, Hijau' },
				{ label: 'Bodi Gagang', value: 'Plastik ABS Tebal Ergonomis' }
			],
			finishingOptions: ['1 Warna Tinta', '2 Warna Tinta (Kombinasi)'],
			instruksi: 'Kirimkan logo atau tulisan stempel. File vector hitam putih (Black & White) format PDF/JPG/PNG resolusi tinggi.'
		};
	}

	if (n.includes('mug')) {
		return {
			deskripsi: 'Mug keramik putih standar SNI dengan cetak sablon sublimasi full color mengkilap dan tahan cuci. Sangat cocok untuk souvenir kantor, seminar kit, hadiah wisuda, dan merchandise promosi.',
			spesifikasi: [
				{ label: 'Bahan', value: 'Keramik Putih Glossy Standar SNI' },
				{ label: 'Kapasitas', value: '11 oz (± 325 ml)' },
				{ label: 'Teknik Cetak', value: 'Sublimasi Heat Press Full Color' },
				{ label: 'Daya Tahan', value: 'Tahan Air & Cuci Sabun' }
			],
			finishingOptions: ['Termasuk Box Satuan Putih'],
			instruksi: 'Area cetak desain: 20 x 8.5 cm. Format file JPG/PNG/PDF dengan resolusi minimal 300 dpi.'
		};
	}

	if (n.includes('pin') || n.includes('gantungan')) {
		return {
			deskripsi: 'Pin peniti dan gantungan kunci custom berkualitas tinggi dengan lapisan plastik mika laminasi anti air. Pilihan terpopuler untuk souvenir event, merchandise komunitas, media kampanye, dan cinderamata.',
			spesifikasi: [
				{ label: 'Varian Ukuran', value: 'Diameter 45 mm & 58 mm' },
				{ label: 'Material', value: 'Plastik PVC Tebal + Peniti / Gantungan Besi' },
				{ label: 'Permukaan', value: 'Dilapisi Film Pelindung Bening' },
				{ label: 'Hasil Cetak', value: 'Full Color Tajam 2400 dpi' }
			],
			finishingOptions: ['Laminasi Glossy (Berkilau)', 'Laminasi Doff (Elegan / Matte)', 'Laminasi Kanvas / Glitter'],
			instruksi: 'Pola lingkaran simetris. Pastikan teks penting berada di dalam area aman diameter lingkaran.'
		};
	}

	if (n.includes('lanyard') || n.includes('id card')) {
		return {
			deskripsi: 'ID Card bahan PVC tebal standar kartu ATM anti air dan tidak mudah patah, dipadukan dengan tali lanyard printing berbahan polyester tisu halus cetak full color bolak-balik.',
			spesifikasi: [
				{ label: 'Bahan ID Card', value: 'PVC Tebal 0.76 mm (Standar Kartu ATM)' },
				{ label: 'Ukuran ID Card', value: '8.6 x 5.4 cm (Standar ISO)' },
				{ label: 'Tali Lanyard', value: 'Lebar 2 cm, Panjang 90 cm + Kait Besi' },
				{ label: 'Ketahanan', value: 'Anti Air, Anti Luntur & Tahan Baret' }
			],
			finishingOptions: ['ID Card Saja (1 Sisi / 2 Sisi)', 'Lanyard + Kait Besi & Stopper', 'Paket Lengkap Card Case + Lanyard'],
			instruksi: 'File desain ID Card 8.6 x 5.4 cm dengan bleed 1 mm. Format PDF/CDR/AI/PNG 300 dpi.'
		};
	}

	if (n.includes('roll banner') || n.includes('roll up')) {
		return {
			deskripsi: 'Roll Up Banner dengan stand rangka aluminium kokoh sistem pegas tarik otomatis. Sangat praktis dibawa bepergian, mudah dipasang dalam 10 detik, dan tampilan sangat elegan untuk promosi pameran mall.',
			spesifikasi: [
				{ label: 'Rangka', value: 'Aluminium Tebal dengan Tas Jinjing Oxford' },
				{ label: 'Mekanisme', value: 'Auto-Retractable Roll Spring' },
				{ label: 'Pilihan Visual', value: 'Flexi China / Korchin / Korea / Albatros' },
				{ label: 'Penggunaan', value: 'Display Indoor & Event Pameran' }
			],
			finishingOptions: ['Laminasi Doff (Matte)', 'Laminasi Glossy (Kilap)', 'Standar Tanpa Laminasi'],
			instruksi: 'Desain ukuran 60x160 cm atau 85x200 cm. Beri jarak lebihan bawah 5 cm untuk area selongsong mekanik roll.'
		};
	}

	if (n.includes('tripod') || n.includes('polyfoam')) {
		return {
			deskripsi: 'Tripod banner stand vertikal yang dapat disesuaikan (adjustable) dipadukan dengan papan polyfoam tebal ringan. Sangat ideal untuk display poster sambutan, daftar menu, galeri foto, dan papan petunjuk arah event.',
			spesifikasi: [
				{ label: 'Tipe Stand', value: 'Tripod Logam Besi Hitam Adjustable' },
				{ label: 'Papan Display', value: 'Polyfoam Tebal 5 mm Kaku Rata' },
				{ label: 'Ukuran Kertas', value: 'Support A3, A2, A1, hingga A0' },
				{ label: 'Kapasitas Sisi', value: 'Bisa 1 Sisi atau 2 Sisi Bolak-balik' }
			],
			finishingOptions: ['Stand Tripod Saja', 'Papan Polyfoam Saja', 'Set Komplit Stand + Polyfoam'],
			instruksi: 'Pastikan file desain berukuran proporsional standar kertas A3/A2/A1/A0. Resolusi minimal 150-300 dpi.'
		};
	}

	if (n.includes('event desk')) {
		return {
			deskripsi: 'Event Desk / Promotion Table lipat portabel berbahan PVC kokoh ringan. Mudah dirakit secara knockdown tanpa alat tambahan dalam waktu 5 menit, dilengkapi tas jinjing kanvas tebal untuk mobilitas SPG dan pameran.',
			spesifikasi: [
				{ label: 'Material Rangka', value: 'PVC Board Keras & Tiang Besi Penopang' },
				{ label: 'Ukuran Meja', value: 'Lebar 80 cm x Tinggi 80 cm x Tebal 40 cm' },
				{ label: 'Header Atas', value: 'Ukuran 80 x 30 cm (Tinggi Total ± 2 Meter)' },
				{ label: 'Kelengkapan', value: 'Meja, Ambalan Rak Dalam, Tiang, & Tas Kanvas' }
			],
			finishingOptions: ['Set Komplit Meja + Cetak Stiker Full Branding + Laminasi'],
			instruksi: 'File desain meliputi bagian depan, samping kiri-kanan, dan header papan atas. Format PDF/TIFF/CDR.'
		};
	}

	if (n.includes('albatros')) {
		return {
			deskripsi: 'Bahan kertas sintetis Albatros 200 gsm dengan permukaan sangat halus tanpa pori dan tidak mudah sobek. Hasil cetak beresolusi fotografi ultra-HD tanpa garis bintik, pilihan wajib untuk display interior mewah.',
			spesifikasi: [
				{ label: 'Gramatur', value: 'Albatros Matte Sintetis 200 gsm' },
				{ label: 'Permukaan', value: 'Halus Doff Bebas Serat Kasar' },
				{ label: 'Tinta', value: 'Eco-Solvent Ultra HD Akurasi Warna Tinggi' },
				{ label: 'Penggunaan', value: 'Indoor Only (Roll Banner, X-Banner, Poster)' }
			],
			finishingOptions: ['Laminasi Doff Matte', 'Laminasi Glossy Mengkilap', 'Tanpa Laminasi'],
			instruksi: 'Format file TIFF/PDF/JPG resolusi 150-300 dpi skala 1:1. Sangat disarankan dilapisi laminasi agar warna tahan gores.'
		};
	}

	return {
		deskripsi: 'Layanan percetakan digital profesional FD Digital Printing dengan mesin teknologi terkini. Warna tajam, pengerjaan cepat, dan jaminan kepuasan pelanggan.',
		spesifikasi: [
			{ label: 'Mesin', value: 'Digital Printing & Offset Quality' },
			{ label: 'Ketahanan', value: 'Tahan lama & tidak mudah pudar' },
			{ label: 'Layanan', value: 'Siap cetak cepat & konsultasi desain' }
		],
		finishingOptions: ['Standar', 'Kustom sesuai permintaan'],
		instruksi: 'Kirimkan file desain terbaik Anda dalam format PDF, JPG, PNG, atau link Canva/Google Drive.'
	};
}

/* ------------------------------------------------------------------ */
/* Obfuscasi ID & SEO URL Slugs (Keamanan dari IDOR / Scraping)       */
/* ------------------------------------------------------------------ */

const SALT = 0x5a17e;

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/[-\s]+/g, '-');
}

/**
 * Enkripsi/obfuscate ID integer database menjadi token acak URL-safe (Base36).
 * Mencegah enumeration attack (/produk/1, /produk/2, dsb).
 */
export function encodeProductId(id: number): string {
	let v = (id ^ SALT) >>> 0;
	v = ((v << 13) | (v >>> 19)) >>> 0;
	v = (v ^ 0x9e3779b9) >>> 0;
	return v.toString(36);
}

/**
 * Dekripsi token kembali ke ID database integer asli.
 */
export function decodeProductId(token: string): number | null {
	if (!token) return null;
	// Jika token berupa slug lengkap "cetak-banner-mm-bohi2h", ambil token di akhir
	const clean = token.includes('-') ? token.split('-').pop()! : token;
	const v = parseInt(clean, 36);
	if (isNaN(v)) return null;
	let dec = (v ^ 0x9e3779b9) >>> 0;
	dec = ((dec >>> 13) | (dec << 19)) >>> 0;
	dec = (dec ^ SALT) >>> 0;
	return dec > 0 && dec < 100_000_000 ? dec : null;
}

/**
 * Buat slug produk yang aman & SEO-friendly, cth: "cetak-banner-mm-bohi2h"
 */
export function getProductSlug(item: { id: number; name: string }): string {
	const s = slugify(item.name);
	const token = encodeProductId(item.id);
	return `${s}-${token}`;
}

/**
 * URL aman untuk produk (tanpa mengekspos ID mentah database)
 */
export function getProductUrl(item: { id: number; name: string }): string {
	return `/produk/${getProductSlug(item)}`;
}
