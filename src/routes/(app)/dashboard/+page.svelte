<script lang="ts">
	import {
		BadgeDollarSign,
		ClipboardList,
		Wallet,
		CalendarClock,
		PiggyBank,
		ArrowRight,
		Send,
		ShoppingBag,
		ShoppingCart,
		Clock,
		CheckCircle2,
		ExternalLink,
		Package,
		Sparkles
	} from 'lucide-svelte';

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

	const customerCols: RtColumn[] = [
		{ key: 'code', label: 'Kode Order' },
		{ key: 'item', label: 'Item & Spesifikasi' },
		{ key: 'tanggal', label: 'Tanggal' },
		{ key: 'total', label: 'Total', class: 'text-right' },
		{ key: 'status', label: 'Status' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right' }
	];

	const hariIni = new Date().toISOString().slice(0, 10);
	function telatJanji(o: { janjiSelesai?: string | null; status?: string }): boolean {
		return Boolean(o.janjiSelesai && o.janjiSelesai < hariIni && o.status !== 'diambil');
	}

	const cards = $derived(
		data.stats
			? [
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
					},
					{
						label: 'Laba bersih hari ini',
						value: rupiah(data.stats.labaBersih),
						icon: PiggyBank,
						accent: data.stats.labaBersih >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
					}
				]
			: []
	);

	const kanalList = $derived(
		data.kanal
			? [
					{ label: 'Telegram', status: data.kanal.telegram, hint: 'Bot notifikasi order & reminder' },
					{ label: 'WhatsApp', status: data.kanal.whatsapp, hint: 'Butuh gateway WA' },
					{ label: 'Email', status: data.kanal.email, hint: 'Via Resend' }
				]
			: []
	);
</script>

