/**
 * Data Profil Perusahaan FD Digital Printing (Company Profile).
 * Memenuhi kebutuhan fungsional FR-01, FR-02, FR-03, FR-04, FR-05, FR-07.
 */

export interface Milestone {
	tahun: string;
	judul: string;
	deskripsi: string;
	badge: string;
}

export interface LayananPercetakan {
	id: string;
	judul: string;
	tagline: string;
	deskripsi: string;
	icon: string;
	produkUnggulan: string[];
	keunggulan: string[];
	mesinTerkait: string;
}

export interface FaqItem {
	tanya: string;
	jawab: string;
	kategori: string;
}

export const COMPANY_INFO = {
	nama: 'FD Digital Printing',
	legalitas: 'FD Digital Printing Group Sidoarjo',
	tagline: 'Cetak Cepat, Hasil Hebat — Solusi Percetakan Digital Terbaik',
	tahunBerdiri: '2018',
	usiaTahun: '8+ Tahun',
	alamatLengkap: 'Jl. Raya Wadungasri No. 42, Wadungasri, Kec. Waru, Kabupaten Sidoarjo, Jawa Timur 61256',
	patokan: 'Dekat perbatasan Surabaya - Sidoarjo (Area Waru - Rungkut - Juanda)',
	whatsapp: '6289507370805',
	whatsappDisplay: '0895-0737-0805',
	telegramUrl: 'https://t.me/FD_printing_bot',
	telegramHandle: '@FD_printing_bot',
	email: 'kontak@fd-printing.sir-l.web.id',
	jamOperasional: {
		hariKerja: 'Senin – Sabtu: 10.00 – 02.00 WIB (Buka Hingga Dini Hari)',
		hariMinggu: 'Minggu: 10.00 – 18.00 WIB',
		catatan: 'Melayani cetak express / kilat ditunggu dan pick-up pesanan hingga larut malam.'
	},
	koordinat: {
		lat: -7.3482,
		lng: 112.7634
	},
	googleMapsQuery: 'FD Digital Printing, Jl. Raya Wadungasri No. 42',
	googleMapsEmbed: 'https://www.google.com/maps?q=FD+Digital+Printing,+Jl.+Raya+Wadungasri+No.+42&output=embed',
	googleMapsLink: 'https://www.google.com/maps/search/?api=1&query=FD+Digital+Printing,+Jl.+Raya+Wadungasri+No.+42'
};

export const DESKRIPSI_PERUSAHAAN = {
	ringkasan:
		'Sentra percetakan digital profesional di Sidoarjo. Melayani cetak outdoor, indoor photo, laser A3+, hingga cutting stiker kilat — buka s/d 02.00 dini hari.',
	narasiLengkap:
		'Berdiri sejak 2018 di Wadungasri, Waru, Sidoarjo, FD Digital Printing menghadirkan layanan cetak cepat berkualitas industri untuk UMKM, korporasi, dan masyarakat umum dengan harga transparan tanpa batasan minimal order.',
	visi: 'Menjadi sentra percetakan digital paling tepercaya di Jawa Timur dengan teknologi modern dan layanan tanpa batas.',
	misi: [
		'Hasil cetak presisi dengan warna tajam dan material tahan lama.',
		'Pengerjaan kilat dan fleksibel buka hingga 02.00 dini hari.',
		'Transparansi harga tanpa batasan minimum order.',
		'Armada mesin modern berkecepatan tinggi dan terkalibrasi.'
	],
	nilaiKeunggulan: [
		{
			judul: 'Armada Mesin Modern',
			deskripsi: 'Mesin outdoor 3.2m, indoor photo, laser A3+, & cutting plotter presisi.',
			icon: 'Cpu'
		},
		{
			judul: 'Pengerjaan Kilat s/d 02.00',
			deskripsi: 'Buka hingga dini hari. File siap cetak bisa langsung naik mesin dan ditunggu.',
			icon: 'Zap'
		},
		{
			judul: 'Tanpa Minimal Order',
			deskripsi: 'Bisa pesan mulai 1 lembar stiker, 1 meter spanduk, hingga ribuan meter.',
			icon: 'ShoppingBag'
		},
		{
			judul: 'Warna Tajam & Solid',
			deskripsi: 'Profil warna CMYK terkalibrasi rapi, tidak belang, dan tahan cuaca.',
			icon: 'Sparkles'
		},
		{
			judul: 'Order Online & QRIS',
			deskripsi: 'Pesan langsung di web, bayar otomatis via QRIS, dan pantau status produksi.',
			icon: 'Activity'
		},
		{
			judul: 'Bantuan File Cetak',
			deskripsi: 'Pengecekan format dan resolusi file sebelum cetak agar hasil maksimal.',
			icon: 'CheckCircle'
		}
	],
	statistik: [
		{ angka: '8+', label: 'Tahun Pengalaman', sublabel: 'Sejak 2018 di Sidoarjo' },
		{ angka: '120.000+', label: 'Meter Dicetak', sublabel: 'Spanduk & Baliho Outdoor' },
		{ angka: '5.200+', label: 'Mitra & UMKM', sublabel: 'Pelanggan Aktif' },
		{ angka: '99.4%', label: 'Kepuasan', sublabel: 'Ulasan Positif' }
	]
};

