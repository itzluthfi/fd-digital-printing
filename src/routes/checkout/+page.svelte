<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ArrowLeft,
		Building2,
		CheckCircle2,
		CreditCard,
		FileText,
		MapPin,
		PackageCheck,
		QrCode,
		ShieldCheck,
		ShoppingBag,
		ShoppingCart,
		Truck,
		Wallet
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import QrisModal from '#lib/components/QrisModal.svelte';
	import { cart } from '#lib/cart.svelte';
	import { saveGuestOrder } from '#lib/guest-orders';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Form State
	let nama = $state(data.user?.name || '');
	let telepon = $state('');
	let email = $state(data.user?.email || '');
	let pengiriman = $state<'ambil_toko' | 'kurir'>('ambil_toko');
	let alamatKirim = $state('');
	let catatanKirim = $state('');
	let paymentMethod = $state<'qris' | 'transfer' | 'cash'>('qris');

	let isSubmitting = $state(false);
	let qrisOpen = $state(false);
	let activeOrderCode = $state('');
	let customQr = $state('');
	let activeFinalTotal = $state<number | null>(null);

	const rupiah = (n: number) =>
		'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	// Hitung Biaya Pengiriman (Bila kurir, estimasi flat atau konsultasi CS)
	const ongkir = $derived(pengiriman === 'kurir' ? 15000 : 0);
	const totalBayar = $derived(cart.total + ongkir);

	function validasi(): boolean {
		if (cart.items.length === 0) {
			toast.error('Keranjang pesanan masih kosong.');
			return false;
		}
		if (!nama.trim() || nama.trim().length < 2) {
			toast.error('Silakan isi Nama Lengkap pemesan.');
			return false;
		}
		if (!telepon.trim() || telepon.trim().length < 8) {
			toast.error('Silakan isi Nomor WhatsApp aktif.');
			return false;
		}
		if (pengiriman === 'kurir' && !alamatKirim.trim()) {
			toast.error('Silakan masukkan Alamat Pengiriman lengkap.');
			return false;
		}
		return true;
	}

	async function handleCheckoutQris() {
		if (!validasi()) return;
		isSubmitting = true;

		try {
			// Format ringkasan pesanan untuk server
			const firstItem = cart.items[0];
			const multiDesc = cart.items
				.map((i) => {
					const dim = i.unit === 'meter' && i.panjang && i.lebar ? ` (${i.panjang}x${i.lebar}m)` : '';
					const fin = i.finishing ? ` [Finishing: ${i.finishing}]` : '';
					return `• ${i.name}${dim} x ${i.qty} ${i.unit === 'meter' ? 'pcs' : i.unit}${fin}`;
				})
				.join('\n');

			const res = await fetch('/api/order/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productId: firstItem.productId,
					nama,
					telepon,
					email,
					notes: `${multiDesc}\n\n[Pengiriman: ${pengiriman === 'ambil_toko' ? 'Ambil di Toko' : `Kurir: ${alamatKirim}`}]`,
					fileUrl: firstItem.fileUrl || '',
					finishing: firstItem.finishing || '',
					panjang: firstItem.panjang || 1,
					lebar: firstItem.lebar || 1,
					qty: firstItem.qty,
					customTotal: totalBayar
				})
			});

			const result = await res.json();
			if (result.success && result.orderCode) {
				activeOrderCode = result.orderCode;
				activeFinalTotal = result.total ?? totalBayar;

				// Simpan ke riwayat pesanan tamu
				saveGuestOrder({
					code: result.orderCode,
					name: cart.items.length > 1 ? `${firstItem.name} + ${cart.items.length - 1} item lainnya` : firstItem.name,
					desc: multiDesc,
					total: activeFinalTotal ?? totalBayar,
					createdAt: new Date().toISOString()
				});

				const codeString = result.goqris?.qris_code || result.goqris?.qris_string || result.goqris?.qr_string;
				if (result.goqris?.qr_image || result.goqris?.qr_image_url) {
					customQr = String(result.goqris.qr_image || result.goqris.qr_image_url);
				} else if (codeString) {
					customQr = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(String(codeString))}`;
				} else {
					customQr = '';
				}

				// Bersihkan keranjang karena pesanan sudah tercatat
				cart.clearCart();
				qrisOpen = true;
			} else {
				toast.error(result.message || 'Gagal memproses pesanan.');
			}
		} catch {
			toast.error('Terjadi kesalahan jaringan.');
		} finally {
			isSubmitting = false;
		}
	}

	function generateWaCheckoutUrl(): string {
		const daftarItemText = cart.items
			.map((item, idx) => {
				const dim = item.unit === 'meter' && item.panjang && item.lebar ? ` (${item.panjang}x${item.lebar} meter)` : '';
				const fin = item.finishing ? `\n   Finishing: ${item.finishing}` : '';
				const file = item.fileUrl ? `\n   File: ${item.fileUrl}` : '\n   File: (Akan dikirim di chat ini)';
				const note = item.notes ? `\n   Catatan: ${item.notes}` : '';
				return `${idx + 1}. *${item.name}* x ${item.qty} ${item.unit}${dim}${fin}${file}${note}\n   Subtotal: ${rupiah(item.subtotal)}`;
			})
			.join('\n\n');

		const pengirimanText =
			pengiriman === 'ambil_toko'
				? 'Ambil Sendiri di Workshop (FD Digital Printing)'
				: `Kirim Kurir ke:\n${alamatKirim}${catatanKirim ? ` (${catatanKirim})` : ''}`;

		const pesan =
			`Halo FD Digital Printing, saya mau konfirmasi pemesanan dari website:\n\n` +
			`*DAFTAR PESANAN:*\n` +
			`${daftarItemText}\n\n` +
			`• Total Belanja: *${rupiah(cart.total)}*\n` +
			(pengiriman === 'kurir' ? `• Estimasi Ongkir: ${rupiah(ongkir)}\n` : '') +
			`• Estimasi Total Bayar: *${rupiah(totalBayar)}*\n` +
			`• Metode Pembayaran: ${paymentMethod === 'qris' ? 'QRIS' : paymentMethod === 'transfer' ? 'Transfer Bank' : 'Cash di Kasir'}\n\n` +
			`*DATA PEMESAN:*\n` +
			`• Nama: ${nama || '(Belum diisi)'}\n` +
			`• No. WA: ${telepon || '(Belum diisi)'}\n` +
			(email ? `• Email: ${email}\n` : '') +
			`• Pengambilan: ${pengirimanText}\n\n` +
			`Mohon dikonfirmasi & dicek file cetakannya ya kak. Terima kasih!`;

		return `https://wa.me/${data.company.whatsapp}?text=${encodeURIComponent(pesan)}`;
	}

	function selesaikanOrder() {
		qrisOpen = false;
		if (activeOrderCode) {
			window.location.href = `/pesan/sukses/${activeOrderCode}`;
		}
	}
