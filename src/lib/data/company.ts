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
		'FD Digital Printing adalah pusat percetakan digital profesional terkemuka yang berbasis di Wadungasri, Waru, Sidoarjo. Kami menyediakan ekosistem percetakan terpadu mulai dari digital printing outdoor skala besar, cetak indoor beresolusi fotografi, digital press laser offset A3+, hingga cutting stiker presisi tinggi.',
	narasiLengkap:
		'Didirikan sejak tahun 2018, FD Digital Printing berdedikasi menjadi mitra strategis bagi pelaku UMKM, korporasi, instansi pemerintah, komunitas kreatif, dan masyarakat umum. Menggabungkan deretan mesin percetakan berteknologi mutakhir, bahan baku premium grade, operator terlatih, dan sistem pemesanan online otomatis yang responsif, kami menjamin kualitas cetak warna akurat, pengerjaan tepat waktu, dan harga bersahabat tanpa minimum order yang memberatkan.',
	visi: 'Menjadi sentra percetakan digital paling tepercaya, inovatif, dan adaptif di Jawa Timur yang memberdayakan pertumbuhan bisnis UMKM dan industri kreatif melalui teknologi cetak modern dan layanan tanpa batas.',
	misi: [
		'Menyediakan hasil cetak berstandar industri dengan ketajaman warna tinggi, tahan cuaca, dan material berkualitas unggul.',
		'Memberikan layanan pengerjaan express dan fleksibel hingga larut malam (02.00 dini hari) untuk menjawab kebutuhan mendesak pelanggan.',
		'Menerapkan transparansi harga menyeluruh, kemudahan pemesanan digital tanpa antre, dan tanpa batasan minimal order.',
		'Terus memperbarui armada mesin dan teknologi finishing modern demi menghadirkan inovasi produk cetak terkini.',
		'Membangun hubungan kemitraan jangka panjang yang saling menguntungkan dengan para pelaku usaha dan komunitas lokal.'
	],
	nilaiKeunggulan: [
		{
			judul: 'Teknologi Mesin Modern',
			deskripsi:
				'Didukung armada mesin produksi berkapasitas tinggi (Konica 512i, Epson Eco-Solvent, Fuji Xerox Versant 180, dan Graphtec Cutter) yang terkalibrasi warna secara berkala.',
			icon: 'Cpu'
		},
		{
			judul: 'Bisa Pengerjaan Kilat & Fleksibel',
			deskripsi:
				'Buka hingga pukul 02.00 dini hari! File siap cetak dapat langsung naik mesin dan ditunggu dalam hitungan jam demi mendukung deadline mendesak Anda.',
			icon: 'Zap'
		},
		{
			judul: 'Tanpa Minimal Order',
			deskripsi:
				'Mulai dari cetak stiker 1 lembar A3+, spanduk 1 meter, hingga ribuan meter baliho korporasi kami layani dengan standar dedikasi mutu yang sama.',
			icon: 'ShoppingBag'
		},
		{
			judul: 'Akurasi Warna CMYK Solid',
			deskripsi:
				'Manajemen profil warna terkalibrasi menghasilkan cetakan yang tajam, pekat, tidak belang, serta awet tahan air dan paparan sinar matahari.',
			icon: 'Sparkles'
		},
		{
			judul: 'Pemesanan Online Live Tracking',
			deskripsi:
				'Pesan kapan saja lewat website, bayar otomatis via QRIS instan, dan pantau langsung status proses cetak secara real-time hingga pesanan siap diambil.',
			icon: 'Activity'
		},
		{
			judul: 'Bantuan File & Pra-Cetak',
			deskripsi:
				'Tim desainer kami siap memeriksa resolusi file, bleeding, garis potong, hingga asistensi setting layout agar hasil akhir sempurna bebas cacat.',
			icon: 'CheckCircle'
		}
	],
	statistik: [
		{ angka: '8+', label: 'Tahun Pengalaman', sublabel: 'Sejak 2018 di Sidoarjo' },
		{ angka: '120.000+', label: 'Meter Persegi Dicetak', sublabel: 'Spanduk & Baliho Outdoor' },
		{ angka: '5.200+', label: 'Pelaku Usaha & UMKM', sublabel: 'Mitra Aktif Berlangganan' },
		{ angka: '99.4%', label: 'Kepuasan Pelanggan', sublabel: 'Ulasan Positif & Repeat Order' }
	]
};