export const SEJARAH_PERUSAHAAN: Milestone[] = [
	{
		tahun: '2018',
		judul: 'Awal Mula di Wadungasri',
		deskripsi: 'Dirintis di Wadungasri, Waru dengan 1 unit mesin outdoor untuk melayani kebutuhan warga dan pedagang lokal.',
		badge: 'Pondasi Awal'
	},
	{
		tahun: '2020',
		judul: 'Digital Press A3+ & Label UMKM',
		deskripsi: 'Investasi mesin laser Fuji Xerox A3+ dan mesin cutting contour untuk memenuhi lonjakan stiker kemasan UMKM.',
		badge: 'Digital Press'
	},
	{
		tahun: '2022',
		judul: 'Upgrade Outdoor & Indoor Ultra-HD',
		deskripsi: 'Penambahan mesin outdoor Konica 512i (120 m²/jam) dan mesin indoor Epson Eco-Solvent kualitas foto.',
		badge: 'Upgrade Mesin'
	},
	{
		tahun: '2024',
		judul: 'Buka s/d 02.00 & E-Commerce',
		deskripsi: 'Perpanjangan operasional hingga pukul 02.00 dini hari dan peluncuran website pemesanan online otomatis.',
		badge: 'Digitalisasi'
	},
	{
		tahun: '2026',
		judul: 'Sentra Percetakan Terpadu',
		deskripsi: 'Melayani ribuan pelanggan dan mitra bisnis dengan kapasitas puluhan ribu cetakan per bulan.',
		badge: 'Masa Kini'
	}
];

