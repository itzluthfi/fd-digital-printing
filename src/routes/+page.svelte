<script lang="ts">
	import {
		Activity,
		ArrowRight,
		Award,
		BadgeCheck,
		Building2,
		Calendar,
		CheckCircle2,
		ChevronDown,
		Clock,
		Cpu,
		ExternalLink,
		Flag,
		History,
		Image as ImageIcon,
		Layers,
		LogIn,
		MapPin,
		PackageCheck,
		Printer,
		Scissors,
		ShieldCheck,
		ShoppingBag,
		ShoppingCart,
		Sparkles,
		Sticker,
		Tag,
		User,
		Wallet,
		Wrench,
		Zap
	} from 'lucide-svelte';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import TelegramIcon from '#lib/components/TelegramIcon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { cart } from '#lib/cart.svelte';
	import GuestOrderModal from '#lib/components/GuestOrderModal.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let guestHistoryOpen = $state(false);
	let activeTabProfil = $state<'tentang' | 'visimisi' | 'sejarah'>('tentang');

	const WA_NUMBER = $derived(data.company.whatsapp);
	const WA_DISPLAY = $derived(data.company.whatsappDisplay);
	const TELEGRAM_URL = $derived(data.company.telegramUrl);

	const waLink = (pesan: string) => `https://wa.me/${data.company.whatsapp}?text=${encodeURIComponent(pesan)}`;
	const WA_UMUM = $derived(waLink('Halo FD Digital Printing, saya mau konsultasi profil & layanan cetak.'));
</script>

