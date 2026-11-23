/**
 * Data default mesin percetakan dan katalog produk FD Digital Printing.
 * Digunakan untuk inisialisasi database awal (init-schema), db:seed, dan auto-seed.
 */

export interface DefaultMachine {
	slug: string;
	nama: string;
	kategori: string;
	kategoriLabel: string;
	tagline: string;
	foto: string;
	statusOperasional: string;
	fungsiKegunaan: string;
	jenisPekerjaan: string[];
	produkDihasilkan: string[];
	bahanDiproses: { kategori: string; daftar: string[] }[];
	spesifikasi: { label: string; value: string }[];
	contohHasilCetak: { judul: string; deskripsi: string; material: string; badge: string }[];
	keunggulanUtama: string[];
	sortOrder: number;
	isActive: boolean;
}

export interface DefaultPriceItem {
	name: string;
	category: string;
	unit: string;
	price: number;
	isActive: boolean;
	sortOrder: number;
	imageUrl: string;
}

export const DEFAULT_MACHINES: DefaultMachine[] = [
  {
    "slug": "mesin-stiker-eco-solvent-epson",
    "nama": "Epson SureColor SC-S40670 Eco-Solvent",
    "kategori": "indoor",
    "kategoriLabel": "Indoor & Eco-Solvent",
    "tagline": "Cetak Stiker & Media Display Ultra-Presisi Warna Tajam Berkualitas Fotografi",
    "foto": "/mesin-1.png",
    "statusOperasional": "Aktif Beroperasi",
    "fungsiKegunaan": "Mencetak media stiker, decal, poster display, signage, dan dekorasi interior/eksterior beresolusi sangat tinggi menggunakan tinta eco-solvent ramah lingkungan dengan akurasi warna cerah, tajam, dan detail yang sangat presisi.",
    "jenisPekerjaan": [
      "Cetak Stiker Label Kemasan & Decal Otomotif",
      "Cetak Roll Up Banner & X-Banner Premium Indoor",
      "Cetak Poster Promosi Display & Neon Box Backlite",
      "Cetak Wall Decor, Wallpaper & Signage Interior",
      "Cetak Foto Kanvas & Art Print Resolusi Tinggi"
    ],
    "produkDihasilkan": [
      "Stiker Vinyl Eco-Solvent (Glossy / Doff / Transparan)",
      "Decal Striping Motor & Mobil Full Color",
      "Roll Up Banner Albatros High Resolution",
      "Poster Duratrans Backlite Neon Box Mall",
      "Canvas Art Print & Wallpaper Custom Dinding"
    ],
    "bahanDiproses": [
      {
        "kategori": "Bahan Stiker & Decal",
        "daftar": [
          "Stiker Vinyl White Glossy/Matte (Ritrama/Orajet)",
          "Stiker Transparan Bening Eco-Solvent",
          "Stiker Cromo & Synthetic PP Film"
        ]
      },
      {
        "kategori": "Media Display Indoor & Backlite",
        "daftar": [
          "Albatros Matte 180-210 gsm",
          "Duratrans Backlite Film",
          "Luster / Photo Paper 260 gsm",
          "Cotton Canvas Premium"
        ]
      }
    ],
    "spesifikasi": [
      {
        "label": "Lebar Cetak Maksimal",
        "value": "64 Inci / 162.6 cm (1.6 Meter)"
      },
      {
        "label": "Teknologi Printhead",
        "value": "Epson PrecisionCore TFP Micro Piezo Printhead"
      },
      {
        "label": "Resolusi Cetak",
        "value": "Hingga 1440 × 1440 dpi (Ultra-HD Fine Art)"
      },
      {
        "label": "Kecepatan Cetak",
        "value": "Hingga 58.4 m²/jam (Mode Produksi)"
      },
      {
        "label": "Jenis & Sistem Tinta",
        "value": "Epson UltraChrome GS3 Eco-Solvent (4 Warna CMYK)"
      },
      {
        "label": "Ketahanan Cetak",
        "value": "Hingga 3 Tahun Outdoor (Tahan Sinar UV & Air)"
      }
    ],
    "contohHasilCetak": [
      {
        "judul": "Stiker Decal Motor & Mobil Striping Custom",
        "deskripsi": "Warna gradasi halus tanpa bintik (banding-free), tinta merekat kuat pada lekukan bodi kendaraan.",
        "material": "Stiker Vinyl Orajet + Laminasi Dingin",
        "badge": "Otomotif Grade"
      },
      {
        "judul": "Roll Up Banner Display Pameran Mall",
        "deskripsi": "Teks ukuran kecil tetap terbaca tajam dan gambar produk berpenampilan mewah.",
        "material": "Albatros Matte 210 gsm",
        "badge": "Eksklusif"
      },
      {
        "judul": "Poster Neon Box Restoran Duratrans",
        "deskripsi": "Pendaran warna menyala hidup dan merata saat disorot lampu neon box.",
        "material": "Backlite Duratrans Film",
        "badge": "Vibrant"
      }
    ],
    "keunggulanUtama": [
      "Teknologi PrecisionCore TFP Printhead menghasilkan detail super tajam hingga 1440 × 1440 dpi",
      "Tinta UltraChrome GS3 hemat konsumsi, cepat kering, dan ramah lingkungan tanpa bau menyengat",
      "Warna cerah dan konsisten untuk kebutuhan indoor mewah maupun daya tahan eksterior"
    ],
    "sortOrder": 1,
    "isActive": true
  },
  {
    "slug": "mesin-spanduk-5m-bluewin",
    "nama": "Bluewin KM1024i Super-Wide Outdoor 5 Meter",
    "kategori": "outdoor",
    "kategoriLabel": "Outdoor Super-Wide Format",
    "tagline": "Raksasa Cetak Spanduk & Billboard 5 Meter Utuh Tanpa Sambungan Garis Lem",
    "foto": "/mesin-2.png",
    "statusOperasional": "Aktif Beroperasi",
    "fungsiKegunaan": "Mencetak media promosi luar ruang skala super besar hingga lebar 5 meter (bahkan hingga 6.6 meter pada konfigurasi tertentu) secara utuh tanpa sambung. Menggunakan printhead industri Konica Minolta KM1024i dengan kecepatan luar biasa dan warna pekat tahan cuaca ekstrem.",
    "jenisPekerjaan": [
      "Cetak Spanduk Raksasa 5 Meter Tanpa Sambung",
      "Cetak Baliho Jalan Tol & Billboard Skala Raksasa",
      "Cetak Backdrop Panggung Spektakuler & Konser Musik",
      "Cetak Giant Banner Gedung / Building Wrap",
      "Cetak Umbul-Umbul & Spanduk Kain Event Akbar"
    ],
    "produkDihasilkan": [
      "Spanduk Flexi Seamless Lebar 4–5 Meter Utuh",
      "Billboard Reklame Jalan Tol & Perempatan Besar",
      "Backdrop Panggung Konser Musik & Konvensi",
      "Banner Fasade Gedung & Penutup Konstruksi",
      "Kain Banner & Flag Outdoor Ukuran Jumbo"
    ],
    "bahanDiproses": [
      {
        "kategori": "Flexi Super-Wide (Lebar s/d 5M)",
        "daftar": [
          "Flexi China 280 / 340 / 380 gsm",
          "Flexi Korea Seamless 440 gsm",
          "Flexi Jerman Heavy Duty 510 gsm"
        ]
      },
      {
        "kategori": "Bahan Khusus Outdoor",
        "daftar": [
          "Backlite Banner 510 gsm (Neon Box Jumbo)",
          "Vinyl Mesh Berlubang (Anti Angin)",
          "Kain TC & Satin Banner Outdoor"
        ]
      }
    ],
    "spesifikasi": [
      {
        "label": "Lebar Cetak Maksimal",
        "value": "5 Meter Tanpa Sambung (Dukungan Media s/d 6.6M)"
      },
      {
        "label": "Teknologi Printhead",
        "value": "Konica Minolta KM1024i Industrial High-Speed"
      },
      {
        "label": "Ukuran Tetesan Tinta",
        "value": "30 Picoliter (30PL Drop Size - Warna CMYK Ekstra Pekat)"
      },
      {
        "label": "Kecepatan Produksi",
        "value": "Kecepatan Tinggi Kapasitas Industri (High Volume)"
      },
      {
        "label": "Sistem Tinta",
        "value": "Heavy Duty Outdoor Solvent Ink Anti UV & Badai"
      },
      {
        "label": "Ketahanan Cuaca",
        "value": "1 – 2 Tahun Tahan Panas Tropis & Hujan Lebat"
      }
    ],
    "contohHasilCetak": [
      {
        "judul": "Backdrop Konser Musik Utama 15 × 5 Meter",
        "deskripsi": "Dicetak bentang utuh tinggi 5 meter tanpa garis lem sambungan, panggung terlihat megah dan kokoh.",
        "material": "Flexi Korea 440 gsm Seamless",
        "badge": "Super Jumbo"
      },
      {
        "judul": "Billboard Reklame Simpang Jalan Protokol",
        "deskripsi": "Kontras warna CMYK sangat solid dan pekat, tetap kontras terlihat dari jarak ratusan meter.",
        "material": "Flexi Jerman 510 gsm",
        "badge": "Heavy Duty"
      },
      {
        "judul": "Giant Banner Promosi Fasade Gedung Mall",
        "deskripsi": "Menutup dinding fasade gedung dengan gambar utuh beresolusi tinggi.",
        "material": "Flexi China 340 gsm",
        "badge": "Mega Display"
      }
    ],
    "keunggulanUtama": [
      "Cetak lebar hingga 5 meter utuh tanpa sambungan lem, hasil jauh lebih rapi dan kuat diterpa angin",
      "Printhead Konica Minolta KM1024i 30PL menghasilkan saturasi warna CMYK pekat dan solid",
      "Kapasitas cetak berkecepatan tinggi siap menyelesaikan ratusan hingga ribuan meter dalam waktu singkat"
    ],
    "sortOrder": 2,
    "isActive": true
  },
  {
    "slug": "mesin-cutting-cnc-sign",
    "nama": "SIGN CNC A21325 Precision CNC Router",
    "kategori": "cutting",
    "kategoriLabel": "CNC Router & 3D Engraving",
    "tagline": "Potong, Ukir, dan Bentuk Akrilik, Kayu, MDF, PVC & Aluminium Presisi Komputer",
    "foto": "/mesin-3.png",
    "statusOperasional": "Aktif Beroperasi",
    "fungsiKegunaan": "Memotong (cutting), mengukir (engraving), dan membentuk (routing) berbagai material padat/keras berukuran besar dengan tingkat presisi tinggi berbasis instruksi komputer (CNC), sangat ideal untuk kebutuhan huruf timbul, signage, neon box, fasade, dan ornamen dekoratif.",
    "jenisPekerjaan": [
      "Pemotongan Akrilik Huruf Timbul & Signage 3D",
      "Cutting & Ukir Lembaran ACP (Aluminium Composite Panel)",
      "Ukiran Panel Dinding & Ornamen Partisi MDF / Kayu",
      "Pembuatan Rangka Huruf Neon Flex & Letter Box",
      "Pemotongan Papan PVC Foam Board Display"
    ],
    "produkDihasilkan": [
      "Huruf Timbul Akrilik LED & Stainless/Galvanis",
      "Papan Nama Kantor, Plang Toko & Signage Gedung",
      "Ornamen Dinding Partisi / Grille Kayu & MDF Laser-Look",
      "Logo 3D Resepsionis & Wall Art Akrilik",
      "Aluminium Composite Panel (ACP) Perforated Fasade"
    ],
    "bahanDiproses": [
      {
        "kategori": "Material Padat & Plastik",
        "daftar": [
          "Akrilik Bening & Warna (2 mm – 20 mm)",
          "PVC Foam Board (3 mm – 18 mm)"
        ]
      },
      {
        "kategori": "Kayu & Rekayasa Kayu",
        "daftar": [
          "MDF Board (3 mm – 18 mm)",
          "Plywood / Multiplek / Triplek",
          "Kayu Solid / Kayu Jati Belanda"
        ]
      },
      {
        "kategori": "Logam Ringan & Komposit",
        "daftar": [
          "Aluminium Composite Panel (ACP)",
          "Plat Aluminium Ringan"
        ]
      }
    ],
    "spesifikasi": [
      {
        "label": "Area Kerja Maksimal",
        "value": "1300 × 2500 mm (1.3 × 2.5 Meter - Lembaran Standar)"
      },
      {
        "label": "Sistem Kontrol",
        "value": "Computer Numerical Control (CNC) Multi-Axis Otomatis"
      },
      {
        "label": "Spindle Power & Speed",
        "value": "High-Power Spindle Water/Air Cooled hingga 24.000 RPM"
      },
      {
        "label": "Toleransi & Presisi",
        "value": "Akurasi Pengulangan ±0.05 mm (Sangat Presisi)"
      },
      {
        "label": "Kedalaman Potong",
        "value": "Mampu memotong material ketebalan hingga puluhan milimeter"
      },
      {
        "label": "Kompatibilitas File",
        "value": "Support File CAD/CAM: DXF, AI, EPS, PLT, NC Code"
      }
    ],
    "contohHasilCetak": [
      {
        "judul": "Huruf Timbul Akrilik LED Toko Kopi",
        "deskripsi": "Pinggiran potongan akrilik bening mengkilap rata tanpa retak rambut, presisi dengan penutup belakang.",
        "material": "Akrilik 3 mm + 5 mm",
        "badge": "Signage"
      },
      {
        "judul": "Panel Fasade Ornamen Motif Islami ACP",
        "deskripsi": "Pola ukir kerawang rumit terpotong bersih pada lembaran ACP 1.2 × 2.4 meter.",
        "material": "Aluminium Composite Panel 4 mm",
        "badge": "Arsitektural"
      },
      {
        "judul": "Plang Papan Nama Ruangan Kayu & Akrilik",
        "deskripsi": "Kombinasi gravir kayu timbul dengan lapisan akrilik glossy yang elegan.",
        "material": "MDF & Akrilik Bening",
        "badge": "Interior"
      }
    ],
    "keunggulanUtama": [
      "Area kerja luas 1300 × 2500 mm mampu menampung satu lembar penuh triplek, akrilik, dan ACP",
      "Pemotongan otomatis terkontrol komputer menjamin lekukan rumit konsisten dan rapi",
      "Daya potong kuat untuk beragam material mulai dari akrilik, PVC, kayu, MDF hingga aluminium"
    ],
    "sortOrder": 3,
    "isActive": true
  },
  {
    "slug": "mesin-laser-press-xerox-c60",
    "nama": "Fuji Xerox Color C60 Production Press A3+",
    "kategori": "laser",
    "kategoriLabel": "Digital Press Laser A3+",
    "tagline": "Cetak Brosur, Kartu Nama, Stiker & Dokumen Komersial A3+ Berkecepatan Tinggi",
    "foto": "/mesin-4.png",
    "statusOperasional": "Aktif Beroperasi",
    "fungsiKegunaan": "Mesin digital printing produksi laser multifungsi kelas industri yang mampu menghasilkan cetakan full-color beresolusi super tinggi dengan warna tajam, detail presisi, akurasi registrasi bolak-balik otomatis, dan dukungan kertas tebal hingga 300 gsm.",
    "jenisPekerjaan": [
      "Cetak Brosur, Flyer & Leaflet Promosi",
      "Cetak Lembaran Stiker Label Kemasan A3+",
      "Cetak Kartu Nama Bisnis, ID Card & Hangtag",
      "Cetak Buku Menu Cafe, Kalender Meja & Katalog",
      "Cetak Sertifikat, Piagam Penghargaan & Undangan"
    ],
    "produkDihasilkan": [
      "Brosur Art Paper Full Color Lipat 2 & Lipat 3",
      "Lembaran Stiker Chromo, Vinyl & Transparan A3+",
      "Kartu Nama Tebal Laminasi Doff / Glossy",
      "Buku Menu Restoran & Katalog Produk Perusahaan",
      "Sertifikat Kertas Fancy (Linen, Jasmine, Concorde)"
    ],
    "bahanDiproses": [
      {
        "kategori": "Kertas Percetakan & Karton",
        "daftar": [
          "Art Paper 120 / 150 gsm",
          "Art Carton 210 / 230 / 260 / 300 gsm",
          "Matte Paper 150 gsm",
          "HVS Paper 70 / 80 / 100 gsm"
        ]
      },
      {
        "kategori": "Kertas Fancy & Tekstur",
        "daftar": [
          "Kertas Linen Jepang",
          "Jasmine Glitter",
          "Concorde Bertekstur",
          "Brief Card (BC)"
        ]
      },
      {
        "kategori": "Stiker Lembaran A3+",
        "daftar": [
          "Stiker Cromo Glossy A3+",
          "Stiker Vinyl Putih Laser A3+",
          "Stiker Transparan Laser A3+"
        ]
      }
    ],
    "spesifikasi": [
      {
        "label": "Ukuran Cetak Maksimal",
        "value": "SRA3 (320 × 450 mm) & Banner Sheet hingga 330 × 660 mm"
      },
      {
        "label": "Resolusi Cetak",
        "value": "2400 × 2400 dpi VCSEL Laser Ultra HD"
      },
      {
        "label": "Kecepatan Cetak",
        "value": "60 Halaman per Menit (Full Color Produksi Cepat)"
      },
      {
        "label": "Dukungan Ketebalan Media",
        "value": "60 gsm hingga 300 gsm (Kertas Tipis s/d Karton Tebal)"
      },
      {
        "label": "Fitur Duplex",
        "value": "Cetak Bolak-Balik Otomatis Presisi Tinggi"
      },
      {
        "label": "Teknologi Toner",
        "value": "EA Low-Melt Eco Toner (Kilap Halus Seragam)"
      }
    ],
    "contohHasilCetak": [
      {
        "judul": "Brosur Promosi Kuliner Lipat 3 Art Paper",
        "deskripsi": "Warna makanan terlihat segar mengkilap dengan teks promosi ukuran kecil terbaca jernih.",
        "material": "Art Paper 150 gsm Full Color 2 Sisi",
        "badge": "Best Seller"
      },
      {
        "judul": "Kartu Nama Premium Eksekutif 2 Sisi",
        "deskripsi": "Registrasi depan dan belakang presisi lurus, dilapisi laminasi doff halus berkesan mewah.",
        "material": "Art Carton 260 gsm + Doff",
        "badge": "Favorit"
      },
      {
        "judul": "Sertifikat Wisuda & Piagam Penghargaan",
        "deskripsi": "Tekstur glitter mutiara kertas jasmine berpadu dengan ketajaman logo emas dan tanda tangan.",
        "material": "Kertas Jasmine 220 gsm",
        "badge": "Formal"
      }
    ],
    "keunggulanUtama": [
      "Resolusi 2400 × 2400 dpi memberikan ketajaman teks mikro dan gradasi warna yang sangat halus",
      "Kecepatan 60 ppm memungkinkan cetak ratusan buku atau ribuan brosur tuntas dalam hitungan jam",
      "Mendukung kertas tebal hingga 300 gsm dan fitur cetak bolak-balik (duplex) otomatis"
    ],
    "sortOrder": 4,
    "isActive": true
  },
  {
    "slug": "mesin-spanduk-3m-bluewin",
    "nama": "Bluewin 512i High-Speed Outdoor 3.2M",
    "kategori": "outdoor",
    "kategoriLabel": "Outdoor Large Format",
    "tagline": "Mesin Cetak Spanduk Cepat Berkecepatan 130 m²/jam dengan Pemanas Infrared",
    "foto": "/mesin-5.png",
    "statusOperasional": "Aktif Beroperasi",
    "fungsiKegunaan": "Mencetak media promosi luar ruang berformat besar hingga lebar 3.2 meter dengan teknologi printhead Konica Minolta KM512i 30PL, dilengkapi sistem pemanas inframerah cerdas untuk pengeringan instan serta hasil cetak warna pekat tahan lama.",
    "jenisPekerjaan": [
      "Cetak Spanduk Toko, Warung, & Banner UMKM Kilat",
      "Cetak Baliho Jalan Raya & Umbul-Umbul Perumahan",
      "Cetak Backdrop Acara Sekolah, Wisuda & Kampanye",
      "Cetak X-Banner & Y-Banner Outdoor",
      "Cetak Spanduk Kain & Mesh Pagar Proyek"
    ],
    "produkDihasilkan": [
      "Spanduk Flexi Frontlite Standar & Tebal",
      "Baliho & Reklame Promosi Event Luar Ruang",
      "Backdrop Panggung Acara Semi-Outdoor",
      "Banner Jaring (Mesh Banner) Penutup Gedung",
      "Spanduk Kain Sablon Digital TC"
    ],
    "bahanDiproses": [
      {
        "kategori": "Flexi Banner",
        "daftar": [
          "Flexi China 280 gsm",
          "Flexi China 340 gsm",
          "Flexi Korea 440 gsm"
        ]
      },
      {
        "kategori": "Media Khusus Outdoor",
        "daftar": [
          "Flexi Jerman 510 gsm",
          "Sticker Vinyl Outdoor",
          "Mesh Banner Berlubang",
          "Kain TC Spanduk"
        ]
      }
    ],
    "spesifikasi": [
      {
        "label": "Lebar Cetak Maksimal",
        "value": "3.2 Meter (Panjang Roll Bebas)"
      },
      {
        "label": "Teknologi Printhead",
        "value": "Konica Minolta KM512i (Konfigurasi 4 Printhead)"
      },
      {
        "label": "Ukuran Tetesan Tinta",
        "value": "30 Picoliter (30PL Drop Size - Tinta Solvent Pekat)"
      },
      {
        "label": "Kecepatan Produksi",
        "value": "Hingga 130 m² per jam (Kapasitas Produksi Super Cepat)"
      },
      {
        "label": "Sistem Pengeringan",
        "value": "Pemanas Cerdas Infrared (IR Heater) & Kipas Pendingin"
      },
      {
        "label": "Ketahanan Luar Ruang",
        "value": "6 – 12 Bulan Tahan Terik Panas & Guyuran Hujan"
      }
    ],
    "contohHasilCetak": [
      {
        "judul": "Spanduk Warung Kuliner Cepat Saji 3 × 1 Meter",
        "deskripsi": "Warna merah dan kuning menyala tajam dan terbaca jelas oleh pengendara jalan raya.",
        "material": "Flexi China 280 gsm",
        "badge": "Kilat 1 Jam"
      },
      {
        "judul": "Backdrop Rapat Kerja & Seminar 6 × 3 Meter",
        "deskripsi": "Dicetak 2 lembar dengan sambungan rapi atau langsung naik cetak hitungan menit.",
        "material": "Flexi Korea 440 gsm",
        "badge": "Rekomendasi"
      },
      {
        "judul": "Banner Promosi Perumahan & Ruko",
        "deskripsi": "Warna tidak luntur diterpa hujan dan panas terik berbulan-bulan.",
        "material": "Flexi China 340 gsm",
        "badge": "Tahan Cuaca"
      }
    ],
    "keunggulanUtama": [
      "Kecepatan cetak spektakuler mencapai 130 m²/jam berkat konfigurasi 4 head KM512i",
      "Sistem pemanas inframerah mempercepat proses kering, banner bisa langsung dilipat dan dipasang",
      "Semburan tetesan tinta 30PL menjamin warna solid dan pekat untuk keterbacaan jarak jauh"
    ],
    "sortOrder": 5,
    "isActive": true
  },
  {
    "slug": "mesin-laminasi-fayon-fy1600d",
    "nama": "Fayon FY1600D Hot & Cold Roll Laminator 1600",
    "kategori": "finishing",
    "kategoriLabel": "Finishing & Pelindung Cetak",
    "tagline": "Laminasi Panas & Dingin Lebar 1.6M Rol Silikon Merata Bebas Gelembung",
    "foto": "/mesin-6.png",
    "statusOperasional": "Aktif Beroperasi",
    "fungsiKegunaan": "Melapisi dan melindungi permukaan media cetak (stiker, banner, poster, foto) dengan lapisan film laminasi panas (hot) maupun dingin (cold) bertekanan rol silikon presisi untuk mencegah goresan, air, minyak, serta sinar UV tanpa risiko kerutan dan gelembung udara.",
    "jenisPekerjaan": [
      "Laminasi Dingin Stiker Vinyl & Decal Kendaraan",
      "Laminasi Panas Foto Kanvas, Kartu Nama & Cover Buku",
      "Laminasi Poster Dinding Display & Pameran Mall",
      "Laminasi Pelindung Menu Restoran Tahan Noda",
      "Mounting & Tempel Stiker ke Papan Foam Board / Impraboard"
    ],
    "produkDihasilkan": [
      "Stiker Laminasi Glossy Berkilau Efek Wet-Look",
      "Stiker & Poster Laminasi Doff Elegan Anti Silau",
      "Stiker Lantai (Floor Graphic) Tekstur Kasar Anti Selip",
      "Papan Display Promosi Beralas Foamboard",
      "Cover Buku & Menu Cafe Tahan Air & Minyak"
    ],
    "bahanDiproses": [
      {
        "kategori": "Laminasi Dingin (Cold Film)",
        "daftar": [
          "Laminasi Cold Clear Glossy",
          "Laminasi Cold Doff / Matte",
          "Laminasi Floor Graphic Kasar",
          "Laminasi 3D Sandblast"
        ]
      },
      {
        "kategori": "Laminasi Panas (Thermal Film)",
        "daftar": [
          "Thermal BOPP Glossy Film",
          "Thermal BOPP Doff Velvet / Soft Touch"
        ]
      }
    ],
    "spesifikasi": [
      {
        "label": "Lebar Laminasi Maksimal",
        "value": "1600 mm (1.6 Meter)"
      },
      {
        "label": "Metode Laminasi",
        "value": "Dual Mode: Hot Lamination & Cold Lamination"
      },
      {
        "label": "Pengaturan Suhu Roller",
        "value": "Dapat diatur hingga 60°C (Kontrol Termostatik Stabil)"
      },
      {
        "label": "Material Roller",
        "value": "Roller Silikon Elastis Anti Lengket Tekanan Merata"
      },
      {
        "label": "Kecepatan Proses",
        "value": "Hingga 10–12 meter per menit (Efisien)"
      },
      {
        "label": "Kualitas Hasil",
        "value": "Zero Bubble & Anti Kerut (Tekanan Pneumatik Presisi)"
      }
    ],
    "contohHasilCetak": [
      {
        "judul": "Lapisan Glossy Stiker Mobil & Decal Motor",
        "deskripsi": "Warna stiker menjadi lebih kontras berkilau dan tahan terhadap baret cuci steam maupun paparan panas knalpot.",
        "material": "Cold Film Glossy Premium",
        "badge": "Otomotif Grade"
      },
      {
        "judul": "Poster Pameran Seni Matte Doff",
        "deskripsi": "Memberikan kesan mewah, bebas dari pantulan kilau lampu sorot pameran.",
        "material": "Cold Film Doff Matte",
        "badge": "Seni Display"
      },
      {
        "judul": "Menu Cafe Anti Noda Minyak",
        "deskripsi": "Bisa dilap basah setiap hari tanpa merembes ke lapisan kertas di dalamnya.",
        "material": "Thermal Film Glossy",
        "badge": "Awet Bertahun-tahun"
      }
    ],
    "keunggulanUtama": [
      "Fleksibilitas laminasi dingin dan panas dengan pengaturan suhu digital presisi hingga 60°C",
      "Roller silikon kualitas tinggi menghasilkan tekanan merata sempurna, bebas gelembung dan kerutan",
      "Mendukung media format besar hingga lebar 1600 mm untuk kebutuhan stiker, poster, dan banner"
    ],
    "sortOrder": 6,
    "isActive": true
  },
  {
    "slug": "mesin-cutting-graphtec-ce6000",
    "nama": "Graphtec CE6000-120 Professional Cutting Plotter 120cm",
    "kategori": "cutting",
    "kategoriLabel": "Contour Cutting Plotter 120cm",
    "tagline": "Pemotong Kontur Stiker Meteran Presisi Tinggi dengan Sensor ARMS Registrasi Akurat",
    "foto": "/mesin-7.png",
    "statusOperasional": "Aktif Beroperasi",
    "fungsiKegunaan": "Memotong bahan stiker vinyl, cutting film, dan polyflex secara presisi mengikuti kontur pola desain digital. Dilengkapi sensor optik canggih ARMS (Advanced Registration Mark Sensor) yang membaca tanda registrasi hasil cetak untuk pemotongan stiker meteran yang akurat dan konsisten.",
    "jenisPekerjaan": [
      "Cutting Stiker Meteran Branding Kaca Toko & Kantor",
      "Contour Cut Kiss-Cut Stiker Label Kemasan Roll / Lembar",
      "Cutting Die-Cut Potong Putus Stiker Merchandise",
      "Cutting Striping Mobil, Motor & Branding Armada Mobil",
      "Cutting Polyflex Sablon Kaos Satuan & Jersey Olahraga"
    ],
    "produkDihasilkan": [
      "Stiker Kaca Sandblast Lettering Logo Toko",
      "Stiker Label Produk Toples & Botol Roll-to-Roll",
      "Cutting Stiker Huruf & Angka Vinyl Warna-Warni (Oracal)",
      "Decal Otomotif Presisi Siap Tempel Masking Tape",
      "Polyflex Sablon Nama & Nomor Punggung Jersey"
    ],
    "bahanDiproses": [
      {
        "kategori": "Bahan Stiker Cetak & Kemasan",
        "daftar": [
          "Stiker Vinyl Cetak Eco-Solvent",
          "Stiker Chromo & Sintetis",
          "Stiker Transparan"
        ]
      },
      {
        "kategori": "Bahan Vinyl Warna & Khusus",
        "daftar": [
          "Stiker Oracal 651 Glossy/Matte (All Colors)",
          "Stiker Kaca Es / Sandblast",
          "Stiker Scotlite / Reflektif Mantul Cahaya",
          "Bahan Polyflex PU/PVC Sablon Kaos"
        ]
      }
    ],
    "spesifikasi": [
      {
        "label": "Lebar Area Potong",
        "value": "Hingga 120 cm / 1200 mm (Dukungan Media Roll Meteran)"
      },
      {
        "label": "Teknologi Sensor Registrasi",
        "value": "ARMS (Advanced Registration Mark Sensor) Otomatis"
      },
      {
        "label": "Kecepatan Pemotongan",
        "value": "Hingga 1000 mm per detik (Sangat Cepat & Gesit)"
      },
      {
        "label": "Tekanan Pisau (Cutting Force)",
        "value": "Hingga 450 gf (Mampu memotong vinyl tebal & reflektif)"
      },
      {
        "label": "Akurasi & Presisi",
        "value": "Akurasi Pengulangan 0.1 mm (Lekukan Tajam Sangat Rapi)"
      },
      {
        "label": "Mode Pemotongan",
        "value": "Kiss-Cut (Setengah Putus) & Perforated Cut (Potong Tembus)"
      }
    ],
    "contohHasilCetak": [
      {
        "judul": "Cutting Stiker Oracal Jam Operasional Kaca Toko",
        "deskripsi": "Huruf berukuran kecil 1 cm terpotong sangat tajam dan mudah dikelupas tanpa patah.",
        "material": "Vinyl Oracal 651 Intermediate",
        "badge": "Presisi Tinggi"
      },
      {
        "judul": "Stiker Label Kemasan Makanan Meteran Kiss-Cut",
        "deskripsi": "Pola lingkaran ribuan stiker terpotong presisi pada posisinya berkat sensor registrasi ARMS.",
        "material": "Stiker Vinyl Putih Glossy",
        "badge": "Produksi Massal"
      },
      {
        "judul": "Cutting Polyflex Jersey Komunitas Olahraga",
        "deskripsi": "Nomor punggung dan nama pemain bergaris tegas, siap di-press panas pada jersey dryfit.",
        "material": "Polyflex PU Korea",
        "badge": "Sablon Kaos"
      }
    ],
    "keunggulanUtama": [
      "Area potong lebar 120 cm memungkinkan pemrosesan stiker gulungan meteran skala besar",
      "Sensor ARMS otomatis mengkompensasi distorsi media cetak sehingga contour cut tidak pernah melenceng",
      "Motor penggerak presisi tinggi mampu memotong teks dan lekukan desain berukuran detail dengan kecepatan tinggi"
    ],
    "sortOrder": 7,
    "isActive": true
  },
  {
    "slug": "mesin-seaming-sun-fr800",
    "nama": "SUN FR-800 Continuous Seamer & Band Sealer",
    "kategori": "finishing",
    "kategoriLabel": "Finishing & Sambungan Banner",
    "tagline": "Penyambung Spanduk & Penyegel Kemasan Otomatis Suhu 300°C Tanpa Lem",
    "foto": "/mesin-8.png",
    "statusOperasional": "Aktif Beroperasi",
    "fungsiKegunaan": "Menyambung (seaming) tepian bahan spanduk/flexi, membuat lipatan keliling (finishing kolong selongsong), serta menyegel kemasan plastik dan aluminium foil secara terus menerus (continuous) menggunakan pemanas suhu tinggi terkontrol tanpa perlu lem manual, menghasilkan sambungan ekstra kuat, tahan tarik angin, dan rapi.",
    "jenisPekerjaan": [
      "Penyambungan Tepian Banner & Spanduk Ukuran Besar",
      "Finishing Keliling Lipat Pinggir & Kolong Selongsong Spanduk",
      "Penyegelan Kemasan Plastik & Kemasan Standing Pouch Foil",
      "Pencetakan Kode Produksi & Expired Date pada Segel",
      "Penyatuan Kantong Kemasan Polymailer & Bungkus Pengiriman"
    ],
    "produkDihasilkan": [
      "Lipatan Keliling Spanduk Flexi Kuat Anti Robek",
      "Selongsong Kolong Bambu/Pipa Atas Bawah Spanduk",
      "Sambungan Rapi Banner Melebihi Lebar Standar Mesin",
      "Segel Kemasan Makanan Ringan / Frozen Food Rapat Kedap Udara",
      "Kemasan Paket Pengiriman Rapi & Tersegel Kuat"
    ],
    "bahanDiproses": [
      {
        "kategori": "Bahan Banner & Reklame",
        "daftar": [
          "Flexi China 280 / 340 gsm",
          "Flexi Korea 440 gsm",
          "Flexi Jerman 510 gsm",
          "Bahan Terpal & PVC Sheet"
        ]
      },
      {
        "kategori": "Bahan Kemasan & Plastik",
        "daftar": [
          "Plastik PE / PP / PVC",
          "Aluminium Foil Standing Pouch",
          "Kemasan Kertas Laminasi Plastik",
          "Bahan Polymailer"
        ]
      }
    ],
    "spesifikasi": [
      {
        "label": "Sistem Operasional",
        "value": "Continuous Band Sealing & Thermal Heat Welding"
      },
      {
        "label": "Pengaturan Suhu",
        "value": "Dapat disetel hingga 300°C (Kontrol Suhu Termostatik Digital)"
      },
      {
        "label": "Kecepatan Penyegelan",
        "value": "Hingga 12 Meter per Menit (Sangat Cepat & Kontinu)"
      },
      {
        "label": "Lebar Garis Segel",
        "value": "6 – 12 mm Garis Pemanas Solid Kuat"
      },
      {
        "label": "Fitur Tambahan",
        "value": "Embossing Roda Cetak Kode Produksi & Tanggal Kedaluwarsa"
      },
      {
        "label": "Metode Pengelasan",
        "value": "Direct Heat Contact (Kuat Tanpa Perlu Lem Tambahan)"
      }
    ],
    "contohHasilCetak": [
      {
        "judul": "Finishing Selongsong Kolong Spanduk Pilkada / Event",
        "deskripsi": "Perekatan lipatan keliling banner untuk disusupi bambu/pipa, tidak mudah robek saat ditiup angin badai.",
        "material": "Flexi China 280 gsm",
        "badge": "Kuat Anti Robek"
      },
      {
        "judul": "Sambungan Banner Lebar Skala Billboard",
        "deskripsi": "Dua lembar banner disambung menyatu rapat dengan garis sambungan yang lurus dan rapi.",
        "material": "Flexi Korea 440 gsm",
        "badge": "Seaming Rapi"
      },
      {
        "judul": "Segel Kemasan Plastik Keripik UMKM",
        "deskripsi": "Penyegelan kedap udara menjamin produk makanan renyah tahan lama, lengkap dengan cap expired date.",
        "material": "Aluminium Foil Stand Pouch",
        "badge": "Kemasan Rapat"
      }
    ],
    "keunggulanUtama": [
      "Perekatan termal otomatis tanpa lem menjamin sambungan spanduk jauh lebih kuat dan tidak mudah lepas diterpa angin",
      "Kecepatan penyegelan hingga 12 meter per menit meningkatkan kapasitas produksi finishing secara signifikan",
      "Rentang suhu hingga 300°C fleksibel untuk menyegel bahan flexi tebal hingga berbagai macam kemasan foil"
    ],
    "sortOrder": 8,
    "isActive": true
  }
];

