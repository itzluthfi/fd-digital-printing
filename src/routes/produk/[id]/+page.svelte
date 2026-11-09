<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		ArrowLeft,
		ArrowRight,
		Check,
		Layers,
		Search,
		CheckCircle2,
		ChevronDown,
		ChevronRight,
		Clock,
		Copy,
		HelpCircle,
		Info,
		Link as LinkIcon,
		LogIn,
		Minus,
		PackageCheck,
		Plus,
		QrCode,
		ShieldCheck,
		ShoppingBag,
		ShoppingCart,
		Sparkles,
		Tag,
		User
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import QrisModal from '#lib/components/QrisModal.svelte';
	import GuestOrderModal from '#lib/components/GuestOrderModal.svelte';
	import { saveGuestOrder } from '#lib/guest-orders';
	import { cart } from '#lib/cart.svelte';
	import { getProductGallery, getProductSpecs } from '#lib/products';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const WA_NUMBER = '6289507370805';

	// Specs & Multi-Foto
	const gallery = $derived(getProductGallery(data.item));
	const specs = $derived(getProductSpecs(data.item.name));
	let activePhotoIndex = $state(0);
	const activePhoto = $derived(gallery[activePhotoIndex] || gallery[0]);

	// Dimension & Order Config
	const isMeter = $derived(data.item.unit === 'meter');
	let panjang = $state(1);
	let lebar = $state(1);
	let qty = $state(1);
	let selectedFinishing = $state('');

	$effect(() => {
		if (specs.finishingOptions.length > 0 && !selectedFinishing) {
			selectedFinishing = specs.finishingOptions[0];
		}
	});
	// Select2 Finishing Dropdown State
	let finishingDropdownOpen = $state(false);
	let finishingSearchQuery = $state('');
	let finishingContainerEl = $state<HTMLDivElement | null>(null);
	let finishingSearchInputEl = $state<HTMLInputElement | null>(null);

	const filteredFinishingOptions = $derived(
		specs.finishingOptions.filter((opt) =>
			opt.toLowerCase().includes(finishingSearchQuery.toLowerCase().trim())
		)
	);

	function getFinishingMeta(opt: string): { badge: string; desc: string } {
		const lower = (opt || '').toLowerCase();
		if (lower.includes('mata ayam')) {
			return {
				badge: 'Paling Populer',
				desc: 'Ring mata ayam di setiap sudut untuk pengait tali spanduk'
			};
		}
		if (lower.includes('kolong') || lower.includes('selongsong')) {
			return {
				badge: 'Pipa/Bambu',
				desc: 'Selongsong atas & bawah untuk disisipkan pipa tiang bendera/banner'
			};
		}
		if (lower.includes('lipat lem')) {
			return {
				badge: 'Rapi Keliling',
				desc: 'Tepi banner dilipat & dilem keliling agar awet dan rapi'
			};
		}
		if (lower.includes('potong pas')) {
			return {
				badge: 'Frameless',
				desc: 'Dipotong tepat garis batas gambar tanpa ada sisa tepi putih'
			};
		}
		if (lower.includes('kiss cut')) {
			return {
				badge: 'Praktis Lembaran',
				desc: 'Setengah putus, stiker tinggal dikelupas langsung dari lembaran'
			};
		}
		if (lower.includes('die cut')) {
			return {
				badge: 'Potong Satuan',
				desc: 'Dipotong putus tembus per biji sesuai lekuk pola desain'
			};
		}
		if (lower.includes('laminasi glossy')) {
			return {
				badge: 'Kilau Mewah',
				desc: 'Lapisan glossy mengkilap tahan air, minyak & goresan'
			};
		}
		if (lower.includes('laminasi doff') || lower.includes('matte')) {
			return {
				badge: 'Matte Elegan',
				desc: 'Lapisan doff eksklusif bebas pantulan silau cahaya'
			};
		}
		if (lower.includes('lipat 2') || lower.includes('lipat 3')) {
			return {
				badge: 'Lipat Mesin',
				desc: 'Garis lipatan presisi rapi menggunakan mesin otomatis'
			};
		}
		if (lower.includes('sudut membulat') || lower.includes('round')) {
			return {
				badge: 'Round Corner',
				desc: 'Keempat sudut dipotong membulat halus modern'
			};
		}
		return {
			badge: 'Standar Cetak',
			desc: 'Spesifikasi pengerjaan standar percetakan bermutu tinggi'
		};
	}

	function toggleFinishingDropdown() {
		finishingDropdownOpen = !finishingDropdownOpen;
		if (finishingDropdownOpen) {
			finishingSearchQuery = '';
			setTimeout(() => finishingSearchInputEl?.focus(), 60);
		}
	}

	function selectFinishing(opt: string) {
		selectedFinishing = opt;
		finishingDropdownOpen = false;
		finishingSearchQuery = '';
	}

	// Customer Form state
	let nama = $state('');
	let telepon = $state('');
	let email = $state('');
	let fileUrl = $state('');
	let notes = $state('');
	let isSubmitting = $state(false);

	// QRIS Modal state
	let qrisOpen = $state(false);
	let guestHistoryOpen = $state(false);
	let activeFinalTotal = $state<number | null>(null);

	const rupiah = (n: number) =>
		'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	// Hitung Total Real-time
	const calculatedTotal = $derived.by(() => {
		if (isMeter) {
			const p = Math.max(0.1, panjang);
			const l = Math.max(0.1, lebar);
			const luasM2 = Math.max(1, p * l);
			return Math.round(data.item.price * luasM2 * qty);
		}
		return Math.round(data.item.price * qty);
	});

	const SATUAN_SINGKAT: Record<string, string> = {
		meter: '/m²',
		pcs: '/pcs',
		lembar: '/lbr',
		paket: '/paket'
	};

	// Generate WhatsApp Order URL
	const waOrderUrl = $derived.by(() => {
		let dimensiText = '';
		if (isMeter) {
			dimensiText = `• Ukuran: ${panjang} x ${lebar} meter (${qty} pcs)\n`;
		} else {
			dimensiText = `• Jumlah: ${qty} ${data.item.unit}\n`;
		}

		const pesan =
			`Halo FD Digital Printing, saya mau pesan:\n\n` +
			`• Produk: *${data.item.name}*\n` +
			dimensiText +
			(selectedFinishing ? `• Finishing: ${selectedFinishing}\n` : '') +
			`• Estimasi Total: *${rupiah(calculatedTotal)}*\n\n` +
			`Data Pemesan:\n` +
			`• Nama: ${nama || '(Belum diisi)'}\n` +
			`• No. WA: ${telepon || '(Belum diisi)'}\n` +
			(fileUrl ? `• File Desain: ${fileUrl}\n` : `• File Desain: (Belum ada / kirim via WA)\n`) +
			(notes ? `• Catatan: ${notes}\n` : '') +
			`\nMohon dikonfirmasi ya. Terima kasih!`;

		return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(pesan)}`;
	});

	function validasiForm(): boolean {
		if (!nama.trim()) {
			toast.error('Silakan isi Nama Lengkap terlebih dahulu.');
			scrollToForm();
			setTimeout(() => namaInput?.focus(), 350);
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('dipi:form-invalid', {
						detail: { field: 'nama' }
					})
				);
			}
			return false;
		}
		if (!telepon.trim() || telepon.trim().length < 8) {
			toast.error('Silakan isi Nomor WhatsApp aktif yang valid.');
			scrollToForm();
			setTimeout(() => teleponInput?.focus(), 350);
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('dipi:form-invalid', {
						detail: { field: 'telepon' }
					})
				);
			}
			return false;
		}
		return true;
	}

	let activeOrderCode = $state('');
	let customQr = $state('');
	let isCreatingOrder = $state(false);
	let honeypot = $state('');

	async function handleKlikQris() {
		if (!validasiForm()) return;
		isCreatingOrder = true;
		try {
			const res = await fetch('/api/order/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					productId: data.item.id,
					nama,
					telepon,
					email,
					fileUrl,
					notes,
					finishing: selectedFinishing,
					panjang,
					lebar,
					qty,
					fax_number_hp: honeypot
				})
			});
			const result = await res.json();
			if (result.success && result.orderCode) {
				activeOrderCode = result.orderCode;
				if (result.total) {
					activeFinalTotal = result.total;
				}

				// Simpan ke riwayat pesanan lokal (Guest Order History) ala Gacoan
				saveGuestOrder({
					code: result.orderCode,
					name: data.item.name,
					desc: `${data.item.name} ${isMeter ? `(${panjang}x${lebar}m)` : ''} x ${qty} ${data.item.unit}`,
					total: result.total ?? calculatedTotal,
					createdAt: new Date().toISOString()
				});

				const codeString = result.goqris?.qris_code || result.goqris?.qris_string || result.goqris?.qr_string;
				if (result.goqris?.qr_image || result.goqris?.qr_image_url) {
					customQr = String(result.goqris.qr_image || result.goqris.qr_image_url);
				} else if (codeString) {
					customQr = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=8&data=${encodeURIComponent(String(codeString))}`;
				} else {
					customQr = '';
					if (result.goqrisError) {
						toast.warning('GoQRIS: ' + result.goqrisError, { duration: 6000 });
					}
				}
				qrisOpen = true;
			} else {
				toast.error(result.message || 'Gagal memproses pesanan.');
			}
		} catch {
			toast.error('Terjadi kesalahan jaringan.');
		} finally {
			isCreatingOrder = false;
		}
	}

	let descOpen = $state(false);
	let formEl = $state<HTMLFormElement | null>(null);
	let namaInput = $state<HTMLInputElement | null>(null);
	let teleponInput = $state<HTMLInputElement | null>(null);

	function scrollToForm() {
		if (formEl) {
			formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function handleTambahKeranjang() {
		cart.addItem({
			productId: data.item.id,
			name: data.item.name,
			category: data.item.category || '',
			unit: data.item.unit,
			price: data.item.price,
			panjang: isMeter ? panjang : undefined,
			lebar: isMeter ? lebar : undefined,
			qty,
			finishing: selectedFinishing,
			fileUrl,
			notes,
			subtotal: calculatedTotal,
			imageUrl: gallery[0] || data.item.imageUrl || ''
		});
		toast.success('Berhasil ditambahkan ke keranjang!', {
			action: {
				label: 'Lihat Keranjang',
				onClick: () => { window.location.href = '/cart'; }
			}
		});
	}

	function handleBeliLangsung() {
		cart.addItem({
			productId: data.item.id,
			name: data.item.name,
			category: data.item.category || '',
			unit: data.item.unit,
			price: data.item.price,
			panjang: isMeter ? panjang : undefined,
			lebar: isMeter ? lebar : undefined,
			qty,
			finishing: selectedFinishing,
			fileUrl,
			notes,
			subtotal: calculatedTotal,
			imageUrl: gallery[0] || data.item.imageUrl || ''
		});
		window.location.href = '/checkout';
	}

	function handleBottomQrisClick() {
		if (!validasiForm()) return;
		handleKlikQris();
	}

	function selesaikanOrder() {
		qrisOpen = false;
		if (activeOrderCode) {
			window.location.href = `/pesan/sukses/${activeOrderCode}`;
		} else if (formEl) {
			isSubmitting = true;
			formEl.submit();
		}
	}

	onMount(() => {
		function handleClickOutside(e: MouseEvent) {
			if (finishingDropdownOpen && finishingContainerEl && !finishingContainerEl.contains(e.target as Node)) {
				finishingDropdownOpen = false;
			}
		}
		document.addEventListener('click', handleClickOutside);

		const sp = page.url.searchParams;
		const pParam = sp.get('panjang');
		const lParam = sp.get('lebar');
		const qParam = sp.get('qty');
		const fParam = sp.get('finishing');
		const nParam = sp.get('nama');
		const tParam = sp.get('telepon');
		const notesParam = sp.get('notes');
		const autoQris = sp.get('auto_qris');

		if (pParam && !isNaN(parseFloat(pParam))) {
			panjang = Math.max(0.1, parseFloat(pParam));
		}
		if (lParam && !isNaN(parseFloat(lParam))) {
			lebar = Math.max(0.1, parseFloat(lParam));
		}
		if (qParam && !isNaN(parseInt(qParam))) {
			qty = Math.max(1, parseInt(qParam));
		}
		if (fParam) {
			selectedFinishing = fParam;
		}
		if (nParam) {
			nama = nParam;
		}
		if (tParam) {
			telepon = tParam;
		}
		if (notesParam) {
			notes = notesParam;
		}

		if (autoQris === '1' || autoQris === 'true') {
			window.setTimeout(() => {
				if (nama.trim() && telepon.trim().length >= 8) {
					toast.info('Dipi memproses pembuatan kode QRIS otomatis...');
					handleKlikQris();
				} else {
					scrollToForm();
					toast.info('Spesifikasi sudah Dipi isikan! Tinggal isi Nama & No. WA untuk lanjut QRIS ya kak.');
					if (!nama.trim()) {
						setTimeout(() => namaInput?.focus(), 500);
					} else {
						setTimeout(() => teleponInput?.focus(), 500);
					}
				}
			}, 350);
		}
	});
</script>

<svelte:head>
	<title>{data.item.name} — FD Digital Printing</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-[#2563eb]/20 transition-colors">
	<!-- Navbar Sticky -->
	<header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
			<a
				href="/katalog"
				class="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
			>
				<ArrowLeft class="h-4 w-4" />
				<span>Kembali ke Katalog</span>
			</a>

			<a href="/" class="flex items-center gap-2">
				<img src="/logo.png" alt="Logo" class="h-8 w-8 rounded-lg object-contain bg-white shadow-2xs" />
				<span class="font-bold text-sm sm:text-base text-slate-900 dark:text-white hidden sm:inline">FD Digital Printing</span>
			</a>

			<div class="flex items-center gap-2">
				<a
					href="/status-order"
					class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-[#2563eb] hover:text-[#2563eb] transition active:scale-95"
					title="Lacak Status Pesanan"
				>
					<PackageCheck class="h-3.5 w-3.5 text-[#2563eb]" />
					<span class="hidden sm:inline">Status Pesanan</span>
				</a>

				<a
					href="/cart"
					class="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#2563eb] transition"
					title="Keranjang Belanja"
				>
					<ShoppingCart class="h-4 w-4 text-[#2563eb]" />
					{#if cart.count > 0}
						<span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-xs">
							{cart.count}
						</span>
					{/if}
				</a>
				{#if data.user}
					<a
						href={data.user.role === 'operator' ? '/order' : '/dashboard'}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-[#1d4ed8] transition active:scale-95"
					>
						<User class="h-3.5 w-3.5" />
						<span>{data.user.role === 'customer' ? 'Akun Saya' : 'Dashboard'}</span>
					</a>
				{:else}
					<a
						href="/sign-in"
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-[#2563eb] hover:text-[#2563eb] transition active:scale-95 shadow-2xs"
					>
						<LogIn class="h-3.5 w-3.5" />
						<span>Masuk</span>
					</a>
				{/if}

				<ThemeToggle class="h-8 w-8" />
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-6 sm:py-10 pb-28 sm:pb-12">
		<!-- Breadcrumbs (Printku Style) -->
		<nav aria-label="Breadcrumb" class="mb-5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
			<a href="/" class="hover:text-slate-900 dark:hover:text-white transition">Home</a>
			<span class="text-slate-300 dark:text-slate-600">/</span>
			<a href="/katalog" class="hover:text-slate-900 dark:hover:text-white transition">Katalog</a>
			{#if data.item.category}
				<span class="text-slate-300 dark:text-slate-600">/</span>
				<span class="text-slate-600 dark:text-slate-300 font-medium">{data.item.category}</span>
			{/if}
			<span class="text-slate-300 dark:text-slate-600">/</span>
			<span class="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{data.item.name}</span>
		</nav>

		<div class="grid gap-8 lg:grid-cols-12 items-start">
			<!-- ============================================== -->
			<!-- KOLOM KIRI: MULTI-FOTO & DETAIL BAHAN (7 Cols) -->
			<!-- ============================================== -->
			<div class="lg:col-span-7 space-y-6">
				<!-- Galeri Foto Produk (Shopee Style) -->
				<div class="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-sm">
					<!-- Main Display Photo -->
					<div class="relative h-64 sm:h-96 w-full overflow-hidden rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800">
						<img
							src={activePhoto}
							alt={data.item.name}
							class="h-full w-full object-cover transition-all duration-300"
						/>
						<span class="absolute top-3 left-3 rounded-lg bg-slate-900/80 text-white backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold">
							Foto {activePhotoIndex + 1} dari {gallery.length}
						</span>
					</div>

					<!-- Thumbnail Strip (Bisa diklik untuk ganti foto) -->
					{#if gallery.length > 1}
						<div class="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
							{#each gallery as photo, idx}
								<button
									type="button"
									onclick={() => (activePhotoIndex = idx)}
									class="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer {activePhotoIndex === idx
										? 'border-[#2563eb] scale-105 shadow-sm'
										: 'border-transparent opacity-60 hover:opacity-100'}"
								>
									<img src={photo} alt="Thumbnail {idx}" class="h-full w-full object-cover" />
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Deskripsi & Keterangan Bahan (Accordion Buka Tutup Standar) -->
				<div class="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all">
					<button
						type="button"
						onclick={() => (descOpen = !descOpen)}
						class="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer"
					>
						<div class="flex items-center gap-3">
							<span class="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-[#2563eb] dark:bg-sky-950/60 dark:text-cyan-400">
								<Info class="h-4 w-4" />
							</span>
							<div>
								<h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
									Deskripsi & Spesifikasi Produk
								</h2>
								<p class="text-[11px] text-slate-500 dark:text-slate-400">
									{descOpen ? 'Klik untuk menutup rincian' : 'Buka untuk melihat karakter bahan & panduan file'}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-1.5 text-xs font-bold text-[#2563eb]">
							<span>{descOpen ? 'Tutup' : 'Lihat'}</span>
							<ChevronDown class="h-4 w-4 transition-transform duration-200 {descOpen ? 'rotate-180' : ''}" />
						</div>
					</button>

					{#if descOpen}
						<div class="border-t border-slate-100 dark:border-slate-800 p-5 sm:p-6 space-y-5 animate-fade-in">
							<div>
								<h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Karakter & Bahan</h3>
								<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
									{specs.deskripsi}
								</p>
							</div>

							<!-- Spesifikasi Grid -->
							<div class="border-t border-slate-100 dark:border-slate-800 pt-4">
								<h3 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Spesifikasi Teknis</h3>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
									{#each specs.spesifikasi as s}
										<div class="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-100 dark:border-slate-800">
											<span class="block text-[11px] font-medium text-slate-400">{s.label}</span>
											<span class="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{s.value}</span>
										</div>
									{/each}
								</div>
							</div>

							<!-- Panduan File -->
							<div class="rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 p-4 border border-sky-100 dark:border-sky-900/60">
								<div class="flex items-start gap-2.5">
									<Info class="h-4 w-4 text-[#2563eb] shrink-0 mt-0.5" />
									<div>
										<h4 class="text-xs font-bold text-slate-900 dark:text-white">Instruksi File Desain</h4>
										<p class="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
											{specs.instruksi}
										</p>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- ============================================== -->
			<!-- KOLOM KANAN: PILIHAN VARIAN & CHECKOUT (5 Cols) -->
			<!-- ============================================== -->
			<div class="lg:col-span-5 lg:sticky lg:top-20 space-y-5">
				<form
					bind:this={formEl}
					method="POST"
					action="?/checkout"
					onsubmit={(e) => {
						if (!validasiForm()) e.preventDefault();
					}}
					class="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-5"
				>
					<input type="hidden" name="paymentMethod" value="qris" />

					<!-- Header Produk & Harga -->
					<div class="border-b border-slate-100 dark:border-slate-800 pb-4">
						{#if data.item.category}
							<span class="inline-block px-2.5 py-0.5 rounded-full bg-sky-50 text-[#2563eb] dark:bg-sky-950/60 dark:text-cyan-400 text-[11px] font-bold uppercase tracking-wider mb-2">
								{data.item.category}
							</span>
						{/if}
						<h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{data.item.name}</h1>
						<div class="mt-2 flex items-baseline gap-2">
							<span class="text-2xl sm:text-3xl font-black text-[#2563eb]">{rupiah(data.item.price)}</span>
							<span class="text-xs text-slate-500 dark:text-slate-400 font-medium">{SATUAN_SINGKAT[data.item.unit] ?? data.item.unit}</span>
						</div>
					</div>

					<!-- Step 1: Pilihan Varian / Ukuran (Shopee Style) -->
					<div class="space-y-3">
						<h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
							1. Tentukan Ukuran & Kuantitas
						</h3>

						{#if isMeter}
							<!-- Input Dimensi P x L -->
							<div class="grid grid-cols-2 gap-3">
								<div>
									<span class="block text-[11px] text-slate-500 mb-1 font-medium">Panjang (meter)</span>
									<input
										type="number"
										step="0.1"
										min="0.5"
										max="50"
										name="panjang"
										bind:value={panjang}
										class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
									/>
								</div>
								<div>
									<span class="block text-[11px] text-slate-500 mb-1 font-medium">Lebar (meter)</span>
									<input
										type="number"
										step="0.1"
										min="0.5"
										max="50"
										name="lebar"
										bind:value={lebar}
										class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
									/>
								</div>
							</div>

							<!-- Quick Presets -->
							<div class="flex items-center gap-1.5 flex-wrap">
								<span class="text-[10px] text-slate-400 mr-1">Preset:</span>
								{#each [[1, 1], [2, 1], [3, 1], [3, 2]] as [p, l]}
									<button
										type="button"
										onclick={() => { panjang = p; lebar = l; }}
										class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer {panjang === p && lebar === l ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'}"
									>
										{p}x{l}m
									</button>
								{/each}
							</div>
						{/if}

						<!-- Jumlah Kuantitas -->
						<div class="flex items-center justify-between pt-2">
							<span class="text-xs font-semibold text-slate-600 dark:text-slate-400">Jumlah {isMeter ? 'pcs' : data.item.unit}:</span>
							<div class="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden">
								<button
									type="button"
									onclick={() => (qty = Math.max(1, qty - 1))}
									class="px-3 py-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
								>
									<Minus class="h-3.5 w-3.5" />
								</button>
								<input
									type="number"
									name="qty"
									min="1"
									bind:value={qty}
									class="w-12 text-center text-sm font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none"
								/>
								<button
									type="button"
									onclick={() => (qty = qty + 1)}
									class="px-3 py-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
								>
									<Plus class="h-3.5 w-3.5" />
								</button>
							</div>
						</div>

						<!-- Opsi Finishing: Select2 Dropdown Modern & Elegan -->
						{#if specs.finishingOptions.length > 0}
							{@const currentMeta = getFinishingMeta(selectedFinishing)}
							<div class="pt-2 relative" bind:this={finishingContainerEl}>
								<div class="flex items-center justify-between mb-1.5">
									<label
										for="finishing-trigger"
										class="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
									>
										<Layers class="h-3.5 w-3.5 text-blue-600" />
										<span>Pilihan Finishing:</span>
									</label>
									<span class="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
										{specs.finishingOptions.length} opsi tersedia
									</span>
								</div>

								<!-- Select2 Trigger Button -->
								<button
									id="finishing-trigger"
									type="button"
									onclick={toggleFinishingDropdown}
									aria-haspopup="listbox"
									aria-expanded={finishingDropdownOpen}
									class="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-left transition-all cursor-pointer shadow-2xs hover:border-blue-500 hover:bg-slate-50/50 dark:hover:bg-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-100 {finishingDropdownOpen
										? 'border-blue-600 ring-2 ring-blue-100 dark:ring-blue-950/50'
										: 'border-slate-200 dark:border-slate-700'}"
								>
									<div class="flex items-center gap-2.5 min-w-0 flex-1">
										<div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600">
											<Layers class="h-4 w-4" />
										</div>
										<div class="min-w-0 flex-1">
											<div class="flex items-center gap-2">
												<span class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
													{selectedFinishing || 'Pilih Jenis Finishing'}
												</span>
												<span class="hidden sm:inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
													{currentMeta.badge}
												</span>
											</div>
											<p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
												{currentMeta.desc}
											</p>
										</div>
									</div>

									<div class="flex items-center gap-1.5 shrink-0 pl-2">
										<ChevronDown
											class="h-4 w-4 text-slate-400 transition-transform duration-200 {finishingDropdownOpen
												? 'rotate-180 text-blue-600'
												: ''}"
										/>
									</div>
								</button>

								<!-- Select2 Dropdown Popover List -->
								{#if finishingDropdownOpen}
									<div
										class="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/80 overflow-hidden animate-in fade-in duration-150"
									role="listbox"
									tabindex="-1"
									onkeydown={(e) => {
										if (e.key === 'Escape') finishingDropdownOpen = false;
									}}
								>
									<!-- Search Filter Box (Khas Select2) -->
									<div class="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
										<div class="relative">
											<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
											<input
												bind:this={finishingSearchInputEl}
												type="text"
												bind:value={finishingSearchQuery}
												placeholder="Cari jenis finishing..."
												class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
											/>
										</div>
									</div>

									<!-- Options List -->
									<div class="max-h-60 overflow-y-auto p-1.5 space-y-1">
										{#if filteredFinishingOptions.length === 0}
											<div class="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
												Tidak ada opsi finishing yang cocok dengan kata kunci.
											</div>
										{:else}
											{#each filteredFinishingOptions as opt}
												{@const meta = getFinishingMeta(opt)}
												{@const isSelected = selectedFinishing === opt}
												<button
													type="button"
													role="option"
													aria-selected={isSelected}
													onclick={() => selectFinishing(opt)}
													class="w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer {isSelected
														? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 text-blue-900 dark:text-blue-200'
														: 'hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-transparent'}"
												>
													<!-- Radio Check Icon -->
													<div class="mt-0.5 shrink-0">
														{#if isSelected}
															<div class="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xs">
																<Check class="h-2.5 w-2.5 stroke-[3]" />
															</div>
														{:else}
															<div class="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
														{/if}
													</div>

													<!-- Text & Description -->
													<div class="flex-1 min-w-0">
														<div class="flex items-center justify-between gap-2">
															<span class="text-xs font-bold leading-tight {isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}">
																{opt}
															</span>
															<span class="shrink-0 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold {isSelected ? 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}">
																{meta.badge}
															</span>
														</div>
														<p class="mt-0.5 text-[11px] leading-snug {isSelected ? 'text-blue-600/80 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}">
															{meta.desc}
														</p>
													</div>
												</button>
											{/each}
										{/if}
									</div>

									<!-- Hint Footer -->
									<div class="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
										<span>Tekan Esc untuk menutup</span>
										<span class="font-medium text-blue-600">FD Digital Printing</span>
									</div>
								</div>
							{/if}

							<input type="hidden" name="finishing" value={selectedFinishing} />
						</div>
					{/if}
					</div>

					<!-- Step 2: Data Pemesan & File (Ringkas & Jelas) -->
					<div class="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
						<h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
							2. Data Pemesan & Desain
						</h3>

						<!-- Honeypot anti-bot -->
						<div class="hidden" style="display: none;" aria-hidden="true">
							<input type="text" name="fax_number_hp" bind:value={honeypot} tabindex="-1" autocomplete="off" />
						</div>

						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Nama Pemesan <span class="text-red-500">*</span></span>
							</div>
							<input
								bind:this={namaInput}
								type="text"
								name="nama"
								required
								bind:value={nama}
								onfocus={() => {
									if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('dipi:form-focus'));
								}}
								placeholder="Contoh: Budi Santoso"
								class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
							/>
						</div>

						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">No. WhatsApp Aktif <span class="text-red-500">*</span></span>
							</div>
							<input
								bind:this={teleponInput}
								type="tel"
								name="telepon"
								required
								bind:value={telepon}
								onfocus={() => {
									if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('dipi:form-focus'));
								}}
								placeholder="Contoh: 08123456789"
								class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
							/>
						</div>

						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Link File Desain</span>
								<span class="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Opsional</span>
							</div>
							<input
								type="url"
								name="fileUrl"
								bind:value={fileUrl}
								placeholder="Google Drive / Canva / WeTransfer"
								class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
							/>
							<p class="mt-1 text-[10px] text-slate-400">
								Kosongkan jika belum punya file (bisa dibantu tim kami via WhatsApp).
							</p>
						</div>

						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Catatan Khusus</span>
								<span class="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Opsional</span>
							</div>
							<input
								type="text"
								name="notes"
								bind:value={notes}
								placeholder="Contoh: Warna lebih pekat, tulisan dibesarkan"
								class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
							/>
						</div>
					</div>

					<!-- Rincian Perhitungan Realtime (Printku Style) -->
					<div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/50 p-4 space-y-2">
						<div class="flex items-center justify-between text-xs">
							<span class="text-slate-500 dark:text-slate-400">Kalkulasi:</span>
							<span class="font-bold text-slate-800 dark:text-slate-200">
								{#if isMeter}
									P: {panjang}m × L: {lebar}m = {Math.max(1, (panjang * lebar)).toFixed(2)} m² ({qty} pcs)
								{:else}
									{qty} {data.item.unit}
								{/if}
							</span>
						</div>
						<div class="flex items-center justify-between text-xs">
							<span class="text-slate-500 dark:text-slate-400">Harga Satuan:</span>
							<span class="font-medium text-slate-700 dark:text-slate-300">{rupiah(data.item.price)} {SATUAN_SINGKAT[data.item.unit] ?? ''}</span>
						</div>
						{#if selectedFinishing}
							<div class="flex items-center justify-between text-xs">
								<span class="text-slate-500 dark:text-slate-400">Finishing:</span>
								<span class="font-semibold text-[#2563eb]">{selectedFinishing}</span>
							</div>
						{/if}
						<div class="pt-2.5 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
							<span class="text-xs font-bold text-slate-900 dark:text-white">Estimasi Total:</span>
							<span class="text-xl font-black text-[#2563eb]">{rupiah(calculatedTotal)}</span>
						</div>
					</div>

					<!-- Action Buttons (Printku Style: + Keranjang, Beli Sekarang, Chat WA) -->
					<div class="space-y-2 pt-1">
						<div class="grid grid-cols-2 gap-2">
							<!-- Tombol Tambah ke Keranjang -->
							<button
								type="button"
								onclick={handleTambahKeranjang}
								class="flex items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-white text-blue-600 hover:bg-blue-50 hover:bg-sky-50 dark:hover:bg-slate-800 py-3 px-3 font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer"
							>
								<ShoppingCart class="h-4 w-4" />
								<span>+ Keranjang</span>
							</button>

							<!-- Tombol Beli Langsung (Checkout) -->
							<button
								type="button"
								onclick={handleBeliLangsung}
								class="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3 px-3 font-bold text-xs sm:text-sm shadow-md shadow-[#2563eb]/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
							>
								<span>Beli Langsung</span>
								<ArrowRight class="h-3.5 w-3.5" />
							</button>
						</div>

						<!-- Tombol Alternatif Bayar QRIS Instan & WhatsApp -->
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={handleKlikQris}
								disabled={isCreatingOrder}
								class="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-slate-200 py-2.5 px-2 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-60"
							>
								{#if isCreatingOrder}
									<span class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
									<span>Membuat QRIS...</span>
								{:else}
									<QrCode class="h-3.5 w-3.5 text-[#2563eb]" />
									<span>QRIS Cepat</span>
								{/if}
							</button>

							<a
								href={waOrderUrl}
								target="_blank"
								rel="noopener"
								class="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-2 font-bold text-xs shadow-xs transition active:scale-95"
							>
								<WhatsappIcon class="h-3.5 w-3.5" />
								<span>Tanya via WA</span>
							</a>
						</div>
					</div>
				</form>
			</div>
		</div>
	</main>

	<!-- Floating Bottom Action Bar on Mobile (Shopee / Digitz Style) -->
	<div
		class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 px-3.5 py-3 sm:hidden shadow-[0_-4px_25px_rgba(0,0,0,0.12)]"
	>
		<!-- Main Action Row -->
		<div class="flex items-center justify-between gap-2">
			<!-- Total Ringkasan -->
			<div class="min-w-0 flex-1">
				<div class="text-base font-black text-slate-900 dark:text-white truncate leading-tight">
					{rupiah(calculatedTotal)}
				</div>
				<span class="block text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
					{isMeter ? `${panjang}x${lebar}m · ${qty} pcs` : `${qty} ${data.item.unit}`}
				</span>
			</div>

			<!-- Action Buttons -->
			<div class="flex items-center gap-1.5 shrink-0">
				<!-- Tombol Scroll ke Form (Shopping Bag Icon sesuai referensi) -->
				<button
					type="button"
					onclick={scrollToForm}
					title="Buka Formulir Pesanan"
					class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-2xs active:scale-95 transition cursor-pointer"
				>
					<ShoppingBag class="h-4 w-4" />
				</button>

				<!-- Tombol Bayar QRIS (Biru/Cyan Sesuai Referensi) -->
				<button
					type="button"
					onclick={handleBottomQrisClick}
					disabled={isCreatingOrder}
					class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 text-xs font-black shadow-xs active:scale-95 transition cursor-pointer disabled:opacity-60"
				>
					{#if isCreatingOrder}
						<span class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
					{:else}
						<QrCode class="h-3.5 w-3.5" />
					{/if}
					<span>BAYAR QRIS</span>
				</button>

				<!-- Tombol Order WA (Hijau Sesuai Referensi) -->
				<a
					href={waOrderUrl}
					target="_blank"
					rel="noopener"
					class="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 text-xs font-black shadow-xs active:scale-95 transition"
				>
					<WhatsappIcon class="h-3.5 w-3.5" />
					<span>ORDER WA</span>
				</a>
			</div>
		</div>
	</div>
</div>

<!-- Modal QRIS Instan Dinamis -->
<QrisModal
	bind:open={qrisOpen}
	amount={activeFinalTotal ?? calculatedTotal}
	orderCode={activeOrderCode}
	customQrImage={customQr}
	onConfirm={selesaikanOrder}
/>

<!-- Modal Riwayat Pesanan Tamu (LocalStorage) -->
<GuestOrderModal bind:open={guestHistoryOpen} />
