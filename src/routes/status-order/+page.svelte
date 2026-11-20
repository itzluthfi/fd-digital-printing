<script lang="ts">
	import { onMount } from 'svelte';
	import {
		AlertCircle,
		ArrowLeft,
		CheckCircle2,
		Clock,
		ExternalLink,
		PackageCheck,
		Printer,
		Search,
		ShieldCheck,
		ShoppingCart,
		Truck
	} from 'lucide-svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import { getGuestOrders, type GuestOrder } from '#lib/guest-orders';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let searchInput = $state('');
	$effect(() => {
		searchInput = data.query || '';
	});
	let guestOrders = $state<GuestOrder[]>([]);

	onMount(() => {
		guestOrders = getGuestOrders();
	});

	const rupiah = (n: number) =>
		'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	function getStatusBadge(status: string) {
		switch (status) {
			case 'selesai':
			case 'diambil':
				return { label: 'Selesai / Siap Diambil', bg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
			case 'diproses':
				return { label: 'Sedang Dicetak / Diproses', bg: 'bg-sky-50 dark:bg-sky-950/60 text-blue-600 border-sky-200 dark:border-sky-800' };
			case 'baru':
				return { label: 'Menunggu Pembayaran / Validasi', bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
			case 'batal':
			case 'kadaluarsa':
				return { label: 'Batal / Kadaluarsa', bg: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' };
			default:
				return { label: status, bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200' };
		}
	}

	function getProgressStep(status: string) {
		if (['selesai', 'diambil'].includes(status)) return 4;
		if (status === 'diproses') return 3;
		if (status === 'baru') return 1;
		return 0;
	}
</script>

<svelte:head>
	<title>Cek Status Order — FD Digital Printing</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased transition-colors">
	<!-- Navbar Header -->
	<header class="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
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
					href="/cart"
					class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:border-blue-600 transition"
				>
					<ShoppingCart class="h-3.5 w-3.5 text-blue-600" />
					<span class="hidden sm:inline">Keranjang</span>
				</a>
				<ThemeToggle class="h-8 w-8" />
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-4xl px-4 py-8 sm:py-12 pb-20">
		<!-- Section Header (Printku Style) -->
		<div class="text-center max-w-xl mx-auto mb-8">
			<div class="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-blue-600 mb-3">
				<PackageCheck class="h-6 w-6" />
			</div>
			<h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
				Lacak Status Pesanan Cetak
			</h1>
			<p class="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
				Cek progres pengerjaan cetakan Anda secara langsung. Masukkan kode invoice atau nomor WhatsApp saat memesan.
			</p>
		</div>

		<!-- Search Box -->
		<div class="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-xs max-w-2xl mx-auto mb-8">
			<form method="GET" class="flex flex-col sm:flex-row gap-3">
				<div class="relative flex-1">
					<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<input
						type="text"
						name="q"
						bind:value={searchInput}
						required
						placeholder="Contoh: FD-20261109-1234 atau 08123456789"
						class="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
					/>
				</div>
				<button
					type="submit"
					class="rounded-xl bg-blue-600 hover:bg-[#1d4ed8] text-white px-6 py-3 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer shrink-0"
				>
					Lacak Sekarang
				</button>
			</form>

			<!-- Quick Pills Riwayat di HP ini -->
			{#if guestOrders.length > 0 && !data.query}
				<div class="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
					<span class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
						Pesanan Terakhir di Perangkat Ini:
					</span>
					<div class="flex flex-wrap gap-2">
						{#each guestOrders.slice(0, 5) as go}
							<a
								href={`/status-order?q=${encodeURIComponent(go.code)}`}
								class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-blue-600 hover:text-blue-600 transition"
							>
								<span>{go.code}</span>
								<span class="text-[10px] text-slate-400">({rupiah(go.total)})</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- Hasil Pencarian -->
		{#if data.query}
			<div class="max-w-2xl mx-auto space-y-4">
				<div class="flex items-center justify-between text-xs text-slate-500">
					<span>Hasil pencarian untuk: <strong class="text-slate-900 dark:text-white">"{data.query}"</strong></span>
					<span>{data.orders.length} pesanan ditemukan</span>
				</div>

				{#if data.orders.length === 0}
					<div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center">
						<AlertCircle class="h-8 w-8 text-amber-500 mx-auto mb-2" />
						<h2 class="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Pesanan Tidak Ditemukan</h2>
						<p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
							Pastikan kode invoice atau nomor WhatsApp yang Anda masukkan sudah benar, atau konfirmasi langsung dengan tim kami via WhatsApp.
						</p>
						<a
							href={`https://wa.me/${data.company.whatsapp}?text=${encodeURIComponent(`Halo FD Digital Printing, saya mau cek status pesanan saya dengan kode/nomor: ${data.query}`)}`}
							target="_blank"
							rel="noopener"
							class="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold transition"
						>
							<WhatsappIcon class="h-3.5 w-3.5" />
							<span>Tanya Admin via WA</span>
						</a>
					</div>
				{:else}
					{#each data.orders as ord (ord.id)}
						{@const badge = getStatusBadge(ord.status)}
						{@const step = getProgressStep(ord.status)}
						<div class="rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-5">
							<!-- Header Order -->
							<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
								<div>
									<span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nomor Pesanan</span>
									<span class="text-base sm:text-lg font-black text-slate-900 dark:text-white">{ord.code}</span>
								</div>
								<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border {badge.bg} self-start sm:self-auto">
									{badge.label}
								</span>
							</div>

							<!-- Timeline Progress (Printku Style) -->
							<div class="py-2">
								<div class="grid grid-cols-4 gap-2 text-center">
									<div class="space-y-1">
										<div class="h-2 rounded-full {step >= 1 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}"></div>
										<span class="block text-[10px] font-bold {step >= 1 ? 'text-blue-600' : 'text-slate-400'}">Order Masuk</span>
									</div>
									<div class="space-y-1">
										<div class="h-2 rounded-full {step >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}"></div>
										<span class="block text-[10px] font-bold {step >= 2 ? 'text-blue-600' : 'text-slate-400'}">Dikonfirmasi</span>
									</div>
									<div class="space-y-1">
										<div class="h-2 rounded-full {step >= 3 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}"></div>
										<span class="block text-[10px] font-bold {step >= 3 ? 'text-blue-600' : 'text-slate-400'}">Masuk Mesin</span>
									</div>
									<div class="space-y-1">
										<div class="h-2 rounded-full {step >= 4 ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}"></div>
										<span class="block text-[10px] font-bold {step >= 4 ? 'text-emerald-600' : 'text-slate-400'}">Siap Diambil</span>
									</div>
								</div>
							</div>

							<!-- Detail Isi Pesanan -->
							<div class="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2 text-xs">
								<div class="flex items-center justify-between">
									<span class="text-slate-500">Pemesan:</span>
									<span class="font-bold text-slate-800 dark:text-slate-200">{ord.customerName || 'Pelanggan'} ({ord.customerPhone})</span>
								</div>
								<div class="flex items-start justify-between gap-4">
									<span class="text-slate-500 shrink-0">Item Cetak:</span>
									<span class="font-medium text-slate-800 dark:text-slate-200 text-right whitespace-pre-line">{ord.description}</span>
								</div>
								{#if ord.fileUrl}
									<div class="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
										<span class="text-slate-500">File Desain:</span>
										<a href={ord.fileUrl} target="_blank" rel="noopener" class="text-blue-600 hover:underline flex items-center gap-1 font-semibold">
											<span>Buka Link File</span>
											<ExternalLink class="h-3 w-3" />
										</a>
									</div>
								{/if}
								<div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm">
									<span class="font-bold text-slate-900 dark:text-white">Total Biaya:</span>
									<span class="font-black text-blue-600">{rupiah(ord.total)}</span>
								</div>
							</div>

							<!-- Action Buttons -->
							<div class="flex items-center gap-2 pt-1">
								<a
									href={`https://wa.me/${data.company.whatsapp}?text=${encodeURIComponent(`Halo FD Digital Printing, saya mau update status pesanan kode: ${ord.code}`)}`}
									target="_blank"
									rel="noopener"
									class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 text-xs font-bold transition"
								>
									<WhatsappIcon class="h-3.5 w-3.5" />
									<span>Hubungi Operator WA</span>
								</a>

								<a
									href={`/pesan/sukses/${ord.code}`}
									class="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-blue-600 transition"
								>
									<span>Detail / Struk</span>
								</a>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</main>
</div>
