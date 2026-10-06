import type { DipiMood } from './dipiSensory';

export interface DipiDialogue {
	text: string;
	mood: DipiMood;
	durationMs?: number;
}

/**
 * Bank dialog reaksi kontekstual Dipi untuk setiap seksi & halaman website.
 * Ditampilkan secara acak dan natural saat pengunjung melihat seksi atau berpindah halaman.
 */
export const SECTION_DIALOGUES: Record<string, DipiDialogue[]> = {
	// 1. Hero Section Beranda (#atas)
	atas: [
		{ text: 'Halo kak! Aku Dipi, asisten cetak FD Printing. Butuh bantuan hari ini?', mood: 'wave' },
		{ text: 'Selamat datang di FD Printing! Cetak cepat kualitas tajam, siap antar atau ambil langsung.', mood: 'happy' },
		{ text: 'Hai kak! Dipi siap nemenin dan bantu hitung estimasi harga cetakmu lho~', mood: 'idle' },
		{ text: 'Cari percetakan kilat dan terpercaya di Sidoarjo? Kakak ada di tempat yang tepat!', mood: 'celebrate' },
		{ text: 'Mau cetak spanduk, stiker, banner, atau brosur kilat? Scroll ke bawah yuk kak!', mood: 'point' },
		{ text: 'File desainmu sudah siap belum nih kak? Mau langsung konsultasi?', mood: 'thinking' },
		{ text: 'Pagi, siang, atau malam, Dipi selalu standby nemenin kakak di sini!', mood: 'peek' }
	],

	// 2. Seksi Layanan & Katalog Produk (#layanan)
	layanan: [
		{ text: 'Banyak pilihan bahan cetak nih! Dari flexi banner, albatros, sampai stiker vinyl tahan air.', mood: 'point' },
		{ text: 'Pilih salah satu produk yuk kak, nanti Dipi bantu hitungin estimasi harga otomatisnya!', mood: 'happy' },
		{ text: 'Bisa pesan satuan atau partai besar lho. Mau cetak kebutuhan apa hari ini?', mood: 'idle' },
		{ text: 'Cari bahan outdoor tahan cuaca atau indoor detail super tajam? Tanya Dipi aja ya!', mood: 'thinking' },
		{ text: 'Klik produk yang kakak suka untuk atur ukuran panjang x lebar sesuai kebutuhan!', mood: 'point' },
		{ text: 'Wah, banner Korea di sini favorit banget lho buat outdoor karena tebal dan awet!', mood: 'celebrate' },
		{ text: 'Lagi butuh stiker label kemasan makanan? Stiker chromo atau vinyl cocok banget kak.', mood: 'happy' }
	],

	// 3. Seksi Alur Order (#alur-order)
	'alur-order': [
		{ text: 'Cuma 3 langkah gampang: pilih produk, upload desain, langsung masuk mesin cetak!', mood: 'happy' },
		{ text: 'Belum punya file desain? Santai kak, tim desainer FD siap bantu bikin konsepnya kok.', mood: 'thinking' },
		{ text: 'Pesan online praktis banget, pantau status pengerjaan langsung dari smartphone!', mood: 'point' },
		{ text: 'File sudah siap cetak? Langsung checkout biar segera masuk antrean produksi terdepan ya kak.', mood: 'celebrate' },
		{ text: 'Nanti setelah checkout kakak dapat nota digital dan live status tracking lho!', mood: 'wave' }
	],

	// 4. Seksi Peta & Lokasi Toko (#lokasi)
	lokasi: [
		{ text: 'Ini workshop kami di Jl. Raya Wadungasri No. 42! Dekat perbatasan Rungkut Surabaya lho.', mood: 'point' },
		{ text: 'Bisa mampir langsung ke toko buat cek sampel bahan atau ambil pesanan kak!', mood: 'wave' },
		{ text: 'Kami buka Senin–Sabtu sampai jam 2 dini hari! Pas banget buat cetak kilat lembur malam.', mood: 'celebrate' },
		{ text: 'Ada area parkir luas dan ruang tunggu yang adem. Ditunggu kedatangannya ya!', mood: 'sit' },
		{ text: 'Butuh panduan rute? Klik tombol Rute Maps di samping untuk rute tercepat via Google Maps!', mood: 'point' },
		{ text: 'Lokasinya persis di pinggir jalan raya, gampang banget ditemuin kok kak.', mood: 'happy' }
	],

	// 5. Seksi FAQ (#faq)
	faq: [
		{ text: 'Ada pertanyaan seputar file atau bahan yang belum terjawab? Klik Dipi, yuk tanya langsung!', mood: 'point' },
		{ text: 'Bisa cetak kilat ditunggu lho kak, asalkan file siap cetak dan antrean mesin tersedia.', mood: 'happy' },
		{ text: 'Pembayaran super praktis via QRIS otomatis semua e-wallet & m-banking, atau transfer.', mood: 'celebrate' },
		{ text: 'Butuh bantuan staf langsung? Tombol WhatsApp selalu siap di pojok kanan bawah kak!', mood: 'wave' },
		{ text: 'Format file terbaik itu PDF atau TIFF ukuran asli resolusi 150-300 DPI ya kak!', mood: 'thinking' }
	],

	// 6. Halaman Detail Produk (/produk/*)
	produk: [
		{ text: 'Ketik ukuran panjang & lebarnya ya kak, total harganya langsung terhitung otomatis!', mood: 'point' },
		{ text: 'Jangan lupa pilih opsi finishing ya, misal mata ayam / ring gantungan untuk banner.', mood: 'idle' },
		{ text: 'Ada request khusus atau catatan potong? Tulis aja di kolom catatan sebelum pesan ya.', mood: 'happy' },
		{ text: 'Bingung pilih bahan yang pas? Klik Dipi, nanti kubantu jelaskan detailnya!', mood: 'wave' }
	],

	// 7. Halaman Formulir Pesan / Checkout (/pesan)
	pesan: [
		{ text: 'Pastikan nomor WhatsApp-mu aktif ya kak, buat update status produksi dan nota digital.', mood: 'point' },
		{ text: 'File desain bisa cantumkan link Google Drive, Canva, atau kirim via WhatsApp kasir.', mood: 'idle' },
		{ text: 'Tinggal selangkah lagi nih! Cek kembali rincian pesananmu sebelum klik checkout ya~', mood: 'happy' },
		{ text: 'Ada catatan khusus untuk operator cetak? Jangan lupa tuliskan di kolom catatan ya kak.', mood: 'point' }
	],

	// 8. Halaman Sukses Order / Menunggu Bayar QRIS (/pesan/sukses/* belum lunas)
	pesan_sukses: [
		{ text: 'Pesananmu sudah masuk! Scan QRIS di layar ya kak biar langsung masuk antrean cetak.', mood: 'happy' },
		{ text: 'Pastikan transfer tepat sesuai nominal rupiah di atas agar otomatis diverifikasi sistem!', mood: 'point' },
		{ text: 'QRIS aktif 15 menit ya kak. Kalau butuh bantuan, klik tombol WhatsApp di bawah!', mood: 'idle' },
		{ text: 'Selesai bayar? Sistem otomatis mendeteksi dan mengalihkan status ke produksi lho.', mood: 'point' }
	],

	// 9. Reaksi Setelah Bayar Lunas (/pesan/sukses/* lunas / diproses)
	bayar_sukses: [
		{ text: 'Yesss! Pembayaran QRIS berhasil! Pesananmu resmi MASUK ANTRIAN CETAK! 🎉', mood: 'celebrate', durationMs: 8000 },
		{ text: 'Hore lunas! Tim operator kami segera memproses cetakanmu secepat kilat!', mood: 'celebrate', durationMs: 8000 },
		{ text: 'Terima kasih banyak kak! Pantau progres cetakmu secara berkala di halaman ini ya~', mood: 'celebrate', durationMs: 8000 }
	],

	// 10. Reaksi Ketika Sesi QRIS Kadaluarsa
	bayar_kadaluarsa: [
		{ text: 'Waduh, sesi QRIS-nya sudah kedaluwarsa nih kak! Mau Dipi bantu buatkan kode QRIS baru?', mood: 'confused', durationMs: 9000 },
		{ text: 'Sesi bayar 15 menit sudah berakhir kak. Tinggal klik Perbarui QRIS untuk scan ulang ya!', mood: 'thinking', durationMs: 9000 },
		{ text: 'Tenang kak, pesananmu masih aman! Silakan klik Perbarui QRIS atau hubungi kasir via WhatsApp ya~', mood: 'point', durationMs: 9000 }
	],

	// 11. Reaksi Ketika Modal QRIS Ditutup (pembeli menutup popup / batal bayar saat itu)
	qris_closed: [
		{ text: 'Sip kak, pesananmu tetap tersimpan aman di riwayat ya! Mau lanjut bayar nanti atau ada yang mau ditanyakan dulu?', mood: 'sit', durationMs: 7500 },
		{ text: 'Modal pembayaran ditutup. Jangan khawatir kak, bisa dibuka & dibayar lagi kapan pun lewat riwayat order ya~', mood: 'wave', durationMs: 7500 },
		{ text: 'Oke kak! Kalau butuh bantuan cek file atau konsultasi bahan cetak, Dipi siap bantu kapan aja~', mood: 'idea', durationMs: 7500 }
	],

	// 12. Reaksi Ketika Pesanan Dibatalkan Pembeli
	order_cancelled: [
		{ text: 'Pesanan telah dibatalkan kak. Jangan sungkan konsultasi lagi ke Dipi kalau butuh cetakan lain ya!', mood: 'confused', durationMs: 8000 },
		{ text: 'Order berhasil dibatalkan. Yuk cari produk atau ukuran lain yang lebih pas di katalog layanan kami~', mood: 'sit', durationMs: 8000 },
		{ text: 'Pesanan dibatalkan. Kalau ada kendala file desain atau harga, Dipi bisa bantu carikan solusinya kak!', mood: 'idea', durationMs: 8000 }
	],

	// 13. Reaksi Beralih Tema Web (Gelap / Terang)
	theme_dark: [
		{ text: 'Mode gelap aktif! Adem di mata, pas banget buat lembur desain malam-malam ya kak~', mood: 'sleep', durationMs: 5000 },
		{ text: 'Gelap elegan! Nyaman banget buat milih produk cetakan tanpa silau.', mood: 'happy', durationMs: 5000 },
		{ text: 'Mode malam menyala! Hemat daya baterai & fokus buat urus pesanan cetak.', mood: 'idea', durationMs: 5000 }
	],
	theme_light: [
		{ text: 'Mode terang aktif! Cerah dan segar, detail warna desain cetakan kelihatan makin jelas!', mood: 'celebrate', durationMs: 5000 },
		{ text: 'Kembali cerah! Cocok banget buat ngecek akurasi warna CMYK ya kak~', mood: 'happy', durationMs: 5000 },
		{ text: 'Silau tapi semangat! Yuk pilih produk cetakan terbaik buat bisnismu hari ini!', mood: 'wave', durationMs: 5000 }
	],

	// 14. Halaman Autentikasi (/sign-in, /sign-up, /forgot-password)
	sign_in: [
		{ text: 'Halo kak! Mau cek status antrean atau riwayat order? Masuk ke akunmu dulu yuk~', mood: 'wave', durationMs: 7000 },
		{ text: 'Selamat datang kembali! Masuk untuk kelola pesanan & nota digitalmu.', mood: 'happy', durationMs: 7000 },
		{ text: 'Ada tombol coba akun demo di bawah lho kak, sekali klik langsung masuk sesuai peran!', mood: 'idea', durationMs: 7000 }
	],
	sign_up: [
		{ text: 'Halo teman baru! Daftar akun cuma butuh beberapa detik, biar riwayat order tersimpan rapi!', mood: 'happy', durationMs: 7000 },
		{ text: 'Yuk gabung! Banyak kemudahan buat pantau proses cetak & riwayat pembayaranmu.', mood: 'celebrate', durationMs: 7000 }
	],
	forgot_password: [
		{ text: 'Lupa password ya kak? Tenang, masukkan emailmu nanti tautan pemulihan dikirimkan~', mood: 'thinking', durationMs: 7000 }
	]
};

