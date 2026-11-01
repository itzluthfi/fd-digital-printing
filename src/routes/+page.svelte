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
	import GuestOrderModal from '#lib/components/GuestOrderModal.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let guestHistoryOpen = $state(false);

	const WA_NUMBER = $derived(data.company.whatsapp);
	const WA_DISPLAY = $derived(data.company.whatsappDisplay);
	const TELEGRAM_URL = $derived(data.company.telegramUrl);

	const waLink = (pesan: string) => `https://wa.me/${data.company.whatsapp}?text=${encodeURIComponent(pesan)}`;
	const WA_UMUM = $derived(waLink('Halo FD Digital Printing, saya mau konsultasi profil & layanan cetak.'));

	const LANGKAH_ORDER = [
		{ no: '1', judul: 'Pilih di E-Commerce', teks: 'Buka katalog online kami, pilih produk, ukuran, dan spesifikasi bahan.' },
		{ no: '2', judul: 'Upload Desain & Bayar', teks: 'Kirim file siap cetak via web atau WhatsApp, lalu bayar instan dengan QRIS.' },
		{ no: '3', judul: 'Proses Mesin & Kirim/Ambil', teks: 'Pesanan langsung naik mesin produksi. Pantau live status hingga siap diambil.' }
	];
</script>

<svelte:head>
	<title>Company Profile — FD Digital Printing Sidoarjo</title>
	<meta
		name="description"
		content="Company Profile Resmi FD Digital Printing Sidoarjo: Sentra percetakan digital profesional sejak 2018. Melayani cetak outdoor, indoor photo, laser press A3+, cutting stiker, dan e-commerce pemesanan online."
	/>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-[#00aeef]/20 transition-colors">
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
					<span class="block text-[11px] sm:text-xs text-[#00aeef] dark:text-[#38c8ff] font-semibold">Company Profile</span>
				</div>
			</a>

			<!-- Navigasi Menu Profil -->
			<nav class="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
				<a href="#tentang" class="transition hover:text-[#00aeef]">Tentang Kami</a>
				<a href="#sejarah" class="transition hover:text-[#00aeef]">Sejarah</a>
				<a href="#layanan" class="transition hover:text-[#00aeef]">Layanan</a>
				<!-- FR-06: Link Halaman Informasi Mesin -->
				<a href="/mesin" class="transition hover:text-[#00aeef] flex items-center gap-1 text-slate-800 dark:text-slate-200 font-semibold">
					<Cpu class="h-3.5 w-3.5 text-[#00aeef]" />
					<span>Armada Mesin</span>
				</a>
				<a href="#lokasi" class="transition hover:text-[#00aeef]">Workshop & Kontak</a>
				<a href="#faq" class="transition hover:text-[#00aeef]">FAQ</a>
			</nav>

			<!-- Action Buttons: Menuju E-Commerce & Login -->
			<div class="flex items-center gap-2 sm:gap-2.5">
				<!-- BUTTON UTAMA MENUJU E-COMMERCE -->
				<a
					href="/katalog"
					class="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#00aeef] hover:bg-[#0092c9] px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#00aeef]/20 transition-all duration-200 hover:scale-102 active:scale-95 group"
				>
					<ShoppingCart class="h-4 w-4 transition-transform group-hover:scale-110" />
					<span>E-Commerce Toko</span>
					<ArrowRight class="h-3.5 w-3.5 hidden sm:inline-block transition-transform group-hover:translate-x-0.5" />
				</a>

				{#if data.user}
					<a
						href={data.user.role === 'operator' ? '/order' : '/dashboard'}
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-[#00aeef] transition active:scale-95"
					>
						<User class="h-3.5 w-3.5 text-[#00aeef]" />
						<span class="hidden sm:inline">{data.user.role === 'customer' ? 'Akun Saya' : 'Dashboard'}</span>
					</a>
				{:else}
					<a
						href="/sign-in"
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-[#00aeef] hover:text-[#00aeef] transition active:scale-95"
					>
						<LogIn class="h-3.5 w-3.5" />
						<span class="hidden sm:inline">Masuk</span>
					</a>
				{/if}

				<ThemeToggle class="h-9 w-9 sm:h-10 sm:w-10" />
			</div>
		</div>
	</header>

	<main>
		<!-- ======================================================== -->
		<!-- HERO SECTION: PURE COMPANY PROFILE (FR-01)               -->
		<!-- ======================================================== -->
		<section id="atas" class="relative overflow-hidden pt-8 pb-14 sm:pt-14 sm:pb-20 bg-gradient-to-b from-white via-slate-50 to-slate-100/70 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800">
			<!-- Subtle background glow -->
			<div class="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#00aeef]/10 blur-3xl rounded-full"></div>

			<div class="mx-auto max-w-7xl px-4 relative z-10">
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
					<!-- Hero Copy Pure Compro -->
					<div class="lg:col-span-7 space-y-5 text-center lg:text-left">
						<div class="inline-flex items-center gap-2 rounded-full border border-[#00aeef]/30 bg-[#00aeef]/10 px-3.5 py-1.5 text-xs font-bold text-[#00aeef] dark:text-[#38c8ff]">
							<Building2 class="h-3.5 w-3.5" />
							<span>COMPANY PROFILE RESMI — BERDIRI SEJAK {data.company.tahunBerdiri}</span>
						</div>

						<h1 class="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
							Mitra Percetakan Digital <br />
							<span class="text-transparent bg-clip-text bg-gradient-to-r from-[#00aeef] via-blue-600 to-indigo-600">
								Terdepan & Terpercaya
							</span>
						</h1>

						<p class="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
							{data.deskripsi.ringkasan}
						</p>

						<!-- PROMINENT CALL TO ACTIONS: BUTTON E-COMMERCE & MESIN -->
						<div class="pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-3">
							<!-- Button Utama ke E-Commerce -->
							<a
								href="/katalog"
								class="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#00aeef] to-blue-600 hover:from-[#0092c9] hover:to-blue-700 px-6 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-[#00aeef]/25 transition-all duration-200 hover:scale-102 active:scale-95 group"
							>
								<ShoppingCart class="h-5 w-5 transition-transform group-hover:scale-110" />
								<span>Kunjungi E-Commerce & Order</span>
								<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</a>

							<!-- Button ke Armada Mesin (FR-06) -->
							<a
								href="/mesin"
								class="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3.5 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 shadow-2xs hover:border-[#00aeef] hover:text-[#00aeef] transition-all duration-200 active:scale-95"
							>
								<Cpu class="h-4 w-4 text-[#00aeef]" />
								<span>Armada Mesin Kami</span>
							</a>

							<!-- Button Konsultasi CS -->
							<a
								href={WA_UMUM}
								target="_blank"
								rel="noopener"
								class="inline-flex items-center gap-2 rounded-2xl bg-green-50 dark:bg-green-950/60 border border-green-200/80 dark:border-green-800 px-4 py-3.5 text-xs sm:text-sm font-bold text-green-700 dark:text-green-300 hover:bg-green-100 transition active:scale-95"
							>
								<WhatsappIcon class="h-4 w-4" />
								<span>Hubungi Admin</span>
							</a>
						</div>

						<!-- Jam Buka & Layanan Kilat (FR-05) -->
						<div class="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
							<span class="inline-flex items-center gap-1.5">
								<Clock class="h-4 w-4 text-[#00aeef]" />
								<span>{data.company.jamOperasional.hariKerja}</span>
							</span>
							<span class="inline-flex items-center gap-1.5">
								<Zap class="h-4 w-4 text-amber-500" />
								<span>Bisa Cetak Kilat Ditunggu</span>
							</span>
						</div>
					</div>

					<!-- Hero Visual Showcase -->
					<div class="lg:col-span-5 relative">
						<div class="overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl relative group">
							<img
								src="/banner-avatar.png"
								alt="Workshop FD Digital Printing"
								class="w-full h-auto block select-none object-cover transition-transform duration-700 group-hover:scale-103"
								loading="eager"
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-6 text-white">
								<div class="flex items-center gap-2 text-xs font-bold text-[#00aeef] uppercase tracking-wider">
									<Building2 class="h-4 w-4" />
									<span>Pusat Percetakan Sidoarjo</span>
								</div>
								<h3 class="text-lg font-black text-white mt-1">Workshop Terpadu & Mesin Modern</h3>
								<p class="text-xs text-slate-300 mt-1 leading-relaxed">{data.company.alamatLengkap}</p>
								<div class="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs">
									<span class="text-emerald-400 font-semibold">● Workshop Siap Dikunjungi</span>
									<a href="#lokasi" class="font-bold text-white hover:text-[#00aeef] flex items-center gap-1">
										Peta Lokasi <ArrowRight class="h-3 w-3" />
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Stats Counter Perusahaan -->
				<div class="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
					{#each data.deskripsi.statistik as stat}
						<div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-5 text-center shadow-xs">
							<span class="block text-2xl sm:text-4xl font-black text-[#00aeef]">{stat.angka}</span>
							<span class="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-1">{stat.label}</span>
							<span class="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{stat.sublabel}</span>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- FR-02: PROFIL DAN DESKRIPSI PERUSAHAAN                   -->
		<!-- ======================================================== -->
		<section id="tentang" class="scroll-mt-16 py-14 sm:py-20 bg-white dark:bg-slate-900/50">
			<div class="mx-auto max-w-7xl px-4">
				<div class="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
					<span class="text-xs font-bold tracking-wider text-[#00aeef] uppercase">Mengenal Kami</span>
					<h2 class="mt-1 text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
						Profil & Filosofi FD Digital Printing
					</h2>
					<p class="mt-2 text-xs sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
						{data.deskripsi.narasiLengkap}
					</p>
				</div>

				<!-- Visi & Misi Cards -->
				<div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch mb-12">
					<!-- Visi -->
					<div class="md:col-span-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 sm:p-8 text-white flex flex-col justify-between shadow-xl">
						<div>
							<div class="flex items-center gap-2.5 text-[#00aeef] mb-3">
								<Award class="h-6 w-6" />
								<span class="text-xs font-bold uppercase tracking-wider">Visi Perusahaan</span>
							</div>
							<h3 class="text-lg sm:text-xl font-bold leading-snug text-white">
								Menjadi Sentra Percetakan Digital Paling Tepercaya & Inovatif
							</h3>
							<p class="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
								"{data.deskripsi.visi}"
							</p>
						</div>

						<div class="mt-6 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
							<span>Badan Usaha: {data.company.legalitas}</span>
							<span class="text-[#00aeef] font-bold">Didirikan {data.company.tahunBerdiri}</span>
						</div>
					</div>

					<!-- Misi -->
					<div class="md:col-span-7 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-6 sm:p-8 flex flex-col justify-between">
						<div>
							<div class="flex items-center gap-2.5 text-[#00aeef] mb-3">
								<BadgeCheck class="h-6 w-6" />
								<span class="text-xs font-bold uppercase tracking-wider">Misi Perusahaan</span>
							</div>
							<h3 class="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-4">
								Komitmen Pelayanan & Standar Mutu Industri
							</h3>
							<ul class="space-y-3">
								{#each data.deskripsi.misi as itemMisi, i}
									<li class="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
										<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00aeef]/10 text-[#00aeef] font-bold text-xs mt-0.5">
											{i + 1}
										</span>
										<span>{itemMisi}</span>
									</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>

				<!-- Nilai-Nilai Keunggulan -->
				<div>
					<div class="text-center mb-6">
						<span class="text-xs font-bold text-[#00aeef] uppercase tracking-wider">Standar Mutu</span>
						<h3 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">6 Keunggulan Utama Kami</h3>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
						{#each data.deskripsi.nilaiKeunggulan as nilai}
							<div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:border-[#00aeef]/50 transition-colors">
								<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#00aeef] mb-3">
									<Sparkles class="h-5 w-5" />
								</div>
								<h4 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{nilai.judul}</h4>
								<p class="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{nilai.deskripsi}</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- FR-03: SEJARAH SINGKAT DAN TAHUN BERDIRI (2018)          -->
		<!-- ======================================================== -->
		<section id="sejarah" class="scroll-mt-16 py-14 sm:py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-7xl px-4">
				<div class="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
					<div class="inline-flex items-center gap-1.5 text-xs font-bold text-[#00aeef] uppercase tracking-wider mb-1">
						<History class="h-3.5 w-3.5" />
						<span>Jejak Langkah & Perkembangan</span>
					</div>
					<h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
						Sejarah Berdiri Sejak Tahun {data.company.tahunBerdiri}
					</h2>
					<p class="mt-2 text-xs sm:text-base text-slate-600 dark:text-slate-300">
						Perjalanan dedikasi kami dari percetakan lokal di Wadungasri hingga bertransformasi menjadi sentra percetakan modern terpadu.
					</p>
				</div>

				<!-- Milestone Timeline Cards -->
				<div class="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
					{#each data.sejarah as mil, idx}
						<div class="flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs relative hover:-translate-y-1 transition-transform duration-300">
							<div>
								<div class="flex items-center justify-between mb-3">
									<span class="flex items-center gap-1 text-xl font-black text-[#00aeef]">
										<Calendar class="h-4 w-4" />
										{mil.tahun}
									</span>
									<span class="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
										{mil.badge}
									</span>
								</div>
								<h4 class="text-sm font-bold text-slate-900 dark:text-white leading-snug">
									{mil.judul}
								</h4>
								<p class="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
									{mil.deskripsi}
								</p>
							</div>

							<div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-semibold uppercase">
								Fase #{idx + 1}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- FR-04: INFORMASI LAYANAN PERCETAKAN                      -->
		<!-- ======================================================== -->
		<section id="layanan" class="scroll-mt-16 py-14 sm:py-20 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-7xl px-4">
				<div class="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
					<span class="text-xs font-bold tracking-wider text-[#00aeef] uppercase">Kategori Layanan</span>
					<h2 class="mt-1 text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
						Layanan Percetakan yang Kami Sediakan
					</h2>
					<p class="mt-2 text-xs sm:text-base text-slate-600 dark:text-slate-300">
						Solusi terpadu memenuhi kebutuhan personal, promosi usaha, hingga kebutuhan korporasi skala besar.
					</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each data.layanan as lay}
						<div class="flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-6 shadow-xs hover:border-[#00aeef]/60 hover:shadow-md transition-all">
							<div>
								<div class="flex items-center justify-between mb-3">
									<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-[#00aeef] shadow-2xs">
										{#if lay.id === 'outdoor'}
											<Flag class="h-5 w-5" />
										{:else if lay.id === 'indoor'}
											<ImageIcon class="h-5 w-5" />
										{:else if lay.id === 'laser-a3'}
											<Printer class="h-5 w-5" />
										{:else if lay.id === 'stiker-cutting'}
											<Scissors class="h-5 w-5" />
										{:else}
											<Sparkles class="h-5 w-5" />
										{/if}
									</div>
									<span class="rounded-lg bg-[#00aeef]/10 text-[#00aeef] dark:text-[#38c8ff] px-2.5 py-1 text-[10px] font-bold">
										Kategori Cetak
									</span>
								</div>

								<h3 class="text-lg font-bold text-slate-900 dark:text-white">{lay.judul}</h3>
								<p class="text-xs font-semibold text-[#00aeef] mt-0.5">{lay.tagline}</p>
								<p class="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{lay.deskripsi}</p>

								<!-- Produk Unggulan -->
								<div class="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
									<span class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Produk Yang Dihasilkan:</span>
									<div class="flex flex-wrap gap-1.5">
										{#each lay.produkUnggulan as prod}
											<span class="rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-800 dark:text-slate-200">
												{prod}
											</span>
										{/each}
									</div>
								</div>

								<!-- Mesin Terkait (FR-06 link ke mesin) -->
								<div class="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
									<Cpu class="h-3.5 w-3.5 text-[#00aeef]" />
									<span class="font-semibold text-slate-700 dark:text-slate-300">{lay.mesinTerkait}</span>
								</div>
							</div>

							<div class="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
								<a href="/mesin" class="text-xs font-bold text-[#00aeef] hover:underline flex items-center gap-1">
									Spesifikasi Mesin <ArrowRight class="h-3 w-3" />
								</a>
								<a href="/katalog" class="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-[#00aeef] transition flex items-center gap-1">
									Beli di E-Commerce <ShoppingCart class="h-3 w-3" />
								</a>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- SHOWCASE SECTION: E-COMMERCE & BELANJA ONLINE (MENONJOL) -->
		<!-- ======================================================== -->
		<section class="py-14 sm:py-20 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white relative overflow-hidden">
			<!-- Subtle ambient light -->
			<div class="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-[#00aeef]/20 rounded-full blur-3xl"></div>

			<div class="mx-auto max-w-7xl px-4 relative z-10">
				<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
					<div class="lg:col-span-7 space-y-4">
						<div class="inline-flex items-center gap-2 rounded-full bg-[#00aeef]/20 border border-[#00aeef]/40 px-3.5 py-1 text-xs font-bold text-[#00aeef]">
							<ShoppingCart class="h-3.5 w-3.5" />
							<span>PLATFORM E-COMMERCE & PEMESANAN ONLINE</span>
						</div>

						<h2 class="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
							Belanja Kebutuhan Cetak <br />
							Kini Lebih Praktis di Toko Online Kami
						</h2>

						<p class="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
							Tidak perlu lagi antre di workshop! FD Digital Printing menyediakan platform e-commerce terintegrasi. Anda dapat melihat katalog harga real-time, memilih spesifikasi bahan, upload file desain, membayar instan via QRIS, dan memantau live status pesanan langsung dari perangkat Anda.
						</p>

						<!-- Keunggulan E-Commerce -->
						<div class="grid grid-cols-2 gap-3 pt-2">
							<div class="rounded-xl bg-white/5 border border-white/10 p-3">
								<span class="block text-xs font-bold text-[#00aeef]">⚡ QRIS & Pembayaran Otomatis</span>
								<span class="block text-[11px] text-slate-400 mt-0.5">Konfirmasi instan tanpa perlu kirim bukti transfer.</span>
							</div>
							<div class="rounded-xl bg-white/5 border border-white/10 p-3">
								<span class="block text-xs font-bold text-[#00aeef]">📦 Live Order Tracking</span>
								<span class="block text-[11px] text-slate-400 mt-0.5">Pantau status pengerjaan mesin secara langsung.</span>
							</div>
							<div class="rounded-xl bg-white/5 border border-white/10 p-3">
								<span class="block text-xs font-bold text-[#00aeef]">🏷️ Harga Transparan</span>
								<span class="block text-[11px] text-slate-400 mt-0.5">Kalkulasi harga otomatis tanpa biaya tersembunyi.</span>
							</div>
							<div class="rounded-xl bg-white/5 border border-white/10 p-3">
								<span class="block text-xs font-bold text-[#00aeef]">✨ Tanpa Minimal Order</span>
								<span class="block text-[11px] text-slate-400 mt-0.5">Bisa pesan mulai dari 1 lembar atau 1 meter saja.</span>
							</div>
						</div>

						<!-- BUTTON KE E-COMMERCE -->
						<div class="pt-4 flex flex-wrap items-center gap-3">
							<a
								href="/katalog"
								class="inline-flex items-center gap-2.5 rounded-2xl bg-[#00aeef] hover:bg-[#0092c9] px-6 py-3.5 text-sm sm:text-base font-extrabold text-white shadow-xl shadow-[#00aeef]/30 transition-all hover:scale-102 active:scale-95 group"
							>
								<ShoppingCart class="h-5 w-5 transition-transform group-hover:scale-110" />
								<span>Buka E-Commerce & Katalog Produk</span>
								<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
							</a>

							<a
								href="/pesan"
								class="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 py-3.5 text-xs sm:text-sm font-bold text-white backdrop-blur-xs transition active:scale-95"
							>
								<span>Form Order Kilat</span>
							</a>

							<button
								type="button"
								onclick={() => (guestHistoryOpen = true)}
								class="inline-flex items-center gap-1.5 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3.5 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
							>
								<PackageCheck class="h-4 w-4 text-[#00aeef]" />
								<span>Lacak Pesanan Saya</span>
							</button>
						</div>
					</div>

					<!-- Visual Card E-Commerce Preview -->
					<div class="lg:col-span-5">
						<div class="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl relative">
							<div class="flex items-center justify-between pb-4 border-b border-slate-800">
								<div class="flex items-center gap-2">
									<img src="/logo.png" alt="Logo" class="h-7 w-7 rounded-lg object-contain bg-white" />
									<span class="text-sm font-bold text-white">E-Commerce Toko FD</span>
								</div>
								<span class="rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1">
									<span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
									Online 24 Jam
								</span>
							</div>

							<div class="py-5 space-y-3">
								<div class="flex items-center justify-between rounded-xl bg-slate-800/60 p-3">
									<div class="flex items-center gap-2.5">
										<Flag class="h-4 w-4 text-[#00aeef]" />
										<span class="text-xs font-semibold text-white">Spanduk & Banner Outdoor</span>
									</div>
									<a href="/katalog" class="text-[11px] font-bold text-[#00aeef] hover:underline">Lihat →</a>
								</div>
								<div class="flex items-center justify-between rounded-xl bg-slate-800/60 p-3">
									<div class="flex items-center gap-2.5">
										<Sticker class="h-4 w-4 text-[#00aeef]" />
										<span class="text-xs font-semibold text-white">Stiker Label Kemasan Kiss Cut</span>
									</div>
									<a href="/katalog" class="text-[11px] font-bold text-[#00aeef] hover:underline">Lihat →</a>
								</div>
								<div class="flex items-center justify-between rounded-xl bg-slate-800/60 p-3">
									<div class="flex items-center gap-2.5">
										<Printer class="h-4 w-4 text-[#00aeef]" />
										<span class="text-xs font-semibold text-white">Brosur & Kartu Nama A3+</span>
									</div>
									<a href="/katalog" class="text-[11px] font-bold text-[#00aeef] hover:underline">Lihat →</a>
								</div>
								<div class="flex items-center justify-between rounded-xl bg-slate-800/60 p-3">
									<div class="flex items-center gap-2.5">
										<ImageIcon class="h-4 w-4 text-[#00aeef]" />
										<span class="text-xs font-semibold text-white">Roll Up Banner & Albatros</span>
									</div>
									<a href="/katalog" class="text-[11px] font-bold text-[#00aeef] hover:underline">Lihat →</a>
								</div>
							</div>

							<a
								href="/katalog"
								class="block text-center rounded-xl bg-gradient-to-r from-[#00aeef] to-blue-600 py-3 text-xs font-bold text-white shadow-md hover:opacity-95 transition"
							>
								Masuk ke Toko Online (Katalog Lengkap)
							</a>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- FR-06 & FR-08 s/d FR-14: TEASER ARMADA MESIN PERCETAKAN  -->
		<!-- ======================================================== -->
		<section class="py-14 sm:py-20 bg-slate-100/70 dark:bg-slate-900/80 border-t border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-7xl px-4">
				<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-14">
					<div>
						<div class="inline-flex items-center gap-1.5 text-xs font-bold text-[#00aeef] uppercase tracking-wider mb-1">
							<Cpu class="h-4 w-4" />
							<span>Teknologi Industri Modern</span>
						</div>
						<h2 class="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
							Armada Mesin Percetakan Kami
						</h2>
						<p class="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
							Didukung oleh 5 lini mesin utama: Outdoor 3.2M, Indoor Ultra-HD Eco-Solvent, Production Press Laser A3+, Contour Cutting Plotter, dan Heavy Duty Roll Laminator.
						</p>
					</div>

					<a
						href="/mesin"
						class="shrink-0 inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-[#00aeef] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-slate-800 dark:hover:bg-[#0092c9] transition active:scale-95"
					>
						<span>Buka Spesifikasi Mesin Lengkap</span>
						<ArrowRight class="h-4 w-4" />
					</a>
				</div>

				<!-- Grid Teaser Mesin -->
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each data.daftarMesin.slice(0, 3) as mesin}
						<div class="group rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col justify-between hover:border-[#00aeef]/60 hover:shadow-md transition-all duration-300">
							<div class="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
								<img
									src={mesin.foto}
									alt={mesin.nama}
									class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
									loading="lazy"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
								<span class="absolute top-3 left-3 rounded-lg bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white uppercase">
									{mesin.kategoriLabel}
								</span>
							</div>

							<div class="p-5 flex-1 flex flex-col justify-between">
								<div>
									<h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#00aeef] transition-colors">
										{mesin.nama}
									</h3>
									<p class="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
										{mesin.fungsiKegunaan}
									</p>
								</div>

								<div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
									<span class="text-slate-400 font-medium">{mesin.spesifikasi[0]?.value}</span>
									<a href={`/mesin#${mesin.id}`} class="font-bold text-[#00aeef] hover:underline flex items-center gap-1">
										Spesifikasi Detail <ArrowRight class="h-3 w-3" />
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- ALUR PEMESANAN PRAKTIS                                   -->
		<!-- ======================================================== -->
		<section class="py-12 sm:py-16 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-7xl px-4">
				<div class="text-center max-w-xl mx-auto mb-8 sm:mb-10">
					<span class="text-xs font-bold tracking-wider text-[#00aeef] uppercase">Praktis & Terpantau</span>
					<h2 class="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Alur Pemesanan Mudah</h2>
					<p class="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">3 langkah cepat dari layar Anda hingga pesanan selesai dicetak.</p>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
					{#each LANGKAH_ORDER as l}
						<div class="flex flex-col items-start rounded-2xl border border-slate-200/80 bg-slate-50/60 dark:bg-slate-800/60 dark:border-slate-800 p-5 transition hover:border-[#00aeef]/40">
							<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 dark:bg-[#00aeef] text-white font-black text-base shadow-xs mb-3">
								{l.no}
							</span>
							<h4 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{l.judul}</h4>
							<p class="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{l.teks}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- FR-05: ALAMAT, KONTAK, JAM OPERASIONAL & LOKASI PERUSAHAAN-->
		<!-- ======================================================== -->
		<section id="lokasi" class="scroll-mt-16 py-14 sm:py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-7xl px-4">
				<div class="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
					<span class="text-xs font-bold tracking-wider text-[#00aeef] uppercase">Kantor & Workshop</span>
					<h2 class="mt-1 text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white">
						Lokasi & Kontak Perusahaan
					</h2>
					<p class="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
						Kunjungi workshop kami untuk konsultasi sampel bahan, ambil pesanan, atau koordinasi project cetak skala besar.
					</p>
				</div>

				<!-- Quick Info Cards (FR-05) -->
				<div class="grid sm:grid-cols-3 gap-4 mb-6">
					<!-- Alamat Lengkap -->
					<div class="flex items-start gap-3 rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00aeef] text-white shadow-xs">
							<MapPin class="h-5 w-5 text-white" />
						</span>
						<div>
							<span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Alamat Workshop</span>
							<span class="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{data.company.alamatLengkap}</span>
							<span class="block text-[11px] text-slate-400 mt-1">{data.company.patokan}</span>
						</div>
					</div>

					<!-- Jam Operasional -->
					<div class="flex items-start gap-3 rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00aeef] text-white shadow-xs">
							<Clock class="h-5 w-5" />
						</span>
						<div>
							<span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Jam Operasional</span>
							<span class="block text-xs sm:text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{data.company.jamOperasional.hariKerja}</span>
							<span class="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{data.company.jamOperasional.hariMinggu}</span>
						</div>
					</div>

					<!-- Kontak Cepat -->
					<div class="flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
						<div>
							<span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Kontak Resmi</span>
							<span class="block text-xs sm:text-sm font-bold text-slate-900 dark:text-white mt-0.5">WhatsApp: {data.company.whatsappDisplay}</span>
						</div>
						<div class="mt-3 flex items-center gap-2">
							<a
								href={data.company.googleMapsLink}
								target="_blank"
								rel="noopener"
								class="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-xs font-bold text-slate-800 dark:text-white hover:border-red-300 transition"
							>
								<MapPin class="h-3.5 w-3.5 text-red-500" />
								<span>Google Maps</span>
							</a>
							<a
								href={WA_UMUM}
								target="_blank"
								rel="noopener"
								class="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 px-3 text-xs font-bold text-white hover:bg-emerald-700 transition"
							>
								<WhatsappIcon class="h-3.5 w-3.5" />
								<span>WhatsApp</span>
							</a>
						</div>
					</div>
				</div>

				<!-- Google Maps Embed (FR-05) -->
				<div class="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
					<iframe
						title="Peta Lokasi Workshop FD Digital Printing"
						src={data.company.googleMapsEmbed}
						class="h-[340px] sm:h-[440px] md:h-[500px] w-full border-0"
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
					></iframe>
				</div>
			</div>
		</section>

		<!-- ======================================================== -->
		<!-- FR-07: INFORMASI FAQ DAN BANTUAN LAYANAN PERCETAKAN       -->
		<!-- ======================================================== -->
		<section id="faq" class="scroll-mt-16 py-14 sm:py-20 bg-white dark:bg-slate-900/60 border-t border-slate-200/80 dark:border-slate-800">
			<div class="mx-auto max-w-4xl px-4">
				<div class="text-center max-w-xl mx-auto mb-10">
					<span class="text-xs font-bold tracking-wider text-[#00aeef] uppercase">Pusat Bantuan</span>
					<h2 class="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
						Pertanyaan Umum (FAQ)
					</h2>
					<p class="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
						Informasi dan bantuan teknis seputar layanan cetak, spesifikasi file, dan pemesanan di FD Digital Printing.
					</p>
				</div>

				<div class="space-y-3">
					{#each data.faq as f}
						<details class="group rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/60 px-5 py-4 transition hover:border-[#00aeef]/40">
							<summary class="flex cursor-pointer list-none items-center justify-between text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
								<span class="flex items-center gap-2">
									<span class="rounded-md bg-blue-100 dark:bg-blue-950/60 text-[#00aeef] px-2 py-0.5 text-[10px] font-bold">
										{f.kategori}
									</span>
									<span>{f.tanya}</span>
								</span>
								<ChevronDown class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
							</summary>
							<p class="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-700/60 pt-2.5">
								{f.jawab}
							</p>
						</details>
					{/each}
				</div>

				<!-- Butuh Bantuan Lanjutan -->
				<div class="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-5 text-center">
					<p class="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
						Masih punya pertanyaan yang belum terjawab di sini?
					</p>
					<a
						href={WA_UMUM}
						target="_blank"
						rel="noopener"
						class="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
					>
						<WhatsappIcon class="h-4 w-4" />
						<span>Chat Tim Customer Service Kami</span>
					</a>
				</div>
			</div>
		</section>
	</main>

	<!-- Footer Minimal Modern -->
	<footer class="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
		<div class="mx-auto max-w-7xl px-4 py-10 sm:py-12">
			<div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
				<div class="md:col-span-2 space-y-3">
					<div class="flex items-center gap-3">
						<img src="/logo.png" alt="Logo" class="h-9 w-9 rounded-xl object-contain bg-white shadow-2xs" />
						<div>
							<p class="font-bold text-slate-900 dark:text-white text-base">FD Digital Printing</p>
							<p class="text-xs text-slate-500 dark:text-slate-400">Solusi Percetakan Digital Terbaik Sidoarjo Sejak {data.company.tahunBerdiri}</p>
						</div>
					</div>
					<p class="text-xs text-slate-500 leading-relaxed max-w-md">
						{data.deskripsi.ringkasan}
					</p>
				</div>

				<div>
					<h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Navigasi Utama</h4>
					<ul class="space-y-2 text-xs">
						<li><a href="#tentang" class="hover:text-[#00aeef] transition">Tentang Kami</a></li>
						<li><a href="#sejarah" class="hover:text-[#00aeef] transition">Sejarah Perusahaan</a></li>
						<li><a href="#layanan" class="hover:text-[#00aeef] transition">Layanan Percetakan</a></li>
						<li><a href="/mesin" class="hover:text-[#00aeef] font-semibold text-[#00aeef] transition">Armada Mesin (Spesifikasi)</a></li>
						<li><a href="/katalog" class="hover:text-[#00aeef] font-bold text-[#00aeef] transition flex items-center gap-1">E-Commerce & Belanja <ShoppingCart class="h-3 w-3" /></a></li>
					</ul>
				</div>

				<div>
					<h4 class="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Kontak & Workshop</h4>
					<p class="text-xs text-slate-500 leading-relaxed">{data.company.alamatLengkap}</p>
					<p class="text-xs text-slate-500 mt-2">WhatsApp: <strong class="text-slate-900 dark:text-white">{data.company.whatsappDisplay}</strong></p>
					<p class="text-xs text-slate-500 mt-0.5">{data.company.jamOperasional.hariKerja}</p>
				</div>
			</div>

			<div class="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
				<div>© 2018–2026 FD Digital Printing. All rights reserved.</div>
				<div class="flex items-center gap-4">
					<a href="/katalog" class="font-bold text-[#00aeef] hover:underline">E-Commerce</a>
					<a href="/pesan" class="hover:text-[#00aeef]">Form Order</a>
					<a href="/sign-in" class="hover:text-slate-900 dark:hover:text-white">Portal Staf</a>
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

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
</style>