export const DEFAULT_PRICE_ITEMS: DefaultPriceItem[] = [
  {
    "name": "Stiker A3+ Bontak (Chromo)",
    "category": "Stiker",
    "unit": "lembar",
    "price": 4600,
    "isActive": true,
    "sortOrder": 10,
    "imageUrl": "/landing-stiker.jpg"
  },
  {
    "name": "Stiker A3+ Bontak + Cutting (Kiss Cut)",
    "category": "Stiker",
    "unit": "lembar",
    "price": 13000,
    "isActive": true,
    "sortOrder": 11,
    "imageUrl": "/landing-stiker.jpg"
  },
  {
    "name": "Stiker A3+ Vinyl Waterproof",
    "category": "Stiker",
    "unit": "lembar",
    "price": 6000,
    "isActive": true,
    "sortOrder": 12,
    "imageUrl": "/landing-stiker.jpg"
  },
  {
    "name": "Stiker A3+ Vinyl + Cutting (Kiss Cut)",
    "category": "Stiker",
    "unit": "lembar",
    "price": 14000,
    "isActive": true,
    "sortOrder": 13,
    "imageUrl": "/landing-stiker.jpg"
  },
  {
    "name": "Stiker Vinyl Meteran (Camel)",
    "category": "Stiker",
    "unit": "meter",
    "price": 55000,
    "isActive": true,
    "sortOrder": 14,
    "imageUrl": "/landing-stiker.jpg"
  },
  {
    "name": "Stiker Vinyl Meteran (Ritrama)",
    "category": "Stiker",
    "unit": "meter",
    "price": 65000,
    "isActive": true,
    "sortOrder": 15,
    "imageUrl": "/landing-stiker.jpg"
  },
  {
    "name": "Stiker Vinyl Meteran (Oneway Vision)",
    "category": "Stiker",
    "unit": "meter",
    "price": 65000,
    "isActive": true,
    "sortOrder": 16,
    "imageUrl": "/landing-stiker.jpg"
  },
  {
    "name": "Stiker Vinyl Meteran (Transparan)",
    "category": "Stiker",
    "unit": "meter",
    "price": 75000,
    "isActive": true,
    "sortOrder": 17,
    "imageUrl": "/landing-stiker.jpg"
  },
  {
    "name": "Stiker Vinyl Meteran (Blackout)",
    "category": "Stiker",
    "unit": "meter",
    "price": 80000,
    "isActive": true,
    "sortOrder": 18,
    "imageUrl": "/landing-stiker.jpg"
  },
  {
    "name": "Laminasi Doff / Glossy A3+",
    "category": "Stiker",
    "unit": "lembar",
    "price": 4000,
    "isActive": true,
    "sortOrder": 19,
    "imageUrl": "/mesin-laminasi.jpg"
  },
  {
    "name": "Laminasi Meteran Doff / Glossy",
    "category": "Stiker",
    "unit": "meter",
    "price": 25000,
    "isActive": true,
    "sortOrder": 20,
    "imageUrl": "/mesin-laminasi.jpg"
  },
  {
    "name": "Jasa Cutting Meteran (Plotter Contour)",
    "category": "Stiker",
    "unit": "meter",
    "price": 25000,
    "isActive": true,
    "sortOrder": 21,
    "imageUrl": "/mesin-cutting.jpg"
  },
  {
    "name": "HVS 100gr A3+",
    "category": "Digital Print",
    "unit": "lembar",
    "price": 3100,
    "isActive": true,
    "sortOrder": 30,
    "imageUrl": "/landing-offset.jpg"
  },
  {
    "name": "Art Paper 150gr A3+",
    "category": "Digital Print",
    "unit": "lembar",
    "price": 3600,
    "isActive": true,
    "sortOrder": 31,
    "imageUrl": "/landing-offset.jpg"
  },
  {
    "name": "Art Carton 210gr A3+",
    "category": "Digital Print",
    "unit": "lembar",
    "price": 3700,
    "isActive": true,
    "sortOrder": 32,
    "imageUrl": "/landing-offset.jpg"
  },
  {
    "name": "Art Carton 230gr A3+",
    "category": "Digital Print",
    "unit": "lembar",
    "price": 3800,
    "isActive": true,
    "sortOrder": 33,
    "imageUrl": "/landing-offset.jpg"
  },
  {
    "name": "Art Carton 260gr A3+",
    "category": "Digital Print",
    "unit": "lembar",
    "price": 3900,
    "isActive": true,
    "sortOrder": 34,
    "imageUrl": "/landing-offset.jpg"
  },
  {
    "name": "Albatros 200gr Matte",
    "category": "Digital Print",
    "unit": "meter",
    "price": 62000,
    "isActive": true,
    "sortOrder": 35,
    "imageUrl": "/landing-hero.jpg"
  },
  {
    "name": "X Banner 60x160cm Flexi China 280gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 43000,
    "isActive": true,
    "sortOrder": 40,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "X Banner 60x160cm Flexi Korchin 380gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 48000,
    "isActive": true,
    "sortOrder": 41,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "X Banner 60x160cm Flexi Korea 440gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 53000,
    "isActive": true,
    "sortOrder": 42,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "X Banner 60x160cm Albatros 200gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 80000,
    "isActive": true,
    "sortOrder": 43,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Y Banner 80x180cm Flexi China 280gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 65000,
    "isActive": true,
    "sortOrder": 44,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Y Banner 80x180cm Flexi Korchin 380gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 75000,
    "isActive": true,
    "sortOrder": 45,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Y Banner 80x180cm Flexi Korea 440gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 79000,
    "isActive": true,
    "sortOrder": 46,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Y Banner 80x180cm Albatros 200gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 125000,
    "isActive": true,
    "sortOrder": 47,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Roll Banner 60x160cm Flexi China 280gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 160000,
    "isActive": true,
    "sortOrder": 48,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Roll Banner 60x160cm Flexi Korchin 380gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 180000,
    "isActive": true,
    "sortOrder": 49,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Roll Banner 60x160cm Flexi Korea 440gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 185000,
    "isActive": true,
    "sortOrder": 50,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Roll Banner 60x160cm Albatros 200gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 190000,
    "isActive": true,
    "sortOrder": 51,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Roll Banner 85x200cm Flexi China 280gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 200000,
    "isActive": true,
    "sortOrder": 52,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Roll Banner 85x200cm Flexi Korchin 380gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 205000,
    "isActive": true,
    "sortOrder": 53,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Roll Banner 85x200cm Flexi Korea 440gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 210000,
    "isActive": true,
    "sortOrder": 54,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Roll Banner 85x200cm Albatros 200gr",
    "category": "Media Promosi",
    "unit": "set",
    "price": 265000,
    "isActive": true,
    "sortOrder": 55,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Tripod Banner A3",
    "category": "Media Promosi",
    "unit": "set",
    "price": 125000,
    "isActive": true,
    "sortOrder": 56,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Tripod Banner A2",
    "category": "Media Promosi",
    "unit": "set",
    "price": 145000,
    "isActive": true,
    "sortOrder": 57,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Tripod Banner A1",
    "category": "Media Promosi",
    "unit": "set",
    "price": 180000,
    "isActive": true,
    "sortOrder": 58,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Tripod Banner A0",
    "category": "Media Promosi",
    "unit": "set",
    "price": 280000,
    "isActive": true,
    "sortOrder": 59,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Mockup Polyfoam A3",
    "category": "Media Promosi",
    "unit": "pcs",
    "price": 25000,
    "isActive": true,
    "sortOrder": 60,
    "imageUrl": "/landing-hero.jpg"
  },
  {
    "name": "Mockup Polyfoam A2",
    "category": "Media Promosi",
    "unit": "pcs",
    "price": 45000,
    "isActive": true,
    "sortOrder": 61,
    "imageUrl": "/landing-hero.jpg"
  },
  {
    "name": "Mockup Polyfoam A1",
    "category": "Media Promosi",
    "unit": "pcs",
    "price": 80000,
    "isActive": true,
    "sortOrder": 62,
    "imageUrl": "/landing-hero.jpg"
  },
  {
    "name": "Mockup Polyfoam A0",
    "category": "Media Promosi",
    "unit": "pcs",
    "price": 180000,
    "isActive": true,
    "sortOrder": 63,
    "imageUrl": "/landing-hero.jpg"
  },
  {
    "name": "Event Desk Portable",
    "category": "Media Promosi",
    "unit": "pcs",
    "price": 1100000,
    "isActive": true,
    "sortOrder": 64,
    "imageUrl": "/banner-avatar.png"
  },
  {
    "name": "Pin Peniti 45mm",
    "category": "Merchandise",
    "unit": "pcs",
    "price": 5000,
    "isActive": true,
    "sortOrder": 70,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Pin Peniti 58mm",
    "category": "Merchandise",
    "unit": "pcs",
    "price": 6000,
    "isActive": true,
    "sortOrder": 71,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Gantungan Kunci 45mm",
    "category": "Merchandise",
    "unit": "pcs",
    "price": 7500,
    "isActive": true,
    "sortOrder": 72,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Gantungan Kunci 58mm",
    "category": "Merchandise",
    "unit": "pcs",
    "price": 8000,
    "isActive": true,
    "sortOrder": 73,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Kipas Kertas Promosi",
    "category": "Merchandise",
    "unit": "pcs",
    "price": 7000,
    "isActive": true,
    "sortOrder": 74,
    "imageUrl": "/landing-offset.jpg"
  },
  {
    "name": "Mug Putih Keramik Custom",
    "category": "Merchandise",
    "unit": "pcs",
    "price": 28500,
    "isActive": true,
    "sortOrder": 75,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Kartu Nama Bisnis (1 Box = 100 pcs)",
    "category": "Stationery",
    "unit": "box",
    "price": 25000,
    "isActive": true,
    "sortOrder": 80,
    "imageUrl": "/landing-offset.jpg"
  },
  {
    "name": "Stempel Flash Lingkaran Diameter 2,5cm",
    "category": "Stationery",
    "unit": "pcs",
    "price": 65000,
    "isActive": true,
    "sortOrder": 81,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Stempel Flash Lingkaran Diameter 3,2cm",
    "category": "Stationery",
    "unit": "pcs",
    "price": 65000,
    "isActive": true,
    "sortOrder": 82,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Stempel Flash Lingkaran Diameter 4,2cm",
    "category": "Stationery",
    "unit": "pcs",
    "price": 75000,
    "isActive": true,
    "sortOrder": 83,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Stempel Flash Oval Diameter 4,2cm",
    "category": "Stationery",
    "unit": "pcs",
    "price": 75000,
    "isActive": true,
    "sortOrder": 84,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Stempel Flash Oval Diameter 4,8cm",
    "category": "Stationery",
    "unit": "pcs",
    "price": 80000,
    "isActive": true,
    "sortOrder": 85,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Stempel Flash Persegi Panjang 5x2,5cm",
    "category": "Stationery",
    "unit": "pcs",
    "price": 65000,
    "isActive": true,
    "sortOrder": 86,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Stempel Flash Persegi Panjang 5x3cm",
    "category": "Stationery",
    "unit": "pcs",
    "price": 75000,
    "isActive": true,
    "sortOrder": 87,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Id Card PVC",
    "category": "Stationery",
    "unit": "pcs",
    "price": 7000,
    "isActive": true,
    "sortOrder": 88,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Tali Lanyard Printing",
    "category": "Stationery",
    "unit": "pcs",
    "price": 12000,
    "isActive": true,
    "sortOrder": 89,
    "imageUrl": "/logo.png"
  },
  {
    "name": "Test Pembayaran QRIS (Testing Rp 1)",
    "category": "Testing",
    "unit": "pcs",
    "price": 1,
    "isActive": true,
    "sortOrder": 99,
    "imageUrl": "/logo.png"
  }
];
