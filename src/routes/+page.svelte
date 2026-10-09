<script lang="ts">
	import {
		ArrowDown,
		ArrowRight,
		BadgeCheck,
		ChevronDown,
		Clock,
		ExternalLink,
		Flag,
		IdCard,
		Image as ImageIcon,
		LogIn,
		MapPin,
		MessagesSquare,
		Newspaper,
		Printer,
		ShoppingBag,
		ShoppingCart,
		Sparkles,
		Sticker,
		Tag,
		User,
		Wallet,
		Zap
	} from 'lucide-svelte';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import TelegramIcon from '#lib/components/TelegramIcon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import GuestOrderModal from '#lib/components/GuestOrderModal.svelte';
	import { getProductImageUrl } from '#lib/products';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let selectedCategory = $state('Semua');
	let guestHistoryOpen = $state(false);

	const categories = $derived([
		'Semua',
		...Array.from(new Set(data.items.map((i) => i.category).filter((c): c is string => Boolean(c))))
	]);

	const filteredItems = $derived(
		selectedCategory === 'Semua'
			? data.items
			: data.items.filter((i) => i.category === selectedCategory)
	);

	const WA_NUMBER = '6289507370805';
	const WA_DISPLAY = '0895-0737-0805';
	const TELEGRAM_URL = 'https://t.me/FD_printing_bot';

	const KONTAK = {
		alamat: 'Jl. Raya Wadungasri No. 42, Sidoarjo',
		jam: 'Senin–Sabtu: 10.00–02.00 · Minggu: 10.00–18.00'
	};
	const MAP_QUERY = 'FD Digital Printing, Jl. Raya Wadungasri No. 42';
	const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
	const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;

	const waLink = (pesan: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(pesan)}`;
	const WA_UMUM = waLink('Halo FD Digital Printing, saya mau tanya-tanya pesanan cetak.');

	const rupiah = (n: number) =>
		'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	const SATUAN_SINGKAT: Record<string, string> = {
		meter: '/m²',
		pcs: '/pcs',
		lembar: '/lbr',
		paket: '/paket'
	};

	const LANGKAH = [
		{ no: '1', judul: 'Pilih Produk', teks: 'Pilih jenis cetakan & ukuran di katalog atau langsung checkout.' },
		{ no: '2', judul: 'Kirim Desain', teks: 'Upload file desain atau ceritakan konsep jika belum punya.' },
		{ no: '3', judul: 'Cetak & Ambil', teks: 'Pantau status live online. Siap ambil di toko atau dikirim.' }
	];

	const FAQ = [
		{
			t: 'Belum punya file desain, apakah bisa dibantu?',
			j: 'Bisa! Kirimkan materi tulisan atau contoh referensi. Tim desainer kami siap membantu persiapan layout cetak.'
		},
		{
			t: 'Apakah pesanan bisa ditunggu / kilat?',
			j: 'Bisa, disesuaikan dengan antrean mesin saat itu. Silakan hubungi admin untuk reservasi slot cetak cepat.'
		},
		{
			t: 'Berapa minimal order cetak di FD?',
			j: 'Tidak ada batasan minimal order. Stiker A3+ bisa mulai 1 lembar, dan spanduk bisa mulai 1 meter persegi.'
		},
		{
			t: 'Bagaimana metode pembayarannya?',
			j: 'Mendukung QRIS instan (semua e-wallet & m-banking), transfer bank, serta tunai langsung di kasir.'
		}
	];
</script>

<svelte:head>
	<title>FD Digital Printing — Cetak Cepat, Hasil Hebat</title>
	<meta
		name="description"
		content="FD Digital Printing: cetak banner, stiker, brosur, kartu nama, dan cetak foto cepat dengan harga transparan. Jl. Raya Wadungasri No. 42."
	/>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-[#00aeef]/20 transition-colors">
	<!-- Navbar Sticky & Glassmorphism -->
	<header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 dark:bg-slate-900/90 dark:border-slate-800 backdrop-blur-md transition-colors">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:py-3">
			<a href="#atas" class="group flex items-center gap-2.5 sm:gap-3 transition">
				<img src="/logo.png" alt="Logo FD Digital Printing" class="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain shadow-2xs group-hover:scale-105 transition-transform" />
				<div class="leading-tight">
					<span class="block text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">FD Digital Printing</span>
					<span class="block text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Cetak cepat, hasil hebat</span>
				</div>
			</a>

			<nav class="hidden items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
				<a href="#layanan" class="transition hover:text-[#00aeef]">Layanan & Harga</a>
				<a href="#alur-order" class="transition hover:text-[#00aeef]">Cara Order</a>
				<a href="/lacak" class="transition hover:text-[#00aeef]">Lacak Order</a>
				<a href="#lokasi" class="transition hover:text-[#00aeef]">Lokasi Toko</a>
				<a href="#faq" class="transition hover:text-[#00aeef]">FAQ</a>
			</nav>

			<div class="flex items-center gap-2">
				{#if data.user}
					<a
						href={data.user.role === 'operator' ? '/order' : '/dashboard'}
						class="inline-flex items-center gap-1.5 rounded-xl bg-[#00aeef] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0092c9] transition active:scale-95"
					>
						<User class="h-3.5 w-3.5" />
						<span>{data.user.role === 'customer' ? 'Akun Saya' : 'Dashboard'}</span>
					</a>
				{:else}
					<a
						href="/sign-in"
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-[#00aeef] hover:text-[#00aeef] transition active:scale-95"
					>
						<LogIn class="h-3.5 w-3.5" />
						<span>Masuk</span>
					</a>
				{/if}

				<ThemeToggle class="h-9 w-9 sm:h-10 sm:w-10" />

				<a
					href={TELEGRAM_URL}
					target="_blank"
					rel="noopener"
					aria-label="Chat Telegram FD Digital Printing"
					title="Buka Telegram Bot"
					class="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#229ED9] text-white shadow-md shadow-[#229ED9]/20 transition hover:bg-[#1e8ec3] hover:scale-105 active:scale-95"
				>
					<TelegramIcon class="h-5 w-5" />
				</a>
			</div>
		</div>
	</header>

	<main>
		<!-- SECTION 1: HERO BANNER (CLEAN, MINIMALIST, RESPONSIVE) -->
		<section id="atas" class="mx-auto max-w-6xl px-4 pt-3 sm:pt-6 pb-2">
			<!-- Banner Container with responsive scaling, crisp border, and rounded corners -->
			<div class="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md sm:shadow-lg transition-all group animate-fade-up">
				<img
					src="/banner-avatar.png"
					alt="FD Digital Printing - Fast and High Quality Service Solution"
					class="w-full h-auto block select-none object-contain"
					loading="eager"
				/>

				<!-- Floating Action (seperti referensi digitz.shop) -->
				<a
					href="#layanan"
					class="absolute bottom-2.5 right-2.5 sm:bottom-5 sm:right-5 inline-flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-slate-950/80 hover:bg-slate-950 text-white backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-bold shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20"
				>
					<span>Jelajahi Katalog</span>
					<ChevronDown class="h-3.5 w-3.5" />
				</a>
			</div>
		</section>

		<!-- SECTION 2: KATALOG LAYANAN & FILTER KATEGORI -->
		<section id="layanan" class="scroll-mt-16 py-6 sm:py-10">
			<div class="mx-auto max-w-6xl px-4">
				<!-- Header & Category Pills (Sesuai Referensi Digitz.shop) -->
				<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4 sm:pb-5">
					<!-- Category Filter Tabs -->
					<div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
						{#each categories as cat}
							<button
								type="button"
								onclick={() => (selectedCategory = cat)}
								class="shrink-0 rounded-xl px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer {selectedCategory === cat
									? 'bg-slate-900 text-white dark:bg-[#00aeef] shadow-xs'
									: 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-800'}"
							>
								{cat}
							</button>
						{/each}
					</div>

					<a
						href="/pesan"
						class="self-start md:self-auto inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#00aeef] hover:underline"
					>
						<span>Buka Form Order</span>
						<ArrowRight class="h-4 w-4" />
					</a>
				</div>

				<div class="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
					{#each filteredItems as item}
						{@const photoUrl = getProductImageUrl(item)}
						<div
							onmouseenter={() => {
								if (typeof window !== 'undefined') {
									window.dispatchEvent(
										new CustomEvent('dipi:item-hover', {
											detail: {
												id: item.id,
												name: item.name,
												price: item.price,
												unit: item.unit
											}
										})
									);
								}
							}}
							onmouseleave={() => {
								if (typeof window !== 'undefined') {
									window.dispatchEvent(new CustomEvent('dipi:item-unhover'));
								}
							}}
							class="group flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 dark:border-slate-800 shadow-xs hover:border-[#00aeef]/60 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
						>
							<!-- Image Container with Zoom effect -->
							<a href={item.url} class="relative block aspect-[4/3] sm:h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
								<img
									src={photoUrl}
									alt={item.name}
									class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
									loading="lazy"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
								<span class="absolute bottom-1.5 right-1.5 sm:bottom-2.5 sm:right-2.5 rounded-md sm:rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-xs">
									{item.unit}
								</span>
							</a>

							<!-- Details -->
							<div class="p-3 sm:p-4 md:p-5 flex-1 flex flex-col justify-between">
								<a href={item.url} class="block">
									<h3 class="text-xs sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#00aeef] transition-colors">
										{item.name}
									</h3>
									<p class="mt-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
										Mulai <strong class="text-xs sm:text-base font-black text-slate-900 dark:text-white">{rupiah(item.price)}</strong><span class="text-[10px] sm:text-xs text-slate-400">{SATUAN_SINGKAT[item.unit] ?? ''}</span>
									</p>
								</a>

								<!-- Dual Action Buttons: Detail & WhatsApp -->
								<div class="mt-3 sm:mt-4 pt-2.5 sm:pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 sm:gap-2">
									<a
										href={item.url}
										class="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-slate-900 dark:bg-[#00aeef] py-1.5 sm:py-2.5 px-2 sm:px-3 text-[11px] sm:text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:hover:bg-[#0092c9] transition active:scale-95"
									>
										<ShoppingCart class="h-3 w-3 sm:h-3.5 sm:w-3.5" />
										<span>Order</span>
									</a>

									<a
										href={waLink(`Halo FD Digital Printing, saya mau konsultasi & pesan: ${item.name}.`)}
										target="_blank"
										rel="noopener"
										title="Chat WhatsApp"
										class="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-400 hover:bg-green-100 transition active:scale-95 border border-green-200/80 dark:border-green-800"
									>
										<WhatsappIcon class="h-3.5 w-3.5 sm:h-4 sm:w-4" />
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- SECTION 3: CARA ORDER CEPAT -->
		<section id="alur-order" class="scroll-mt-16 bg-white dark:bg-slate-900/60 py-12 sm:py-16 md:py-20 border-y border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-6xl px-4">
				<div class="text-center max-w-xl mx-auto mb-8 sm:mb-10">
					<span class="text-xs font-bold tracking-wider text-[#00aeef] uppercase">Praktis & Terpantau</span>
					<h2 class="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Alur Order Cepat</h2>
					<p class="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">3 langkah mudah tanpa repot antre panjang.</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
					{#each LANGKAH as l}
						<div class="flex flex-col items-start rounded-2xl border border-slate-200/80 bg-slate-50/60 dark:bg-slate-800/60 dark:border-slate-800 p-5 transition hover:border-[#00aeef]/40">
							<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 dark:bg-[#00aeef] text-white font-black text-base shadow-xs mb-3">
								{l.no}
							</span>
							<h4 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{l.judul}</h4>
							<p class="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{l.teks}</p>
						</div>
					{/each}
				</div>

				<div class="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
					<span class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700">
						<Wallet class="h-3.5 w-3.5 text-[#00aeef]" /> Cash · QRIS · Transfer
					</span>
					<span class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200/60 dark:border-slate-700">
						<Clock class="h-3.5 w-3.5 text-[#00aeef]" /> Buka s/d 02.00 Dini Hari
					</span>
				</div>
			</div>
		</section>

		<!-- SECTION 4: WORKSHOP & PETA BESAR -->
		<section id="lokasi" class="scroll-mt-16 py-12 sm:py-16 md:py-20 bg-slate-50 dark:bg-slate-950">
			<div class="mx-auto max-w-6xl px-4">
				<div class="text-center max-w-2xl mx-auto mb-8">
					<span class="text-xs font-bold tracking-wider text-[#00aeef] uppercase">Workshop Percetakan</span>
					<h2 class="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Kunjungi Workshop Kami</h2>
					<p class="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
						Mampir langsung untuk konsultasi bahan, ambil pesanan, atau koordinasi project cetak.
					</p>
				</div>

				<!-- Quick Info Bar -->
				<div class="grid sm:grid-cols-3 gap-3 mb-6">
					<div class="flex items-start gap-3 rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00aeef] text-white shadow-xs">
							<MapPin class="h-5 w-5 text-white" />
						</span>
						<div>
							<span class="block text-xs font-bold text-slate-400 uppercase">Alamat Workshop</span>
							<span class="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{KONTAK.alamat}</span>
						</div>
					</div>

					<div class="flex items-start gap-3 rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00aeef] text-white shadow-xs">
							<Clock class="h-5 w-5" />
						</span>
						<div>
							<span class="block text-xs font-bold text-slate-400 uppercase">Jam Buka</span>
							<span class="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{KONTAK.jam}</span>
						</div>
					</div>

					<div class="flex items-center gap-2.5 rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs">
						<a
							href={MAP_LINK}
							target="_blank"
							rel="noopener"
							class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs hover:border-red-300 transition active:scale-95 group"
						>
							<MapPin class="h-4 w-4 text-[#EA4335] group-hover:scale-110 transition-transform" />
							<span>Rute Maps</span>
						</a>
						<a
							href={WA_UMUM}
							target="_blank"
							rel="noopener"
							class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition active:scale-95 shadow-xs"
						>
							<WhatsappIcon class="h-4 w-4" />
							<span>WhatsApp</span>
						</a>
					</div>
				</div>

				<!-- Big Map Container: Luas, Nyaman, dan Jelas -->
				<div class="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
					<iframe
						title="Peta Lokasi FD Digital Printing"
						src={MAP_EMBED}
						class="h-[340px] sm:h-[440px] md:h-[500px] w-full border-0"
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
					></iframe>
				</div>
			</div>
		</section>

		<!-- SECTION 5: PERTANYAAN UMUM (FAQ) - PALING BAWAH SEBELUM FOOTER -->
		<section id="faq" class="scroll-mt-16 py-12 sm:py-16 md:py-20 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-4xl px-4">
				<div class="text-center max-w-xl mx-auto mb-8 sm:mb-10">
					<span class="text-xs font-bold tracking-wider text-[#00aeef] uppercase">Bantuan & Informasi</span>
					<h2 class="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Pertanyaan Umum (FAQ)</h2>
					<p class="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">Pertanyaan yang paling sering diajukan seputar order & cetak.</p>
				</div>

				<div class="space-y-3">
					{#each FAQ as f}
						<details class="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 px-5 py-4 transition hover:border-[#00aeef]/40">
							<summary class="flex cursor-pointer list-none items-center justify-between text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
								<span>{f.t}</span>
								<ChevronDown class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
							</summary>
							<p class="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-700/60 pt-2.5">
								{f.j}
							</p>
						</details>
					{/each}
				</div>
			</div>
		</section>
	</main>

	<!-- Minimal Modern Footer -->
	<footer class="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
		<div class="mx-auto max-w-6xl px-4 py-8 sm:py-10">
			<div class="flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex items-center gap-3 text-center sm:text-left">
					<img src="/logo.png" alt="Logo" class="h-8 w-8 rounded-lg object-contain bg-white shadow-2xs" />
					<div>
						<p class="font-bold text-slate-900 dark:text-white text-sm">FD Digital Printing</p>
						<p class="text-xs text-slate-500 dark:text-slate-400">Jl. Raya Wadungasri No. 42 · {WA_DISPLAY}</p>
					</div>
				</div>

				<div class="flex items-center gap-5 text-xs font-medium">
					<a href="/pesan" class="hover:text-[#00aeef] transition">Pesan Online</a>
					<a href={WA_UMUM} target="_blank" rel="noopener" class="hover:text-green-600 transition flex items-center gap-1">
						<WhatsappIcon class="h-3.5 w-3.5" /> WhatsApp
					</a>
					<a href={TELEGRAM_URL} target="_blank" rel="noopener" class="hover:text-[#229ED9] transition flex items-center gap-1">
						<TelegramIcon class="h-3.5 w-3.5" /> Telegram Bot
					</a>
					<a href="/sign-in" class="hover:text-slate-900 dark:hover:text-white transition">Masuk Staf</a>
				</div>
			</div>
			<div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-center text-[11px] text-slate-400">
				© 2026 FD Digital Printing. All rights reserved.
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

	<!-- Modal Riwayat Pesanan Tamu (LocalStorage ala Gacoan) -->
	<GuestOrderModal bind:open={guestHistoryOpen} />
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(14px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-up {
		animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
</style>