/** Ambil dialog acak yang berbeda dari dialog sebelumnya */
export function getRandomDialogue(key: string, lastText?: string | null): DipiDialogue | null {
	const list = SECTION_DIALOGUES[key];
	if (!list || list.length === 0) return null;
	const filtered = list.filter((item) => item.text !== lastText);
	const pool = filtered.length > 0 ? filtered : list;
	return pool[Math.floor(Math.random() * pool.length)];
}

/** Dialog interaktif saat kursor meng-hover kartu produk di katalog */
export function getProductHoverDialogue(productName: string, price?: number, unit?: string): DipiDialogue {
	const n = productName.toLowerCase();

	if (n.includes('korea')) {
		const list: DipiDialogue[] = [
			{ text: 'Wah, Banner Korea 440gsm ini favorit outdoor! Super tebal, tahan hujan badai & warna ekstra pekat!', mood: 'celebrate', durationMs: 6500 },
			{ text: 'Banner Korea Rp 35.000/m² teksturnya matte mewah, pilihan juara buat backdrop panggung & plang toko!', mood: 'point', durationMs: 6500 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	if (n.includes('banner') || n.includes('spanduk') || n.includes('mm') || n.includes('flexi')) {
		const list: DipiDialogue[] = [
			{ text: 'Banner MM ini seratnya halus & hasil cetaknya tajam lho kak! Pas banget buat spanduk toko atau promosi.', mood: 'point', durationMs: 6500 },
			{ text: 'Cetak Banner MM Rp 25.000/m² sudah gratis mata ayam plong, pengerjaan cepat bisa ditunggu!', mood: 'happy', durationMs: 6500 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	if (n.includes('vinyl')) {
		const list: DipiDialogue[] = [
			{ text: 'Stiker Vinyl ini bahan plastik tahan air (waterproof) & gak mudah sobek, cocok buat botol minuman atau motor!', mood: 'happy', durationMs: 6500 },
			{ text: 'Stiker Vinyl mulai Rp 5.000/pcs, bisa dipotong kiss cut atau die cut rapi sesuai lekuk logomu kak!', mood: 'point', durationMs: 6500 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	if (n.includes('chromo') || n.includes('stiker')) {
		const list: DipiDialogue[] = [
			{ text: 'Stiker Chromo paling ekonomis & mengkilap glossy, juara banget buat label toples kue & kemasan makanan!', mood: 'happy', durationMs: 6500 },
			{ text: 'Cuma Rp 15.000 per lembar A3+, bisa muat puluhan logo stiker jualanmu kak!', mood: 'celebrate', durationMs: 6500 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	if (n.includes('brosur') || n.includes('flyer')) {
		const list: DipiDialogue[] = [
			{ text: 'Brosur A4 cetak full color bolak-balik di kertas Art Paper, efektif banget buat promosi event atau daftar menu!', mood: 'wave', durationMs: 6500 },
			{ text: 'Brosur A4 cuma Rp 1.500/lembar, hasil cetak tajam & warna cerah bikin usahamu dilirik!', mood: 'happy', durationMs: 6500 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	if (n.includes('kartu')) {
		const list: DipiDialogue[] = [
			{ text: 'Kartu Nama 1 box isi 100 pcs, bikin bisnis dan branding personal kakak tampil makin elegan & terpercaya!', mood: 'celebrate', durationMs: 6500 },
			{ text: 'Bahan tebal Art Carton 260gsm, bisa tambah laminasi doff atau glossy biar makin mewah kak!', mood: 'point', durationMs: 6500 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	if (n.includes('foto') || n.includes('photo')) {
		const list: DipiDialogue[] = [
			{ text: 'Cetak Foto kualitas studio di kertas foto premium, warna tajam awet bertahun-tahun lho kak!', mood: 'happy', durationMs: 6500 },
			{ text: 'Momen wisuda, nikahan, atau liburan? Cetak di sini warnanya hidup & anti luntur!', mood: 'point', durationMs: 6500 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	const priceText = price ? ` mulai Rp ${price.toLocaleString('id-ID')}` : '';
	return {
		text: `Produk ${productName}${priceText} nih kak! Klik Order untuk atur ukuran & langsung checkout ya~`,
		mood: 'happy',
		durationMs: 6500
	};
}

/** Dialog interaktif saat validasi form pemesanan belum lengkap */
export function getFormInvalidDialogue(field: 'nama' | 'telepon' | 'cart' | 'file'): DipiDialogue {
	if (field === 'nama') {
		const list: DipiDialogue[] = [
			{ text: 'Eits kak! Nama pemesan wajib diisi dulu ya, biar nota dan antrean cetak tidak tertukar~', mood: 'point', durationMs: 8000 },
			{ text: 'Nama pemesannya masih kosong nih kak. Isi dulu ya biar Dipi bisa catat pesanannya!', mood: 'confused', durationMs: 8000 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	if (field === 'telepon') {
		const list: DipiDialogue[] = [
			{ text: 'Nomor WhatsApp-nya jangan lupa kak! Minimal 8 digit aktif untuk update status cetakan kakak ya.', mood: 'point', durationMs: 8000 },
			{ text: 'Mohon isi No. WhatsApp yang valid ya kak, kasir akan kirim nota & foto hasil cetak ke nomor itu!', mood: 'thinking', durationMs: 8000 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	if (field === 'cart') {
		return {
			text: 'Keranjangmu masih kosong nih kak! Pilih produk di langkah 1 dan klik "Tambahkan" dulu ya~',
			mood: 'confused',
			durationMs: 8000
		};
	}

	return {
		text: 'Mohon lengkapi formulir pemesanannya dulu ya kak sebelum lanjut ke pembayaran!',
		mood: 'point',
		durationMs: 8000
	};
}

/** Dialog interaktif saat validasi formulir login / registrasi belum lengkap */
export function getAuthInvalidDialogue(field: 'email' | 'password' | 'name', isSignUp = false): DipiDialogue {
	if (field === 'name') {
		return {
			text: 'Nama lengkap wajib diisi ya kak, biar kami tahu siapa pemilik akun ini!',
			mood: 'point',
			durationMs: 7000
		};
	}

	if (field === 'email') {
		const list: DipiDialogue[] = [
			{ text: 'Emailnya masih kosong atau belum valid nih kak. Tulis alamat email aktifmu ya!', mood: 'confused', durationMs: 7000 },
			{ text: 'Mohon isi email kakak dulu ya, biar nota & konfirmasi akun bisa terkirim lancar~', mood: 'point', durationMs: 7000 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	if (field === 'password') {
		if (isSignUp) {
			return {
				text: 'Password minimal 8 karakter ya kak, demi keamanan akun dan riwayat pesananmu!',
				mood: 'thinking',
				durationMs: 7000
			};
		}
		return {
			text: 'Password-nya belum diisi nih kak! Masukkan password akunmu dulu ya~',
			mood: 'point',
			durationMs: 7000
		};
	}

	return {
		text: 'Mohon lengkapi kolom formulir yang wajib diisi dulu ya kak!',
		mood: 'point',
		durationMs: 7000
	};
}

/** Dialog interaktif saat terjadi kegagalan autentikasi (kredensial salah / email kembar) */
export function getAuthFailedDialogue(reason: 'credential' | 'register' | 'general', message?: string): DipiDialogue {
	if (reason === 'credential') {
		const list: DipiDialogue[] = [
			{ text: 'Aduh, email atau password sepertinya belum cocok kak. Coba cek lagi ya, atau klik "Lupa password" jika lupa~', mood: 'confused', durationMs: 8000 },
			{ text: 'Kredensial belum pas nih kak. Pastikan huruf besar-kecil password sudah tepat ya!', mood: 'thinking', durationMs: 8000 }
		];
		return list[Math.floor(Math.random() * list.length)];
	}

	if (reason === 'register') {
		return {
			text: 'Wah, email ini sepertinya sudah terdaftar kak! Coba langsung masuk aja yuk lewat tab "Masuk Akun".',
			mood: 'idea',
			durationMs: 8000
		};
	}

	return {
		text: message || 'Terjadi kendala saat memproses akun. Silakan coba lagi sebentar ya kak!',
		mood: 'confused',
		durationMs: 7000
	};
}