</script>

<svelte:head>
	<title>Checkout Pesanan — FD Digital Printing</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors">
	<!-- Navbar Header -->
	<header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
			<a
				href="/cart"
				class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
			>
				<ArrowLeft class="h-4 w-4" />
				<span>Kembali ke Keranjang</span>
			</a>

			<a href="/" class="flex items-center gap-2">
				<img src="/logo.png" alt="Logo" class="h-8 w-8 rounded-lg object-contain bg-white shadow-2xs" />
				<span class="font-bold text-sm sm:text-base text-slate-900 dark:text-white hidden sm:inline">FD Digital Printing</span>
			</a>

			<div class="flex items-center gap-2">
				<span class="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
					<ShieldCheck class="h-4 w-4" />
					<span class="hidden sm:inline">Checkout Aman</span>
				</span>
				<ThemeToggle class="h-8 w-8" />
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-6 sm:py-10 pb-20">
		<!-- Breadcrumbs (Printku Style) -->
		<nav aria-label="Breadcrumb" class="mb-5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
			<a href="/" class="hover:text-slate-900 dark:hover:text-white transition">Home</a>
			<span class="text-slate-300 dark:text-slate-600">/</span>
			<a href="/katalog" class="hover:text-slate-900 dark:hover:text-white transition">Katalog</a>
			<span class="text-slate-300 dark:text-slate-600">/</span>
			<a href="/cart" class="hover:text-slate-900 dark:hover:text-white transition">Keranjang</a>
			<span class="text-slate-300 dark:text-slate-600">/</span>
			<span class="font-bold text-slate-900 dark:text-white">Checkout Pembayaran</span>
		</nav>

		{#if cart.items.length === 0 && !activeOrderCode}
			<!-- Empty Cart Redirect -->
			<div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-xs max-w-lg mx-auto">
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
					<ShoppingBag class="h-8 w-8" />
				</div>
				<h2 class="text-lg font-bold text-slate-900 dark:text-white">Keranjang Anda Masih Kosong</h2>
				<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Silakan pilih produk cetak di katalog sebelum checkout.</p>
				<div class="mt-6">
					<a
						href="/katalog"
						class="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-[#1d4ed8] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition"
					>
						<span>Buka Katalog Produk</span>
					</a>
				</div>
			</div>
		{:else}
			<div class="grid gap-8 lg:grid-cols-12 items-start">
				<!-- Kolom Kiri: Form Data Pemesan & Pengiriman & Pembayaran (7 Cols) -->
				<div class="lg:col-span-7 space-y-6">
					<!-- Step 1: Data Pemesan -->
					<div class="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
						<div class="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
							<span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
							<h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Data Pemesan</h2>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div>
								<span class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
									Nama Lengkap <span class="text-red-500">*</span>
								</span>
								<input
									type="text"
									bind:value={nama}
									placeholder="Contoh: Budi Santoso"
									class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
								/>
							</div>

							<div>
								<span class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
									No. WhatsApp Aktif <span class="text-red-500">*</span>
								</span>
								<input
									type="tel"
									bind:value={telepon}
									placeholder="Contoh: 08123456789"
									class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
								/>
							</div>

							<div class="sm:col-span-2">
								<div class="flex items-center justify-between mb-1">
									<span class="text-xs font-semibold text-slate-700 dark:text-slate-300">Email Pemesan</span>
									<span class="text-[10px] text-slate-400">Opsional untuk bukti invoice</span>
								</div>
								<input
									type="email"
									bind:value={email}
									placeholder="nama@email.com"
									class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
								/>
							</div>
						</div>
					</div>

					<!-- Step 2: Opsi Pengambilan / Pengiriman (Printku Style) -->
					<div class="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
						<div class="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
							<span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
							<h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Metode Pengambilan Pesanan</h2>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<!-- Pilihan Ambil di Toko -->
							<button
								type="button"
								onclick={() => (pengiriman = 'ambil_toko')}
								class="p-4 rounded-xl border-2 text-left transition-all cursor-pointer {pengiriman === 'ambil_toko'
									? 'border-blue-600 bg-sky-50/50 dark:bg-sky-950/40'
									: 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Building2 class="h-4 w-4 text-blue-600" />
										<span class="text-xs font-bold text-slate-900 dark:text-white">Ambil Sendiri di Toko</span>
									</div>
									<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">Gratis</span>
								</div>
								<p class="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
									Ambil langsung di workshop FD Digital Printing Sidoarjo saat pesanan selesai dicetak.
								</p>
							</button>

							<!-- Pilihan Kirim Kurir -->
							<button
								type="button"
								onclick={() => (pengiriman = 'kurir')}
								class="p-4 rounded-xl border-2 text-left transition-all cursor-pointer {pengiriman === 'kurir'
									? 'border-blue-600 bg-sky-50/50 dark:bg-sky-950/40'
									: 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Truck class="h-4 w-4 text-blue-600" />
										<span class="text-xs font-bold text-slate-900 dark:text-white">Kirim Ekspedisi / Kurir</span>
									</div>
									<span class="text-[10px] font-bold text-slate-600 dark:text-slate-300">{rupiah(15000)}</span>
								</div>
								<p class="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
									Dikirim ke alamat Anda melalui kurir instan (Grab/Gojek) atau ekspedisi (J&T/JNE).
								</p>
							</button>
						</div>

						{#if pengiriman === 'kurir'}
							<div class="space-y-3 pt-2">
								<div>
									<span class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
										Alamat Lengkap Pengiriman <span class="text-red-500">*</span>
									</span>
									<textarea
										bind:value={alamatKirim}
										rows="3"
										placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota..."
										class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
									></textarea>
								</div>
								<div>
									<span class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
										Catatan Alamat (Opsional)
									</span>
									<input
										type="text"
										bind:value={catatanKirim}
										placeholder="Contoh: Pagar hitam, samping toko kelontong"
										class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
									/>
								</div>
							</div>
						{/if}
					</div>

					<!-- Step 3: Metode Pembayaran (Printku Style) -->
					<div class="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
						<div class="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
							<span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">3</span>
							<h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Pilih Metode Pembayaran</h2>
						</div>

						<div class="space-y-2.5">
							<!-- Option 1: QRIS -->
							<button
								type="button"
								onclick={() => (paymentMethod = 'qris')}
								class="w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between {paymentMethod === 'qris'
									? 'border-blue-600 bg-sky-50/50 dark:bg-sky-950/40'
									: 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}"
							>
								<div class="flex items-center gap-3">
									<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
										<QrCode class="h-5 w-5" />
									</div>
									<div>
										<span class="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">QRIS Dinamis (Otomatis)</span>
										<span class="block text-[11px] text-slate-500 dark:text-slate-400">BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay</span>
									</div>
								</div>
								<span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">Instan 24 Jam</span>
							</button>

							<!-- Option 2: Transfer Bank -->
							<button
								type="button"
								onclick={() => (paymentMethod = 'transfer')}
								class="w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between {paymentMethod === 'transfer'
									? 'border-blue-600 bg-sky-50/50 dark:bg-sky-950/40'
									: 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}"
							>
								<div class="flex items-center gap-3">
									<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
										<CreditCard class="h-5 w-5" />
									</div>
									<div>
										<span class="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Transfer Bank Manual</span>
										<span class="block text-[11px] text-slate-500 dark:text-slate-400">Konfirmasi transfer via WhatsApp</span>
									</div>
								</div>
							</button>

							<!-- Option 3: Bayar di Kasir Toko -->
							{#if pengiriman === 'ambil_toko'}
								<button
									type="button"
									onclick={() => (paymentMethod = 'cash')}
									class="w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between {paymentMethod === 'cash'
										? 'border-blue-600 bg-sky-50/50 dark:bg-sky-950/40'
										: 'border-slate-200 dark:border-slate-800 hover:border-slate-300'}"
								>
									<div class="flex items-center gap-3">
										<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
											<Wallet class="h-5 w-5" />
										</div>
										<div>
											<span class="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Bayar di Kasir Toko (Cash)</span>
											<span class="block text-[11px] text-slate-500 dark:text-slate-400">Bayar tunai saat mengambil pesanan</span>
										</div>
									</div>
								</button>
							{/if}
						</div>
					</div>
				</div>

				<!-- Kolom Kanan: Rincian Belanja & Tombol Konfirmasi (5 Cols Sticky) -->
				<div class="lg:col-span-5 lg:sticky lg:top-20 space-y-4">
					<div class="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
						<h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
							Ringkasan Pesanan ({cart.itemCount} Item)
						</h2>

						<!-- Daftar item ringkas -->
						<div class="max-h-64 overflow-y-auto space-y-3 pr-1 text-xs">
							{#each cart.items as item}
								<div class="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
									<div class="min-w-0 flex-1">
										<span class="font-bold text-slate-900 dark:text-white truncate block">{item.name}</span>
										<span class="text-[11px] text-slate-500 dark:text-slate-400">
											{item.qty} {item.unit === 'meter' ? 'pcs' : item.unit}
											{#if item.panjang && item.lebar}
												({item.panjang}x{item.lebar}m)
											{/if}
											{#if item.finishing}
												· {item.finishing}
											{/if}
										</span>
									</div>
									<span class="font-bold text-slate-900 dark:text-white shrink-0">
										{rupiah(item.subtotal)}
									</span>
								</div>
							{/each}
						</div>

						<!-- Perhitungan Biaya -->
						<div class="space-y-1.5 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
							<div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
								<span>Subtotal Cetak:</span>
								<span class="font-medium text-slate-800 dark:text-slate-200">{rupiah(cart.total)}</span>
							</div>
							<div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
								<span>Metode Pengambilan:</span>
								<span class="font-medium text-slate-800 dark:text-slate-200">
									{pengiriman === 'ambil_toko' ? 'Ambil di Toko (Gratis)' : `Kurir: ${rupiah(ongkir)}`}
								</span>
							</div>
							<div class="pt-3 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
								<span class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Total Pembayaran:</span>
								<span class="text-xl sm:text-2xl font-black text-blue-600">{rupiah(totalBayar)}</span>
							</div>
						</div>

						<!-- Tombol Aksi Sesuai Metode -->
						<div class="pt-2 space-y-2.5">
							{#if paymentMethod === 'qris'}
								<button
									type="button"
									onclick={handleCheckoutQris}
									disabled={isSubmitting}
									class="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-[#1d4ed8] text-white py-3.5 px-4 font-bold text-xs sm:text-sm shadow-md shadow-[#2563eb]/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-60"
								>
									{#if isSubmitting}
										<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
										<span>Memproses Order & QRIS...</span>
									{:else}
										<QrCode class="h-4 w-4" />
										<span>Bayar QRIS Sekarang ({rupiah(totalBayar)})</span>
									{/if}
								</button>
							{/if}

							<!-- Alternatif WhatsApp Button Selalu Tersedia -->
							<a
								href={generateWaCheckoutUrl()}
								target="_blank"
								rel="noopener"
								class="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95 text-center cursor-pointer"
							>
								<WhatsappIcon class="h-4 w-4" />
								<span>{paymentMethod === 'qris' ? 'Konfirmasi via WhatsApp' : `Kirim Pesanan ke WhatsApp (${rupiah(totalBayar)})`}</span>
							</a>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>

<!-- Modal QRIS Instan Dinamis -->
<QrisModal
	bind:open={qrisOpen}
	amount={activeFinalTotal ?? totalBayar}
	orderCode={activeOrderCode}
	customQrImage={customQr}
	onConfirm={selesaikanOrder}
/>
