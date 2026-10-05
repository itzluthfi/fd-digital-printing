<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { BellRing, History, Send, Wallet } from 'lucide-svelte';
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
	import Dialog from '#lib/components/ui/dialog.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import SearchInput from '#lib/components/ui/search-input.svelte';
	import Select from '#lib/components/ui/select.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { cn } from '#lib/utils';
	import { rupiah, tgl, tglWaktu, METODE_LABEL } from '#lib/format';
	import type { PiutangRow } from '#lib/server/piutang';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let filter = $state<'semua' | 'belum_lunas' | 'lunas' | 'telat'>('semua');
	let q = $state('');
	let bayarOpen = $state(false);
	let bayarTarget = $state<PiutangRow | null>(null);
	let bayarJumlah = $state(0);
	let bayarMetode = $state('cash');
	let riwayatOpen = $state(false);
	let riwayatTarget = $state<PiutangRow | null>(null);

	const chipDefs = [
		{ id: 'semua', label: 'Semua' },
		{ id: 'belum_lunas', label: 'Belum lunas' },
		{ id: 'lunas', label: 'Lunas' },
		{ id: 'telat', label: 'Telat' }
	] as const;

	const isTelat = (r: PiutangRow) => r.status === 'belum_lunas' && r.selisihHari < 0;

	const counts = $derived({
		semua: data.piutang.length,
		belum_lunas: data.piutang.filter((p) => p.status === 'belum_lunas').length,
		lunas: data.piutang.filter((p) => p.status === 'lunas').length,
		telat: data.piutang.filter(isTelat).length
	});
	const daftar = $derived(
		data.piutang
			.filter((p) =>
				filter === 'semua'
					? true
					: filter === 'telat'
						? isTelat(p)
						: p.status === filter
			)
			.filter((p) => {
				const s = q.trim().toLowerCase();
				if (!s) return true;
				return (
					p.customerName.toLowerCase().includes(s) ||
					(p.orderDescription ?? '').toLowerCase().includes(s) ||
					(p.customerPhone ?? '').includes(s)
				);
			})
	);

	const totalSisa = $derived(data.piutang.filter((p) => p.status === 'belum_lunas').reduce((a, p) => a + p.sisa, 0));
	const telatCount = $derived(
		data.piutang.filter((p) => p.status === 'belum_lunas' && p.selisihHari < 0).length
	);

	function pesanGagal(result: ActionOutcome, baku: string): string {
		if (result.type === 'failure') return String(result.data?.message ?? baku);
		return baku;
	}

	/* ---------------- Kirim reminder (header) ---------------- */
	function kirimSemua() {
		return async ({ result }: { result: ActionOutcome }) => {
			if (result.type === 'success') {
				const d = result.data as { terkirim?: number; dilewati?: number } | undefined;
				toast.success(`${d?.terkirim ?? 0} terkirim, ${d?.dilewati ?? 0} dilewati (sudah dikirim).`);
				await invalidateAll();
			} else {
				toast.error(pesanGagal(result, 'Gagal mengirim reminder.'));
			}
		};
	}

	/* ---------------- Ingatkan per baris (hanya yang telat) ---------------- */
	function bisaIngatkan(r: PiutangRow): boolean {
		return r.status === 'belum_lunas' && r.selisihHari < 0 && !r.sentKinds.includes('telat');
	}

	function ingatkan(r: PiutangRow) {
		return () => {
			const prev = [...r.sentKinds];
			r.sentKinds = [...r.sentKinds, 'telat']; // optimistis
			return async ({ result }: { result: ActionOutcome }) => {
				if (result.type === 'failure' || result.type === 'error') {
					r.sentKinds = prev;
					toast.error(pesanGagal(result, 'Gagal mengirim reminder.'));
				} else {
					toast.success('Reminder dikirim ke pelanggan.');
					await invalidateAll();
				}
			};
		};
	}

	/* ---------------- Bayar ---------------- */
	function bukaBayar(r: PiutangRow) {
		bayarTarget = r;
		bayarJumlah = r.sisa;
		bayarMetode = 'cash';
		bayarOpen = true;
	}

	function bayarkan() {
		return () => {
			const target = bayarTarget;
			if (!target) return;
			const prev = { paidAmount: target.paidAmount, sisa: target.sisa, status: target.status };
			const bayar = bayarJumlah;
			target.paidAmount = target.paidAmount + bayar;
			target.sisa = Math.max(0, target.amount - target.paidAmount);
			if (target.paidAmount >= target.amount - 0.001) target.status = 'lunas';
			return async ({ result }: { result: ActionOutcome }) => {
				if (result.type === 'failure' || result.type === 'error') {
					target.paidAmount = prev.paidAmount;
					target.sisa = prev.sisa;
					target.status = prev.status;
					toast.error(pesanGagal(result, 'Gagal mencatat pembayaran.'));
				} else {
					toast.success(`Pembayaran ${rupiah(bayar)} tercatat.`);
					bayarOpen = false;
					await invalidateAll();
				}
			};
		};
	}

	/* ---------------- Riwayat ---------------- */
	function bukaRiwayat(r: PiutangRow) {
		riwayatTarget = r;
		riwayatOpen = true;
	}
	const riwayatList = $derived(
		riwayatTarget?.orderId != null
			? data.riwayat.filter((p) => p.orderId === riwayatTarget!.orderId)
			: []
	);

	const cols: RtColumn[] = [
		{ key: 'pelanggan', label: 'Pelanggan' },
		{ key: 'deskripsi', label: 'Deskripsi order' },
		{ key: 'total', label: 'Total', class: 'text-right' },
		{ key: 'dibayar', label: 'Dibayar', class: 'text-right' },
		{ key: 'sisa', label: 'Sisa', class: 'text-right' },
		{ key: 'tempo', label: 'Jatuh tempo' },
		{ key: 'status', label: 'Status' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right' }
	];
</script>

<PageHeader title="Buku Piutang" description="Catat pembayaran dan kirim pengingat jatuh tempo.">
	<form method="POST" action="?/kirimReminder" use:enhance={kirimSemua}>
		<Button type="submit" variant="outline" size="sm">
			<Send class="h-3.5 w-3.5" /> Kirim reminder
		</Button>
	</form>
</PageHeader>

<div class="mb-4 space-y-2">
	<SearchInput bind:value={q} placeholder="Cari pelanggan atau deskripsi order…" />
	<div class="flex flex-wrap items-center gap-2">
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
				{counts[c.id]}
			</span>
		</button>
	{/each}
	<span class="text-xs text-slate-500 sm:ml-auto">
		Total sisa belum lunas: <strong class="text-slate-900">{rupiah(totalSisa)}</strong>
		{#if telatCount > 0}
			<Badge variant="danger" class="ml-1">{telatCount} telat</Badge>
		{/if}
	</span>
	</div>
</div>

{#if daftar.length === 0}
	<EmptyState
		message={filter === 'semua' ? 'Belum ada piutang.' : `Tidak ada piutang berstatus "${chipDefs.find((c) => c.id === filter)?.label ?? filter}".`}
		actionLabel="Lihat antrean order"
		actionHref="/order"
	/>
{:else}
	<ResponsiveTable columns={cols} rows={daftar} keyOf={(r) => r.id}>
		{#snippet cell(col, r)}
			{#if col.key === 'pelanggan'}
				<span class="font-medium text-slate-900">{r.customerName}</span>
				{#if r.customerPhone}
					<span class="block text-[11px] text-slate-400">{r.customerPhone}</span>
				{/if}
			{:else if col.key === 'deskripsi'}
				<span class="line-clamp-2">{r.orderDescription ?? '-'}</span>
			{:else if col.key === 'total'}
				<span class="whitespace-nowrap">{rupiah(r.amount)}</span>
			{:else if col.key === 'dibayar'}
				<span class="whitespace-nowrap">{rupiah(r.paidAmount)}</span>
			{:else if col.key === 'sisa'}
				<span class="font-bold whitespace-nowrap">{rupiah(r.sisa)}</span>
			{:else if col.key === 'tempo'}
				{#if r.selisihHari < 0 && r.status === 'belum_lunas'}
					<span class="font-medium text-red-700">{tgl(r.dueDate)}</span>
					<Badge variant="danger" class="ml-1">Telat {Math.abs(r.selisihHari)} hari</Badge>
				{:else}
					{tgl(r.dueDate)}
				{/if}
			{:else if col.key === 'status'}
				<Badge variant={r.status === 'lunas' ? 'success' : 'warning'}>
					{r.status === 'lunas' ? 'Lunas' : 'Belum lunas'}
				</Badge>
			{:else if col.key === 'aksi'}
				<div class="flex items-center justify-end gap-1.5">
					{#if bisaIngatkan(r)}
						<form method="POST" action="?/ingatkan" use:enhance={ingatkan(r)} class="inline">
							<input type="hidden" name="receivableId" value={r.id} />
							<Button type="submit" size="sm" variant="ghost" >
								<BellRing class="h-3.5 w-3.5" /> Ingatkan
							</Button>
						</form>
					{/if}
					{#if r.orderId != null}
						<Button size="sm" variant="ghost" onclick={() => bukaRiwayat(r)} >
							<History class="h-3.5 w-3.5" /> Riwayat
						</Button>
					{/if}
					{#if r.status === 'belum_lunas'}
						<Button size="sm" variant="outline" onclick={() => bukaBayar(r)}>
							<Wallet class="h-3.5 w-3.5" /> Bayar
						</Button>
					{/if}
				</div>
			{/if}
		{/snippet}
		{#snippet card(r)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<p class="font-semibold text-slate-900">{r.customerName}</p>
					{#if r.customerPhone}
						<a href="tel:{r.customerPhone}" class="text-xs text-brand-700">{r.customerPhone}</a>
					{/if}
				</div>
				<Badge variant={r.status === 'lunas' ? 'success' : 'warning'}>
					{r.status === 'lunas' ? 'Lunas' : 'Belum lunas'}
				</Badge>
			</div>
			{#if r.orderDescription}
				<p class="mt-1.5 line-clamp-2 text-sm text-slate-600">{r.orderDescription}</p>
			{/if}
			<div class="mt-2 space-y-1 border-t border-slate-100 pt-2 text-sm">
				<p class="flex justify-between"><span class="text-slate-400">Total</span><span class="text-slate-700">{rupiah(r.amount)}</span></p>
				<p class="flex justify-between"><span class="text-slate-400">Dibayar</span><span class="text-slate-700">{rupiah(r.paidAmount)}</span></p>
				<p class="flex justify-between"><span class="text-slate-400">Sisa</span><span class="font-bold text-slate-900">{rupiah(r.sisa)}</span></p>
				<p class="flex items-center justify-between">
					<span class="text-slate-400">Jatuh tempo</span>
					<span>
						{#if r.selisihHari < 0 && r.status === 'belum_lunas'}
							<span class="font-medium text-red-700">{tgl(r.dueDate)}</span>
							<Badge variant="danger" class="ml-1">Telat {Math.abs(r.selisihHari)} hari</Badge>
						{:else}
							<span class="text-slate-700">{tgl(r.dueDate)}</span>
						{/if}
					</span>
				</p>
			</div>
			<div class="mt-3 flex flex-col gap-2">
				{#if bisaIngatkan(r)}
					<form method="POST" action="?/ingatkan" use:enhance={ingatkan(r)}>
						<input type="hidden" name="receivableId" value={r.id} />
						<Button type="submit" variant="outline" class="min-h-10 w-full">
							<BellRing class="h-4 w-4" /> Ingatkan pelanggan
						</Button>
					</form>
				{/if}
				<div class="grid grid-cols-2 gap-2">
					{#if r.orderId != null}
						<Button variant="ghost" class="min-h-10 border border-slate-200" onclick={() => bukaRiwayat(r)}>
							<History class="h-4 w-4" /> Riwayat
					</Button>
					{/if}
					{#if r.status === 'belum_lunas'}
						<Button variant="outline" class="min-h-10" onclick={() => bukaBayar(r)}>
							<Wallet class="h-4 w-4" /> Bayar
						</Button>
					{/if}
				</div>
			</div>
		{/snippet}
	</ResponsiveTable>
{/if}

<!-- Dialog bayar -->
<Dialog
	bind:open={bayarOpen}
	title="Catat pembayaran"
	description={bayarTarget
		? `Piutang ${bayarTarget.customerName} — sisa ${rupiah(bayarTarget.sisa)}.`
		: undefined}
>
	{#if bayarTarget}
		<form method="POST" action="?/bayar" use:enhance={bayarkan()}>
			<input type="hidden" name="receivableId" value={bayarTarget.id} />
			<div class="space-y-3">
				<div>
					<Label for="bayar-jumlah">Jumlah (Rp)</Label>
					<Input
						id="bayar-jumlah"
						name="amount"
						type="number"
						min="1"
						step="500"
						bind:value={bayarJumlah}
						required
					/>
				</div>
				<div>
					<Label for="bayar-metode">Metode</Label>
					<Select id="bayar-metode" name="method" bind:value={bayarMetode} required>
						<option value="cash">Tunai</option>
						<option value="transfer">Transfer</option>
						<option value="qris">QRIS</option>
					</Select>
				</div>
				<div class="flex justify-end gap-2 pt-1">
					<Button type="button" variant="outline" onclick={() => (bayarOpen = false)}>Batal</Button>
					<Button type="submit">Simpan pembayaran</Button>
				</div>
			</div>
		</form>
	{/if}
</Dialog>

<!-- Dialog riwayat -->
<Dialog
	bind:open={riwayatOpen}
	title="Riwayat pembayaran"
	description={riwayatTarget
		? `${riwayatTarget.customerName} — ${riwayatTarget.orderDescription ?? 'order'}.`
		: undefined}
>
	{#if riwayatList.length === 0}
		<p class="text-sm text-slate-500">Belum ada pembayaran tercatat untuk order ini.</p>
	{:else}
		<ul class="divide-y divide-slate-100">
			{#each riwayatList as p (p.id)}
				<li class="flex items-center justify-between py-2 text-sm">
					<span>
						<span class="font-medium text-slate-900">{rupiah(p.amount)}</span>
						<span class="text-slate-400"> · </span>
						<span class="text-slate-500">{METODE_LABEL[p.method] ?? p.method}</span>
					</span>
					<span class="text-xs text-slate-400">{tglWaktu(p.paidAt)}</span>
				</li>
			{/each}
		</ul>
		<p class="mt-3 border-t border-slate-100 pt-2 text-sm">
			<span class="text-slate-500">Total dibayar:</span>
			<strong class="text-slate-900">{rupiah(riwayatList.reduce((a, p) => a + p.amount, 0))}</strong>
		</p>
	{/if}
	<div class="flex justify-end pt-3">
		<Button variant="outline" onclick={() => (riwayatOpen = false)}>Tutup</Button>
	</div>
</Dialog>
