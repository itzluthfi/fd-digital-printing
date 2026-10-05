<script lang="ts">
	import {
		ArrowLeft,
		CheckCircle2,
		ChevronRight,
		Clock,
		Copy,
		HelpCircle,
		Info,
		Link as LinkIcon,
		Minus,
		Plus,
		QrCode,
		ShieldCheck,
		Sparkles,
		Tag
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import QrisModal from '#lib/components/QrisModal.svelte';
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

	// Customer Form state
	let nama = $state('');
	let telepon = $state('');
	let email = $state('');
	let fileUrl = $state('');
	let notes = $state('');
	let isSubmitting = $state(false);

	// QRIS Modal state
	let qrisOpen = $state(false);

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
			return false;
		}
		if (!telepon.trim() || telepon.trim().length < 8) {
			toast.error('Silakan isi Nomor WhatsApp aktif yang valid.');
			return false;
		}
		return true;
	}

	let activeOrderCode = $state('');
	let customQr = $state('');
	let isCreatingOrder = $state(false);

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
					qty
				})
			});
			const result = await res.json();
			if (result.success && result.orderCode) {
				activeOrderCode = result.orderCode;
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

	let formEl: HTMLFormElement;

	function selesaikanOrder() {
		qrisOpen = false;
		if (activeOrderCode) {
			window.location.href = `/pesan/sukses/${activeOrderCode}`;
		} else if (formEl) {
			isSubmitting = true;
			formEl.submit();
		}
	}
</script>

<svelte:head>
	<title>{data.item.name} — FD Digital Printing</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-[#00aeef]/20 transition-colors">
	<!-- Navbar Sticky -->
	<header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
			<a
				href="/"
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
				<ThemeToggle class="h-8 w-8" />
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-6 sm:py-10">
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
										? 'border-[#00aeef] scale-105 shadow-sm'
										: 'border-transparent opacity-60 hover:opacity-100'}"
								>
									<img src={photo} alt="Thumbnail {idx}" class="h-full w-full object-cover" />
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Deskripsi & Keterangan Bahan -->
				<div class="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-5">
					<div>
						<h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">Deskripsi & Karakter Bahan</h2>
						<p class="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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
							<Info class="h-4 w-4 text-[#00aeef] shrink-0 mt-0.5" />
							<div>
								<h4 class="text-xs font-bold text-slate-900 dark:text-white">Instruksi File Desain</h4>
								<p class="mt-0.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
									{specs.instruksi}
								</p>
							</div>
						</div>
					</div>
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
							<span class="inline-block px-2.5 py-0.5 rounded-full bg-sky-50 text-[#00aeef] dark:bg-sky-950/60 dark:text-cyan-400 text-[11px] font-bold uppercase tracking-wider mb-2">
								{data.item.category}
							</span>
						{/if}
						<h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{data.item.name}</h1>
						<div class="mt-2 flex items-baseline gap-2">
							<span class="text-2xl sm:text-3xl font-black text-[#00aeef]">{rupiah(data.item.price)}</span>
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
										class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
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
										class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
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
										class="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer {panjang === p && lebar === l ? 'bg-[#00aeef] text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'}"
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

						<!-- Opsi Finishing -->
						{#if specs.finishingOptions.length > 0}
							<div class="pt-2">
								<span class="block text-[11px] text-slate-500 mb-1 font-medium">Finishing:</span>
								<select
									name="finishing"
									bind:value={selectedFinishing}
									class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
								>
									{#each specs.finishingOptions as opt}
										<option value={opt}>{opt}</option>
									{/each}
								</select>
							</div>
						{/if}
					</div>

					<!-- Step 2: Data Pemesan & File (Ringkas & Jelas) -->
					<div class="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
						<h3 class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
							2. Data Pemesan & Desain
						</h3>

						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Nama Pemesan <span class="text-red-500">*</span></span>
							</div>
							<input
								type="text"
								name="nama"
								required
								bind:value={nama}
								placeholder="Contoh: Budi Santoso"
								class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
							/>
						</div>

						<div>
							<div class="flex items-center justify-between mb-1">
								<span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">No. WhatsApp Aktif <span class="text-red-500">*</span></span>
							</div>
							<input
								type="tel"
								name="telepon"
								required
								bind:value={telepon}
								placeholder="Contoh: 08123456789"
								class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
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
								class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
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
								class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00aeef]"
							/>
						</div>
					</div>

					<!-- Total Ringkasan -->
					<div class="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between">
						<div>
							<span class="block text-[11px] font-medium text-slate-400">Total Pembayaran</span>
							<span class="text-xl font-black text-slate-900 dark:text-white">{rupiah(calculatedTotal)}</span>
						</div>
					</div>

					<!-- Dual Checkout Mode: Tombol Simpel & Elegan Sesuai Permintaan -->
					<div class="flex items-center gap-2 pt-1">
						<!-- Tombol QRIS -->
						<button
							type="button"
							onclick={handleKlikQris}
							disabled={isCreatingOrder}
							class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#00aeef] dark:hover:bg-[#0092c9] text-white py-3.5 px-3 font-bold text-xs sm:text-sm shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-60"
						>
							{#if isCreatingOrder}
								<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
								<span>Membuat QRIS...</span>
							{:else}
								<QrCode class="h-4 w-4" />
								<span>Bayar QRIS</span>
							{/if}
						</button>

						<!-- Tombol WhatsApp -->
						<a
							href={waOrderUrl}
							target="_blank"
							rel="noopener"
							class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-3 font-bold text-xs sm:text-sm shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 cursor-pointer"
						>
							<WhatsappIcon class="h-4 w-4" />
							<span>Order via WA</span>
						</a>
					</div>
				</form>
			</div>
		</div>
	</main>
</div>

<!-- Modal QRIS Instan Dinamis -->
<QrisModal
	bind:open={qrisOpen}
	amount={calculatedTotal}
	orderCode={activeOrderCode}
	customQrImage={customQr}
	onConfirm={selesaikanOrder}
/>
