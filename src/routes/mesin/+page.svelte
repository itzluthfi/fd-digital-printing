<script lang="ts">
	import {
		ArrowLeft,
		ArrowRight,
		CheckCircle2,
		Cpu,
		ExternalLink,
		Filter,
		Layers,
		LogIn,
		Maximize2,
		PhoneCall,
		Printer,
		Scissors,
		Search,
		ShieldCheck,
		Sparkles,
		Tag,
		User,
		Wrench,
		Zap
	} from 'lucide-svelte';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import TelegramIcon from '#lib/components/TelegramIcon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let kategoriPilihan = $state<string>('semua');
	let searchKeyword = $state<string>('');
	let selectedMesinId = $state<string | null>(null);

	const daftarMesin = $derived(data.daftarMesin);

	const mesinTerfilter = $derived(
		daftarMesin.filter((m) => {
			const cocokKategori = kategoriPilihan === 'semua' || m.kategori === kategoriPilihan;
			const keyword = searchKeyword.toLowerCase().trim();
			if (!keyword) return cocokKategori;
			const cocokTeks =
				m.nama.toLowerCase().includes(keyword) ||
				m.kategoriLabel.toLowerCase().includes(keyword) ||
				m.fungsiKegunaan.toLowerCase().includes(keyword) ||
				m.produkDihasilkan.some((p) => p.toLowerCase().includes(keyword)) ||
				m.bahanDiproses.some((b) => b.daftar.some((d) => d.toLowerCase().includes(keyword)));
			return cocokKategori && cocokTeks;
		})
	);

	const waLink = (pesan: string) =>
		`https://wa.me/${data.company.whatsapp}?text=${encodeURIComponent(pesan)}`;
</script>