export const SEJARAH_PERUSAHAAN: Milestone[] = [
	{
		tahun: '2018',
		judul: 'Awal Mula Pendirian di Wadungasri',
		deskripsi:
			'FD Digital Printing resmi dirintis di sebuah workshop sederhana di Jl. Raya Wadungasri No. 42, Waru, Sidoarjo. Berbekal 1 unit mesin outdoor dan tekad melayani cetak banner cepat bagi para pedagang lokal dan warga sekitar.',
		badge: 'Pondasi Awal'
	},
	{
		tahun: '2020',
		judul: 'Ekspansi Digital Press A3+ & Booming Label UMKM',
		deskripsi:
			'Melihat lonjakan kebutuhan kemasan produk UMKM dan frozen food saat pandemi, kami menginvestasikan mesin laser produksi Fuji Xerox A3+ dan mesin cutting contour. Langkah ini menjadikan FD Printing rujukan utama cetak stiker label di Sidoarjo-Surabaya.',
		badge: 'Digital Press'
	},
	{
		tahun: '2022',
		judul: 'Modernisasi Armada Mesin Outdoor & Indoor Ultra-HD',
		deskripsi:
			'Melakukan upgrade besar-besaran pada lini produksi luar ruang dengan mesin Konica 512i berkecepatan 120 m²/jam dan mesin indoor Epson Eco-Solvent untuk kebutuhan display pameran, kanvas foto, dan banner resolusi tinggi.',
		badge: 'Upgrade Teknologi'
	},
	{
		tahun: '2024',
		judul: 'Transformasi Digital & Operasional Hingga Dini Hari',
		deskripsi:
			'Memperpanjang jam operasional hingga pukul 02.00 dini hari untuk melayani kebutuhan mendesak para pelaku usaha. Sekaligus meluncurkan platform sistem pemesanan online otomatis dengan pembayaran QRIS dan bot notifikasi pintar.',
		badge: 'Digitalisasi'
	},
	{
		tahun: '2026',
		judul: 'Menuju Sentra Percetakan Terpadu & Ramah Lingkungan',
		deskripsi:
			'Kini FD Digital Printing dipercaya oleh ribuan mitra bisnis, kantor instansi, komunitas kreatif, serta UMKM nasional dengan kapasitas produksi puluhan ribu cetakan per bulan dan komitmen layanan prima tanpa henti.',
		badge: 'Masa Kini'
	}
];

export const LAYANAN_PERCETAKAN: LayananPercetakan[] = [
	{
		id: 'outdoor',
		judul: 'Digital Printing Outdoor',
		tagline: 'Cetak Format Besar Tahan Panas & Hujan',
		deskripsi:
			'Layanan cetak media luar ruang skala besar menggunakan tinta solvent tahan cuaca ekstrem. Warna tajam mencolok dan tidak mudah luntur hingga 12 bulan.',
		icon: 'Flag',
		produkUnggulan: ['Spanduk Warung & Toko', 'Baliho & Reklame Jalan', 'Backdrop Panggung Seminar', 'Umbul-Umbul & Flag Banner'],
		keunggulan: ['Lebar bahan s/d 3.2 meter tanpa sambungan', 'Tahan sinar UV matahari & air hujan', 'Pengerjaan super kilat partai besar'],
		mesinTerkait: 'Allwin Konica 512i High-Speed Outdoor 3.2M'
	},
	{
		id: 'indoor',
		judul: 'Indoor High-Resolution & Display',
		tagline: 'Kualitas Fotografi Tanpa Garis (Banding-Free)',
		deskripsi:
			'Pilihan utama untuk materi promosi dalam ruangan, event mall, dan galeri seni dengan kerapatan piksel micro piezo yang menghasilkan gradasi warna super mulus.',
		icon: 'Image',
		produkUnggulan: ['Roll Up Banner Eksklusif', 'X-Banner & Y-Banner Indoor', 'Poster Albatros Sintetis', 'Cetak Foto Kanvas & Duratrans Backlite'],
		keunggulan: ['Resolusi hingga 2400 dpi', 'Tinta Eco-Solvent ramah lingkungan bebas bau', 'Hasil gambar super detail dan tajam'],
		mesinTerkait: 'Epson SureColor Ultra-HD Indoor Eco-Solvent'
	},
	{
		id: 'laser-a3',
		judul: 'Digital Press Laser Offset A3+',
		tagline: 'Cetak Dokumen & Kemasan Cepat Presisi',
		deskripsi:
			'Pengganti cetak offset untuk oplah kecil hingga menengah. Cetak lembaran kertas tebal, kartu nama, dan brosur selesai dalam hitungan menit dengan warna CMYK pekat mengkilap.',
		icon: 'Printer',
		produkUnggulan: ['Kartu Nama Eksklusif', 'Brosur & Flyer Lipat', 'Sertifikat & Piagam', 'Buku Menu Resto, Kalender & Katalog'],
		keunggulan: ['Dukungan kertas 70 gsm hingga 310 gsm', 'Hasil warna solid tajam setara offset', 'Bisa cetak 1 lembar tanpa minimal order'],
		mesinTerkait: 'Fuji Xerox Versant 180 Production Press'
	},
	{
		id: 'stiker-cutting',
		judul: 'Label Kemasan & Cutting Stiker',
		tagline: 'Potong Sesuai Pola Bebas (Kiss Cut & Die Cut)',
		deskripsi:
			'Solusi branding kemasan produk UMKM, toples kue, botol minuman, dan frozen food dengan daya rekat ekstra kuat serta pemotongan otomatis presisi tinggi.',
		icon: 'Sticker',
		produkUnggulan: ['Stiker Vinyl Anti Air & Minyak', 'Stiker Chromo Glossy Ekonomis', 'Stiker Hologram Pelangi Custom', 'Cutting Stiker Otomotif & Sandblast'],
		keunggulan: ['Kiss cut rapi tinggal kelupas', 'Sensor optik otomatis membaca pola lekukan rumit', 'Tersedia finishing laminasi doff & glossy'],
		mesinTerkait: 'Graphtec CE7000-60 Precision Plotter'
	},
	{
		id: 'finishing',
		judul: 'Finishing & Perlindungan Cetak',
		tagline: 'Perlindungan Ekstra dan Tampilan Premium',
		deskripsi:
			'Sentuhan akhir untuk meningkatkan daya tahan cetakan terhadap goresan fisik, tumpahan air, dan memberikan estetika mewah pada materi promosi Anda.',
		icon: 'Sparkles',
		produkUnggulan: ['Laminasi Doff Velvet (Matte)', 'Laminasi Glossy Mengkilap', 'Pasang Mata Ayam (Ring Lubang)', 'Lipat Lem Keliling & Jilid Spiral'],
		keunggulan: ['Lapisan bebas gelembung (bubble-free)', 'Melindungi dari air dan kelembapan', 'Meningkatkan ketebalan dan daya tarik visual'],
		mesinTerkait: 'Heavy Duty Thermal & Cold Laminator 1600'
	}
];

