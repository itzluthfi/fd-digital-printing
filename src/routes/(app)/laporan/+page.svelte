<script lang="ts">
	import { Download, Printer, Receipt } from 'lucide-svelte';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import EmptyState from '#lib/components/app/empty-state.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import SearchInput from '#lib/components/ui/search-input.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { rupiah, tgl, tglWaktu, METODE_LABEL } from '#lib/format';
	import { cn } from '#lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const tabs = [
		{ key: 'harian', label: 'Harian' },
		{ key: 'mingguan', label: 'Mingguan' },
		{ key: 'bulanan', label: 'Bulanan' }
	];

	let metodeFilter = $state('semua');
	let q = $state('');

	const metodeChips = [{ key: 'semua', label: 'Semua Metode' }, ...Object.entries(METODE_LABEL).map(([key, label]) => ({ key, label }))];

	const tampil = $derived(
		data.rows
			.filter((r) => metodeFilter === 'semua' || r.method === metodeFilter)
			.filter((r) => {
				const s = q.trim().toLowerCase();
				if (!s) return true;
				return (
					(r.description ?? '').toLowerCase().includes(s) ||
					(r.customerName ?? '').toLowerCase().includes(s) ||
					(r.orderId != null && String(r.orderId).includes(s))
				);
			})
	);

	const metodeVariant: Record<string, 'default' | 'brand' | 'success' | 'warning'> = {
		cash: 'success',
		transfer: 'brand',
		qris: 'warning',
		piutang: 'default'
	};

	const cols: RtColumn[] = [
		{ key: 'paidAt', label: 'Waktu' },
		{ key: 'orderId', label: 'Order' },
		{ key: 'customerName', label: 'Pelanggan' },
		{ key: 'method', label: 'Metode' },
		{ key: 'amount', label: 'Jumlah', class: 'text-right' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right', sortable: false }
	];
</script>

<PageHeader title="Laporan Omzet" description="Dihitung dari pembayaran riil yang tercatat di sistem." />

<!-- Period Tabs & Export Toolbar -->
<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
	<div class="flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
		{#each tabs as t (t.key)}
			<a
				href="/laporan?periode={t.key}"
				class={cn(
					'rounded-lg px-4 py-1.5 text-center text-xs sm:text-sm font-semibold transition-colors',
					data.periode === t.key
						? 'bg-[#00aeef] text-white shadow-xs'
						: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800'
				)}
			>
				{t.label}
			</a>
		{/each}
	</div>
	<Button variant="outline" size="sm" href={`/api/export?jenis=omzet&periode=${data.periode}`}>
		<Download class="h-3.5 w-3.5 mr-1" /> Unduh CSV
	</Button>
</div>

<!-- Statistik Omzet Cards -->
<div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
	{#each data.perMetode as m (m.method)}
		<div class="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
			<p class="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">{m.label}</p>
			<p class="mt-1 text-base sm:text-lg font-bold text-slate-900 dark:text-white">{rupiah(m.total)}</p>
			<p class="text-xs text-slate-400 mt-0.5">{m.count} transaksi</p>
		</div>
	{/each}
	<div class="rounded-xl border border-sky-300 bg-sky-50 p-3.5 shadow-xs dark:border-sky-800 dark:bg-sky-950/60">
		<p class="text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-300">Total Omzet</p>
		<p class="mt-1 text-lg sm:text-xl font-black text-sky-900 dark:text-sky-100">{rupiah(data.grandTotal)}</p>
		<p class="text-xs text-sky-700 dark:text-sky-300 mt-0.5">Periode {data.periode} (sejak {tgl(data.mulai)})</p>
	</div>
</div>

<div class="mt-6 space-y-3">
	<!-- Filter & Search Section -->
	<div class="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex-1 max-w-md">
			<SearchInput bind:value={q} placeholder="Cari nomor order, pelanggan, atau catatan…" />
		</div>
		<div class="flex flex-wrap items-center gap-1.5">
			{#each metodeChips as m (m.key)}
				<button
					type="button"
					onclick={() => (metodeFilter = m.key)}
					class={cn(
						'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
						metodeFilter === m.key
							? 'border-[#00aeef] bg-[#00aeef] text-white shadow-xs'
							: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
					)}
				>
					{m.label}
				</button>
			{/each}
		</div>
	</div>

	<ResponsiveTable columns={cols} rows={tampil} keyOf={(r) => r.id} emptyText="Tidak ada pembayaran yang cocok dengan filter.">
		{#snippet empty()}
			<EmptyState message="Belum ada pembayaran pada periode ini." actionLabel="Buka kasir" actionHref="/kasir" />
		{/snippet}
		{#snippet cell(c, r)}
			{#if c.key === 'paidAt'}
				<span class="whitespace-nowrap text-slate-600 dark:text-slate-300">{tglWaktu(r.paidAt)}</span>
			{:else if c.key === 'orderId'}
				{#if r.orderId}
					<a href="/kasir/invoice/{r.orderId}" class="font-bold text-[#00aeef] hover:underline">
						#{r.orderId}
					</a>
					<span class="text-slate-500 dark:text-slate-400"> — {r.description ?? ''}</span>
				{:else}
					<span class="text-slate-400">-</span>
				{/if}
			{:else if c.key === 'customerName'}
				<span class="font-medium text-slate-900 dark:text-white">{r.customerName ?? '-'}</span>
			{:else if c.key === 'method'}
				<Badge variant={metodeVariant[r.method] ?? 'default'}>{METODE_LABEL[r.method] ?? r.method}</Badge>
			{:else if c.key === 'amount'}
				<span class="font-bold text-slate-900 dark:text-white whitespace-nowrap">{rupiah(r.amount)}</span>
			{:else if c.key === 'aksi'}
				{#if r.orderId}
					<div class="flex items-center justify-end gap-1">
						<a
							href="/kasir/struk/{r.orderId}"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
							title="Cetak Struk Thermal"
						>
							<Printer class="h-3 w-3" /> Struk
						</a>
						<a
							href="/kasir/invoice/{r.orderId}"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
							title="Buka Invoice"
						>
							<Receipt class="h-3 w-3" /> Inv
						</a>
					</div>
				{/if}
			{/if}
		{/snippet}
		{#snippet card(r)}
			<div class="flex items-start justify-between gap-2">
				<p class="font-bold text-slate-900 dark:text-white">
					{#if r.orderId}
						<a href="/kasir/invoice/{r.orderId}" class="text-[#00aeef] hover:underline">#{r.orderId}</a>
						<span class="font-normal text-slate-500 dark:text-slate-400"> — {r.description ?? ''}</span>
					{:else}
						<span class="text-slate-400">-</span>
					{/if}
				</p>
				<Badge variant={metodeVariant[r.method] ?? 'default'}>{METODE_LABEL[r.method] ?? r.method}</Badge>
			</div>
			<div class="mt-2 space-y-1 text-sm">
				<p><span class="text-slate-500 dark:text-slate-400">Pelanggan: </span><span class="text-slate-800 dark:text-slate-200 font-medium">{r.customerName ?? '-'}</span></p>
				<p><span class="text-slate-500 dark:text-slate-400">Waktu: </span><span class="text-slate-600 dark:text-slate-400">{tglWaktu(r.paidAt)}</span></p>
			</div>
			<div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
				{#if r.orderId}
					<div class="flex items-center gap-1.5">
						<a
							href="/kasir/struk/{r.orderId}"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
						>
							<Printer class="h-3 w-3" /> Struk
						</a>
						<a
							href="/kasir/invoice/{r.orderId}"
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex h-7 items-center gap-1 rounded border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
						>
							<Receipt class="h-3 w-3" /> Invoice
						</a>
					</div>
				{/if}
				<p class="text-base font-bold text-slate-900 dark:text-white">{rupiah(r.amount)}</p>
			</div>
		{/snippet}
	</ResponsiveTable>
</div>
