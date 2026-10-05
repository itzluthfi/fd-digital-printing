<script lang="ts">
	import { BadgeDollarSign, ClipboardList, Wallet, CalendarClock, ArrowRight, Send } from 'lucide-svelte';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import EmptyState from '#lib/components/app/empty-state.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { rupiah, tgl, tglWaktu, STATUS_LABEL } from '#lib/format';
	import { cn } from '#lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const statusVariant: Record<string, 'brand' | 'warning' | 'success' | 'default'> = {
		baru: 'brand',
		diproses: 'warning',
		selesai: 'success',
		diambil: 'default'
	};

	const orderCols: RtColumn[] = [
		{ key: 'order', label: 'Order' },
		{ key: 'pelanggan', label: 'Pelanggan' },
		{ key: 'status', label: 'Status' },
		{ key: 'total', label: 'Total', class: 'text-right' }
	];
	const tempoCols: RtColumn[] = [
		{ key: 'pelanggan', label: 'Pelanggan' },
		{ key: 'tempo', label: 'Jatuh tempo' },
		{ key: 'sisa', label: 'Sisa', class: 'text-right' }
	];

	const cards = [
		{
			label: 'Omzet hari ini',
			value: rupiah(data.stats.omzetHariIni),
			icon: BadgeDollarSign,
			accent: 'bg-green-100 text-green-700'
		},
		{
			label: 'Order aktif',
			value: String(data.stats.orderAktif),
			icon: ClipboardList,
			accent: 'bg-brand-100 text-brand-800'
		},
		{
			label: 'Piutang aktif',
			value: rupiah(data.stats.piutangAktif),
			icon: Wallet,
			accent: 'bg-yellow-100 text-yellow-700'
		},
		{
			label: 'Jatuh tempo ≤ 7 hari',
			value: String(data.stats.tempo7Hari),
			icon: CalendarClock,
			accent: data.stats.tempo7Hari > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
		}
	];

	const kanalList = $derived([
		{ label: 'Telegram', status: data.kanal.telegram, hint: 'Bot notifikasi order & reminder' },
		{ label: 'WhatsApp', status: data.kanal.whatsapp, hint: 'Butuh gateway WA' },
		{ label: 'Email', status: data.kanal.email, hint: 'Via Resend' }
	]);
</script>

<PageHeader title="Dashboard" description="Ringkasan operasional toko hari ini.">
	<Button href="/kasir">Transaksi baru</Button>
</PageHeader>

