<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import {
		AlertTriangle,
		ArrowRight,
		CalendarCheck,
		ExternalLink,
		FileText,
		MessageSquare,
		Send
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	/** Bentuk hasil action yang dipakai handler enhance. */
	type ActionOutcome = {
		type: 'success' | 'failure' | 'redirect' | 'error';
		data?: { message?: string; [k: string]: unknown } | null;
	};

	import EmptyState from '#lib/components/app/empty-state.svelte';
	import PageHeader from '#lib/components/app/page-header.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import SearchInput from '#lib/components/ui/search-input.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { cn } from '#lib/utils';
	import { rupiah, tgl, tglWaktu, STATUS_LABEL, STATUS_URUTAN } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const STATUS_BADGE: Record<string, 'warning' | 'brand' | 'success' | 'default' | 'danger'> = {
		baru: 'warning',
		diproses: 'brand',
		selesai: 'success',
		diambil: 'default',
		kadaluarsa: 'danger',
		batal: 'danger'
	};

	type Order = (typeof data.orders)[number];

	let filter = $state<string>('semua');
	let q = $state('');

	const mendesakCount = $derived(
		data.orders.filter((o) => o.telatJanji || o.deadlineHariIni).length
	);

	const counts = $derived<Record<string, number>>({
		semua: data.orders.length,
		mendesak: mendesakCount,
		...Object.fromEntries(STATUS_URUTAN.map((s) => [s, data.orders.filter((o) => o.status === s).length]))
	});

	const daftar = $derived(
		data.orders
			.filter((o) => {
				if (filter === 'semua') return true;
				if (filter === 'mendesak') return o.telatJanji || o.deadlineHariIni;
				return o.status === filter;
			})
			.filter((o) => {
				const s = q.trim().toLowerCase();
				if (!s) return true;
				return (
					String(o.id).includes(s) ||
					(o.code ?? '').toLowerCase().includes(s) ||
					o.description.toLowerCase().includes(s) ||
					(o.customerName ?? '').toLowerCase().includes(s) ||
					(o.customerPhone ?? '').includes(s)
				);
			})
	);

	const chipDefs = $derived([
		{ id: 'semua', label: 'Semua' },
		{ id: 'mendesak', label: '🚨 Mendesak / Telat' },
		...STATUS_URUTAN.map((s) => ({ id: s, label: STATUS_LABEL[s] ?? s }))
	]);

	function berikutnya(status: Order['status']) {
		const i = STATUS_URUTAN.indexOf(status);
		return i >= 0 && i < STATUS_URUTAN.length - 1 ? STATUS_URUTAN[i + 1] : null;
	}

	function labelAksiBerikutnya(next: string | null) {
		if (next === 'diproses') return 'Mulai Proses';
		if (next === 'selesai') return 'Tandai Selesai';
		if (next === 'diambil') return 'Ambil Pesanan';
		return 'Lanjut';
	}

	function waLinkCustomer(order: Order) {
		if (!order.customerPhone) return null;
		let clean = order.customerPhone.replace(/\D/g, '');
		if (clean.startsWith('0')) clean = '62' + clean.slice(1);
		const pesan =
			order.status === 'selesai'
				? `Halo Kak ${order.customerName ?? ''}, pesanan Anda *${order.code ?? `#${order.id}`}* (${order.description}) sudah selesai dicetak dan siap diambil di FD Digital Printing. Terima kasih!`
				: `Halo Kak ${order.customerName ?? ''}, konfirmasi pesanan Anda *${order.code ?? `#${order.id}`}* (${order.description}) di FD Digital Printing.`;
		return `https://wa.me/${clean}?text=${encodeURIComponent(pesan)}`;
	}

	const cols = $derived<RtColumn[]>([
		{ key: 'kode', label: 'Kode & Waktu' },
		{ key: 'pelanggan', label: 'Pelanggan' },
		{ key: 'deskripsi', label: 'Deskripsi & File' },
		...(data.isOperator ? [] : [{ key: 'total', label: 'Total', class: 'text-right' }]),
		{ key: 'status', label: 'Status & SLA' },
		{ key: 'aksi', label: 'Aksi Cepat', class: 'text-right' }
	]);

	/** Optimistic: status berubah di UI langsung, rollback + toast bila server gagal. */
	function lanjutkan(order: Order) {
		return () => {
			const prev = order.status;
			const next = berikutnya(order.status);
			if (!next) return;
			order.status = next;
			return async ({ result }: { result: ActionOutcome }) => {
				if (result.type === 'failure' || result.type === 'error') {
					order.status = prev;
					const msg =
						result.type === 'failure'
							? String(result.data?.message ?? 'Gagal memperbarui status order.')
							: 'Gagal memperbarui status order.';
					toast.error(msg);
				} else {
					toast.success(`Order #${order.id} → "${STATUS_LABEL[next] ?? next}".`);
					await invalidateAll();
				}
			};
		};
	}

	/** Optimistic: janji selesai tersimpan langsung di UI, toast bila gagal. */
	function simpanJanji(order: Order) {
		return () => {
			return async ({ result, update }: { result: ActionOutcome; update: () => Promise<void> }) => {
				if (result.type === 'failure' || result.type === 'error') {
					toast.error(
						result.type === 'failure'
							? String(result.data?.message ?? 'Gagal menyimpan janji selesai.')
							: 'Gagal menyimpan janji selesai.'
					);
				} else {
					toast.success('Janji selesai disimpan.');
					await update();
					await invalidateAll();
				}
			};
		};
	}

	const emptyAction = $derived(
		data.isOperator
			? { href: '/order', label: 'Muat ulang' }
			: { href: '/kasir', label: 'Buat order di kasir' }
	);

	/** Kirim ulang notifikasi "cetakan selesai" — toast sukses/gagal. */
	function kirimUlang() {
		return () => {
			return async ({ result }: { result: ActionOutcome }) => {
				if (result.type === 'failure' || result.type === 'error') {
					const msg =
						result.type === 'failure'
							? String(result.data?.message ?? 'Gagal mengirim notifikasi.')
							: 'Gagal mengirim notifikasi.';
					toast.error(msg);
				} else {
					toast.success('Notifikasi dikirim ulang. Lihat hasilnya di halaman Notifikasi.');
					await invalidateAll();
				}
			};
		};
	}
</script>

<PageHeader title="Antrean Order" description="Kelola antrean cetakan dari baru sampai diambil." />

<div class="mb-4 space-y-2">
	<SearchInput bind:value={q} placeholder="Cari kode, deskripsi, pelanggan, atau telepon…" />
	<div class="flex flex-wrap gap-2">
		{#each chipDefs as c (c.id)}
			<button
				type="button"
				onclick={() => (filter = c.id)}
				class={cn(
					'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
					filter === c.id
						? c.id === 'mendesak'
							? 'border-red-600 bg-red-600 text-white'
							: 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
						: c.id === 'mendesak' && mendesakCount > 0
							? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
							: 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
				)}
			>
				{c.label}
				<span
					class={cn(
						'ml-1 rounded-full px-1.5 py-0.2',
						filter === c.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
					)}
				>
					{counts[c.id] ?? 0}
				</span>
			</button>
		{/each}
	</div>
</div>

<ResponsiveTable columns={cols} rows={daftar} keyOf={(order) => order.id}>
	{#snippet empty()}
		<EmptyState
			message={filter === 'semua'
				? 'Belum ada order.'
				: filter === 'mendesak'
					? 'Tidak ada order yang mendesak atau telat janji.'
					: `Tidak ada order berstatus "${STATUS_LABEL[filter] ?? filter}".`}
			actionLabel={emptyAction.label}
			actionHref={emptyAction.href}
		/>
	{/snippet}
	{#snippet cell(c, order)}
		{#if c.key === 'kode'}
			<span class="font-semibold text-slate-900 dark:text-white">{order.code ?? `#${order.id}`}</span>
			<span class="block text-[11px] text-slate-400">{tglWaktu(order.createdAt)}</span>
		{:else if c.key === 'pelanggan'}
			<span class="font-medium text-slate-900 dark:text-white">{order.customerName ?? '-'}</span>
			{#if !data.isOperator && order.customerPhone}
				<span class="block text-[11px] text-slate-400">{order.customerPhone}</span>
			{/if}
		{:else if c.key === 'deskripsi'}
			<p class="line-clamp-2 text-slate-800 dark:text-slate-200">{order.description}</p>
			{#if order.fileUrl}
				<a
					href={order.fileUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-1 inline-flex items-center gap-1 rounded bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition"
					title="Buka file desain cetak"
				>
					<FileText class="h-3 w-3" />
					<span>File Desain</span>
					<ExternalLink class="h-2.5 w-2.5 opacity-60" />
				</a>
			{/if}
		{:else if c.key === 'total'}
			<span class="font-medium whitespace-nowrap">{rupiah(order.total)}</span>
		{:else if c.key === 'status'}
			<Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
			{#if order.telatJanji}
				<span class="mt-1 block"><Badge variant="danger">⚠️ Telat Janji</Badge></span>
			{:else if order.deadlineHariIni}
				<span class="mt-1 block"><Badge variant="warning">⚡ Hari Ini</Badge></span>
			{:else if order.janjiSelesai}
				<span class="mt-1 block text-[11px] whitespace-nowrap text-slate-400"
					>Janji: {tgl(order.janjiSelesai)}{order.sisaHari != null && order.sisaHari > 0 ? ` (${order.sisaHari}h)` : ''}</span
				>
			{/if}
		{:else if c.key === 'aksi'}
			<div class="flex flex-col items-end gap-1.5">
				<div class="flex items-center gap-1">
					{#if berikutnya(order.status)}
						{@const next = berikutnya(order.status)}
						<form method="POST" action="?/lanjut" use:enhance={lanjutkan(order)} class="inline">
							<input type="hidden" name="orderId" value={order.id} />
							<Button
								type="submit"
								size="sm"
								variant={order.status === 'baru' ? 'default' : 'outline'}
								class="h-7 px-2.5 text-xs font-semibold"
							>
								<ArrowRight class="h-3.5 w-3.5 mr-1" />
								<span>{labelAksiBerikutnya(next)}</span>
							</Button>
						</form>
					{:else}
						<form method="POST" action="?/kirimUlang" use:enhance={kirimUlang()} class="inline">
							<input type="hidden" name="orderId" value={order.id} />
							<Button type="submit" size="sm" variant="outline" class="h-7 px-2 text-xs" title="Kirim ulang notifikasi ke pelanggan">
								<Send class="h-3 w-3" /> Kirim ulang
							</Button>
						</form>
					{/if}

					{#if order.customerPhone}
						{@const waUrl = waLinkCustomer(order)}
						{#if waUrl}
							<a
								href={waUrl}
								target="_blank"
								rel="noopener noreferrer"
								title="Hubungi pelanggan via WhatsApp"
								class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-green-200 dark:border-green-800 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 hover:bg-green-100 transition"
							>
								<MessageSquare class="h-3.5 w-3.5" />
							</a>
						{/if}
					{/if}
				</div>

				<form
					method="POST"
					action="?/janji"
					use:enhance={simpanJanji(order)}
					class="flex items-center justify-end gap-1"
				>
					<input type="hidden" name="orderId" value={order.id} />
					<input
						type="date"
						name="janjiSelesai"
						value={order.janjiSelesai ?? ''}
						title="Ubah janji selesai pengerjaan"
						class="h-7 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1 text-[11px] text-slate-700 dark:text-slate-200"
					/>
					<button
						type="submit"
						class="flex h-7 w-7 items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
						title="Simpan janji selesai"
					>
						<CalendarCheck class="h-3.5 w-3.5" />
					</button>
				</form>
			</div>
		{/if}
	{/snippet}
	{#snippet card(order)}
		{@const next = berikutnya(order.status)}
		<div class="flex items-start justify-between gap-2">
			<div>
				<p class="font-semibold text-slate-900 dark:text-white">{order.code ?? `#${order.id}`}</p>
				<p class="text-xs text-slate-400">{tglWaktu(order.createdAt)}</p>
			</div>
			<div class="text-right">
				<Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
				{#if order.telatJanji}
					<span class="mt-1 block"><Badge variant="danger">⚠️ Telat Janji</Badge></span>
				{:else if order.deadlineHariIni}
					<span class="mt-1 block"><Badge variant="warning">⚡ Hari Ini</Badge></span>
				{/if}
			</div>
		</div>
		<div class="mt-2 space-y-1 text-sm">
			<div class="flex items-center justify-between">
				<p><span class="text-slate-400">Pelanggan: </span><span class="font-medium text-slate-800 dark:text-slate-200">{order.customerName ?? '-'}</span></p>
				{#if order.customerPhone}
					{@const waUrl = waLinkCustomer(order)}
					{#if waUrl}
						<a
							href={waUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium"
						>
							<MessageSquare class="h-3 w-3" /> WA
						</a>
					{/if}
				{/if}
			</div>
			<p class="text-slate-700 dark:text-slate-300">{order.description}</p>
			{#if order.fileUrl}
				<div class="pt-1">
					<a
						href={order.fileUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1 rounded bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
					>
						<FileText class="h-3 w-3" /> File Desain <ExternalLink class="h-2.5 w-2.5" />
					</a>
				</div>
			{/if}
		</div>
		{#if !data.isOperator}
			<p class="mt-2 text-right text-base font-bold text-slate-900 dark:text-white">{rupiah(order.total)}</p>
		{/if}
		{#if next}
			<form method="POST" action="?/lanjut" use:enhance={lanjutkan(order)} class="mt-3">
				<input type="hidden" name="orderId" value={order.id} />
				<Button type="submit" variant="outline" class="min-h-10 w-full font-semibold">
					<ArrowRight class="h-4 w-4 mr-1.5" /> {labelAksiBerikutnya(next)}
				</Button>
			</form>
		{:else}
			<form method="POST" action="?/kirimUlang" use:enhance={kirimUlang()} class="mt-3">
				<input type="hidden" name="orderId" value={order.id} />
				<Button type="submit" variant="outline" class="min-h-10 w-full">
					<Send class="h-4 w-4 mr-1.5" /> Kirim ulang notifikasi
				</Button>
			</form>
		{/if}
		<form
			method="POST"
			action="?/janji"
			use:enhance={simpanJanji(order)}
			class="mt-2 flex items-center gap-2"
		>
			<input type="hidden" name="orderId" value={order.id} />
			<Label for="janji-{order.id}" class="text-xs text-slate-500">Janji selesai</Label>
			<input
				id="janji-{order.id}"
				type="date"
				name="janjiSelesai"
				value={order.janjiSelesai ?? ''}
				class="h-10 flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm text-slate-700 dark:text-slate-200"
			/>
			<Button type="submit" variant="outline" class="min-h-10" title="Simpan janji selesai">
				<CalendarCheck class="h-4 w-4" />
			</Button>
		</form>
		{#if order.telatJanji}
			<p class="mt-2"><Badge variant="danger">⚠️ Telat Janji</Badge></p>
		{:else if order.janjiSelesai}
			<p class="mt-2 text-xs text-slate-400">Janji selesai: {tgl(order.janjiSelesai)}{order.sisaHari != null && order.sisaHari > 0 ? ` (${order.sisaHari} hari lagi)` : ''}</p>
		{/if}
	{/snippet}
</ResponsiveTable>
