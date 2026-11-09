<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		Clock,
		Cpu,
		Layers,
		LogIn,
		PackageCheck,
		Search,
		ShoppingBag,
		ShoppingCart,
		Sparkles,
		User,
		Wallet,
		Zap
	} from 'lucide-svelte';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import TelegramIcon from '#lib/components/TelegramIcon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import GuestOrderModal from '#lib/components/GuestOrderModal.svelte';
	import { getProductImageUrl } from '#lib/products';
	import { cart } from '#lib/cart.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let selectedCategory = $state('Semua');
	let searchQuery = $state('');
	let guestHistoryOpen = $state(false);

	const categories = $derived([
		'Semua',
		...Array.from(new Set(data.items.map((i) => i.category).filter((c): c is string => Boolean(c))))
	]);

	const filteredItems = $derived(
		data.items.filter((i) => {
			const matchCategory = selectedCategory === 'Semua' || i.category === selectedCategory;
			const q = searchQuery.toLowerCase().trim();
			if (!q) return matchCategory;
			return matchCategory && i.name.toLowerCase().includes(q);
		})
	);

	const rupiah = (n: number) =>
		'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	const SATUAN_SINGKAT: Record<string, string> = {
		meter: '/m²',
		pcs: '/pcs',
		lembar: '/lbr',
		paket: '/paket'
	};

	const waLink = (pesan: string) =>
		`https://wa.me/${data.company.whatsapp}?text=${encodeURIComponent(pesan)}`;
	const WA_UMUM = waLink('Halo FD Digital Printing, saya mau tanya-tanya produk di e-commerce.');
</script>

