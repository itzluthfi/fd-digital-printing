<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { ArrowRight, CalendarCheck, Send } from 'lucide-svelte';
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

	const STATUS_BADGE = {
		baru: 'warning',
		diproses: 'brand',
		selesai: 'success',
		diambil: 'default'
	} as const;

	type Order = (typeof data.orders)[number];

	let filter = $state<string>('semua');
	let q = $state('');

	const counts = $derived(
		Object.fromEntries([
			['semua', data.orders.length],
			...STATUS_URUTAN.map((s) => [s, data.orders.filter((o) => o.status === s).length])
		])
	);
	const daftar = $derived(
		data.orders
			.filter((o) => filter === 'semua' || o.status === filter)
			.filter((o) => {
				const s = q.trim().toLowerCase();
				if (!s) return true;
				return (
					String(o.id).includes(s) ||
					o.description.toLowerCase().includes(s) ||
					(o.customerName ?? '').toLowerCase().includes(s)
				);
			})
	);
	const chipDefs = $derived([
		{ id: 'semua', label: 'Semua' },
		...STATUS_URUTAN.map((s) => ({ id: s, label: STATUS_LABEL[s] ?? s }))
	]);

	function berikutnya(status: Order['status']) {
		const i = STATUS_URUTAN.indexOf(status);
		return i >= 0 && i < STATUS_URUTAN.length - 1 ? STATUS_URUTAN[i + 1] : null;
	}

	const cols: RtColumn[] = [
		{ key: 'kode', label: 'Kode' },
		{ key: 'pelanggan', label: 'Pelanggan' },
		{ key: 'deskripsi', label: 'Deskripsi' },
		...(data.isOperator ? [] : [{ key: 'total', label: 'Total', class: 'text-right' }]),
		{ key: 'status', label: 'Status' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right' }
	];

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
	<SearchInput bind:value={q} placeholder="Cari kode, deskripsi, atau pelanggan…" />
	<div class="flex flex-wrap gap-2">
	{#each chipDefs as c (c.id)}
		<button
			type="button"
			onclick={() => (filter = c.id)}
			class={cn(
				'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
				filter === c.id
					? 'border-brand-900 bg-brand-900 text-white'
					: 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
			)}
		>
			{c.label}
			<span class={cn('ml-1 rounded-full px-1.5', filter === c.id ? 'bg-white/20' : 'bg-slate-100')}>
				{counts[c.id] ?? 0}
			</span>
		</button>
	{/each}
	</div>
</div>

	<ResponsiveTable columns={cols} rows={daftar} keyOf={(order) => order.id}>
		{#snippet empty()}
			<EmptyState
				message={filter === 'semua' ? 'Belum ada order.' : `Tidak ada order berstatus "${STATUS_LABEL[filter] ?? filter}".`}
				actionLabel={emptyAction.label}
				actionHref={emptyAction.href}
			/>
		{/snippet}
		{#snippet cell(c, order)}
			{#if c.key === 'kode'}
				<span class="font-semibold text-slate-900">{order.code ?? `#${order.id}`}</span>
				<span class="block text-[11px] text-slate-400">{tglWaktu(order.createdAt)}</span>
			{:else if c.key === 'pelanggan'}
				<span class="font-medium text-slate-900">{order.customerName ?? '-'}</span>
				{#if !data.isOperator && order.customerPhone}
					<span class="block text-[11px] text-slate-400">{order.customerPhone}</span>
				{/if}
			{:else if c.key === 'deskripsi'}
				<span class="line-clamp-2">{order.description}</span>
			{:else if c.key === 'total'}
				<span class="font-medium whitespace-nowrap">{rupiah(order.total)}</span>
			{:else if c.key === 'status'}
				<Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
				{#if order.telatJanji}
					<span class="mt-1 block"><Badge variant="danger">Telat janji</Badge></span>
				{:else if order.janjiSelesai}
					<span class="mt-1 block text-[11px] whitespace-nowrap text-slate-400"
						>Janji: {tgl(order.janjiSelesai)}</span
					>
				{/if}
			{:else if c.key === 'aksi'}
				{#if berikutnya(order.status)}
					<form method="POST" action="?/lanjut" use:enhance={lanjutkan(order)} class="inline">
						<input type="hidden" name="orderId" value={order.id} />
						<Button type="submit" size="sm" variant="outline">
							<ArrowRight class="h-3.5 w-3.5" /> Lanjut
						</Button>
					</form>
				{:else}
					<form method="POST" action="?/kirimUlang" use:enhance={kirimUlang()} class="inline">
						<input type="hidden" name="orderId" value={order.id} />
						<Button type="submit" size="sm" variant="outline" title="Kirim ulang notifikasi ke pelanggan">
							<Send class="h-3.5 w-3.5" /> Kirim ulang
						</Button>
					</form>
				{/if}
				<form
					method="POST"
					action="?/janji"
					use:enhance={simpanJanji(order)}
					class="mt-1 flex items-center justify-end gap-1"
				>
					<input type="hidden" name="orderId" value={order.id} />
					<input
						type="date"
						name="janjiSelesai"
						value={order.janjiSelesai ?? ''}
						title="Janji selesai pengerjaan"
						class="h-8 rounded-md border border-slate-300 bg-white px-1.5 text-xs text-slate-700"
					/>
					<Button type="submit" size="sm" variant="ghost" title="Simpan janji selesai">
						<CalendarCheck class="h-3.5 w-3.5" />
					</Button>
				</form>
			{/if}
		{/snippet}
		{#snippet card(order)}
			{@const next = berikutnya(order.status)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<p class="font-semibold text-slate-900">{order.code ?? `#${order.id}`}</p>
					<p class="text-xs text-slate-400">{tglWaktu(order.createdAt)}</p>
				</div>
				<Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
			</div>
			<div class="mt-2 space-y-1 text-sm">
				<p><span class="text-slate-400">Pelanggan: </span><span class="font-medium text-slate-800">{order.customerName ?? '-'}</span></p>
				{#if !data.isOperator && order.customerPhone}
					<p><span class="text-slate-400">Telepon: </span><span class="text-slate-700">{order.customerPhone}</span></p>
				{/if}
				<p class="text-slate-700">{order.description}</p>
			</div>
			{#if !data.isOperator}
				<p class="mt-2 text-right text-base font-bold text-slate-900">{rupiah(order.total)}</p>
			{/if}
			{#if next}
				<form method="POST" action="?/lanjut" use:enhance={lanjutkan(order)} class="mt-3">
					<input type="hidden" name="orderId" value={order.id} />
					<Button type="submit" variant="outline" class="min-h-10 w-full">
						<ArrowRight class="h-4 w-4" /> Lanjut ke "{STATUS_LABEL[next] ?? next}"
					</Button>
				</form>
			{:else}
				<form method="POST" action="?/kirimUlang" use:enhance={kirimUlang()} class="mt-3">
					<input type="hidden" name="orderId" value={order.id} />
					<Button type="submit" variant="outline" class="min-h-10 w-full">
						<Send class="h-4 w-4" /> Kirim ulang notifikasi
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
					class="h-10 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700"
				/>
				<Button type="submit" variant="outline" class="min-h-10" title="Simpan janji selesai">
					<CalendarCheck class="h-4 w-4" />
				</Button>
			</form>
			{#if order.telatJanji}
				<p class="mt-2"><Badge variant="danger">Telat janji</Badge></p>
			{:else if order.janjiSelesai}
				<p class="mt-2 text-xs text-slate-400">Janji selesai: {tgl(order.janjiSelesai)}</p>
			{/if}
		{/snippet}
	</ResponsiveTable>
