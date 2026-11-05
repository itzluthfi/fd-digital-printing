<script lang="ts">
	import { enhance } from '$app/forms';
	import { Eye, RefreshCw, Send, AlertCircle, CheckCircle2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import EmptyState from '#lib/components/app/empty-state.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Dialog from '#lib/components/ui/dialog.svelte';
	import SearchInput from '#lib/components/ui/search-input.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { cn } from '#lib/utils';
	import { tglWaktu } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Log = (typeof data.logs)[number];

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
	let detailOpen = $state(false);
	let selectedLog = $state<Log | null>(null);
	let retryingId = $state<number | null>(null);

	const channelChips = [
		{ id: 'semua', label: 'Semua Kanal' },
		{ id: 'telegram', label: 'Telegram' },
		{ id: 'whatsapp', label: 'WhatsApp' },
		{ id: 'email', label: 'Email' }
	];
	const statusChips = [
		{ id: 'semua', label: 'Semua Status' },
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
					l.title.toLowerCase().includes(s) ||
					(l.error ?? '').toLowerCase().includes(s)
				);
			})
	);

	const cols: RtColumn[] = [
		{ key: 'createdAt', label: 'Waktu' },
		{ key: 'channel', label: 'Kanal' },
		{ key: 'customerName', label: 'Tujuan & Pelanggan' },
		{ key: 'title', label: 'Judul Notifikasi' },
		{ key: 'status', label: 'Status & Error' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right', sortable: false }
	];

	function bukaDetail(l: Log) {
		selectedLog = l;
		detailOpen = true;
	}

	function handleRetry(l: Log) {
		return () => {
			retryingId = l.id;
			return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
				retryingId = null;
				if (result.type === 'success') {
					toast.success(result.data?.message ?? 'Notifikasi berhasil dikirim ulang!');
					await update();
				} else if (result.type === 'failure') {
					toast.error(result.data?.message ?? 'Gagal mengirim ulang notifikasi.');
				}
			};
		};
	}
</script>

<PageHeader
	title="Notifikasi"
	description="Riwayat pengiriman notifikasi ke pelanggan via Telegram, WhatsApp, dan email."
/>

