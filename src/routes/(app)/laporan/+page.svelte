<script lang="ts">
	import PageHeader from '#lib/components/app/page-header.svelte';
	import EmptyState from '#lib/components/app/empty-state.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
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

	const metodeChips = [{ key: 'semua', label: 'Semua metode' }, ...Object.entries(METODE_LABEL).map(([key, label]) => ({ key, label }))];

	const tampil = $derived(
		metodeFilter === 'semua' ? data.rows : data.rows.filter((r) => r.method === metodeFilter)
	);

	const metodeVariant: Record<string, 'default' | 'brand' | 'success' | 'warning'> = {
		cash: 'success',
		transfer: 'brand',
		qris: 'warning',
		piutang: 'default'
	};

	const cols: RtColumn[] = [
		{ key: 'waktu', label: 'Waktu' },
		{ key: 'order', label: 'Order' },
		{ key: 'pelanggan', label: 'Pelanggan' },
		{ key: 'metode', label: 'Metode' },
		{ key: 'jumlah', label: 'Jumlah', class: 'text-right' }
	];
</script>

<PageHeader title="Laporan omzet" description="Dihitung dari pembayaran tercatat, bukan input manual." />

<div class="mb-4 flex rounded-md border border-slate-200 bg-white p-1 sm:inline-flex sm:w-auto">
	{#each tabs as t (t.key)}
		<a
			href="/laporan?periode={t.key}"
			class={cn(
				'flex-1 rounded px-4 py-1.5 text-center text-sm font-medium transition-colors sm:flex-none',
				data.periode === t.key ? 'bg-brand-900 text-white' : 'text-slate-600 hover:bg-slate-100'
			)}
		>
			{t.label}
		</a>
	{/each}
</div>

<div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
	{#each data.perMetode as m (m.method)}
		<div class="rounded-lg border border-slate-200 bg-white p-3.5">
			<p class="text-xs font-medium text-slate-500">{m.label}</p>
			<p class="mt-1 text-base font-bold text-slate-900">{rupiah(m.total)}</p>
			<p class="text-xs text-slate-400">{m.count} transaksi</p>
		</div>
	{/each}
	<div class="rounded-lg border border-brand-200 bg-brand-50 p-3.5">
		<p class="text-xs font-medium text-brand-700">Total omzet</p>
		<p class="mt-1 text-base font-bold text-brand-900">{rupiah(data.grandTotal)}</p>
		<p class="text-xs text-brand-600">sejak {tgl(data.mulai)}</p>
	</div>
</div>

<div class="mt-6">
	<div class="mb-3 flex flex-wrap items-center gap-2">
		<h2 class="mr-1 text-sm font-semibold text-slate-900">Rincian pembayaran</h2>
		{#each metodeChips as m (m.key)}
			<button
				type="button"
				onclick={() => (metodeFilter = m.key)}
				class={cn(
					'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
					metodeFilter === m.key
						? 'border-brand-900 bg-brand-900 text-white'
						: 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
				)}
			>
				{m.label}
			</button>
		{/each}
	</div>
	<ResponsiveTable columns={cols} rows={tampil} keyOf={(r) => r.id} emptyText="Tidak ada pembayaran yang cocok.">
		{#snippet empty()}
			<EmptyState message="Belum ada pembayaran pada periode ini." actionLabel="Buka kasir" actionHref="/kasir" />
		{/snippet}
		{#snippet cell(c, r)}
			{#if c.key === 'waktu'}
				<span class="whitespace-nowrap">{tglWaktu(r.paidAt)}</span>
			{:else if c.key === 'order'}
				{#if r.orderId}
					<a href="/kasir/invoice/{r.orderId}" class="font-medium text-brand-700 hover:underline">
						#{r.orderId}
					</a>
					<span class="text-slate-500"> — {r.description ?? ''}</span>
				{:else}
					<span class="text-slate-400">-</span>
				{/if}
			{:else if c.key === 'pelanggan'}
				{r.customerName ?? '-'}
			{:else if c.key === 'metode'}
				<Badge variant={metodeVariant[r.method] ?? 'default'}>{METODE_LABEL[r.method] ?? r.method}</Badge>
			{:else if c.key === 'jumlah'}
				<span class="font-medium">{rupiah(r.amount)}</span>
			{/if}
		{/snippet}
		{#snippet card(r)}
			<div class="flex items-start justify-between gap-2">
				<p class="font-semibold text-slate-900">
					{#if r.orderId}
						<a href="/kasir/invoice/{r.orderId}" class="text-brand-700 hover:underline">#{r.orderId}</a>
						<span class="font-normal text-slate-500"> — {r.description ?? ''}</span>
					{:else}
						<span class="text-slate-400">-</span>
					{/if}
				</p>
				<Badge variant={metodeVariant[r.method] ?? 'default'}>{METODE_LABEL[r.method] ?? r.method}</Badge>
			</div>
			<div class="mt-2 space-y-1 text-sm">
				<p><span class="text-slate-400">Pelanggan: </span><span class="text-slate-700">{r.customerName ?? '-'}</span></p>
				<p><span class="text-slate-400">Waktu: </span><span class="text-slate-700">{tglWaktu(r.paidAt)}</span></p>
			</div>
			<p class="mt-2 text-right text-base font-bold text-slate-900">{rupiah(r.amount)}</p>
		{/snippet}
	</ResponsiveTable>
</div>
