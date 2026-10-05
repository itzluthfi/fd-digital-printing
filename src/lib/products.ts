/**
 * Helper katalog, galeri foto produk, dan spesifikasi percetakan FD Digital Printing.
 * Mendukung multiple foto per produk (ala Shopee/Lynk.id) dan deskripsi teknis bahan.
 */

export const DEFAULT_PRODUCT_GALLERIES: Record<string, string[]> = {
	banner: [
		'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80'
	],
	korea: [
		'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80'
	],
	stiker: [
		'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1589330694653-dad6d3240a91?auto=format&fit=crop&w=800&q=80'
	],
	chromo: [
		'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80'
	],
	brosur: [
		'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1589330694653-dad6d3240a91?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80'
	],
	kartu: [
		'https://images.unsplash.com/photo-1589330694653-dad6d3240a91?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=800&q=80'
	],
	foto: [
		'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80'
	],
	default: [
		'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80',
		'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80'
	]
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