export const FAQ_PERCETAKAN: FaqItem[] = [
	{
		tanya: 'Belum punya file desain, apakah bisa dibantu dibuatkan?',
		jawab:
			'Tentu bisa! Anda cukup mengirimkan teks materi, sketsa coretan tangan, atau foto referensi yang diinginkan via WhatsApp. Tim desainer kami siap membantu menata layout hingga siap naik mesin.',
		kategori: 'Desain'
	},
	{
		tanya: 'Berapa minimal order cetak di FD Digital Printing?',
		jawab:
			'Kami tidak membatasi minimal order! Anda bisa mencetak stiker mulai 1 lembar A3+, spanduk mulai 1 meter persegi, ataupun cetak dokumen satuan dengan harga transparan.',
		kategori: 'Pemesanan'
	},
	{
		tanya: 'Apakah pesanan bisa ditunggu / dicetak kilat?',
		jawab:
			'Bisa sekali! Untuk file yang sudah siap cetak (ready-to-print) dan antrean mesin sedang memungkinkan, spanduk dan stiker dapat selesai dalam 1–3 jam. Kami juga buka hingga jam 02.00 dini hari untuk melayani kebutuhan mendesak Anda.',
		kategori: 'Produksi'
	},
	{
		tanya: 'Format file apa saja yang disarankan agar hasil cetak maksimal?',
		jawab:
			'Disarankan format file siap cetak: PDF, TIFF, JPG, CDR (CorelDraw), atau AI/PSD dengan color mode CMYK dan resolusi minimal 150-300 dpi ukuran asli 100% untuk menghindari pecah atau perubahan warna.',
		kategori: 'Teknis'
	},
	{
		tanya: 'Apa perbedaan bahan Flexi China dan Flexi Korea pada spanduk?',
		jawab:
			'Flexi China (280-300 gsm) adalah pilihan ekonomis dan populer untuk spanduk outdoor event jangka pendek. Sedangkan Flexi Korea (440 gsm) memiliki serat jauh lebih rapat, permukaan halus, lebih tebal, dan menyerap warna lebih pekat, sangat direkomendasikan untuk pameran premium dan backdrop panggung.',
		kategori: 'Bahan'
	},
	{
		tanya: 'Bagaimana metode pembayaran dan pengirimannya?',
		jawab:
			'Kami mendukung pembayaran instan via QRIS (semua e-wallet dan m-banking), transfer bank (BCA/Mandiri/BRI), serta tunai di kasir. Untuk pengiriman, pesanan dapat diambil langsung di toko atau dikirim menggunakan kurir online (Gosend/GrabExpress) maupun ekspedisi luar kota.',
		kategori: 'Pembayaran'
	}
];