<div class="mb-4 space-y-2.5">
	<SearchInput bind:value={q} placeholder="Cari nama pelanggan, nomor tujuan, judul, atau isi pesan error…" />

	<!-- Filter Kanal -->
	<div class="flex flex-wrap items-center gap-1.5">
		<span class="mr-1 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Kanal:</span>
		{#each channelChips as c (c.id)}
			<button
				type="button"
				onclick={() => (channelFilter = c.id)}
				class={cn(
					'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
					channelFilter === c.id
						? 'border-[#00aeef] bg-[#00aeef] text-white shadow-xs'
						: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
				)}
			>
				{c.label}
			</button>
		{/each}
	</div>

	<!-- Filter Status -->
	<div class="flex flex-wrap items-center gap-1.5">
		<span class="mr-1 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Status:</span>
		{#each statusChips as c (c.id)}
			<button
				type="button"
				onclick={() => (statusFilter = c.id)}
				class={cn(
					'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
					statusFilter === c.id
						? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 shadow-xs'
						: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
				)}
			>
				{c.label}
			</button>
		{/each}
	</div>
</div>

<ResponsiveTable columns={cols} rows={daftar} keyOf={(l) => l.id} emptyText="Belum ada riwayat notifikasi yang cocok.">
	{#snippet empty()}
		<EmptyState message="Belum ada riwayat notifikasi." actionLabel="Lihat order" actionHref="/order" />
	{/snippet}
	{#snippet cell(c, l)}
		{#if c.key === 'createdAt'}
			<span class="whitespace-nowrap text-slate-600 dark:text-slate-300">{tglWaktu(l.createdAt)}</span>
		{:else if c.key === 'channel'}
			<Badge variant="brand">{CHANNEL_LABEL[l.channel] ?? l.channel}</Badge>
		{:else if c.key === 'customerName'}
			<span class="font-semibold text-slate-900 dark:text-white">{l.customerName ?? '-'}</span>
			<span class="block max-w-45 truncate text-[11px] text-slate-500 dark:text-slate-400" title={l.target}>{l.target}</span>
		{:else if c.key === 'title'}
			<span class="font-medium text-slate-800 dark:text-slate-200">{l.title}</span>
			{#if l.orderId}
				<a href="/kasir/invoice/{l.orderId}" class="ml-1 font-semibold text-[#00aeef] hover:underline">#{l.orderId}</a>
			{/if}
		{:else if c.key === 'status'}
			<div class="flex flex-col items-start gap-1">
				<Badge variant={STATUS_BADGE[l.status] ?? 'default'}>{STATUS_LABEL_NOTIF[l.status] ?? l.status}</Badge>
				{#if l.error && l.status !== 'skipped'}
					<button
						type="button"
						class="max-w-55 truncate text-left text-[11px] text-red-600 hover:underline dark:text-red-400 cursor-pointer"
						onclick={() => bukaDetail(l)}
						title="Klik untuk lihat detail error"
					>
						⚠️ {l.error}
					</button>
				{/if}
			</div>
		{:else if c.key === 'aksi'}
			<div class="flex items-center justify-end gap-1">
				<Button
					type="button"
					size="icon"
					variant="ghost"
					onclick={() => bukaDetail(l)}
					title="Lihat detail notifikasi"
				>
					<Eye class="h-4 w-4 text-slate-600 dark:text-slate-300" />
				</Button>
				{#if l.status === 'failed'}
					<form method="POST" action="?/retry" use:enhance={handleRetry(l)} class="inline">
						<input type="hidden" name="logId" value={l.id} />
						<Button
							type="submit"
							size="sm"
							variant="outline"
							class="h-7 px-2 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800"
							disabled={retryingId === l.id}
							title="Kirim ulang notifikasi ini"
						>
							<RefreshCw class={cn('h-3 w-3 mr-1', retryingId === l.id && 'animate-spin')} />
							<span>Retry</span>
						</Button>
					</form>
				{/if}
			</div>
		{/if}
	{/snippet}
	{#snippet card(l)}
		<div class="flex items-start justify-between gap-2">
			<div>
				<p class="font-bold text-slate-900 dark:text-white">{l.title}</p>
				<p class="text-xs text-slate-500 dark:text-slate-400">{tglWaktu(l.createdAt)}</p>
			</div>
			<Badge variant={STATUS_BADGE[l.status] ?? 'default'}>{STATUS_LABEL_NOTIF[l.status] ?? l.status}</Badge>
		</div>
		<div class="mt-2 flex items-center gap-2 text-sm">
			<Badge variant="brand">{CHANNEL_LABEL[l.channel] ?? l.channel}</Badge>
			<span class="truncate text-slate-700 dark:text-slate-300 font-medium">{l.customerName ?? l.target}</span>
			{#if l.orderId}
				<a href="/kasir/invoice/{l.orderId}" class="font-semibold text-[#00aeef] hover:underline">#{l.orderId}</a>
			{/if}
		</div>
		{#if l.error}
			<div class="mt-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50">
				<p class="font-semibold">Error:</p>
				<p class="mt-0.5">{l.error}</p>
			</div>
		{/if}
		<div class="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
			<Button size="sm" variant="outline" onclick={() => bukaDetail(l)}>
				<Eye class="h-3.5 w-3.5 mr-1" /> Detail
			</Button>
			{#if l.status === 'failed'}
				<form method="POST" action="?/retry" use:enhance={handleRetry(l)} class="inline">
					<input type="hidden" name="logId" value={l.id} />
					<Button type="submit" size="sm" variant="default" class="bg-[#00aeef] text-white" disabled={retryingId === l.id}>
						<RefreshCw class={cn('h-3.5 w-3.5 mr-1', retryingId === l.id && 'animate-spin')} /> Kirim Ulang
					</Button>
				</form>
			{/if}
		</div>
	{/snippet}
</ResponsiveTable>

<!-- Modal Detail Log Notifikasi -->
{#if selectedLog}
	<Dialog bind:open={detailOpen} title="Detail Log Notifikasi">
		<div class="space-y-4">
			<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
				<div class="flex items-center justify-between">
					<Badge variant="brand">{CHANNEL_LABEL[selectedLog.channel] ?? selectedLog.channel}</Badge>
					<Badge variant={STATUS_BADGE[selectedLog.status] ?? 'default'}>
						{STATUS_LABEL_NOTIF[selectedLog.status] ?? selectedLog.status}
					</Badge>
				</div>
				<p class="mt-2 text-base font-bold text-slate-900 dark:text-white">{selectedLog.title}</p>
				<p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{tglWaktu(selectedLog.createdAt)}</p>
			</div>

			<div class="space-y-2 text-sm text-slate-700 dark:text-slate-300">
				<div class="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800">
					<span class="text-slate-500">Pelanggan:</span>
					<span class="font-medium">{selectedLog.customerName ?? '-'}</span>
				</div>
				<div class="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800">
					<span class="text-slate-500">Tujuan (ID/No/Email):</span>
					<span class="font-mono text-xs">{selectedLog.target}</span>
				</div>
				{#if selectedLog.orderId}
					<div class="flex items-center justify-between border-b border-slate-100 pb-1.5 dark:border-slate-800">
						<span class="text-slate-500">Nomor Order:</span>
						<a href="/kasir/invoice/{selectedLog.orderId}" class="font-bold text-[#00aeef] hover:underline">
							#{selectedLog.orderId}
						</a>
					</div>
				{/if}
			</div>

			{#if selectedLog.error}
				<div class="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
					<p class="font-bold mb-1 flex items-center gap-1">
						<AlertCircle class="h-4 w-4" /> Keterangan Kegagalan:
					</p>
					<p class="font-mono whitespace-pre-wrap">{selectedLog.error}</p>
				</div>
			{/if}

			<div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
				{#if selectedLog.status === 'failed'}
					<form method="POST" action="?/retry" use:enhance={handleRetry(selectedLog)} class="inline">
						<input type="hidden" name="logId" value={selectedLog.id} />
						<Button type="submit" class="bg-[#00aeef] hover:bg-[#009bd6] text-white">
							<RefreshCw class="h-4 w-4 mr-1.5" /> Kirim Ulang Sekarang
						</Button>
					</form>
				{/if}
				<Button type="button" variant="outline" onclick={() => (detailOpen = false)}>
					Tutup
				</Button>
			</div>
		</div>
	</Dialog>
{/if}