<svelte:head>
	<title>Company Profile — FD Digital Printing Sidoarjo</title>
	<meta
		name="description"
		content="Company Profile Resmi FD Digital Printing Sidoarjo: Sentra percetakan digital profesional sejak 2018. Melayani cetak outdoor, indoor photo, laser press A3+, cutting stiker, dan pemesanan e-commerce online."
	/>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600/20 transition-colors">
	<!-- ======================================================== -->
	<!-- NAVBAR UTAMA (FR-06: NAVIGASI E-COMMERCE & MESIN)         -->
	<!-- ======================================================== -->
	<header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md transition-colors">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:py-3">
			<a href="#atas" class="group flex items-center gap-2.5 sm:gap-3 transition">
				<img
					src="/logo.png"
					alt="Logo FD Digital Printing"
					class="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain shadow-2xs group-hover:scale-105 transition-transform"
				/>
				<div class="leading-tight">
					<span class="block text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">FD Digital Printing</span>
					<span class="block text-[11px] sm:text-xs text-blue-600 dark:text-[#38c8ff] font-semibold">Company Profile</span>
				</div>
			</a>

			<!-- Action Buttons: Menuju E-Commerce & Login Saja -->
			<div class="flex items-center gap-2 sm:gap-2.5">
				<!-- Lacak Pesanan (Printku Style) -->
				<a
					href="/status-order"
					class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-[#2563eb] hover:text-blue-600 transition active:scale-95"
					title="Lacak Status Pesanan"
				>
					<PackageCheck class="h-3.5 w-3.5 text-blue-600" />
					<span class="hidden md:inline">Lacak Order</span>
				</a>

				<!-- Keranjang Belanja -->
				<a
					href="/cart"
					class="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#2563eb] transition active:scale-95"
					title="Keranjang Belanja"
				>
					<ShoppingCart class="h-4 w-4 text-blue-600" />
					{#if cart.count > 0}
						<span class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white shadow-xs">
							{cart.count}
						</span>
					{/if}
				</a>

				<!-- BUTTON UTAMA MENUJU E-COMMERCE -->
				<a
					href="/katalog"
					class="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#2563eb]/20 transition-all duration-200 hover:scale-102 active:scale-95 group"
				>
					<ShoppingCart class="h-4 w-4 transition-transform group-hover:scale-110" />
					<span>E-Commerce Toko</span>
					<ArrowRight class="h-3.5 w-3.5 hidden sm:inline-block transition-transform group-hover:translate-x-0.5" />
				</a>

				{#if data.user}
					<a
						href={data.user.role === 'operator' ? '/order' : '/dashboard'}
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-[#2563eb] transition active:scale-95"
					>
						<User class="h-3.5 w-3.5 text-blue-600" />
						<span class="hidden sm:inline">{data.user.role === 'customer' ? 'Akun Saya' : 'Dashboard'}</span>
					</a>
				{:else}
					<a
						href="/sign-in"
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-[#2563eb] hover:text-blue-600 transition active:scale-95"
					>
						<LogIn class="h-3.5 w-3.5 text-blue-600" />
						<span>Masuk</span>
					</a>
				{/if}

				<ThemeToggle class="h-9 w-9 sm:h-10 sm:w-10" />
			</div>
		</div>
	</header>

	<main>
		<!-- ======================================================== -->
		<!-- 1. HERO SECTION: RINGKAS, POWERFUL, MODERN (FR-01)        -->
		<!-- ======================================================== -->
		<section id="atas" class="relative overflow-hidden pt-8 pb-10 sm:pt-12 sm:pb-14 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800">
			<div class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-3xl rounded-full"></div>

			<div class="mx-auto max-w-7xl px-4 relative z-10">
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
					<!-- Hero Copy -->
					<div class="lg:col-span-7 space-y-4 text-center lg:text-left">
						<div class="inline-flex items-center gap-2 rounded-full border border-[#2563eb]/30 bg-blue-600/10 px-3.5 py-1 text-xs font-bold text-blue-600 dark:text-[#38c8ff]">
							<Building2 class="h-3.5 w-3.5" />
							<span>COMPANY PROFILE RESMI — EST. {data.company.tahunBerdiri}</span>
						</div>

						<h1 class="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
							Mitra Percetakan Digital <br />
							<span class="text-blue-600 dark:text-[#38c8ff]">
								Terdepan & Terpercaya
							</span>
						</h1>

						<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
							{data.deskripsi.ringkasan}
						</p>

						<!-- CTA Buttons -->
						<div class="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
							<a
								href="/katalog"
								class="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-[#2563eb]/20 transition hover:scale-102 active:scale-95 group"
							>
								<ShoppingCart class="h-4 w-4" />
								<span>Kunjungi E-Commerce & Order</span>
								<ArrowRight class="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
							</a>

							<a
								href="/mesin"
								class="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-[#2563eb] transition active:scale-95"
							>
								<Cpu class="h-4 w-4 text-blue-600" />
								<span>Armada Mesin</span>
							</a>

							<a
								href={WA_UMUM}
								target="_blank"
								rel="noopener"
								class="inline-flex items-center gap-1.5 rounded-xl bg-green-50 dark:bg-green-950/60 border border-green-200/80 dark:border-green-800 px-4 py-3 text-xs sm:text-sm font-bold text-green-700 dark:text-green-300 hover:bg-green-100 transition active:scale-95"
							>
								<WhatsappIcon class="h-4 w-4" />
								<span>WhatsApp</span>
							</a>
						</div>

						<div class="pt-1 flex items-center justify-center lg:justify-start gap-3 text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
							<span class="flex items-center gap-1"><Clock class="h-3.5 w-3.5 text-blue-600" /> Buka s/d 02.00 Dini Hari</span>
							<span>·</span>
							<span class="flex items-center gap-1"><Zap class="h-3.5 w-3.5 text-amber-500" /> Bisa Cetak Kilat</span>
							<span>·</span>
							<span class="flex items-center gap-1"><MapPin class="h-3.5 w-3.5 text-red-500" /> Wadungasri, Waru, Sidoarjo</span>
						</div>
					</div>

					<!-- Hero Visual & Quick Stats -->
					<div class="lg:col-span-5 space-y-4">
						<div class="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg relative group">
							<img
								src="/banner-avatar.png"
								alt="Workshop FD Digital Printing"
								class="w-full h-48 sm:h-56 block select-none object-cover transition-transform duration-500 group-hover:scale-103"
								loading="eager"
							/>
							<div class="absolute inset-x-0 bottom-0 bg-slate-950/80 p-4 text-white">
								<h3 class="text-sm sm:text-base font-bold text-white">Sentra Produksi Percetakan Modern</h3>
								<p class="text-[11px] text-slate-300 mt-0.5">{data.company.alamatLengkap}</p>
							</div>
						</div>

						<!-- Compact Stats Grid -->
						<div class="grid grid-cols-4 gap-2">
							{#each data.deskripsi.statistik as stat}
								<div class="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-2.5 text-center shadow-2xs">
									<span class="block text-base sm:text-lg font-black text-blue-600">{stat.angka}</span>
									<span class="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mt-0.5 leading-tight">{stat.label}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- 2. PROFIL, VISI-MISI & SEJARAH (COMPACT TABBED: FR-02/03) -->
		<!-- ======================================================== -->
		<section id="profil" class="scroll-mt-16 py-10 sm:py-14 bg-white dark:bg-slate-900/50 border-b border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-7xl px-4">
				<div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4 mb-6">
					<div>
						<span class="text-xs font-bold tracking-wider text-blue-600 uppercase">Mengenal Perusahaan</span>
						<h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Tentang FD Digital Printing</h2>
					</div>

					<!-- Segmented Tab Controls (Meringkas 3 Section Jadi 1 Kompak) -->
					<div class="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
						<button
							type="button"
							onclick={() => (activeTabProfil = 'tentang')}
							class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {activeTabProfil === 'tentang'
								? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
								: 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}"
						>
							Profil & Nilai
						</button>
						<button
							type="button"
							onclick={() => (activeTabProfil = 'visimisi')}
							class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {activeTabProfil === 'visimisi'
								? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
								: 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}"
						>
							Visi & Misi
						</button>
						<button
							type="button"
							onclick={() => (activeTabProfil = 'sejarah')}
							class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer {activeTabProfil === 'sejarah'
								? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
								: 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}"
						>
							Sejarah (Est. 2018)
						</button>
					</div>
				</div>

				<!-- TAB 1: PROFIL & 6 NILAI KEUNGGULAN (FR-02) -->
				{#if activeTabProfil === 'tentang'}
					<div class="space-y-6 animate-fade-in">
						<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
							{data.deskripsi.narasiLengkap}
						</p>

						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
							{#each data.deskripsi.nilaiKeunggulan as nilai}
								<div class="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 shadow-2xs hover:border-[#2563eb]/50 transition-colors">
									<div class="flex items-center gap-2 mb-1.5">
										<Sparkles class="h-4 w-4 text-blue-600" />
										<h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{nilai.judul}</h4>
									</div>
									<p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{nilai.deskripsi}</p>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- TAB 2: VISI & MISI (FR-02) -->
				{#if activeTabProfil === 'visimisi'}
					<div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch animate-fade-in">
						<div class="md:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 flex flex-col justify-between shadow-xs">
							<div>
								<div class="flex items-center gap-2 text-blue-600 mb-2">
									<Award class="h-5 w-5" />
									<span class="text-xs font-bold uppercase tracking-wider">Visi Perusahaan</span>
								</div>
								<h3 class="text-base sm:text-lg font-bold leading-snug text-slate-900 dark:text-white">
									Sentra Percetakan Paling Tepercaya & Inovatif
								</h3>
								<p class="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
									"{data.deskripsi.visi}"
								</p>
							</div>
							<div class="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
								<span>Legalitas: {data.company.legalitas}</span>
								<span class="text-blue-600 font-bold">Est. {data.company.tahunBerdiri}</span>
							</div>
						</div>

						<div class="md:col-span-7 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 sm:p-6">
							<div class="flex items-center gap-2 text-blue-600 mb-3">
								<BadgeCheck class="h-5 w-5" />
								<span class="text-xs font-bold uppercase tracking-wider">Misi Perusahaan</span>
							</div>
							<ul class="space-y-2.5">
								{#each data.deskripsi.misi as itemMisi, i}
									<li class="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
										<span class="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 font-bold text-[11px] mt-0.5">
											{i + 1}
										</span>
										<span>{itemMisi}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				{/if}

				<!-- TAB 3: SEJARAH & MILESTONES (FR-03) -->
				{#if activeTabProfil === 'sejarah'}
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-in">
						{#each data.sejarah as mil}
							<div class="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 flex flex-col justify-between">
								<div>
									<div class="flex items-center justify-between mb-1.5">
										<span class="text-sm font-black text-blue-600">{mil.tahun}</span>
										<span class="rounded bg-slate-200/70 dark:bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300">{mil.badge}</span>
									</div>
									<h4 class="text-xs font-bold text-slate-900 dark:text-white leading-snug">{mil.judul}</h4>
									<p class="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{mil.deskripsi}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- 3. LAYANAN PERCETAKAN UTAMA (FR-04)                      -->
		<!-- ======================================================== -->
		<section id="layanan" class="scroll-mt-16 py-10 sm:py-14 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-7xl px-4">
				<div class="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
					<div>
						<span class="text-xs font-bold tracking-wider text-blue-600 uppercase">Layanan Kami</span>
						<h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Layanan Percetakan yang Disediakan</h2>
					</div>
					<a href="/katalog" class="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
						Lihat Produk di Katalog <ArrowRight class="h-3 w-3" />
					</a>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
					{#each data.layanan as lay}
						<div class="flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs hover:border-[#2563eb]/60 transition-colors">
							<div>
								<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 mb-2.5">
									{#if lay.id === 'outdoor'}
										<Flag class="h-4 w-4" />
									{:else if lay.id === 'indoor'}
										<ImageIcon class="h-4 w-4" />
									{:else if lay.id === 'laser-a3'}
										<Printer class="h-4 w-4" />
									{:else if lay.id === 'stiker-cutting'}
										<Scissors class="h-4 w-4" />
									{:else}
										<Sparkles class="h-4 w-4" />
									{/if}
								</div>

								<h3 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{lay.judul}</h3>
								<p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{lay.deskripsi}</p>

								<div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
									<div class="flex flex-wrap gap-1">
										{#each lay.produkUnggulan.slice(0, 2) as prod}
											<span class="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">
												{prod}
											</span>
										{/each}
									</div>
								</div>
							</div>

							<div class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
								<a href="/mesin" class="text-blue-600 font-semibold hover:underline">Mesin</a>
								<a href="/katalog" class="text-slate-600 dark:text-slate-300 font-semibold hover:text-blue-600">Order →</a>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- 4. DUAL SHOWCASE RINGKAS: E-COMMERCE & ARMADA MESIN (FR-06) -->
		<!-- ======================================================== -->
		<section class="py-10 sm:py-14 bg-white dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-7xl px-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
					<!-- Card 1: E-Commerce Toko Online (Clean Light Card) -->
					<div class="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-5 sm:p-7 flex flex-col justify-between shadow-2xs">
						<div>
							<div class="flex items-center justify-between mb-2">
								<span class="rounded-full bg-blue-600/10 border border-[#2563eb]/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 uppercase">
									Toko Online Cetak
								</span>
								<span class="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
									<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
									Online 24 Jam
								</span>
							</div>

							<h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
								Belanja Percetakan di E-Commerce
							</h3>
							<p class="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
								Kalkulasi harga instan, bayar otomatis via QRIS real-time, dan pantau live status antrean mesin cetak Anda dari mana saja.
							</p>

							<div class="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-700 dark:text-slate-300">
								<span class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded shadow-2xs">⚡ QRIS Instan</span>
								<span class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded shadow-2xs">📦 Live Tracking</span>
								<span class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded shadow-2xs">✨ Tanpa Minimum Order</span>
							</div>
						</div>

						<div class="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
							<a
								href="/katalog"
								class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition active:scale-95"
							>
								<ShoppingCart class="h-3.5 w-3.5" />
								<span>Buka E-Commerce Katalog</span>
							</a>
							<button
								type="button"
								onclick={() => (guestHistoryOpen = true)}
								class="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-[#2563eb] hover:text-blue-600 transition cursor-pointer active:scale-95"
							>
								<PackageCheck class="h-3.5 w-3.5 text-blue-600" />
								<span>Lacak Order</span>
							</button>
						</div>
					</div>

					<!-- Card 2: Armada Mesin Berteknologi Tinggi (FR-06 & FR-08 s/d FR-14) -->
					<div class="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-5 sm:p-7 flex flex-col justify-between shadow-2xs">
						<div>
							<div class="flex items-center justify-between mb-2">
								<span class="rounded-full bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">
									Kapasitas Produksi
								</span>
								<span class="text-xs font-bold text-blue-600">{data.daftarMesin.length} Unit Mesin Siap Operasi</span>
							</div>

							<h3 class="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
								Armada Mesin Percetakan Kami
							</h3>
							<p class="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
								Dari mesin outdoor 3.2M, indoor fotografi eco-solvent, production press laser A3+, hingga digital contour cutting plotter presisi 0.1 mm.
							</p>

							<div class="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-700 dark:text-slate-300">
								<span class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">Allwin Konica 512i</span>
								<span class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">Epson Ultra-HD</span>
								<span class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">Fuji Xerox Versant</span>
								<span class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">Graphtec Cutter</span>
							</div>
						</div>

						<div class="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-700 flex items-center gap-2.5">
							<a
								href="/mesin"
								class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition"
							>
								<Cpu class="h-3.5 w-3.5" />
								<span>Buka Spesifikasi Mesin Lengkap</span>
								<ArrowRight class="h-3.5 w-3.5" />
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- 5. WORKSHOP, JAM BUKA & PETA GOOGLE MAPS (FR-05)         -->
		<!-- ======================================================== -->
		<section id="lokasi" class="scroll-mt-16 py-10 sm:py-14 bg-slate-50 dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-7xl px-4">
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
					<!-- Info Kontak -->
					<div class="lg:col-span-5 space-y-4">
						<div>
							<span class="text-xs font-bold tracking-wider text-blue-600 uppercase">Workshop Resmi</span>
							<h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Lokasi & Jam Operasional</h2>
							<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Silakan berkunjung langsung untuk cek sampel bahan atau ambil pesanan.</p>
						</div>

						<div class="space-y-2.5">
							<div class="flex items-start gap-3 rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800">
								<MapPin class="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
								<div>
									<span class="block text-[11px] font-bold text-slate-400 uppercase">Alamat Workshop</span>
									<span class="block text-xs font-semibold text-slate-900 dark:text-white mt-0.5">{data.company.alamatLengkap}</span>
									<span class="block text-[10px] text-slate-400 mt-0.5">{data.company.patokan}</span>
								</div>
							</div>

							<div class="flex items-start gap-3 rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-slate-200/80 dark:border-slate-800">
								<Clock class="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
								<div>
									<span class="block text-[11px] font-bold text-slate-400 uppercase">Jam Operasional</span>
									<span class="block text-xs font-semibold text-slate-900 dark:text-white mt-0.5">{data.company.jamOperasional.hariKerja}</span>
									<span class="block text-[11px] text-slate-500 mt-0.5">{data.company.jamOperasional.hariMinggu}</span>
								</div>
							</div>

							<div class="flex items-center gap-2 pt-1">
								<a
									href={data.company.googleMapsLink}
									target="_blank"
									rel="noopener"
									class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-white hover:border-red-300 transition"
								>
									<MapPin class="h-3.5 w-3.5 text-red-500" />
									<span>Petunjuk Maps</span>
								</a>
								<a
									href={WA_UMUM}
									target="_blank"
									rel="noopener"
									class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition"
								>
									<WhatsappIcon class="h-3.5 w-3.5" />
									<span>WhatsApp</span>
								</a>
							</div>
						</div>
					</div>

					<!-- Google Maps Embed Compact -->
					<div class="lg:col-span-7 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
						<iframe
							title="Peta Lokasi Workshop FD Digital Printing"
							src={data.company.googleMapsEmbed}
							class="h-[280px] sm:h-[320px] w-full border-0"
							loading="lazy"
							referrerpolicy="no-referrer-when-downgrade"
						></iframe>
					</div>
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- 6. FAQ & PUSAT BANTUAN RINGKAS (FR-07)                   -->
		<!-- ======================================================== -->
		<section id="faq" class="scroll-mt-16 py-10 sm:py-14 bg-white dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-4xl px-4">
				<div class="text-center max-w-xl mx-auto mb-6">
					<span class="text-xs font-bold tracking-wider text-blue-600 uppercase">Pusat Bantuan</span>
					<h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Pertanyaan Umum (FAQ)</h2>
				</div>

				<div class="space-y-2.5">
					{#each data.faq as f}
						<details class="group rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 px-4 py-3 transition hover:border-[#2563eb]/40">
							<summary class="flex cursor-pointer list-none items-center justify-between text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
								<span class="flex items-center gap-2">
									<span class="rounded bg-blue-100 dark:bg-blue-950/60 text-blue-600 px-1.5 py-0.5 text-[9px] font-bold">
										{f.kategori}
									</span>
									<span>{f.tanya}</span>
								</span>
								<ChevronDown class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
							</summary>
							<p class="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-700/60 pt-2">
								{f.jawab}
							</p>
						</details>
					{/each}
				</div>
			</div>
		</section>
	</main>

	<!-- Footer Ringkas & Elegan -->
	<footer class="bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-6 text-xs transition-colors">
		<div class="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<img src="/logo.png" alt="Logo" class="h-6 w-6 rounded-md object-contain" />
				<span class="font-bold text-slate-900 dark:text-white">FD Digital Printing</span>
				<span class="text-slate-400">·</span>
				<span>© 2018–2026. All rights reserved.</span>
			</div>
			<div class="flex items-center gap-4">
				<a href="/katalog" class="font-bold text-blue-600 hover:underline">E-Commerce</a>
				<a href="/mesin" class="hover:text-blue-600">Armada Mesin</a>
				<a href="/sign-in" class="hover:text-slate-900 dark:hover:text-white">Portal Staf</a>
			</div>
		</div>
	</footer>

	<!-- Floating WhatsApp Button -->
	<a
		href={WA_UMUM}
		target="_blank"
		rel="noopener"
		aria-label="Chat WhatsApp FD Digital Printing"
		class="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-40 flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/30 transition hover:scale-105 active:scale-95"
	>
		<WhatsappIcon class="h-6 w-6" />
	</a>

	<!-- Modal Riwayat Pesanan Tamu -->
	<GuestOrderModal bind:open={guestHistoryOpen} />
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fadeIn 0.25s ease-out both;
	}
</style>