<svelte:head>
	<title>E-Commerce & Toko Online Percetakan — FD Digital Printing</title>
	<meta
		name="description"
		content="Toko Online & E-Commerce Resmi FD Digital Printing Sidoarjo: Belanja spanduk, banner outdoor, stiker label kemasan, brosur A3+, dan kartu nama dengan harga transparan dan bayar QRIS instan."
	/>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-[#2563eb]/20 transition-colors">
	<!-- Navbar Header -->
	<header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md transition-colors">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:py-3">
			<!-- Logo & Teks Pojok Kiri Menuju Compro (/) -->
			<a href="/" title="Kembali ke Company Profile" class="group flex items-center gap-2.5 sm:gap-3 transition">
				<img
					src="/logo.png"
					alt="Logo FD Digital Printing"
					class="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain shadow-2xs group-hover:scale-105 transition-transform"
				/>
				<div class="leading-tight">
					<span class="block text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-[#2563eb] transition-colors">FD Digital Printing</span>
					<span class="block text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Toko Online & E-Commerce</span>
				</div>
			</a>

			<!-- Kanan: Status Pesanan + Button Masuk / Login + ThemeToggle + Telegram -->
			<div class="flex items-center gap-2">
				<a
					href="/status-order"
					class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-[#2563eb] hover:text-[#2563eb] transition active:scale-95"
					title="Lacak Status Pesanan / Riwayat Transaksi"
				>
					<PackageCheck class="h-3.5 w-3.5 text-[#2563eb]" />
					<span class="hidden sm:inline">Status Pesanan</span>
				</a>

				<a
					href="/cart"
					class="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#2563eb] transition active:scale-95"
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
						class="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95"
					>
						<User class="h-3.5 w-3.5" />
						<span>{data.user.role === 'customer' ? 'Akun Saya' : 'Dashboard'}</span>
					</a>
				{:else}
					<a
						href="/sign-in"
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-[#2563eb] hover:text-[#2563eb] transition active:scale-95"
					>
						<LogIn class="h-3.5 w-3.5 text-[#2563eb]" />
						<span>Masuk</span>
					</a>
				{/if}

				<ThemeToggle class="h-9 w-9 sm:h-10 sm:w-10" />

				<a
					href={data.company.telegramUrl}
					target="_blank"
					rel="noopener"
					aria-label="Telegram FD Printing"
					class="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-md shadow-[#229ED9]/20 transition hover:bg-[#1e8ec3] hover:scale-105 active:scale-95"
				>
					<TelegramIcon class="h-5 w-5" />
				</a>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-4 py-6 sm:py-10">
		<!-- Store Hero / Banner -->
		<div class="mb-8 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-xs relative overflow-hidden">
			<div class="relative z-10 max-w-3xl">
				<a
					href="/"
					class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline mb-2"
				>
					<ArrowLeft class="h-3.5 w-3.5" /> Kembali ke Company Profile Utama
				</a>
				<h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
					Katalog Produk & Percetakan Online
				</h1>
				<p class="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
					Pilih produk percetakan, tentukan spesifikasi ukuran & finishing, dan pesan langsung secara online. Pembayaran instan dengan verifikasi otomatis.
				</p>
				<div class="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
					<span class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80 font-medium">
						<Wallet class="h-3.5 w-3.5 text-blue-600" /> QRIS & Transfer Otomatis
					</span>
					<span class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80 font-medium">
						<Clock class="h-3.5 w-3.5 text-blue-600" /> Buka s/d 02.00 WIB
					</span>
					<span class="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80 font-medium">
						<Zap class="h-3.5 w-3.5 text-amber-500" /> Bisa Ditunggu / Kilat
					</span>
				</div>
			</div>
		</div>

		<!-- Category Filter & Search -->
		<div class="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
			<!-- Category Tabs -->
			<div class="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
				{#each categories as cat}
					<button
						type="button"
						onclick={() => (selectedCategory = cat)}
						class="shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer {selectedCategory === cat
							? 'bg-blue-600 text-white shadow-xs'
							: 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/90'}"
					>
						{cat}
					</button>
				{/each}
			</div>

			<!-- Search -->
			<div class="relative w-full md:w-72">
				<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari produk cetak..."
					class="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
				/>
			</div>
		</div>

		<!-- Product Cards Grid (E-Commerce Listings) -->
		<div class="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
			{#each filteredItems as item}
				{@const photoUrl = getProductImageUrl(item)}
				<div class="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-xs hover:border-[#2563eb]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
					<!-- Photo -->
					<a href={item.url} class="relative block aspect-[4/3] sm:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
						<img
							src={photoUrl}
							alt={item.name}
							class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
							loading="lazy"
						/>
						
						<span class="absolute bottom-2 right-2 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:text-slate-200 shadow-xs">
							{item.unit}
						</span>
					</a>

					<!-- Content -->
					<div class="p-3.5 sm:p-5 flex-1 flex flex-col justify-between">
						<a href={item.url} class="block">
							<span class="text-[10px] font-bold text-[#2563eb] uppercase tracking-wider">{item.category}</span>
							<h3 class="mt-0.5 text-xs sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#2563eb] transition-colors">
								{item.name}
							</h3>
							<p class="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
								Mulai <strong class="text-xs sm:text-base font-black text-slate-900 dark:text-white">{rupiah(item.price)}</strong><span class="text-[10px] sm:text-xs text-slate-400">{SATUAN_SINGKAT[item.unit] ?? ''}</span>
							</p>
						</a>

						<div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-2">
							<a
								href={item.url}
								class="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 py-2 px-3 text-[11px] sm:text-xs font-bold text-white shadow-xs transition active:scale-95"
							>
								<ShoppingCart class="h-3.5 w-3.5" />
								<span>Order</span>
							</a>

							<a
								href={waLink(`Halo FD Digital Printing, saya mau konsultasi produk: ${item.name}.`)}
								target="_blank"
								rel="noopener"
								title="Chat WhatsApp"
								class="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-400 hover:bg-green-100 transition active:scale-95 border border-green-200/80 dark:border-green-800"
							>
								<WhatsappIcon class="h-4 w-4" />
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Link to Machines & Company Profile -->
		<div class="mt-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#2563eb]">
					<Cpu class="h-6 w-6" />
				</div>
				<div>
					<h3 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Ingin Tahu Mesin yang Memproduksi Produk Ini?</h3>
					<p class="text-xs text-slate-500">Lihat spesifikasi teknis, teknologi printhead, dan contoh hasil cetak mesin kami.</p>
				</div>
			</div>
			<div class="flex items-center gap-2.5">
				<a
					href="/mesin"
					class="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition"
				>
					<Cpu class="h-3.5 w-3.5" />
					<span>Armada Mesin</span>
				</a>
				<a
					href="/"
					class="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-[#2563eb] transition"
				>
					<ArrowLeft class="h-3.5 w-3.5" />
					<span>Company Profile</span>
				</a>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="mt-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
		<div class="mx-auto max-w-7xl px-4 py-8">
			<div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
				<div class="flex items-center gap-2.5">
					<img src="/logo.png" alt="Logo" class="h-6 w-6 rounded-md object-contain" />
					<span class="font-bold text-slate-900 dark:text-white">FD Digital Printing</span>
					<span class="text-slate-400">·</span>
					<span>{data.company.alamatLengkap}</span>
				</div>
				<div class="flex items-center gap-4 font-medium">
					<a href="/" class="hover:text-[#2563eb]">Company Profile</a>
					<a href="/mesin" class="hover:text-[#2563eb]">Armada Mesin</a>
					<a href="/pesan" class="hover:text-[#2563eb]">Form Order</a>
				</div>
			</div>
		</div>
	</footer>

	<!-- Floating WhatsApp Button -->
	<a
		href={WA_UMUM}
		target="_blank"
		rel="noopener"
		aria-label="Chat WhatsApp FD Digital Printing"
		class="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-40 flex h-13 w-13 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl shadow-green-600/30 transition hover:scale-105 hover:bg-green-700 active:scale-95"
	>
		<WhatsappIcon class="h-6 w-6 sm:h-7 sm:w-7" />
	</a>

	<!-- Modal Riwayat Pesanan Tamu -->
	<GuestOrderModal bind:open={guestHistoryOpen} />
</div>
