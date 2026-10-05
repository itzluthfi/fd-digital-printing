<script lang="ts">
	import PageHeader from '#lib/components/app/page-header.svelte';
	import EmptyState from '#lib/components/app/empty-state.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import SearchInput from '#lib/components/ui/search-input.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { cn } from '#lib/utils';
	import { tglWaktu } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const CHANNEL_LABEL: Record<string, string> = {
		telegram: 'Telegram',
		whatsapp: 'WhatsApp',
		email: 'Email'
	};
	const STATUS_LABEL_NOTIF: Record<string, string> = {
		sent: 'Terkirim',
		failed: 'Gagal',
		skipped: 'Dilewati'
	};
	const STATUS_BADGE = {
		sent: 'success',
		failed: 'danger',
		skipped: 'default'
	} as const;

	let channelFilter = $state('semua');
	let statusFilter = $state('semua');
	let q = $state('');

	const channelChips = [
		{ id: 'semua', label: 'Semua kanal' },
		{ id: 'telegram', label: 'Telegram' },
		{ id: 'whatsapp', label: 'WhatsApp' },
		{ id: 'email', label: 'Email' }
	];
	const statusChips = [
		{ id: 'semua', label: 'Semua status' },
		{ id: 'sent', label: 'Terkirim' },
		{ id: 'failed', label: 'Gagal' },
		{ id: 'skipped', label: 'Dilewati' }
	];

	const daftar = $derived(
		data.logs
			.filter((l) => channelFilter === 'semua' || l.channel === channelFilter)
			.filter((l) => statusFilter === 'semua' || l.status === statusFilter)
			.filter((l) => {
				const s = q.trim().toLowerCase();
				if (!s) return true;
				return (
					(l.customerName ?? '').toLowerCase().includes(s) ||
					l.target.toLowerCase().includes(s) ||
					l.title.toLowerCase().includes(s)
				);
			})
	);

	const cols: RtColumn[] = [
		{ key: 'waktu', label: 'Waktu' },
		{ key: 'kanal', label: 'Kanal' },
		{ key: 'tujuan', label: 'Tujuan' },
		{ key: 'judul', label: 'Judul' },
		{ key: 'status', label: 'Status' }
	];

	function chipClass(active: boolean) {
		return cn(
			'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
			active
				? 'border-brand-900 bg-brand-900 text-white'
				: 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
		);
	}
</script>

<PageHeader
	title="Notifikasi"
	description="Riwayat pengiriman notifikasi ke pelanggan via Telegram, WhatsApp, dan email."
/>

<div class="mb-4 space-y-2">
	<SearchInput bind:value={q} placeholder="Cari nama, tujuan, atau judul…" />
	<div class="flex flex-wrap gap-2">
		{#each channelChips as c (c.id)}
			<button type="button" onclick={() => (channelFilter = c.id)} class={chipClass(channelFilter === c.id)}>
				{c.label}
			</button>
		{/each}
	</div>
	<div class="flex flex-wrap gap-2">
		{#each statusChips as c (c.id)}
			<button type="button" onclick={() => (statusFilter = c.id)} class={chipClass(statusFilter === c.id)}>
				{c.label}
			</button>
		{/each}
	</div>
</div>

<ResponsiveTable columns={cols} rows={daftar} keyOf={(l) => l.id} emptyText="Belum ada riwayat notifikasi.">
	{#snippet empty()}
		<EmptyState message="Belum ada riwayat notifikasi." actionLabel="Lihat order" actionHref="/order" />
	{/snippet}
	{#snippet cell(c, l)}
		{#if c.key === 'waktu'}
			<span class="whitespace-nowrap">{tglWaktu(l.createdAt)}</span>
		{:else if c.key === 'kanal'}
			<Badge variant="brand">{CHANNEL_LABEL[l.channel] ?? l.channel}</Badge>
		{:else if c.key === 'tujuan'}
			<span class="font-medium text-slate-900">{l.customerName ?? '-'}</span>
			<span class="block max-w-45 truncate text-[11px] text-slate-400" title={l.target}>{l.target}</span>
		{:else if c.key === 'judul'}
			<span>{l.title}</span>
			{#if l.orderId}
				<a href="/kasir/invoice/{l.orderId}" class="ml-1 font-medium text-brand-700 hover:underline">#{l.orderId}</a>
			{/if}
		{:else if c.key === 'status'}
			<Badge variant={STATUS_BADGE[l.status] ?? 'default'}>{STATUS_LABEL_NOTIF[l.status] ?? l.status}</Badge>
			{#if l.error && l.status !== 'skipped'}
				<span class="block max-w-55 truncate text-[11px] text-slate-400" title={l.error}>{l.error}</span>
			{/if}
		{/if}
	{/snippet}
	{#snippet card(l)}
		<div class="flex items-start justify-between gap-2">
			<div>
				<p class="font-semibold text-slate-900">{l.title}</p>
				<p class="text-xs text-slate-400">{tglWaktu(l.createdAt)}</p>
			</div>
			<Badge variant={STATUS_BADGE[l.status] ?? 'default'}>{STATUS_LABEL_NOTIF[l.status] ?? l.status}</Badge>
		</div>
		<div class="mt-2 flex items-center gap-2 text-sm">
			<Badge variant="brand">{CHANNEL_LABEL[l.channel] ?? l.channel}</Badge>
			<span class="truncate text-slate-600">{l.customerName ?? l.target}</span>
			{#if l.orderId}
				<a href="/kasir/invoice/{l.orderId}" class="font-medium text-brand-700 hover:underline">#{l.orderId}</a>
			{/if}
		</div>
		{#if l.error}
			<p class="mt-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">{l.error}</p>
		{/if}
	{/snippet}
</ResponsiveTable>