<div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
	{#each cards as c (c.label)}
		<div class="rounded-lg border border-slate-200 bg-white p-4">
			<div class="flex items-center gap-2.5">
				<span class={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md', c.accent)}>
					<c.icon class="h-4.5 w-4.5" />
				</span>
				<p class="text-xs font-medium text-slate-500">{c.label}</p>
			</div>
			<p class="mt-2 text-xl font-bold text-slate-900">{c.value}</p>
		</div>
	{/each}
</div>

<section class="mt-4 rounded-lg border border-slate-200 bg-white p-4">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="flex items-center gap-2 text-sm font-semibold text-slate-900">
			<Send class="h-4 w-4 text-brand-700" /> Status kanal notifikasi
		</h2>
		<a href="/notifikasi" class="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
			Riwayat <ArrowRight class="h-3.5 w-3.5" />
		</a>
	</div>
	<div class="grid gap-2 sm:grid-cols-3">
		{#each kanalList as k (k.label)}
			<div class="flex items-center gap-2.5 rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5">
				<span
					class={cn(
						'h-2.5 w-2.5 shrink-0 rounded-full',
						k.status === 'ok' ? 'bg-green-500' : 'bg-slate-300'
					)}
					title={k.status === 'ok' ? 'Terhubung' : 'Belum terhubung'}
				></span>
				<div class="min-w-0">
					<p class="text-sm font-medium text-slate-900">{k.label}</p>
					<p class="truncate text-xs text-slate-500">
						{k.status === 'ok' ? 'Terhubung' : 'Belum terhubung'} · {k.hint}
					</p>
				</div>
			</div>
		{/each}
	</div>
</section>

<div class="mt-6 grid gap-6 lg:grid-cols-2">	<section>
		<div class="mb-2 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-slate-900">Order terbaru</h2>
			<a href="/order" class="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
				Semua order <ArrowRight class="h-3.5 w-3.5" />
			</a>
		</div>
		<ResponsiveTable
			columns={orderCols}
			rows={data.orderTerbaru}
			keyOf={(o) => o.id}
		>
		{#snippet empty()}
			<EmptyState message="Belum ada order hari ini." actionLabel="Buat transaksi" actionHref="/kasir" />
		{/snippet}
		{#snippet cell(c, o)}
			{#if c.key === 'order'}
				<p class="font-medium text-slate-900">#{o.id} — {o.description}</p>
				<p class="text-xs text-slate-500">{tglWaktu(o.createdAt)}</p>
			{:else if c.key === 'pelanggan'}
				{o.customerName ?? '-'}
			{:else if c.key === 'status'}
				<Badge variant={statusVariant[o.status] ?? 'default'}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
			{:else if c.key === 'total'}
				<span class="font-medium">{rupiah(o.total)}</span>
			{/if}
		{/snippet}
		{#snippet card(o)}
			<div class="flex items-start justify-between gap-2">
				<p class="font-semibold text-slate-900">#{o.id} — {o.description}</p>
				<Badge variant={statusVariant[o.status] ?? 'default'}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
			</div>
			<div class="mt-2 space-y-1 text-sm">
				<p><span class="text-slate-400">Pelanggan: </span><span class="text-slate-700">{o.customerName ?? '-'}</span></p>
				<p><span class="text-slate-400">Waktu: </span><span class="text-slate-700">{tglWaktu(o.createdAt)}</span></p>
			</div>
			<p class="mt-2 text-right text-base font-bold text-slate-900">{rupiah(o.total)}</p>
		{/snippet}
	</ResponsiveTable>
	</section>

	<section>
		<div class="mb-2 flex items-center justify-between">
			<h2 class="text-sm font-semibold text-slate-900">Jatuh tempo terdekat</h2>
			<a href="/piutang" class="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
				Semua piutang <ArrowRight class="h-3.5 w-3.5" />
			</a>
		</div>
		<ResponsiveTable
			columns={tempoCols}
			rows={data.tempoTerdekat}
			keyOf={(r) => r.id}
		>
		{#snippet empty()}
			<EmptyState message="Tidak ada piutang aktif." actionLabel="Lihat piutang" actionHref="/piutang" />
		{/snippet}
		{#snippet cell(c, r)}
			{@const sisa = r.amount - r.paidAmount}
			{@const telat = new Date(r.dueDate) < new Date()}
			{#if c.key === 'pelanggan'}
				<span class="font-medium text-slate-900">{r.customerName}</span>
			{:else if c.key === 'tempo'}
				<Badge variant={telat ? 'danger' : 'warning'}>{tgl(r.dueDate)}</Badge>
			{:else if c.key === 'sisa'}
				<span class="font-medium">{rupiah(sisa)}</span>
			{/if}
		{/snippet}
		{#snippet card(r)}
			{@const sisa = r.amount - r.paidAmount}
			{@const telat = new Date(r.dueDate) < new Date()}
			<div class="flex items-start justify-between gap-2">
				<p class="font-semibold text-slate-900">{r.customerName}</p>
				<Badge variant={telat ? 'danger' : 'warning'}>{tgl(r.dueDate)}</Badge>
			</div>
			<p class="mt-2 text-right text-base font-bold text-slate-900">{rupiah(sisa)}</p>
		{/snippet}
		</ResponsiveTable>
	</section>
</div>