export const LAYANAN_PERCETAKAN: LayananPercetakan[] = [
	{
		id: 'outdoor',
		judul: 'Digital Printing Outdoor',
		tagline: 'Format Besar Tahan Cuaca',
		deskripsi: 'Cetak spanduk, baliho, dan backdrop panggung lebar hingga 3.2 meter tahan panas dan hujan.',
		icon: 'Flag',
		produkUnggulan: ['Spanduk & Banner', 'Baliho Jalan', 'Backdrop Acara', 'Umbul-Umbul'],
		keunggulan: ['Lebar s/d 3.2m tanpa sambung', 'Tahan air & sinar UV', 'Pengerjaan cepat partai besar'],
		mesinTerkait: 'Allwin Konica 512i Outdoor 3.2M'
	},
	{
		id: 'indoor',
		judul: 'Indoor Photo & Display',
		tagline: 'Kualitas Fotografi Ultra-HD',
		deskripsi: 'Cetak roll banner, x-banner, poster albatros, dan foto kanvas dengan gradasi warna super halus.',
		icon: 'Image',
		produkUnggulan: ['Roll Up Banner', 'X-Banner', 'Poster Albatros', 'Foto Kanvas'],
		keunggulan: ['Resolusi tinggi s/d 2400 dpi', 'Tinta Eco-Solvent bebas bau', 'Detail tajam tanpa garis'],
		mesinTerkait: 'Epson SureColor Ultra-HD Indoor'
	},
	{
		id: 'laser-a3',
		judul: 'Digital Press Laser A3+',
		tagline: 'Brosur & Kertas Tebal',
		deskripsi: 'Cetak cepat kartu nama, brosur lipat, menu restoran, dan sertifikat dalam hitungan menit.',
		icon: 'Printer',
		produkUnggulan: ['Kartu Nama', 'Brosur & Flyer', 'Buku Menu & Kalender', 'Sertifikat'],
		keunggulan: ['Kertas 70 gsm s/d 310 gsm', 'Warna solid tajam setara offset', 'Bisa cetak 1 lembar'],
		mesinTerkait: 'Fuji Xerox Versant 180 Press'
	},
	{
		id: 'stiker-cutting',
		judul: 'Label Kemasan & Cutting',
		tagline: 'Potong Pola Presisi (Kiss Cut)',
		deskripsi: 'Stiker vinyl anti air dan stiker bontak untuk label toples kue, botol, kemasan makanan, & motor.',
		icon: 'Sticker',
		produkUnggulan: ['Stiker Vinyl Anti Air', 'Stiker Bontak Glossy', 'Stiker Transparan', 'Cutting Stiker Custom'],
		keunggulan: ['Tinggal kelupas (kiss cut)', 'Potong pola lekukan rumit', 'Tersedia laminasi doff/glossy'],
		mesinTerkait: 'Graphtec CE7000-60 Plotter'
	},
	{
		id: 'finishing',
		judul: 'Finishing & Perlindungan',
		tagline: 'Awet & Tampilan Mewah',
		deskripsi: 'Laminasi doff/glossy, ring mata ayam spanduk, lem lipat keliling, hingga jilid spiral.',
		icon: 'Sparkles',
		produkUnggulan: ['Laminasi Doff / Glossy', 'Pasang Mata Ayam', 'Lipat Lem Keliling', 'Jilid Spiral'],
		keunggulan: ['Lapisan rapi bebas gelembung', 'Melindungi dari air & goresan', 'Tampilan lebih eksklusif'],
		mesinTerkait: 'Heavy Duty Thermal Laminator'
	}
];

export const FAQ_PERCETAKAN: FaqItem[] = [
	{
		tanya: 'Belum punya file desain, apakah bisa dibantu?',
		jawab: 'Bisa! Kirimkan teks materi, konsep, atau foto referensi via WhatsApp, tim kami siap bantu tata layout.',
		kategori: 'Desain'
	},
	{
		tanya: 'Berapa minimal order di FD Digital Printing?',
		jawab: 'Tidak ada minimal order. Anda bisa pesan mulai 1 lembar stiker A3+ atau 1 meter spanduk.',
		kategori: 'Pemesanan'
	},
	{
		tanya: 'Apakah pesanan bisa ditunggu / dicetak kilat?',
		jawab: 'Bisa! Untuk file siap cetak dan antrean memungkinkan, banner & stiker bisa selesai dalam 1–3 jam. Kami buka s/d 02.00 dini hari.',
		kategori: 'Produksi'
	},
	{
		tanya: 'Format file apa yang disarankan?',
		jawab: 'Format siap cetak: PDF, TIFF, atau JPG resolusi minimal 150 PPI dengan mode warna CMYK agar warna akurat.',
		kategori: 'Teknis'
	},
	{
		tanya: 'Apa metode pembayaran dan opsi pengiriman?',
		jawab: 'Pembayaran via QRIS otomatis, transfer bank, atau tunai. Pengiriman bisa ambil langsung di toko atau lewat kurir online (Gosend/Grab).',
		kategori: 'Pembayaran'
	}
];