{#if data.isCustomer}
	<!-- ======================================================== -->
	<!-- PORTAL & DASHBOARD PELANGGAN (CUSTOMER VIEW)            -->
	<!-- ======================================================== -->
	<div class="space-y-6">
		<!-- Welcome Header Banner -->
		<div class="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-slate-900 p-6 sm:p-7 text-white shadow-xl border border-slate-800">
			<div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 class="text-xl sm:text-2xl font-bold tracking-tight text-white">
						Halo, {data.customerProfile?.name || data.user?.name || 'Pelanggan'}! 👋
					</h1>
					<p class="mt-1 text-xs sm:text-sm text-slate-300">
						Kelola dan pantau seluruh pesanan cetakan Anda di FD Digital Printing.
					</p>
				</div>

				<div>
					<a
						href="/"
						class="inline-flex items-center gap-2 rounded-xl bg-[#00aeef] hover:bg-[#0092c9] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition active:scale-95"
					>
						<ShoppingBag class="h-4 w-4" />
						<span>Lihat Toko & Order</span>
					</a>
				</div>
			</div>
		</div>

		<!-- Customer Stat Cards -->
		{#if data.customerStats}
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				<div class="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:bg-slate-900 dark:border-slate-800">
					<div class="flex items-center gap-2.5">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#00aeef] dark:bg-sky-950/60">
							<ShoppingBag class="h-5 w-5" />
						</span>
						<p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pesanan</p>
					</div>
					<p class="mt-3 text-2xl font-black text-slate-900 dark:text-white">{data.customerStats.totalOrders}</p>
				</div>

				<div class="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:bg-slate-900 dark:border-slate-800">
					<div class="flex items-center gap-2.5">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60">
							<Clock class="h-5 w-5" />
						</span>
						<p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Sedang Diproses</p>
					</div>
					<p class="mt-3 text-2xl font-black text-slate-900 dark:text-white">{data.customerStats.activeOrders}</p>
				</div>

				<div class="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:bg-slate-900 dark:border-slate-800">
					<div class="flex items-center gap-2.5">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60">
							<CheckCircle2 class="h-5 w-5" />
						</span>
						<p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Selesai / Diambil</p>
					</div>
					<p class="mt-3 text-2xl font-black text-slate-900 dark:text-white">{data.customerStats.completedOrders}</p>
				</div>

				<div class="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:bg-slate-900 dark:border-slate-800">
					<div class="flex items-center gap-2.5">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60">
							<Wallet class="h-5 w-5" />
						</span>
						<p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Transaksi</p>
					</div>
					<p class="mt-3 text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{rupiah(data.customerStats.totalSpent)}</p>
				</div>
			</div>
		{/if}

		<!-- Daftar Pesanan Pelanggan -->
		<section class="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Riwayat Pesanan Anda</h2>
					<p class="text-xs text-slate-500 dark:text-slate-400">Daftar semua cetakan yang tercatat atas akun Anda.</p>
				</div>
				<Button href="/" size="sm" class="rounded-xl font-bold bg-[#00aeef] hover:bg-[#0092c9] text-white">
					Lihat Katalog
				</Button>
			</div>

			{#if data.customerOrders && data.customerOrders.length > 0}
				<ResponsiveTable
					columns={customerCols}
					rows={data.customerOrders}
					keyOf={(o) => o.id}
				>
					{#snippet cell(col, o)}
						{#if col.key === 'code'}
							<a href={`/pesan/sukses/${o.code}`} class="font-mono font-black text-xs text-[#00aeef] hover:underline">
								{o.code}
							</a>
						{:else if col.key === 'item'}
							<p class="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-1">{o.description}</p>
							{#if o.fileUrl}
								<a href={o.fileUrl} target="_blank" rel="noopener" class="text-[11px] text-[#00aeef] hover:underline inline-flex items-center gap-1 mt-0.5">
									<span>File Desain</span> <ExternalLink class="h-3 w-3" />
								</a>
							{/if}
						{:else if col.key === 'tanggal'}
							<p class="text-xs text-slate-500">{tglWaktu(o.createdAt)}</p>
						{:else if col.key === 'total'}
							<p class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{rupiah(o.total)}</p>
						{:else if col.key === 'status'}
							<Badge variant={statusVariant[o.status] ?? 'default'}>
								{STATUS_LABEL[o.status] ?? o.status}
							</Badge>
						{:else if col.key === 'aksi'}
							<a
								href={`/pesan/sukses/${o.code}`}
								class="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
							>
								<span>Lihat / Nota</span>
								<ArrowRight class="h-3 w-3" />
							</a>
						{/if}
					{/snippet}
					{#snippet card(o)}
						<div class="flex items-start justify-between gap-2">
							<a href={`/pesan/sukses/${o.code}`} class="font-mono font-black text-sm text-[#00aeef] hover:underline">
								{o.code}
							</a>
							<Badge variant={statusVariant[o.status] ?? 'default'}>
								{STATUS_LABEL[o.status] ?? o.status}
							</Badge>
						</div>
						<p class="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{o.description}</p>
						<div class="mt-3 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-2.5">
							<span class="text-slate-500">{tgl(o.createdAt)}</span>
							<span class="font-bold text-[#00aeef] text-sm">{rupiah(o.total)}</span>
						</div>
						<div class="mt-3 flex gap-2">
							<Button href={`/pesan/sukses/${o.code}`} class="w-full text-xs font-bold rounded-xl" size="sm">
								Buka Nota / Bayar
							</Button>
						</div>
					{/snippet}
				</ResponsiveTable>
			{:else}
				<div class="py-12 text-center flex flex-col items-center justify-center">
					<div class="h-16 w-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-[#00aeef] flex items-center justify-center mb-3">
						<Package class="h-8 w-8" />
					</div>
					<h3 class="text-base font-bold text-slate-900 dark:text-white">Belum Ada Pesanan Tercatat</h3>
					<p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
						Pesanan Anda akan otomatis muncul di sini setelah checkout.
					</p>
					<Button href="/" class="mt-4 rounded-xl font-bold bg-[#00aeef] hover:bg-[#0092c9] text-white">
						Pilih Produk & Order
					</Button>
				</div>
			{/if}
		</section>
	</div>
{:else}
	<!-- ======================================================== -->
	<!-- DASHBOARD OWNER / ADMIN OPERASIONAL TOKO                 -->
	<!-- ======================================================== -->
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

	{#if data.kanal}
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
	{/if}

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
				{#if telatJanji(o)}
					<span class="mt-1 block"><Badge variant="danger">Telat janji</Badge></span>
				{/if}
			{:else if c.key === 'total'}
				<span class="font-medium">{rupiah(o.total)}</span>
			{/if}
		{/snippet}
		{#snippet card(o)}
			<div class="flex items-start justify-between gap-2">
				<p class="font-semibold text-slate-900">#{o.id} — {o.description}</p>
				<div class="flex flex-col items-end gap-1">
					<Badge variant={statusVariant[o.status] ?? 'default'}>{STATUS_LABEL[o.status] ?? o.status}</Badge>
					{#if telatJanji(o)}
						<Badge variant="danger">Telat janji</Badge>
					{/if}
				</div>
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
{/if}
