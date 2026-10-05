<script lang="ts">
	import {
		BadgeCheck,
		ChevronDown,
		Clock,
		Flag,
		IdCard,
		Image as ImageIcon,
		MapPin,
		MessagesSquare,
		Newspaper,
		Phone,
		Printer,
		Sticker,
		Tag,
		Wallet,
		Zap
	} from 'lucide-svelte';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import TelegramIcon from '#lib/components/TelegramIcon.svelte';
	import logoFd from '#lib/assets/logo-fd.svg';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const WA_NUMBER = '6289507370805';
	const WA_DISPLAY = '0895-0737-0805';
	const TELEGRAM_URL = 'https://t.me/FD_printing_bot';

	const KONTAK = {
		alamat: 'Jl. Raya Wadungasri No. 42',
		jam: ''
	};
	const MAP_QUERY = 'FD Digital Printing, Jl. Raya Wadungasri No. 42';
	const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
	const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;

	const waLink = (pesan: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(pesan)}`;
	const WA_UMUM = waLink('Halo FD Digital Printing, saya mau tanya-tanya dulu.');

	const rupiah = (n: number) =>
		'Rp' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	const SATUAN_SINGKAT: Record<string, string> = {
		meter: '/m²',
		pcs: '/pcs',
		lembar: '/lembar',
		paket: '/paket'
	};

	function ikonProduk(nama: string) {
		const n = nama.toLowerCase();
		if (n.includes('banner')) return Flag;
		if (n.includes('stiker')) return Sticker;
		if (n.includes('brosur')) return Newspaper;
		if (n.includes('kartu')) return IdCard;
		if (n.includes('foto')) return ImageIcon;
		return Printer;
	}

	const TRUST = [
		{ ikon: BadgeCheck, judul: 'Hasil Terjamin', teks: 'Cek kualitas sebelum diserahkan.' },
		{ ikon: Zap, judul: 'Proses Cepat', teks: 'Antrian produksi terpantau rapi.' },
		{ ikon: Tag, judul: 'Harga Jelas', teks: 'Acuan katalog, tanpa biaya siluman.' },
		{ ikon: MessagesSquare, judul: 'Dibantu Sampai Beres', teks: 'Konsultasi via WhatsApp, gratis.' }
	];

	const LANGKAH = [
		{ judul: 'Pilih layanan', teks: 'Tentukan yang mau dicetak: banner, stiker, brosur, kartu nama, atau foto.' },
		{ judul: 'Chat WhatsApp', teks: 'Kirim desain via WhatsApp. Belum punya desain? Ceritakan saja kebutuhanmu.' },
		{ judul: 'Konfirmasi & pembayaran', teks: 'Kami hitungkan total dari katalog harga. Bayar tunai, transfer, atau QRIS.' },
		{ judul: 'Produksi', teks: 'Pesananmu masuk antrian dan dikerjakan. Statusnya terpantau.' },
		{ judul: 'Ambil atau dikirim', teks: 'Ambil langsung atau kami kirimkan. Selesai.' }
	];

	const FAQ = [
		{
			t: 'Saya tidak punya desain, bisa?',
			j: 'Bisa. Ceritakan kebutuhanmu lewat WhatsApp — teks, warna, ukuran — nanti kami bantu siapkan.'
		},
		{
			t: 'Apakah ada minimum order?',
			j: 'Untuk satuan kecil seperti stiker dan kartu nama tidak ada minimum yang memberatkan. Untuk banner besar, tanya dulu via WhatsApp.'
		},
		{
			t: 'Bisa urgent / ditunggu?',
			j: 'Tergantung antrian hari itu. Chat WhatsApp dulu, kami usahakan yang tercepat.'
		},
		{
			t: 'Bagaimana cara bayar?',
			j: 'Tunai, transfer bank, atau QRIS. Pesanan besar biasanya pakai DP — rinciannya dijelaskan saat konfirmasi.'
		},
		{
			t: 'File desain format apa?',
			j: 'PDF, JPG, atau PNG. Kalau cuma punya foto dari HP, kirim saja — kami bantu cek kelayakannya.'
		}
	];
</script>

<svelte:head>
	<title>FD Digital Printing — Cetak Banner, Stiker, Brosur, Kartu Nama</title>
	<meta
		name="description"
		content="FD Digital Printing: cetak banner, stiker, brosur, kartu nama, dan cetak foto. Harga jelas dari katalog, pesan semudah chat WhatsApp."
	/>
</svelte:head>

<div class="min-h-screen bg-white font-sans text-slate-900 antialiased">
	<!-- Top bar -->
	<div class="bg-brand-950 text-white">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 text-sm">
			<a href={waLink('Halo FD Digital Printing!')} class="flex items-center gap-2 hover:text-brand-100">
				<Phone class="h-4 w-4" />
				<span class="font-medium">{WA_DISPLAY}</span>
			</a>
			<span class="hidden items-center gap-1.5 text-brand-200 sm:flex">
				<MapPin class="h-4 w-4" />
				{KONTAK.alamat}
			</span>
		</div>
	</div>

	<!-- Header -->
	<header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
			<a href="#atas" class="flex items-center gap-2.5">
				<img src={logoFd} alt="Logo FD Digital Printing" class="h-10 w-10 rounded-xl" />
				<span class="leading-tight">
					<span class="block text-base font-bold text-brand-900">FD Digital Printing</span>
					<span class="block text-xs text-slate-500">Cetak cepat, hasil hebat</span>
				</span>
			</a>
			<nav class="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
				<a href="#layanan" class="hover:text-brand-900">Layanan</a>
				<a href="#harga" class="hover:text-brand-900">Harga</a>
				<a href="#cara-order" class="hover:text-brand-900">Cara Order</a>
				<a href="#faq" class="hover:text-brand-900">FAQ</a>
				<a href="#lokasi" class="hover:text-brand-900">Lokasi</a>
			</nav>
			<a
				href={WA_UMUM}
				target="_blank"
				rel="noopener"
				class="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
			>
				<WhatsappIcon class="h-4 w-4" />
				<span class="hidden sm:inline">Pesan via WhatsApp</span>
				<span class="sm:hidden">Pesan</span>
			</a>
		</div>
	</header>

	<main id="atas">
		<!-- Hero -->
		<section class="bg-brand-900 text-white">
			<div class="mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
				<div>
					<p class="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-brand-100">
						DIGITAL PRINTING
					</p>
					<h1 class="text-3xl font-bold leading-tight md:text-5xl">
						Cetak banner, stiker & brosur. Pesan semudah chat.
					</h1>
					<p class="mt-4 max-w-md text-brand-100 md:text-lg">
						Harga jelas dari katalog, tanpa biaya siluman. Kirim desain via WhatsApp, kami
						urus sisanya sampai beres.
					</p>
					<div class="mt-6 flex flex-wrap gap-3">
						<a
							href={WA_UMUM}
							target="_blank"
							rel="noopener"
							class="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
						>
							<WhatsappIcon class="h-5 w-5" />
							Chat WhatsApp
						</a>
						<a
							href="#harga"
							class="flex items-center gap-2 rounded-xl bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
						>
							<Tag class="h-5 w-5" />
							Lihat Harga
						</a>
					</div>
					{#if data.items.length > 0}
						<p class="mt-6 text-sm text-brand-200">
							Mulai dari
							<span class="font-bold text-white">{rupiah(Math.min(...data.items.map((i) => i.price)))}</span>
							— {data.items.length} layanan di katalog.
						</p>
					{/if}
				</div>
				<div class="overflow-hidden rounded-2xl">
					<img
						src="/landing-hero.jpg"
						alt="Mesin large-format printing mencetak banner"
						class="h-64 w-full object-cover md:h-96"
						loading="eager"
					/>
				</div>
			</div>
		</section>

		<!-- Trust strip -->
		<section class="border-b border-slate-200 bg-white">
			<div class="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-8 md:grid-cols-4">
				{#each TRUST as t}
					<div class="flex items-start gap-3">
						<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
							<t.ikon class="h-5 w-5" />
						</span>
						<span>
							<span class="block font-semibold">{t.judul}</span>
							<span class="block text-sm text-slate-500">{t.teks}</span>
						</span>
					</div>
				{/each}
			</div>
		</section>

		<!-- Layanan -->
		<section id="layanan" class="scroll-mt-20 bg-slate-50">
			<div class="mx-auto max-w-6xl px-4 py-14 md:py-20">
				<h2 class="text-2xl font-bold text-brand-900 md:text-3xl">Layanan kami</h2>
				<p class="mt-2 max-w-xl text-slate-500">
					Klik layanan untuk langsung chat WhatsApp dengan pesan terisi otomatis.
				</p>
				<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each data.items as item}
						{@const Ikon = ikonProduk(item.name)}
						<a
							href={waLink(`Halo FD Digital Printing, saya mau pesan: ${item.name}.`)}
							target="_blank"
							rel="noopener"
							class="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lg"
						>
							<span class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-900 text-white">
								<Ikon class="h-6 w-6" />
							</span>
							<span class="mt-4 block font-semibold text-slate-900">{item.name}</span>
							<span class="mt-1 block text-sm text-slate-500">
								Mulai <span class="font-bold text-brand-900">{rupiah(item.price)}</span>{SATUAN_SINGKAT[item.unit] ?? ''}
							</span>
							<span class="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 group-hover:underline">
								<WhatsappIcon class="h-4 w-4" />
								Pesan via WhatsApp
							</span>
						</a>
					{/each}
				</div>
			</div>
		</section>

		<!-- Kenapa FD -->
		<section class="bg-white">
			<div class="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
				<div class="overflow-hidden rounded-2xl">
					<img
						src="/landing-stiker.jpg"
						alt="Stiker vinyl hasil cetakan"
						class="h-64 w-full object-cover md:h-80"
						loading="lazy"
					/>
				</div>
				<div>
					<h2 class="text-2xl font-bold text-brand-900 md:text-3xl">Kenapa cetak di FD?</h2>
					<ul class="mt-6 space-y-4">
						<li class="flex items-start gap-3">
							<BadgeCheck class="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
							<span><strong>Harga transparan.</strong> Semua acuan harga ada di katalog — yang kamu lihat, itu yang kamu bayar.</span>
						</li>
						<li class="flex items-start gap-3">
							<BadgeCheck class="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
							<span><strong>Order tercatat rapi.</strong> Setiap pesanan punya kode tracking, jadi tidak ada yang tercecer.</span>
						</li>
						<li class="flex items-start gap-3">
							<BadgeCheck class="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
							<span><strong>Kabar otomatis.</strong> Saat cetakanmu selesai, kamu langsung diberi tahu untuk diambil.</span>
						</li>
					</ul>

				</div>
			</div>
		</section>

		<!-- Cara order -->
		<section id="cara-order" class="scroll-mt-20 bg-brand-900 text-white">
			<div class="mx-auto max-w-6xl px-4 py-14 md:py-20">
				<h2 class="text-2xl font-bold md:text-3xl">Cara order</h2>
				<p class="mt-2 text-brand-200">Lima langkah, tanpa ribet.</p>
				<ol class="mt-8 grid gap-4 md:grid-cols-5">
					{#each LANGKAH as l, i}
						<li class="rounded-2xl bg-white/10 p-5">
							<span class="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-white">
								{i + 1}
							</span>
							<span class="mt-3 block font-semibold">{l.judul}</span>
							<span class="mt-1 block text-sm text-brand-200">{l.teks}</span>
						</li>
					{/each}
				</ol>
				<div class="mt-8 flex flex-wrap items-center gap-4 text-sm text-brand-200">
					<span class="flex items-center gap-2">
						<Wallet class="h-4 w-4" /> Tunai · Transfer · QRIS
					</span>
					<span class="flex items-center gap-2">
						<Clock class="h-4 w-4" /> Info jam buka via WhatsApp
					</span>
				</div>
			</div>
		</section>

		<!-- Daftar harga -->
		<section id="harga" class="scroll-mt-20 bg-white">
			<div class="mx-auto max-w-4xl px-4 py-14 md:py-20">
				<h2 class="text-2xl font-bold text-brand-900 md:text-3xl">Daftar harga</h2>
				<p class="mt-2 text-slate-500">Acuan langsung dari katalog kami. Harga final dikonfirmasi via WhatsApp.</p>
				<div class="mt-8 overflow-hidden rounded-2xl border border-slate-200">
					{#each data.items as item, i}
						<div class="flex items-center justify-between gap-4 px-5 py-4 {i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}">
							<div>
								<p class="font-semibold">{item.name}</p>
								<p class="text-sm text-slate-500">{SATUAN_SINGKAT[item.unit] ?? item.unit}</p>
							</div>
							<p class="shrink-0 font-bold text-brand-900">{rupiah(item.price)}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<!-- Galeri -->
		<section class="bg-slate-50">
			<div class="mx-auto max-w-6xl px-4 py-14 md:py-20">
				<h2 class="text-2xl font-bold text-brand-900 md:text-3xl">Hasil cetakan</h2>
				<p class="mt-2 text-slate-500">Contoh jenis produk yang kami kerjakan.</p>
				<div class="mt-8 grid gap-4 md:grid-cols-2">
					<div class="overflow-hidden rounded-2xl">
						<img src="/landing-stiker.jpg" alt="Contoh stiker" class="h-64 w-full object-cover" loading="lazy" />
						<p class="bg-white px-5 py-3 text-sm font-medium text-slate-600">Stiker vinyl & chromo</p>
					</div>
					<div class="overflow-hidden rounded-2xl">
						<img src="/landing-offset.jpg" alt="Contoh brosur dan kartu nama" class="h-64 w-full object-cover" loading="lazy" />
						<p class="bg-white px-5 py-3 text-sm font-medium text-slate-600">Brosur & kartu nama</p>
					</div>
				</div>
			</div>
		</section>

		<!-- FAQ -->
		<section id="faq" class="scroll-mt-20 bg-white">
			<div class="mx-auto max-w-3xl px-4 py-14 md:py-20">
				<h2 class="text-2xl font-bold text-brand-900 md:text-3xl">Pertanyaan umum</h2>
				<div class="mt-8 space-y-3">
					{#each FAQ as f}
						<details class="group rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
							<summary class="flex cursor-pointer list-none items-center justify-between font-semibold">
								{f.t}
								<ChevronDown class="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
							</summary>
							<p class="mt-2 text-sm leading-relaxed text-slate-600">{f.j}</p>
						</details>
					{/each}
				</div>
			</div>
		</section>

		<!-- Lokasi & jam buka -->
		<section id="lokasi" class="scroll-mt-20 bg-slate-50">
			<div class="mx-auto max-w-6xl px-4 py-14 md:py-20">
				<h2 class="text-2xl font-bold text-brand-900 md:text-3xl">Kunjungi toko kami</h2>
			<p class="mt-2 text-slate-500">Mampir langsung untuk konsultasi dan ambil pesanan.</p>
				{#if KONTAK.alamat}
					<div class="mt-8 grid gap-4 md:grid-cols-2">
						<div class="overflow-hidden rounded-2xl border border-slate-200">
							<iframe
								title="Peta lokasi FD Digital Printing"
								src={MAP_EMBED}
								class="h-72 w-full"
								loading="lazy"
							></iframe>
						</div>
						<div class="rounded-2xl border border-slate-200 bg-white p-6">
							<p class="flex items-start gap-3">
								<MapPin class="mt-0.5 h-5 w-5 shrink-0 text-brand-900" />
								<span>{KONTAK.alamat}</span>
							</p>
							{#if KONTAK.jam}
								<p class="mt-4 flex items-start gap-3">
									<Clock class="mt-0.5 h-5 w-5 shrink-0 text-brand-900" />
									<span>{KONTAK.jam}</span>
								</p>
							{:else}
								<p class="mt-4 flex items-start gap-3">
									<Clock class="mt-0.5 h-5 w-5 shrink-0 text-brand-900" />
									<span>Jam buka: hubungi via WhatsApp</span>
								</p>
							{/if}
							<div class="mt-6 flex flex-wrap gap-3">
								<a
									href={MAP_LINK}
									target="_blank"
									rel="noopener"
									class="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-6 py-3 font-semibold text-brand-900 transition hover:bg-slate-50"
								>
									<MapPin class="h-5 w-5" />
									Lihat Rute di Google Maps
								</a>
							<a
								href={WA_UMUM}
								target="_blank"
								rel="noopener"
								class="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
							>
								<WhatsappIcon class="h-5 w-5" />
								Chat WhatsApp
							</a>
						</div>
					</div>
				</div>
				{:else}
					<div class="mt-8 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
						<MapPin class="mx-auto h-8 w-8 text-slate-400" />
						<p class="mt-3 font-semibold text-slate-700">Alamat & jam buka menyusul</p>
						<p class="mt-1 text-sm text-slate-500">Chat WhatsApp untuk info lokasi toko.</p>
					</div>
				{/if}
			</div>
		</section>

		<!-- CTA final -->
		<section class="bg-brand-900 text-white">
			<div class="mx-auto max-w-3xl px-4 py-14 text-center md:py-20">
				<h2 class="text-2xl font-bold md:text-3xl">Siap cetak? Chat kami sekarang.</h2>
				<p class="mt-2 text-brand-200">Balas cepat di jam kerja. Kirim desainmu, kami hitungkan harganya.</p>
				<div class="mt-6 flex flex-wrap items-center justify-center gap-3">
					<a
						href={WA_UMUM}
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-green-700"
					>
						<WhatsappIcon class="h-6 w-6" />
						{WA_DISPLAY}
					</a>
					<a
						href={TELEGRAM_URL}
						target="_blank"
						rel="noopener"
						class="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-6 py-4 font-semibold text-white transition hover:bg-white/20"
					>
						<TelegramIcon class="h-5 w-5" />
						Telegram
					</a>
				</div>
			</div>
		</section>
	</main>

	<!-- Footer -->
	<footer class="bg-brand-950 text-brand-200">
		<div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
			<div>
				<p class="font-bold text-white">FD Digital Printing</p>
				<p class="mt-2 text-sm">Cetak cepat, hasil hebat. Banner, stiker, brosur, kartu nama, cetak foto.</p>
			</div>
			<div>
				<p class="font-bold text-white">Layanan</p>
				<ul class="mt-2 space-y-1 text-sm">
					{#each data.items as item}
						<li>{item.name}</li>
					{/each}
				</ul>
			</div>
			<div>
				<p class="font-bold text-white">Hubungi kami</p>
				<a href={WA_UMUM} target="_blank" rel="noopener" class="mt-2 flex items-center gap-2 text-sm hover:text-white">
					<WhatsappIcon class="h-4 w-4" /> WhatsApp: {WA_DISPLAY}
				</a>
				<a href={TELEGRAM_URL} target="_blank" rel="noopener" class="mt-2 flex items-center gap-2 text-sm hover:text-white">
					<TelegramIcon class="h-4 w-4" /> Telegram: @FD_printing_bot
				</a>
				<p class="mt-2 flex items-start gap-2 text-sm">
					<MapPin class="mt-0.5 h-4 w-4 shrink-0" />
					{KONTAK.alamat}
				</p>
				<p class="mt-1 text-sm">Jam buka: tanya via WhatsApp.</p>
			</div>
		</div>
		<div class="border-t border-white/10">
			<div class="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-brand-300">
				© 2026 FD Digital Printing
			</div>
		</div>
	</footer>

	<!-- Sticky WA bar (mobile) -->
	<div class="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden">
		<a
			href={WA_UMUM}
			target="_blank"
			rel="noopener"
			class="flex items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white"
		>
			<WhatsappIcon class="h-5 w-5" />
			Pesan via WhatsApp
		</a>
	</div>
	<div class="h-20 md:hidden"></div>
</div>

<style>
	html {
		scroll-behavior: smooth;
	}
</style>
