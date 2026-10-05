<script lang="ts">
	import { page } from '$app/state';
	import {
		ArrowLeft,
		CheckCircle2,
		CreditCard,
		FileText,
		Flag,
		IdCard,
		Image as ImageIcon,
		Info,
		Newspaper,
		Plus,
		Printer,
		QrCode,
		ShieldCheck,
		ShoppingCart,
		Store,
		Trash2,
		Wallet
	} from 'lucide-svelte';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type CartItem = {
		name: string;
		unit: string;
		price: number;
		panjang?: number;
		lebar?: number;
		qty: number;
		subtotal: number;
	};

	let cart = $state<CartItem[]>([]);
	let selectedItemId = $state<number>(data.items[0]?.id ?? 0);
	let panjang = $state<number>(1);
	let lebar = $state<number>(1);
	let qty = $state<number>(1);

	// Customer Form state
	let nama = $state('');
	let telepon = $state('');
	let email = $state('');
	let fileUrl = $state('');
	let notes = $state('');
	let paymentMethod = $state<'qris' | 'transfer' | 'cash'>('qris');
	let isSubmitting = $state(false);

	const rupiah = (n: number) =>
		'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	const currentItem = $derived(data.items.find((i) => i.id === selectedItemId) ?? data.items[0]);
	const isMeter = $derived(currentItem?.unit === 'meter');

	const calculatedItemSubtotal = $derived.by(() => {
		if (!currentItem) return 0;
		if (isMeter) {
			const p = Math.max(0.1, Number(panjang) || 1);
			const l = Math.max(0.1, Number(lebar) || 1);
			const q = Math.max(1, Number(qty) || 1);
			return Math.round(p * l * currentItem.price * q);
		} else {
			const q = Math.max(1, Number(qty) || 1);
			return Math.round(currentItem.price * q);
		}
	});

	const grandTotal = $derived(cart.reduce((sum, item) => sum + item.subtotal, 0));

	function tambahKeCart() {
		if (!currentItem) return;
		const p = isMeter ? Math.max(0.1, Number(panjang) || 1) : undefined;
		const l = isMeter ? Math.max(0.1, Number(lebar) || 1) : undefined;
		const q = Math.max(1, Number(qty) || 1);

		cart.push({
			name: currentItem.name,
			unit: currentItem.unit,
			price: currentItem.price,
			panjang: p,
			lebar: l,
			qty: q,
			subtotal: calculatedItemSubtotal
		});

		// Reset qty
		qty = 1;
	}

	function hapusDariCart(index: number) {
		cart = cart.filter((_, i) => i !== index);
	}

	// Pre-select if URL has parameter ?produk=...
	$effect(() => {
		const produkParam = page.url.searchParams.get('produk');
		if (produkParam) {
			const found = data.items.find((i) => i.name.toLowerCase().includes(produkParam.toLowerCase()));
			if (found) {
				selectedItemId = found.id;
			}
		}
	});
</script>

