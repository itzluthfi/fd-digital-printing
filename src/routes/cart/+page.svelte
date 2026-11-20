<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		FileText,
		Minus,
		PackageCheck,
		Plus,
		ShoppingBag,
		ShoppingCart,
		Trash2
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import { cart } from '#lib/cart.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const rupiah = (n: number) =>
		'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	function handleHapus(id: string, name: string) {
		cart.removeItem(id);
		toast.success(`"${name}" dihapus dari keranjang.`);
	}

	function handleUpdateQty(id: string, current: number, delta: number) {
		const next = current + delta;
		if (next < 1) return;
		cart.updateQty(id, next);
	}
</script>

<svelte:head>
	<title>Keranjang Belanja — FD Digital Printing</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors">
	<!-- Navbar Header -->
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
					class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-[#2563eb] hover:text-blue-600 transition active:scale-95"
				>
					<PackageCheck class="h-3.5 w-3.5 text-blue-600" />
					<span class="hidden sm:inline">Status Pesanan</span>
				</a>
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
			<span class="font-bold text-slate-900 dark:text-white">Daftar Belanja (Keranjang)</span>
		</nav>

		<!-- Header Judul -->
		<div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-4">
			<div>
				<h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Daftar Belanja Anda</h1>
				<p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Periksa spesifikasi item cetak Anda sebelum melanjutkan ke pembayaran.</p>
			</div>
			<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-blue-600 text-xs font-bold self-start sm:self-auto">
				<ShoppingCart class="h-3.5 w-3.5" />
				{cart.count} Item ({cart.itemCount} Jenis Produk)
			</span>
		</div>

		{#if cart.items.length === 0}
			<!-- Empty State -->
			<div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 sm:p-16 text-center shadow-xs max-w-lg mx-auto">
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
					<ShoppingBag class="h-8 w-8" />
				</div>
				<h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Keranjang Belanja Masih Kosong</h2>
				<p class="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
					Belum ada pesanan cetak yang ditambahkan. Silakan pilih produk percetakan dari katalog kami.
				</p>
				<div class="mt-6">
					<a
						href="/katalog"
						class="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-[#1d4ed8] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition active:scale-95"
					>
						<ShoppingCart class="h-4 w-4" />
						<span>Pilih Produk di Katalog</span>
					</a>
				</div>
			</div>
		{:else}
			<div class="grid gap-8 lg:grid-cols-12 items-start">
				<!-- Kolom Kiri: Daftar Item Belanja (8 Cols) -->
				<div class="lg:col-span-8 space-y-4">
					{#each cart.items as item (item.id)}
						<div class="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs transition hover:border-[#2563eb]/40">
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2 mb-1">
										{#if item.category}
											<span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
												{item.category}
											</span>
										{/if}
										<span class="text-xs font-bold text-blue-600">
											{rupiah(item.price)} <span class="text-[10px] text-slate-400 font-normal">/{item.unit === 'meter' ? 'm²' : item.unit}</span>
										</span>
									</div>
									<h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
										{item.name}
									</h2>

									<!-- Spesifikasi Cetak (Badges Ala Printku) -->
									<div class="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
										{#if item.unit === 'meter' && item.panjang && item.lebar}
											<span class="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 font-semibold text-slate-700 dark:text-slate-300">
												📐 Ukuran: {item.panjang}m × {item.lebar}m ({Math.max(1, item.panjang * item.lebar).toFixed(2)} m²)
											</span>
										{/if}
										{#if item.finishing}
											<span class="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 font-semibold text-blue-600">
												✨ Finishing: {item.finishing}
											</span>
										{/if}
										{#if item.fileUrl}
											<a
												href={item.fileUrl}
												target="_blank"
												rel="noopener"
												class="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 px-2 py-1 font-semibold text-sky-700 dark:text-cyan-300 hover:underline flex items-center gap-1"
											>
												<FileText class="h-3 w-3" />
												<span>Link Desain</span>
											</a>
										{:else}
											<span class="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-slate-400">
												File: (Kirim via WA)
											</span>
										{/if}
									</div>

									{#if item.notes}
										<p class="mt-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2 border border-slate-100 dark:border-slate-800">
											<strong class="text-slate-700 dark:text-slate-300">Catatan:</strong> {item.notes}
										</p>
									{/if}
								</div>

								<!-- Tombol Hapus -->
								<button
									type="button"
									onclick={() => handleHapus(item.id, item.name)}
									title="Hapus dari keranjang"
									class="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition active:scale-95 cursor-pointer shrink-0"
								>
									<Trash2 class="h-4 w-4" />
								</button>
							</div>

							<!-- Bar Bawah: Qty Counter & Subtotal -->
							<div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
								<!-- Qty Counter [-] [qty] [+] -->
								<div class="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden">
									<button
										type="button"
										onclick={() => handleUpdateQty(item.id, item.qty, -1)}
										disabled={item.qty <= 1}
										class="px-2.5 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-30 cursor-pointer"
									>
										<Minus class="h-3.5 w-3.5" />
									</button>
									<span class="w-10 text-center text-xs font-bold text-slate-900 dark:text-white">
										{item.qty}
									</span>
									<button
										type="button"
										onclick={() => handleUpdateQty(item.id, item.qty, 1)}
										class="px-2.5 py-1 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
									>
										<Plus class="h-3.5 w-3.5" />
									</button>
								</div>

								<!-- Subtotal -->
								<div class="text-right">
									<span class="block text-[10px] text-slate-400 font-medium">Subtotal</span>
									<span class="text-sm sm:text-base font-black text-slate-900 dark:text-white">
										{rupiah(item.subtotal)}
									</span>
								</div>
							</div>
						</div>
					{/each}

					<!-- Tombol Tambah Produk Lain -->
					<div class="pt-2">
						<a
							href="/katalog"
							class="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-[#2563eb] hover:text-blue-600 transition active:scale-95"
						>
							<Plus class="h-3.5 w-3.5 text-blue-600" />
							<span>Tambah Pesanan Produk Lain</span>
						</a>
					</div>
				</div>

				<!-- Kolom Kanan: Ringkasan Belanja (4 Cols Sticky) -->
				<div class="lg:col-span-4 lg:sticky lg:top-20 space-y-4">
					<div class="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
						<h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
							Ringkasan Belanja
						</h2>

						<div class="space-y-2 text-xs">
							<div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
								<span>Total Item:</span>
								<span class="font-bold text-slate-800 dark:text-slate-200">{cart.count} pcs ({cart.itemCount} jenis)</span>
							</div>
							<div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
								<span>Subtotal Cetak:</span>
								<span class="font-bold text-slate-800 dark:text-slate-200">{rupiah(cart.total)}</span>
							</div>
							<div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
								<span>Pengambilan:</span>
								<span class="font-bold text-emerald-600 dark:text-emerald-400">Tersedia Ambil di Toko (Gratis)</span>
							</div>
						</div>

						<div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
							<span class="text-xs font-bold text-slate-900 dark:text-white">Total Akhir:</span>
							<span class="text-xl sm:text-2xl font-black text-blue-600">{rupiah(cart.total)}</span>
						</div>

						<!-- Action Checkout Button -->
						<div class="pt-2 space-y-2">
							<a
								href="/checkout"
								class="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-[#1d4ed8] text-white py-3.5 px-4 font-bold text-xs sm:text-sm shadow-md shadow-[#2563eb]/20 transition-all hover:scale-[1.02] active:scale-95 text-center cursor-pointer"
							>
								<span>Lanjut ke Checkout</span>
								<ArrowRight class="h-4 w-4" />
							</a>

							<a
								href={`https://wa.me/${data.company.whatsapp}?text=${encodeURIComponent(`Halo FD Digital Printing, saya mau konsultasi isi keranjang belanja saya (${cart.itemCount} produk, total ${rupiah(cart.total)}).`)}`}
								target="_blank"
								rel="noopener"
								class="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 py-3 px-4 font-bold text-xs transition active:scale-95 text-center"
							>
								<WhatsappIcon class="h-4 w-4" />
								<span>Konsultasi Keranjang via WA</span>
							</a>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>
