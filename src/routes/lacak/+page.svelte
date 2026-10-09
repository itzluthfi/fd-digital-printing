<script lang="ts">
	import { Check, Clock3, ExternalLink, LoaderCircle, PackageCheck, Search, XCircle } from 'lucide-svelte';
	import { onDestroy } from 'svelte';
	import { rupiah, tglWaktu, STATUS_LABEL } from '#lib/format';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';

	type TrackingResult = {
		success: boolean;
		code?: string;
		status?: string;
		isPaid?: boolean;
		isExpired?: boolean;
		isCancelled?: boolean;
		total?: number;
		createdAt?: string;
		message?: string;
	};

	const WA_NUMBER = '6289507370805';
	const STATUS_STEPS = ['baru', 'diproses', 'selesai', 'diambil'];
	const statusDescription: Record<string, string> = {
		baru: 'Menunggu pembayaran atau konfirmasi pesanan.',
		diproses: 'Pesanan sudah masuk antrean produksi.',
		selesai: 'Pesanan sudah selesai dan siap diambil.',
		diambil: 'Pesanan sudah diserahkan kepada pelanggan.'
	};

	let code = $state('');
	let result = $state<TrackingResult | null>(null);
	let loading = $state(false);
	let error = $state('');
	let refreshTimer: ReturnType<typeof setInterval> | undefined;

	const waLink = $derived(
		`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
			`Halo FD Digital Printing, saya ingin menanyakan order ${result?.code ?? code}.`
		)}`
	);
	const activeStep = $derived(result?.status ? STATUS_STEPS.indexOf(result.status) : -1);
	const isTerminal = $derived(result?.status === 'batal' || result?.status === 'kadaluarsa');

	function normalizeCode(value: string) {
		return value.trim().toUpperCase().replace(/\s+/g, '');
	}

	async function fetchStatus(orderCode: string, showLoading = true) {
		if (showLoading) loading = true;
		error = '';
		try {
			const response = await fetch(`/api/order/status?code=${encodeURIComponent(orderCode)}`);
			const data = (await response.json()) as TrackingResult;
			if (!response.ok || !data.success) {
				throw new Error(data.message ?? 'Order tidak ditemukan.');
			}
			result = data;
			code = data.code ?? orderCode;
		} catch (err) {
			if (showLoading) result = null;
			error = err instanceof Error ? err.message : 'Gagal menghubungi server.';
		} finally {
			if (showLoading) loading = false;
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const normalized = normalizeCode(code);
		if (!normalized) {
			error = 'Masukkan kode order terlebih dahulu.';
			result = null;
			return;
		}
		await fetchStatus(normalized);
		if (refreshTimer) clearInterval(refreshTimer);
		if (result && !isTerminal) {
			refreshTimer = setInterval(() => fetchStatus(normalized, false), 15000);
		}
	}

	function resetSearch() {
		code = '';
		result = null;
		error = '';
		if (refreshTimer) clearInterval(refreshTimer);
	}

	onDestroy(() => {
		if (refreshTimer) clearInterval(refreshTimer);
	});
</script>

<svelte:head>
	<title>Lacak Order | FD Digital Printing</title>
	<meta name="description" content="Cek status pesanan cetak FD Digital Printing dengan kode order Anda." />
</svelte:head>

<div class="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
	<header class="border-b border-slate-200 bg-white">
		<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
			<a href="/" class="flex items-center gap-2.5">
				<img src="/logo.png" alt="Logo FD Digital Printing" class="h-9 w-9 rounded-xl object-contain" />
				<span class="text-sm font-bold tracking-tight sm:text-base">FD Digital Printing</span>
			</a>
			<div class="flex items-center gap-2">
				<a href="/pesan" class="hidden rounded-xl px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 sm:inline-flex">Buat Order</a>
				<ThemeToggle class="h-9 w-9" />
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
		<div class="mx-auto max-w-2xl text-center">
			<p class="text-xs font-bold uppercase tracking-[0.18em] text-[#00aeef]">Status Pesanan</p>
			<h1 class="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Lacak order Anda</h1>
			<p class="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Masukkan kode yang tertera pada nota atau pesan konfirmasi order.</p>

			<form onsubmit={handleSubmit} class="mt-8 flex flex-col gap-2 sm:flex-row">
				<label for="order-code" class="sr-only">Kode order</label>
				<input
					id="order-code"
					bind:value={code}
					placeholder="Contoh: FD-A1B2C3"
					autocomplete="off"
					class="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm uppercase tracking-wider outline-none transition focus:border-[#00aeef] focus:ring-4 focus:ring-[#00aeef]/10"
				/>
				<button type="submit" disabled={loading} class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00aeef] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0092c9] disabled:cursor-wait disabled:opacity-70">
					{#if loading}<LoaderCircle class="h-4 w-4 animate-spin" />{:else}<Search class="h-4 w-4" />{/if}
					<span>Cek Status</span>
				</button>
			</form>
		</div>

		{#if error}
			<div role="alert" class="mx-auto mt-6 flex max-w-2xl items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				<span>{error}</span>
				<button type="button" onclick={resetSearch} class="font-bold underline underline-offset-2">Coba lagi</button>
			</div>
		{/if}

		{#if result}
			<section class="mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-live="polite">
				<div class="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<p class="text-xs font-bold uppercase tracking-wider text-slate-400">Kode Order</p>
						<p class="mt-1 font-mono text-xl font-black tracking-widest text-slate-950">{result.code}</p>
					</div>
					<div class="sm:text-right">
						<p class="text-xs font-bold uppercase tracking-wider text-slate-400">Dibuat</p>
						<p class="mt-1 text-sm font-semibold text-slate-700">{tglWaktu(result.createdAt)}</p>
					</div>
				</div>

				{#if isTerminal}
					<div class="mt-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-700">
						<XCircle class="mt-0.5 h-5 w-5 shrink-0" />
						<div><p class="font-bold">{STATUS_LABEL[result.status ?? ''] ?? 'Order tidak aktif'}</p><p class="mt-1 text-sm">Silakan hubungi kami bila membutuhkan bantuan.</p></div>
					</div>
				{:else}
					<div class="mt-7 grid grid-cols-4 gap-1 sm:gap-3">
						{#each STATUS_STEPS as step, index}
							<div class="text-center">
								<div class="mx-auto flex h-9 w-9 items-center justify-center rounded-full {index <= activeStep ? 'bg-[#00aeef] text-white' : 'bg-slate-100 text-slate-400'}">
									{#if index < activeStep}<Check class="h-4 w-4" />{:else if index === activeStep}<Clock3 class="h-4 w-4" />{:else}<span class="text-xs font-bold">{index + 1}</span>{/if}
								</div>
								<p class="mt-2 text-[10px] font-bold leading-4 sm:text-xs">{STATUS_LABEL[step]}</p>
							</div>
						{/each}
					</div>
					<div class="mt-6 rounded-xl bg-cyan-50 p-4 text-center text-sm text-cyan-950">
						<p class="font-bold">{STATUS_LABEL[result.status ?? ''] ?? 'Status diperbarui'}</p>
						<p class="mt-1 text-cyan-800">{statusDescription[result.status ?? ''] ?? 'Status order Anda sedang diperbarui.'}</p>
					</div>
				{/if}

				<div class="mt-6 flex items-end justify-between border-t border-slate-100 pt-5">
					<div class="flex items-center gap-2 text-sm text-slate-500"><PackageCheck class="h-4 w-4" /> Total order</div>
					<strong class="text-xl font-black text-slate-950">{rupiah(result.total)}</strong>
				</div>

				<div class="mt-6 flex flex-col gap-2 sm:flex-row">
					<a href={waLink} target="_blank" rel="noopener" class="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white hover:bg-[#1fba59]"><WhatsappIcon class="h-4 w-4" /> Tanya via WhatsApp</a>
					<button type="button" onclick={resetSearch} class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Lacak order lain</button>
				</div>
			</section>
		{/if}

		<div class="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-1.5 text-xs text-slate-400">
			<span>Belum punya order?</span><a href="/pesan" class="font-bold text-[#0075a2] hover:underline">Buat pesanan baru</a><ExternalLink class="h-3 w-3" />
		</div>
	</main>
</div>
