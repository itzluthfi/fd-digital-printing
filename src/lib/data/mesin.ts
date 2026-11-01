/**
 * Data Mesin Percetakan FD Digital Printing.
 * Memenuhi kebutuhan fungsional FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14.
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
	
	// FR-10: Fungsi dan kegunaan setiap mesin
	fungsiKegunaan: string;
	
	// FR-11: Jenis pekerjaan dan produk yang dapat dihasilkan
	jenisPekerjaan: string[];
	produkDihasilkan: string[];
	
	// FR-12: Jenis bahan yang dapat diproses
	bahanDiproses: {
		kategori: string;
		daftar: string[];
	}[];
	
	// FR-13: Spesifikasi mesin yang relevan bagi pelanggan
	spesifikasi: SpesifikasiMesin[];
	
	// FR-14: Contoh hasil cetak yang dapat dihasilkan
	contohHasilCetak: ContohHasilCetak[];
	
	keunggulanUtama: string[];
}

export const DAFTAR_MESIN: MesinPercetakan[] = [
	{
		id: 'mesin-outdoor-konica',
		nama: 'Allwin Konica Minolta 512i High-Speed 3.2M',
		kategori: 'outdoor',
		kategoriLabel: 'Outdoor Large Format',
		tagline: 'Mesin Industri Format Besar Berkecepatan Tinggi untuk Spanduk & Baliho',
		foto: '/landing-hero.jpg',
		statusOperasional: 'Aktif Beroperasi',
		fungsiKegunaan:
			'Mencetak media promosi luar ruang (outdoor) skala besar dengan tinta solvent tahan air dan cuaca ekstrem, menjamin warna solid tidak cepat pudar diterpa terik matahari dan hujan badai.',
		jenisPekerjaan: [
			'Cetak Spanduk Promosi Toko & Cafe',
			'Cetak Baliho Jalan Raya & Billboard Besar',
			'Cetak Backdrop Panggung Acara / Seminar',
			'Cetak Banner Event Olahraga & Pameran',
			'Cetak Umbul-Umbul Perumahan & Kampanye'
		],
		produkDihasilkan: [
			'Spanduk Flexi Frontlite (Pecel Lele, Warung, Toko)',
			'Baliho Reklame Raksasa Luar Kota',
			'Backdrop Panggung Gathering / Wisuda',
			'X-Banner & Y-Banner Outdoor',
			'Spanduk Kain / TC Sablon Digital'
		],
		bahanDiproses: [
			{
				kategori: 'Flexi Frontlite',
				daftar: ['Flexi China 280 gsm', 'Flexi China 340 gsm', 'Flexi Korea 440 gsm (Serat Halus Tebal)']
			},
			{
				kategori: 'Bahan Khusus Outdoor',
				daftar: ['Flexi Jerman 510 gsm Heavy Duty', 'Backlite Banner 510 gsm (Neon Box)', 'Kain TC Spanduk']
			}
		],
		spesifikasi: [
			{ label: 'Lebar Cetak Maksimal', value: '3.2 Meter (Panjang Tanpa Batas)' },
			{ label: 'Teknologi Printhead', value: 'Konica Minolta KM512i High-Speed (4/8 Heads)' },
			{ label: 'Resolusi Cetak', value: 'Hingga 1440 dpi (High Density)' },
			{ label: 'Kecepatan Cetak', value: 'Hingga 120 m² per jam (Kapasitas Produksi Cepat)' },
			{ label: 'Jenis Tinta', value: 'Solvent Base Premium Tahan UV & Anti Luntur' },
			{ label: 'Ketahanan Luar Ruang', value: '6 – 12 Bulan (Tahan Panas Terik & Hujan)' }
		],
		contohHasilCetak: [
			{
				judul: 'Spanduk Warung Kuliner & UMKM',
				deskripsi: 'Warna merah dan kuning menyala tajam, terbaca jelas dari kejauhan hingga jarak 50 meter.',
				material: 'Flexi China 280 gsm',
				badge: 'Best Seller'
			},
			{
				judul: 'Backdrop Panggung Seminar Nasional 6 x 3 Meter',
				deskripsi: 'Dicetak utuh tanpa sambungan garis tengah, permukaan rata dan tidak memantulkan cahaya berlebih saat disorot lampu panggung.',
				material: 'Flexi Korea 440 gsm',
				badge: 'Premium Event'
			},
			{
				judul: 'Baliho Billboard Promosi Perumahan 4 x 8 Meter',
				deskripsi: 'Kekuatan bahan tebal dan sambungan lem hot-air gun rapi tahan terpaan angin kencang di jalan tol.',
				material: 'Flexi Jerman 510 gsm',
				badge: 'Heavy Duty'
			}
		],
		keunggulanUtama: [
			'Bisa cetak hingga lebar 3.2 meter tanpa sambungan jahitan',
			'Kecepatan cetak tinggi, pesanan ratusan meter siap dalam hitungan jam',
			'Pigmen tinta pekat anti pudar meski terkena hujan terik sepanjang hari'
		]
	},
	{
		id: 'mesin-indoor-epson',
		nama: 'Epson SureColor Ultra-HD Eco-Solvent 1.6M',
		kategori: 'indoor',
		kategoriLabel: 'Indoor High-Resolution',
		tagline: 'Kerapatan Piksel Fotografi Tanpa Garis untuk Display Promosi Mewah',
		foto: '/landing-stiker.jpg',
		statusOperasional: 'Aktif Beroperasi',
		fungsiKegunaan:
			'Mencetak materi display dalam ruangan (indoor) dan reproduksi karya fotografi beresolusi super tinggi dengan gradasi warna yang sangat halus, bebas efek garis (banding-free), dan tinta ramah lingkungan tanpa bau tajam.',
		jenisPekerjaan: [
			'Cetak Roll Up Banner Pameran & Mall',
			'Cetak Poster Display Toko & Menu Restoran',
			'Cetak Foto Kanvas Seni & Wedding Gallery',
			'Cetak Stiker Label Vinyl Presisi Halus',
			'Cetak Film Backlite Duratrans untuk Neon Box Indoor'
		],
		produkDihasilkan: [
			'Roll Up Banner Aluminium Eksklusif',
			'Tripod & X-Banner Albatros Matte',
			'Poster Frame Bingkai Kaca',
			'Foto Wedding Media Canvas Artistik',
			'Menu Transparan & Duratrans Neon Box'
		],
		bahanDiproses: [
			{
				kategori: 'Media Sintetis Indoor',
				daftar: ['Albatros Matte 180 gsm', 'Luster Photo Paper 260 gsm', 'Glossy Photo Paper']
			},
			{
				kategori: 'Media Display & Seni',
				daftar: ['Canvas Cotton Seni', 'Duratrans Backlite Film', 'Stiker Vinyl Indoor Premium']
			}
		],
		spesifikasi: [
			{ label: 'Lebar Cetak Maksimal', value: '1.6 Meter (160 cm)' },
			{ label: 'Teknologi Printhead', value: 'PrecisionCore TFP Micro Piezo' },
			{ label: 'Resolusi Cetak', value: 'Hingga 2400 x 1200 dpi (Ultra-HD)' },
			{ label: 'Konfigurasi Tinta', value: 'UltraChrome GS3 Eco-Solvent (9 Warna)' },
			{ label: 'Karakteristik Tinta', value: 'Bebas Bau Kimia Tajam (Aman untuk Ruangan Ber-AC)' },
			{ label: 'Akurasi Warna', value: 'Cakupan gamut warna luas 98.2% Pantone Matching' }
		],
		contohHasilCetak: [
			{
				judul: 'Roll Up Banner Promosi Mall 85 x 200 cm',
				deskripsi: 'Permukaan Albatros halus doff, tidak melengkung di bagian sisi samping, detail tipografi kecil terbaca sangat tajam.',
				material: 'Albatros + Laminasi Doff',
				badge: 'Display Eksklusif'
			},
			{
				judul: 'Cetak Foto Keluarga & Wisuda di Atas Kanvas',
				deskripsi: 'Tekstur serat kanvas alami berpadu dengan saturasi warna kulit alami yang hidup dan hangat.',
				material: 'Cotton Canvas Premium',
				badge: 'Art Gallery'
			},
			{
				judul: 'Poster Neon Box Restoran Duratrans',
				deskripsi: 'Saat lampu neon box dinyalakan, foto makanan terlihat sangat menggoda dengan kontras cahaya merata.',
				material: 'Backlite Film Duratrans',
				badge: 'High Contrast'
			}
		],
		keunggulanUtama: [
			'Tinta Eco-Solvent ramah lingkungan tidak berbau, aman dipasang di ruangan tertutup dan ber-AC',
			'Resolusi ultra tinggi 2400 dpi menghasilkan gradasi warna lembut tanpa garis bintik',
			'Akurasi warna mendekati 98% standar warna desain di layar monitor'
		]
	},
	{
		id: 'mesin-laser-press-xerox',
		nama: 'Fuji Xerox Versant 180 Production Press A3+',
		kategori: 'laser',
		kategoriLabel: 'Digital Press Laser A3+',
		tagline: 'Cetak Dokumen & Cetak Offset Cepat Oplah Fleksibel dalam Hitungan Menit',
		foto: '/landing-offset.jpg',
		statusOperasional: 'Aktif Beroperasi',
		fungsiKegunaan:
			'Mencetak dokumen komersial, stiker lembaran, brosur, kartu nama, dan kemasan kertas tebal dengan kecepatan tinggi dan akurasi registrasi bolak-balik sempurna tanpa batasan minimal order.',
		jenisPekerjaan: [
			'Cetak Lembaran Stiker Label Produk UMKM',
			'Cetak Kartu Nama Bisnis & Corporate Id',
			'Cetak Brosur & Flyer Lipat Promosi',
			'Cetak Buku Menu Cafe, Kalender & Katalog',
			'Cetak Sertifikat, Piagam, & Undangan'
		],
		produkDihasilkan: [
			'Lembaran Stiker Chromo & Vinyl A3+ Siap Cutting',
			'Kartu Nama Tebal 2 Sisi Laminasi Doff Velvet',
			'Brosur Lipat 3 Art Paper Full Color',
			'Sertifikat Bertekstur Linen / Jasmine Glitter',
			'Hangtag Baju & Paper Bag Kemasan Ringan'
		],
		bahanDiproses: [
			{
				kategori: 'Kertas Seni & Karton',
				daftar: ['Art Paper 120 / 150 gsm', 'Art Carton 210 / 260 / 310 gsm', 'Matte Paper 150 gsm']
			},
			{
				kategori: 'Kertas Fancy & Tekstur',
				daftar: ['Kertas Linen Jepang', 'Jasmine Glitter', 'Concorde', 'Brief Card (BC) 160 gsm']
			},
			{
				kategori: 'Bahan Stiker Lembaran',
				daftar: ['Stiker Chromo Glossy A3+', 'Stiker Vinyl Putih A3+', 'Stiker Transparan A3+']
			}
		],
		spesifikasi: [
			{ label: 'Ukuran Kertas Maksimal', value: '330 x 488 mm (Support Banner Sheet 330 x 1200 mm)' },
			{ label: 'Resolusi Cetak', value: 'Ultra HD 2400 x 2400 dpi VCSEL Laser' },
			{ label: 'Kecepatan Cetak', value: '80 Halaman A4 per Menit (Produksi Cepat Kilat)' },
			{ label: 'Gramatur Kertas', value: '52 gsm hingga 350 gsm (Kertas Tipis s/d Karton Tebal)' },
			{ label: 'Akurasi Registrasi Duplex', value: 'Toleransi presisi register bolak-balik < 0.5 mm' },
			{ label: 'Teknologi Toner', value: 'Emulsion Aggregation (EA) Eco-Toner Halus Mengkilap' }
		],
		contohHasilCetak: [
			{
				judul: 'Kartu Nama Bisnis Eksekutif',
				deskripsi: 'Teks huruf kecil ukuran 5pt tercetak sangat tajam dan terbaca bersih pada kedua sisi kartu.',
				material: 'Art Carton 260 gsm + Laminasi Doff',
				badge: 'Favorit'
			},
			{
				judul: 'Brosur Lipat Tiga Promosi Perumahan & Kuliner',
				deskripsi: 'Warna foto tampak mengkilap cerah alami dengan lipatan yang rapi tanpa retak kertas pada punggung lipat.',
				material: 'Art Paper 150 gsm Full Color 2 Sisi',
				badge: 'Best Seller'
			},
			{
				judul: 'Sertifikat Penghargaan Resmi / Piagam Lomba',
				deskripsi: 'Kemewahan tekstur serat kain linen dipadukan dengan tinta hitam dan logo emas solid.',
				material: 'Linen Jepang 230 gsm',
				badge: 'Formal'
			}
		],
		keunggulanUtama: [
			'Bisa cetak mulai 1 lembar A3+ tanpa perlu biaya plat offset mahal',
			'Kecepatan cetak 80 lembar per menit, pesanan ribuan brosur selesai hari yang sama',
			'Akurasi bolak-balik (duplex) sangat presisi memudahkan pemotongan'
		]
	},
	{
		id: 'mesin-cutting-graphtec',
		nama: 'Graphtec CE7000-60 Digital Contour Cutting Plotter',
		kategori: 'cutting',
		kategoriLabel: 'Precision Contour Cutting',
		tagline: 'Pemotong Kontur Digital Presisi Tinggi untuk Stiker Custom Segala Bentuk',
		foto: '/mesin-cutting.jpg',
		statusOperasional: 'Aktif Beroperasi',
		fungsiKegunaan:
			'Memotong lembaran stiker mengikuti pola lekukan desain (lingkaran, kotak melengkung, maupun siluet logo rumit) secara otomatis dengan sensor optik membaca barcode posisi.',
		jenisPekerjaan: [
			'Kiss-Cut Stiker Label Kemasan Makanan & Minuman',
			'Die-Cut Stiker Potong Putus Satuan Merchandise',
			'Cutting Stiker Huruf & Angka Kaca Toko (Sandblast)',
			'Cutting Striping Otomotif Motor & Mobil',
			'Cutting Polyflex Sablon Kaos Satuan'
		],
		produkDihasilkan: [
			'Lembaran Stiker Toples Kue Kering (Tinggal Kelupas)',
			'Stiker Botol Frozen Food Anti-Air Kiss Cut',
			'Stiker Merchandise Komunitas / Band Die-Cut',
			'Cutting Huruf Jam Buka Kaca Pintu Masuk Toko',
			'Stiker Label Alamat & Barcode Pengiriman'
		],
		bahanDiproses: [
			{
				kategori: 'Bahan Stiker Cetak',
				daftar: ['Stiker Vinyl White Glossy/Matte', 'Stiker Chromo Glossy', 'Stiker Transparan Bening']
			},
			{
				kategori: 'Bahan Stiker Khusus',
				daftar: ['Stiker Hologram Pelangi', 'Stiker Silver & Gold Metalik', 'Stiker Sandblast Kaca', 'Polyflex Kaos']
			}
		],
		spesifikasi: [
			{ label: 'Lebar Area Potong', value: 'Maksimal 603 mm (Support Roll & Lembar A3+)' },
			{ label: 'Sistem Sensor Optik', value: 'ARMS 8.0 (Auto Registration Mark Sensor) + Datalink Barcode' },
			{ label: 'Kecepatan Pemotongan', value: 'Hingga 1000 mm per detik (Super Gesit)' },
			{ label: 'Kekuatan Tekanan Pisau', value: 'Hingga 450 gf (Mampu memotong vinyl tebal & backing)' },
			{ label: 'Toleransi Presisi', value: 'Akurasi potong hingga 0.1 mm (Sangat Presisi)' },
			{ label: 'Mode Potong', value: 'Kiss-Cut (Setengah Putus) & Die-Cut (Potong Tembus Per Biji)' }
		],
		contohHasilCetak: [
			{
				judul: 'Stiker Kemasan Botol Kopi Susu Kiss-Cut',
				deskripsi: 'Terpotong sempurna membentuk oval, mudah dikelupas dalam satu tarikan tanpa merusak kertas belakang.',
				material: 'Vinyl White Anti Air',
				badge: 'Best Seller UMKM'
			},
			{
				judul: 'Stiker Merchandise Komunitas Die-Cut Satuan',
				deskripsi: 'Dipotong putus mengikuti lekuk siluet karakter kartun, siap dibagikan satuan ke pembeli.',
				material: 'Vinyl Matte + Laminasi Doff',
				badge: 'Merchandise'
			},
			{
				judul: 'Stiker Label Toples Kue Kering Lebaran Diameter 5cm',
				deskripsi: 'Satu lembar A3+ memuat puluhan stiker terpotong presisi rapi siap ditempel di toples.',
				material: 'Chromo Glossy',
				badge: 'Ekonomis'
			}
		],
		keunggulanUtama: [
			'Sensor ARMS 8.0 otomatis mengoreksi kemiringan kertas sehingga potongan tidak pernah melenceng',
			'Mendukung kiss-cut (kelupas mudah) dan die-cut (potong putus per biji)',
			'Mampu memotong detail lekukan huruf dan logo rumit hingga ukuran sekecil 5 milimeter'
		]
	},
	{
		id: 'mesin-laminasi-roll',
		nama: 'Heavy Duty Thermal & Cold Roll Laminator 1600',
		kategori: 'finishing',
		kategoriLabel: 'Finishing & Perlindungan',
		tagline: 'Lapisan Pelindung Anti Gores, Anti Air, dan Anti Pudar Bebas Gelembung',
		foto: '/mesin-laminasi.jpg',
		statusOperasional: 'Aktif Beroperasi',
		fungsiKegunaan:
			'Melapisi permukaan cetakan menggunakan lapisan plastik film khusus bertekanan rol pneumatik dan suhu terkontrol untuk melindungi cetakan dari goresan, air, minyak, serta memberikan tampilan mewah.',
		jenisPekerjaan: [
			'Laminasi Stiker Outdoor & Otomotif',
			'Laminasi Poster Dinding & Pameran Mall',
			'Laminasi Kartu Nama & Cover Buku Luxury',
			'Laminasi Menu Cafe Tahan Tumpahan Minyak',
			'Laminasi Stiker Lantai (Floor Graphic) Anti Licin'
		],
		produkDihasilkan: [
			'Stiker Glossy Berkilau Ekstra Tebal',
			'Kartu Nama & Buku Doff Velvet Halus Mewah',
			'Poster Tahan Dilap Kain Basah Berulang Kali',
			'Papan Menu Cafe Bebas Noda Makanan',
			'Stiker Motor Tahan Baret Cuci Steam'
		],
		bahanDiproses: [
			{
				kategori: 'Plastik Film Dingin (Cold)',
				daftar: ['Laminasi Cold Glossy Monomeric', 'Laminasi Cold Doff Matte', 'Laminasi 3D Tekstur Sandblast']
			},
			{
				kategori: 'Plastik Film Panas (Thermal)',
				daftar: ['BOPP Thermal Glossy 28 micron', 'BOPP Thermal Doff Velvet 32 micron']
			}
		],
		spesifikasi: [
			{ label: 'Lebar Laminasi Maksimal', value: '1600 mm (1.6 Meter) & Unit Desktop A3+' },
			{ label: 'Pengatur Suhu Digital', value: '0°C hingga 140°C Suhu Presisi Termostatik' },
			{ label: 'Sistem Rol Tekanan', value: 'Pneumatik Silikon Anti-Gelembung (Bubble-Free System)' },
			{ label: 'Kecepatan Laminasi', value: 'Hingga 10 meter per menit' },
			{ label: 'Ketebalan Media Masuk', value: 'Hingga 25 mm (Bisa melaminasi media tebal / foamboard)' },
			{ label: 'Pilihan Finishing', value: 'Glossy (Mengkilap), Doff (Matte Velvet), dan Sandblast' }
		],
		contohHasilCetak: [
			{
				judul: 'Lapisan Laminasi Glossy Stiker Mobil & Motor',
				deskripsi: 'Menjadikan warna cetakan stiker terlihat lebih hidup, basah (wet-look), dan tahan dari goresan kerikil jalan.',
				material: 'Cold Lamination Clear Glossy',
				badge: 'Otomotif'
			},
			{
				judul: 'Lapisan Doff Velvet Halus untuk Cover Buku & Kartu Nama',
				deskripsi: 'Sensasi sentuhan lembut seperti beludru saat dipegang, anti silau pantulan cahaya lampu kantor.',
				material: 'Thermal BOPP Doff Matte',
				badge: 'Luxury Touch'
			},
			{
				judul: 'Menu Restoran Anti Air Tahan Noda Minyak',
				deskripsi: 'Dapat dicuci atau dilap dengan sabun pembersih setiap hari tanpa merusak kertas di dalamnya.',
				material: 'Thermal Glossy Tebal',
				badge: 'Tahan Cuci'
			}
		],
		keunggulanUtama: [
			'Tekanan pneumatik merata memastikan hasil 100% bebas gelembung udara dan kerutan',
			'Melipatgandakan usia ketahanan hasil cetakan dari paparan sinar UV dan air',
			'Memberikan impresi mewah dan profesional pada setiap materi cetakan bisnis Anda'
		]
	}
];
