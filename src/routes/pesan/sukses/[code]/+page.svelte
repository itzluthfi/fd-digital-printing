<script lang="ts">
	import {
		ArrowLeft,
		Check,
		CheckCircle2,
		Clock,
		Copy,
		Download,
		ExternalLink,
		PackageCheck,
		Printer,
		QrCode,
		ShieldCheck,
		Wallet
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import { saveGuestOrder } from '#lib/guest-orders';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const WA_NUMBER = '6289507370805';
	let copied = $state(false);

	onMount(() => {
		if (data.order?.code) {
			saveGuestOrder({
				code: data.order.code,
				name: data.order.description ?? `Pesanan ${data.order.code}`,
				total: data.order.total,
				createdAt: data.order.createdAt ?? new Date().toISOString()
			});
		}
	});

	const rupiah = (n: number) =>
		'Rp ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	function salinKode() {
		navigator.clipboard.writeText(data.order.code ?? '');
		copied = true;
		toast.success('Kode order disalin ke clipboard!');
		setTimeout(() => (copied = false), 2500);
	}

	const waKonfirmasiUrl = $derived.by(() => {
		const pesan =
			`Halo FD Digital Printing, saya baru saja melakukan pemesanan via Web!\n\n` +
			`• Kode Order: *${data.order.code}*\n` +
			`• Nama: *${data.order.customerName ?? '-'}*\n` +
			`• Total: *${rupiah(data.order.total)}*\n` +
			(data.order.fileUrl ? `• Link File: ${data.order.fileUrl}\n` : '') +
			`\nMohon dicek dan dikonfirmasi pesanannya ya. Terima kasih!`;
		return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(pesan)}`;
	});

	// Status progression step
	const statusMap: Record<string, number> = {
		baru: 1,
		diproses: 2,
		selesai: 3,
		diambil: 4
	};
	const currentStep = $derived(statusMap[data.order.status] ?? 1);
	const isPaid = $derived(data.order.status !== 'baru' || (data.payments && data.payments.length > 0));
</script>

<svelte:head>
	<title>Pesanan: {data.order.code} — FD Digital Printing</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-[#00aeef]/20 transition-colors">
	<!-- Navbar Header -->
	<header class="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 dark:bg-slate-900/95 dark:border-slate-800 backdrop-blur-md">
		<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
			<a href="/" class="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition text-xs sm:text-sm font-semibold">
				<ArrowLeft class="h-4 w-4" />
				<span>Beranda</span>
			</a>

			<div class="flex items-center gap-2">
				<img src="/logo.png" alt="Logo" class="h-8 w-8 rounded-lg object-contain bg-white shadow-2xs" />
				<span class="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Status Pesanan</span>
			</div>

			<ThemeToggle class="h-8 w-8" />
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-4 py-8 sm:py-12">
		<!-- Success Announcement Card -->
		<div class="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:bg-slate-900 dark:border-slate-800 text-center">
			{#if isPaid}
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
					<CheckCircle2 class="h-9 w-9" />
				</div>

				<h1 class="mt-4 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
					Pesanan & Pembayaran Diterima!
				</h1>
				<p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
					Terima kasih! Pembayaran Anda telah terkonfirmasi lunas dan pesanan masuk tahap produksi pengerjaan.
				</p>
			{:else}
				<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
					<Clock class="h-9 w-9" />
				</div>

				<h1 class="mt-4 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
					Pesanan Tercatat (Menunggu Pembayaran)
				</h1>
				<p class="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
					Pesanan Anda telah tercatat di antrean. Pembayaran belum terverifikasi lunas — silakan selesaikan via QRIS atau kirim bukti via WhatsApp.
				</p>
			{/if}

			<!-- Kode Order Banner -->
			<div class="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 px-6 py-4">
				<div class="text-left">
					<span class="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kode Pelacakan Order</span>
					<span class="font-mono text-2xl font-black text-brand-900 dark:text-[#00aeef] tracking-wider">
						{data.order.code}
					</span>
				</div>
				<button
					type="button"
					onclick={salinKode}
					class="flex items-center gap-1.5 rounded-xl bg-white dark:bg-slate-700 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition shadow-2xs cursor-pointer active:scale-95"
				>
					{#if copied}
						<Check class="h-3.5 w-3.5 text-emerald-500" />
						<span>Tersalin!</span>
					{:else}
						<Copy class="h-3.5 w-3.5" />
						<span>Salin Kode</span>
					{/if}
				</button>
			</div>

			<!-- Status Stepper Timeline -->
			<div class="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
				<div class="grid grid-cols-4 gap-2 text-center">
					<div class="flex flex-col items-center">
						<div class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold {currentStep >= 1 ? 'bg-[#00aeef] text-white shadow-xs' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}">
							1
						</div>
						<span class="mt-2 text-[11px] sm:text-xs font-semibold {currentStep >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}">
							Diterima
						</span>
					</div>

					<div class="flex flex-col items-center">
						<div class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold {currentStep >= 2 ? 'bg-[#00aeef] text-white shadow-xs' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}">
							2
						</div>
						<span class="mt-2 text-[11px] sm:text-xs font-semibold {currentStep >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}">
							Produksi
						</span>
					</div>

					<div class="flex flex-col items-center">
						<div class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold {currentStep >= 3 ? 'bg-[#00aeef] text-white shadow-xs' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}">
							3
						</div>
						<span class="mt-2 text-[11px] sm:text-xs font-semibold {currentStep >= 3 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}">
							Selesai
						</span>
					</div>

					<div class="flex flex-col items-center">
						<div class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold {currentStep >= 4 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}">
							4
						</div>
						<span class="mt-2 text-[11px] sm:text-xs font-semibold {currentStep >= 4 ? 'text-slate-900 dark:text-white' : 'text-slate-400'}">
							Diambil
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Rincian Pesanan Card -->
		<div class="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
			<h2 class="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
				Rincian Pesanan
			</h2>

			<div class="mt-4 space-y-3 text-xs sm:text-sm">
				<div class="flex justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/60">
					<span class="text-slate-500 dark:text-slate-400">Pemesan</span>
					<span class="font-semibold text-slate-900 dark:text-white">{data.order.customerName} ({data.order.customerPhone})</span>
				</div>

				<div class="py-1.5 border-b border-slate-50 dark:border-slate-800/60">
					<span class="block text-slate-500 dark:text-slate-400 mb-1">Item yang Dipesan:</span>
					<p class="font-medium text-slate-900 dark:text-white whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
						{data.order.description}
					</p>
				</div>

				{#if data.order.fileUrl}
					<div class="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/60">
						<span class="text-slate-500 dark:text-slate-400">File Desain</span>
						<a href={data.order.fileUrl} target="_blank" rel="noopener" class="flex items-center gap-1 font-semibold text-[#00aeef] hover:underline">
							<span>Buka Tautan File</span>
							<ExternalLink class="h-3.5 w-3.5" />
						</a>
					</div>
				{/if}

				<div class="flex items-center justify-between pt-2 text-base font-black">
					<span class="text-slate-900 dark:text-white">Total Tagihan</span>
					<span class="text-[#00aeef]">{rupiah(data.order.total)}</span>
				</div>
			</div>
		</div>

		<!-- Action Buttons: WhatsApp & Cetak -->
		<div class="mt-6 flex flex-col sm:flex-row gap-3">
			<a
				href={waKonfirmasiUrl}
				target="_blank"
				rel="noopener"
				class="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-600 py-4 px-6 text-sm font-bold text-white shadow-lg shadow-green-600/25 hover:bg-green-700 transition active:scale-98"
			>
				<WhatsappIcon class="h-5 w-5" />
				<span>Konfirmasi via WhatsApp Sekarang</span>
			</a>

			<button
				type="button"
				onclick={() => window.print()}
				class="no-print flex items-center justify-center gap-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 px-6 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition active:scale-98 shadow-xs cursor-pointer"
			>
				<Printer class="h-4 w-4" />
				<span>Cetak Nota</span>
			</button>
		</div>
	</main>
</div>