<svelte:head>
	<title>Order Cetak Online — FD Digital Printing</title>
	<meta name="description" content="Pesan spanduk, stiker, brosur online cepat dan transparan di FD Digital Printing." />
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors">
	<!-- Navbar Checkout -->
	<header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
			<a href="/" class="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition text-xs sm:text-sm font-semibold">
				<ArrowLeft class="h-4 w-4" />
				<span>Kembali ke Beranda</span>
			</a>

			<div class="flex items-center gap-2">
				<img src="/logo.png" alt="Logo" class="h-8 w-8 rounded-lg object-contain bg-white shadow-2xs" />
				<span class="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Checkout Online</span>
			</div>

			<ThemeToggle class="h-8 w-8" />
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-6 sm:py-10">
		<div class="mb-6 sm:mb-8 text-center sm:text-left">
			<span class="text-xs font-bold uppercase tracking-wider text-[#00aeef]">Formulir Pemesanan</span>
			<h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Pesan Cetak Online</h1>
			<p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
				Pilih spesifikasi produk, lampirkan materi desain, dan selesaikan pembayaran dengan praktis.
			</p>
		</div>

		<form
			method="POST"
			action="?/checkout"
			onsubmit={() => (isSubmitting = true)}
			class="grid gap-8 lg:grid-cols-12"
		>
			<input type="hidden" name="cartItems" value={JSON.stringify(cart)} />

			<!-- KOLOM KIRI: PILIH PRODUK & DATA DIRI (7 Cols) -->
			<div class="space-y-6 lg:col-span-7">
				<!-- Step 1: Pilih Produk & Spesifikasi -->
				<div class="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
					<div class="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
						<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#00aeef] text-white text-xs font-black">1</span>
						<span>Pilih Produk & Spesifikasi</span>
					</div>

					<div class="mt-4 space-y-4">
						<div>
							<label for="produk-select" class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Jenis Layanan Cetak</label>
							<select
								id="produk-select"
								bind:value={selectedItemId}
								class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#00aeef] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							>
								{#each data.items as item}
									<option value={item.id}>
										{item.name} — {rupiah(item.price)} / {item.unit}
									</option>
								{/each}
							</select>
						</div>

						{#if isMeter}
							<div class="grid grid-cols-2 gap-3">
								<div>
									<label for="panjang-input" class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Panjang (meter)</label>
									<input
										id="panjang-input"
										type="number"
										step="0.1"
										min="0.1"
										bind:value={panjang}
										class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00aeef] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
									/>
								</div>
								<div>
									<label for="lebar-input" class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Lebar (meter)</label>
									<input
										id="lebar-input"
										type="number"
										step="0.1"
										min="0.1"
										bind:value={lebar}
										class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00aeef] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
									/>
								</div>
							</div>
						{/if}

						<div class="grid grid-cols-2 gap-3 items-end">
							<div>
								<label for="qty-input" class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
									Jumlah ({isMeter ? 'pcs banner' : currentItem?.unit ?? 'pcs'})
								</label>
								<input
									id="qty-input"
									type="number"
									min="1"
									bind:value={qty}
									class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00aeef] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
								/>
							</div>

							<div>
								<div class="text-[11px] text-slate-500 mb-1">Subtotal Item:</div>
								<div class="text-sm sm:text-base font-bold text-brand-900 dark:text-[#00aeef]">
									{rupiah(calculatedItemSubtotal)}
								</div>
							</div>
						</div>

						<button
							type="button"
							onclick={tambahKeCart}
							class="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-[#00aeef] py-2.5 px-4 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 dark:hover:bg-[#0092c9] transition active:scale-98 shadow-xs cursor-pointer"
						>
							<Plus class="h-4 w-4" />
							<span>Tambahkan ke Daftar Pesanan</span>
						</button>
					</div>
				</div>

				<!-- Step 2: Data Pemesan & File Desain -->
				<div class="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
					<div class="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
						<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#00aeef] text-white text-xs font-black">2</span>
						<span>Data Pemesan & File Desain</span>
					</div>

					<div class="mt-4 space-y-4">
						<div class="grid sm:grid-cols-2 gap-3">
							<div>
								<label for="nama-pemesan" class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nama Lengkap *</label>
								<input
									id="nama-pemesan"
									name="nama"
									type="text"
									required
									placeholder="Contoh: Budi Santoso"
									bind:value={nama}
									class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00aeef] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
								/>
							</div>

							<div>
								<label for="telepon-pemesan" class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nomor WhatsApp Aktif *</label>
								<input
									id="telepon-pemesan"
									name="telepon"
									type="tel"
									required
									placeholder="Contoh: 08123456789"
									bind:value={telepon}
									class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00aeef] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
								/>
							</div>
						</div>

						<div>
							<label for="fileurl-pemesan" class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
								Link File Desain (Google Drive / WeTransfer / Dropbox / Canva)
							</label>
							<input
								id="fileurl-pemesan"
								name="fileUrl"
								type="url"
								placeholder="https://drive.google.com/..."
								bind:value={fileUrl}
								class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00aeef] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							/>
							<p class="mt-1 text-[11px] text-slate-500">
								*Pastikan izin link diset "Siapa saja yang memiliki link dapat melihat". Belum punya file? Kosongkan saja, kami bantu buatkan.
							</p>
						</div>

						<div>
							<label for="notes-pemesan" class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Catatan Tambahan (Opsional)</label>
							<textarea
								id="notes-pemesan"
								name="notes"
								rows="2"
								placeholder="Misal: finishing mata ayam 4 sudut, laminasi doff, potong pas garis..."
								bind:value={notes}
								class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 focus:border-[#00aeef] focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
							></textarea>
						</div>
					</div>
				</div>

				<!-- Step 3: Pilihan Pembayaran -->
				<div class="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
					<div class="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
						<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#00aeef] text-white text-xs font-black">3</span>
						<span>Metode Pembayaran</span>
					</div>

					<div class="mt-4 grid gap-3 sm:grid-cols-3">
						<label
							class="flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition {paymentMethod === 'qris'
								? 'border-[#00aeef] bg-[#00aeef]/10 text-slate-900 dark:text-white'
								: 'border-slate-200 bg-slate-50/50 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'}"
						>
							<div class="flex items-center justify-between">
								<QrCode class="h-5 w-5 text-[#00aeef]" />
								<input type="radio" name="paymentMethod" value="qris" bind:group={paymentMethod} class="accent-[#00aeef]" />
							</div>
							<div class="mt-3">
								<div class="text-xs font-bold">QRIS Instan</div>
								<div class="text-[11px] text-slate-500 dark:text-slate-400">Scan via e-wallet/BCA</div>
							</div>
						</label>

						<label
							class="flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition {paymentMethod === 'transfer'
								? 'border-[#00aeef] bg-[#00aeef]/10 text-slate-900 dark:text-white'
								: 'border-slate-200 bg-slate-50/50 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'}"
						>
							<div class="flex items-center justify-between">
								<CreditCard class="h-5 w-5 text-indigo-500" />
								<input type="radio" name="paymentMethod" value="transfer" bind:group={paymentMethod} class="accent-[#00aeef]" />
							</div>
							<div class="mt-3">
								<div class="text-xs font-bold">Transfer Bank</div>
								<div class="text-[11px] text-slate-500 dark:text-slate-400">BCA / Mandiri / BRI</div>
							</div>
						</label>

						<label
							class="flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition {paymentMethod === 'cash'
								? 'border-[#00aeef] bg-[#00aeef]/10 text-slate-900 dark:text-white'
								: 'border-slate-200 bg-slate-50/50 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'}"
						>
							<div class="flex items-center justify-between">
								<Store class="h-5 w-5 text-emerald-500" />
								<input type="radio" name="paymentMethod" value="cash" bind:group={paymentMethod} class="accent-[#00aeef]" />
							</div>
							<div class="mt-3">
								<div class="text-xs font-bold">Bayar di Toko</div>
								<div class="text-[11px] text-slate-500 dark:text-slate-400">COD saat ambil pesanan</div>
							</div>
						</label>
					</div>
				</div>
			</div>

			<!-- KOLOM KANAN: RINGKASAN ORDER & SUBMIT (5 Cols) -->
			<div class="space-y-6 lg:col-span-5">
				<div class="sticky top-20 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
					<div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
						<div class="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
							<ShoppingCart class="h-4 w-4 text-[#00aeef]" />
							<span>Daftar Pesanan ({cart.length})</span>
						</div>
					</div>

					<!-- Item List -->
					<div class="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
						{#if cart.length === 0}
							<div class="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-800">
								Belum ada produk yang ditambahkan. Pilih produk di langkah 1 dan klik "Tambahkan".
							</div>
						{:else}
							{#each cart as item, idx}
								<div class="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
									<div class="min-w-0 flex-1">
										<p class="font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
										<p class="text-[11px] text-slate-500 dark:text-slate-400">
											{#if item.unit === 'meter' && item.panjang && item.lebar}
												Ukuran {item.panjang}x{item.lebar}m · Qty: {item.qty}
											{:else}
												Qty: {item.qty} {item.unit}
											{/if}
										</p>
										<p class="font-semibold text-slate-800 dark:text-slate-200 mt-1">
											{rupiah(item.subtotal)}
										</p>
									</div>
									<button
										type="button"
										onclick={() => hapusDariCart(idx)}
										class="p-1 text-slate-400 hover:text-red-500 transition"
										title="Hapus item"
									>
										<Trash2 class="h-3.5 w-3.5" />
									</button>
								</div>
							{/each}
						{/if}
					</div>

					<!-- Pricing Calculation -->
					<div class="mt-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
						<div class="flex justify-between text-slate-500">
							<span>Subtotal Cetak</span>
							<span class="font-medium text-slate-800 dark:text-slate-200">{rupiah(grandTotal)}</span>
						</div>
						<div class="flex justify-between text-slate-500">
							<span>Biaya Admin Web</span>
							<span class="font-semibold text-emerald-600">Gratis (Rp 0)</span>
						</div>
						<div class="flex justify-between text-base font-extrabold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
							<span>Total Bayar</span>
							<span class="text-[#00aeef]">{rupiah(grandTotal)}</span>
						</div>
					</div>

					<!-- Submit Button -->
					<div class="mt-6">
						<button
							type="submit"
							disabled={cart.length === 0 || isSubmitting}
							class="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00aeef] py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-[#00aeef]/25 hover:bg-[#0092c9] transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
						>
							{#if isSubmitting}
								<span>Memproses Pesanan...</span>
							{:else}
								<CheckCircle2 class="h-4 w-4" />
								<span>Kirim Pesanan Sekarang</span>
							{/if}
						</button>

						<p class="mt-3 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
							<ShieldCheck class="h-3.5 w-3.5 text-emerald-500" />
							<span>Pesanan langsung tercatat resmi di antrean produksi FD</span>
						</p>
					</div>
				</div>
			</div>
		</form>
	</main>
</div>