<svelte:head>
	<title>Teknologi & Informasi Mesin Percetakan — FD Digital Printing</title>
	<meta
		name="description"
		content="Pelajari spesifikasi lengkap armada mesin percetakan modern FD Digital Printing: Mesin Outdoor Konica 512i, Epson Eco-Solvent, Fuji Xerox Versant 180, dan Graphtec Cutter."
	/>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-[#00aeef]/20 transition-colors">
	<!-- Navbar Header -->
	<header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 dark:bg-slate-900/90 dark:border-slate-800 backdrop-blur-md transition-colors">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:py-3">
			<a href="/" title="Kembali ke Company Profile" class="group flex items-center gap-2.5 sm:gap-3 transition">
				<img
					src="/logo.png"
					alt="Logo FD Digital Printing"
					class="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain shadow-2xs group-hover:scale-105 transition-transform"
				/>
				<div class="leading-tight">
					<span class="block text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-[#00aeef] transition-colors">FD Digital Printing</span>
					<span class="block text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Informasi Mesin Percetakan</span>
				</div>
			</a>

			<div class="flex items-center gap-2.5">
				{#if data.user}
					<a
						href={data.user.role === 'operator' ? '/order' : '/dashboard'}
						class="inline-flex items-center gap-1.5 rounded-xl bg-[#00aeef] hover:bg-[#0092c9] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95"
					>
						<User class="h-3.5 w-3.5" />
						<span>{data.user.role === 'customer' ? 'Akun Saya' : 'Dashboard'}</span>
					</a>
				{:else}
					<a
						href="/sign-in"
						class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-[#00aeef] hover:text-[#00aeef] transition active:scale-95"
					>
						<LogIn class="h-3.5 w-3.5 text-[#00aeef]" />
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

	<main class="mx-auto max-w-7xl px-4 py-8 sm:py-12">
		<!-- Breadcrumbs & Hero Title -->
		<div class="mb-8 sm:mb-10 text-center max-w-3xl mx-auto">
			<a
				href="/"
				class="inline-flex items-center gap-1.5 text-xs font-bold text-[#00aeef] hover:underline mb-3"
			>
				<ArrowLeft class="h-3.5 w-3.5" /> Kembali ke Company Profile FD Digital Printing
			</a>
			<span class="block text-xs font-bold tracking-wider text-[#00aeef] uppercase">Kapasitas & Teknologi Produksi</span>
			<h1 class="mt-1 text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
				Armada Mesin Percetakan Kami
			</h1>
			<p class="mt-2 text-xs sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
				Eksplorasi seluruh mesin cetak berstandar industri milik FD Digital Printing. Kami menghadirkan transparansi spesifikasi teknis, jenis bahan yang diproses, serta sampel hasil cetak nyata untuk menjamin kepuasan project Anda.
			</p>

			<!-- Quick Highlights Badges -->
			<div class="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
				<span class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 shadow-2xs">
					<Sparkles class="h-3.5 w-3.5 text-[#00aeef]" /> Terkalibrasi Warna Rutin
				</span>
				<span class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 shadow-2xs">
					<Zap class="h-3.5 w-3.5 text-amber-500" /> Siap Cetak Kilat & Partai Besar
				</span>
				<span class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 shadow-2xs">
					<ShieldCheck class="h-3.5 w-3.5 text-emerald-500" /> Maintenance Berkala
				</span>
			</div>
		</div>

		<!-- Filter & Search Controls -->
		<div class="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
			<!-- Category Tabs -->
			<div class="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
				<button
					type="button"
					onclick={() => (kategoriPilihan = 'semua')}
					class="shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer {kategoriPilihan === 'semua'
						? 'bg-slate-900 text-white dark:bg-[#00aeef] shadow-xs'
						: 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'}"
				>
					Semua Mesin ({daftarMesin.length})
				</button>
				<button
					type="button"
					onclick={() => (kategoriPilihan = 'outdoor')}
					class="shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer {kategoriPilihan === 'outdoor'
						? 'bg-slate-900 text-white dark:bg-[#00aeef] shadow-xs'
						: 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'}"
				>
					Outdoor 3.2M
				</button>
				<button
					type="button"
					onclick={() => (kategoriPilihan = 'indoor')}
					class="shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer {kategoriPilihan === 'indoor'
						? 'bg-slate-900 text-white dark:bg-[#00aeef] shadow-xs'
						: 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'}"
				>
					Indoor Ultra-HD
				</button>
				<button
					type="button"
					onclick={() => (kategoriPilihan = 'laser')}
					class="shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer {kategoriPilihan === 'laser'
						? 'bg-slate-900 text-white dark:bg-[#00aeef] shadow-xs'
						: 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'}"
				>
					Press Laser A3+
				</button>
				<button
					type="button"
					onclick={() => (kategoriPilihan = 'cutting')}
					class="shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer {kategoriPilihan === 'cutting'
						? 'bg-slate-900 text-white dark:bg-[#00aeef] shadow-xs'
						: 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'}"
				>
					Contour Cutting
				</button>
				<button
					type="button"
					onclick={() => (kategoriPilihan = 'finishing')}
					class="shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer {kategoriPilihan === 'finishing'
						? 'bg-slate-900 text-white dark:bg-[#00aeef] shadow-xs'
						: 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'}"
				>
					Finishing & Roll
				</button>
			</div>

			<!-- Search Input -->
			<div class="relative w-full md:w-72">
				<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
				<input
					type="text"
					bind:value={searchKeyword}
					placeholder="Cari mesin, bahan, atau produk..."
					class="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-[#00aeef] focus:outline-none focus:ring-1 focus:ring-[#00aeef]"
				/>
			</div>
		</div>

		<!-- DAFTAR MESIN PERCETAKAN (FR-08 s/d FR-14) -->
		<div class="space-y-10 sm:space-y-14">
			{#if mesinTerfilter.length === 0}
				<div class="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
					<Cpu class="h-12 w-12 text-slate-400 mx-auto mb-3" />
					<h3 class="text-base font-bold text-slate-800 dark:text-slate-200">Tidak ada mesin yang cocok</h3>
					<p class="text-xs text-slate-500 mt-1">Coba kata kunci lain atau pilih tab kategori 'Semua Mesin'.</p>
					<button
						type="button"
						onclick={() => {
							kategoriPilihan = 'semua';
							searchKeyword = '';
						}}
						class="mt-4 rounded-xl bg-[#00aeef] px-4 py-2 text-xs font-bold text-white shadow-xs"
					>
						Reset Filter
					</button>
				</div>
			{/if}

			{#each mesinTerfilter as mesin, index}
				<article
					id={mesin.id}
					class="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300"
				>
					<!-- Header Banner Card: FR-08 & FR-09 -->
					<div class="grid grid-cols-1 lg:grid-cols-12 gap-0 border-b border-slate-100 dark:border-slate-800">
						<!-- FR-09: Foto Mesin -->
						<div class="lg:col-span-5 relative bg-slate-100 dark:bg-slate-800 aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto overflow-hidden">
							<img
								src={mesin.foto}
								alt={`Foto ${mesin.nama}`}
								class="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
								loading="lazy"
							/>
							<div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent lg:hidden"></div>
							<div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
								<span class="rounded-lg bg-slate-950/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
									{mesin.kategoriLabel}
								</span>
								<span class="rounded-lg bg-emerald-600/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white flex items-center gap-1">
									<CheckCircle2 class="h-3 w-3" /> {mesin.statusOperasional}
								</span>
							</div>
						</div>

						<!-- Ringkasan Mesin & FR-10 (Fungsi & Kegunaan) -->
						<div class="lg:col-span-7 p-5 sm:p-7 md:p-8 flex flex-col justify-between">
							<div>
								<div class="flex items-center gap-2 text-xs font-bold text-[#00aeef] uppercase tracking-wider">
									<Printer class="h-4 w-4" />
									<span>Mesin #{index + 1} — {mesin.kategoriLabel}</span>
								</div>
								<!-- FR-09: Nama Mesin -->
								<h2 class="mt-1 text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
									{mesin.nama}
								</h2>
								<p class="mt-1 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
									{mesin.tagline}
								</p>

								<!-- FR-10: Fungsi dan Kegunaan Setiap Mesin -->
								<div class="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-800">
									<div class="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white mb-1.5">
										<Wrench class="h-3.5 w-3.5 text-[#00aeef]" />
										<span>Fungsi & Kegunaan Utama:</span>
									</div>
									<p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
										{mesin.fungsiKegunaan}
									</p>
								</div>

								<!-- Keunggulan Mesin -->
								<div class="mt-4 space-y-1.5">
									{#each mesin.keunggulanUtama as keunggulan}
										<div class="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
											<CheckCircle2 class="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
											<span>{keunggulan}</span>
										</div>
									{/each}
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2.5">
								<a
									href={waLink(`Halo FD Digital Printing, saya mau konsultasi cetak menggunakan mesin: ${mesin.nama}.`)}
									target="_blank"
									rel="noopener"
									class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
								>
									<WhatsappIcon class="h-4 w-4" />
									<span>Konsultasi Mesin Ini</span>
								</a>

								<a
									href="/pesan"
									class="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-[#00aeef] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:hover:bg-[#0092c9] transition active:scale-95"
								>
									<span>Langsung Pesan Online</span>
									<ArrowRight class="h-3.5 w-3.5" />
								</a>
							</div>
						</div>
					</div>

					<!-- Technical Details Grid: FR-11, FR-12, FR-13, FR-14 -->
					<div class="p-5 sm:p-7 md:p-8 space-y-6">
						<!-- FR-13: Spesifikasi Mesin yang Relevan bagi Pelanggan -->
						<div>
							<h3 class="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3">
								<Cpu class="h-4 w-4 text-[#00aeef]" />
								<span>Spesifikasi Teknis Relevan untuk Pelanggan</span>
							</h3>
							<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
								{#each mesin.spesifikasi as spec}
									<div class="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
										<span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{spec.label}</span>
										<span class="block text-xs font-bold text-slate-900 dark:text-white mt-1 leading-snug">{spec.value}</span>
									</div>
								{/each}
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							<!-- FR-11: Jenis Pekerjaan & Produk yang Dihasilkan -->
							<div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5">
								<h3 class="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3">
									<Layers class="h-4 w-4 text-[#00aeef]" />
									<span>Pekerjaan & Produk yang Dihasilkan</span>
								</h3>
								<div class="space-y-3">
									<div>
										<span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Jenis Pekerjaan:</span>
										<ul class="space-y-1 text-xs text-slate-600 dark:text-slate-300">
											{#each mesin.jenisPekerjaan as p}
												<li class="flex items-center gap-1.5">
													<span class="h-1.5 w-1.5 rounded-full bg-[#00aeef]"></span>
													<span>{p}</span>
												</li>
											{/each}
										</ul>
									</div>
									<div class="pt-2 border-t border-slate-200/60 dark:border-slate-800">
										<span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Produk Jadi:</span>
										<div class="flex flex-wrap gap-1.5">
											{#each mesin.produkDihasilkan as prod}
												<span class="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-800 dark:text-slate-200">
													{prod}
												</span>
											{/each}
										</div>
									</div>
								</div>
							</div>

							<!-- FR-12: Jenis Bahan yang Dapat Diproses -->
							<div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-5">
								<h3 class="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-3">
									<Tag class="h-4 w-4 text-[#00aeef]" />
									<span>Jenis Bahan yang Dapat Diproses</span>
								</h3>
								<div class="space-y-3">
									{#each mesin.bahanDiproses as kategoriBahan}
										<div>
											<span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
												{kategoriBahan.kategori}:
											</span>
											<div class="flex flex-wrap gap-1.5">
												{#each kategoriBahan.daftar as b}
													<span class="rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-1 text-[11px] font-medium text-blue-900 dark:text-blue-200">
														{b}
													</span>
												{/each}
											</div>
										</div>
									{/each}
								</div>
							</div>
						</div>

						<!-- FR-14: Contoh Hasil Cetak yang Dihasilkan -->
						<div>
							<h3 class="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-3">
								<Sparkles class="h-4 w-4 text-[#00aeef]" />
								<span>Contoh Hasil Cetak Nyata Mesin Ini</span>
							</h3>
							<div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
								{#each mesin.contohHasilCetak as contoh}
									<div class="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/80 p-4 flex flex-col justify-between shadow-2xs hover:border-[#00aeef]/60 transition-colors">
										<div>
											<div class="flex items-center justify-between gap-2 mb-2">
												<span class="rounded-md bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
													{contoh.badge}
												</span>
												<span class="text-[10px] text-slate-400 font-semibold">{contoh.material}</span>
											</div>
											<h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
												{contoh.judul}
											</h4>
											<p class="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
												{contoh.deskripsi}
											</p>
										</div>
										<div class="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
											<span class="text-emerald-600 dark:text-emerald-400 font-semibold">Tersedia di Katalog</span>
											<a href="/pesan" class="font-bold text-[#00aeef] hover:underline flex items-center gap-0.5">
												Pesan <ArrowRight class="h-3 w-3" />
											</a>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</article>
			{/each}
		</div>

		<!-- Bottom Banner CTA -->
		<div class="mt-14 sm:mt-20 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
			<div class="relative z-10 max-w-2xl">
				<span class="text-xs font-bold text-[#00aeef] uppercase tracking-wider">Solusi Percetakan Andal</span>
				<h2 class="mt-1 text-2xl sm:text-3xl font-black text-white">Punya Spesifikasi Proyek Khusus?</h2>
				<p class="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
					Tim teknis dan operator mesin FD Digital Printing siap membantu memilih jenis mesin, bahan baku paling tepat, dan uji sampel warna untuk proyek cetak Anda.
				</p>
				<div class="mt-6 flex flex-wrap items-center gap-3">
					<a
						href={waLink('Halo FD Digital Printing, saya ada project cetak khusus dan mau diskusi teknis mesin.')}
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-3 text-xs font-bold text-white shadow-md transition active:scale-95"
					>
						<WhatsappIcon class="h-4 w-4" />
						<span>Konsultasi Teknis Mesin</span>
					</a>
					<a
						href="/katalog"
						class="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 text-xs font-bold text-white backdrop-blur-xs transition active:scale-95"
					>
						<span>Buka Katalog Produk</span>
					</a>
				</div>
			</div>
		</div>
	</main>

	<!-- Footer Minimal -->
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
					<a href="/" class="hover:text-[#00aeef]">Beranda Company Profile</a>
					<a href="/#layanan" class="hover:text-[#00aeef]">Layanan</a>
					<a href="/katalog" class="hover:text-[#00aeef]">Katalog</a>
					<a href="/pesan" class="hover:text-[#00aeef]">Pesan Online</a>
				</div>
			</div>
		</div>
	</footer>
</div>
