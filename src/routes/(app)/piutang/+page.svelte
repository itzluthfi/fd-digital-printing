<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { BellRing, Download, History, Send, Wallet } from 'lucide-svelte';
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
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import { cn } from '#lib/utils';
	import { rupiah, tgl, tglWaktu, METODE_LABEL } from '#lib/format';
	import type { PiutangRow } from '#lib/server/piutang';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function waReminderLink(r: PiutangRow): string {
		const raw = (r.customerPhone ?? '').replace(/\D/g, '');
		const phone = raw.startsWith('0') ? '62' + raw.slice(1) : raw.startsWith('62') ? raw : raw ? '62' + raw : '';
		if (!phone) return '';
		const msg = encodeURIComponent(
			`*PENGINGAT TAGIHAN — FD DIGITAL PRINTING*\n\n` +
			`Halo *${r.customerName}*,\n` +
			`Kami menginfokan pesanan *${r.orderDescription ?? 'Cetak'}* memiliki sisa tagihan sebesar *${rupiah(r.sisa)}*.\n` +
			(r.dueDate ? `Jatuh tempo: *${tgl(r.dueDate)}*\n\n` : `\n`) +
			`Mohon konfirmasi atau lakukan pelunasan. Terima kasih! 🙏`
		);
		return `https://wa.me/${phone}?text=${msg}`;
	}

	let filter = $state<'semua' | 'belum_lunas' | 'lunas' | 'telat'>('semua');
	let q = $state('');
	let bayarOpen = $state(false);
	let bayarTarget = $state<PiutangRow | null>(null);
	let bayarJumlah = $state(0);
	let bayarMetode = $state('cash');
	let riwayatOpen = $state(false);
	let riwayatTarget = $state<PiutangRow | null>(null);

	const chipDefs = [
		{ id: 'semua', label: 'Semua Piutang' },
		{ id: 'belum_lunas', label: 'Belum Lunas' },
		{ id: 'telat', label: '🚨 Telat Tempo' },
		{ id: 'lunas', label: 'Lunas' }
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
		{ key: 'customerName', label: 'Pelanggan' },
		{ key: 'orderDescription', label: 'Deskripsi order' },
		{ key: 'amount', label: 'Total', class: 'text-right' },
		{ key: 'paidAmount', label: 'Dibayar', class: 'text-right' },
		{ key: 'sisa', label: 'Sisa Tagihan', class: 'text-right' },
		{ key: 'dueDate', label: 'Jatuh tempo' },
		{ key: 'status', label: 'Status' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right', sortable: false }
	];
</script>

<PageHeader title="Buku Piutang" description="Catat pembayaran dan kirim pengingat jatuh tempo.">
	<form method="POST" action="?/kirimReminder" use:enhance={kirimSemua} class="inline">
		<Button type="submit" variant="outline" size="sm">
			<Send class="h-3.5 w-3.5 mr-1" /> Kirim reminder
		</Button>
	</form>
	<Button variant="outline" size="sm" href="/api/export?jenis=piutang">
		<Download class="h-3.5 w-3.5 mr-1" /> Unduh CSV
	</Button>
</PageHeader>

<div class="mb-4 space-y-2.5">
	<SearchInput bind:value={q} placeholder="Cari pelanggan atau deskripsi order…" />
	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex flex-wrap items-center gap-1.5">
			{#each chipDefs as c (c.id)}
				<button
					type="button"
					onclick={() => (filter = c.id)}
					class={cn(
						'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
						filter === c.id
							? c.id === 'telat'
								? 'border-red-600 bg-red-600 text-white shadow-xs'
								: 'border-[#00aeef] bg-[#00aeef] text-white shadow-xs'
							: c.id === 'telat' && telatCount > 0
								? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
								: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
					)}
				>
					{c.label}
					<span class={cn('ml-1.5 rounded-full px-1.5 py-0.2 text-[11px] font-semibold', filter === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400')}>
						{counts[c.id]}
					</span>
				</button>
			{/each}
		</div>

		<span class="text-xs text-slate-500 dark:text-slate-400">
			Total sisa belum lunas: <strong class="font-bold text-slate-900 dark:text-white">{rupiah(totalSisa)}</strong>
			{#if telatCount > 0}
				<Badge variant="danger" class="ml-1.5">{telatCount} telat</Badge>
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
			{#if col.key === 'customerName'}
				<span class="font-semibold text-slate-900 dark:text-white">{r.customerName}</span>
				{#if r.customerPhone}
					<span class="block text-[11px] text-slate-500 dark:text-slate-400">{r.customerPhone}</span>
				{/if}
			{:else if col.key === 'orderDescription'}
				<span class="line-clamp-2 text-slate-800 dark:text-slate-200">{r.orderDescription ?? '-'}</span>
			{:else if col.key === 'amount'}
				<span class="whitespace-nowrap text-slate-800 dark:text-slate-200">{rupiah(r.amount)}</span>
			{:else if col.key === 'paidAmount'}
				<span class="whitespace-nowrap text-slate-800 dark:text-slate-200">{rupiah(r.paidAmount)}</span>
			{:else if col.key === 'sisa'}
				<span class="font-bold whitespace-nowrap text-amber-600 dark:text-amber-400">{rupiah(r.sisa)}</span>
			{:else if col.key === 'dueDate'}
				{#if r.selisihHari < 0 && r.status === 'belum_lunas'}
					<span class="font-semibold text-red-600 dark:text-red-400">{tgl(r.dueDate)}</span>
					<Badge variant="danger" class="ml-1">Telat {Math.abs(r.selisihHari)}h</Badge>
				{:else}
					<span class="text-slate-700 dark:text-slate-300">{tgl(r.dueDate)}</span>
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
							<Button type="submit" size="sm" variant="ghost" title="Kirim reminder via bot">
								<BellRing class="h-3.5 w-3.5 mr-1" /> Ingatkan
							</Button>
						</form>
					{/if}
					{#if r.orderId != null}
						<Button size="sm" variant="ghost" onclick={() => bukaRiwayat(r)} title="Lihat riwayat pembayaran">
							<History class="h-3.5 w-3.5 mr-1" /> Riwayat
						</Button>
					{/if}
					{#if r.status === 'belum_lunas' && r.customerPhone}
						<a
							href={waReminderLink(r)}
							target="_blank"
							rel="noopener noreferrer"
							title="Chat WhatsApp Pelanggan"
							class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/60 dark:text-green-400 transition-colors"
						>
							<WhatsappIcon class="h-4 w-4" />
						</a>
					{/if}
					{#if r.status === 'belum_lunas'}
						<Button size="sm" class="bg-[#00aeef] hover:bg-[#009bd6] text-white" onclick={() => bukaBayar(r)}>
							<Wallet class="h-3.5 w-3.5 mr-1" /> Bayar
						</Button>
					{/if}
				</div>
			{/if}
		{/snippet}
		{#snippet card(r)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<p class="font-bold text-slate-900 dark:text-white">{r.customerName}</p>
					{#if r.customerPhone}
						<span class="text-xs text-slate-500 dark:text-slate-400">{r.customerPhone}</span>
					{/if}
				</div>
				<Badge variant={r.status === 'lunas' ? 'success' : 'warning'}>
					{r.status === 'lunas' ? 'Lunas' : 'Belum lunas'}
				</Badge>
			</div>

			<p class="mt-2 text-sm text-slate-700 dark:text-slate-300">{r.orderDescription ?? '-'}</p>

			<div class="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2 dark:border-slate-800">
				<div>
					<span class="text-slate-500 dark:text-slate-400">Total:</span>
					<span class="font-medium text-slate-800 dark:text-slate-200 block">{rupiah(r.amount)}</span>
				</div>
				<div>
					<span class="text-slate-500 dark:text-slate-400">Sisa Tagihan:</span>
					<span class="font-bold text-amber-600 dark:text-amber-400 block">{rupiah(r.sisa)}</span>
				</div>
				<div class="col-span-2">
					<span class="text-slate-500 dark:text-slate-400">Jatuh Tempo: </span>
					{#if r.selisihHari < 0 && r.status === 'belum_lunas'}
						<span class="font-semibold text-red-600 dark:text-red-400">{tgl(r.dueDate)} (Telat {Math.abs(r.selisihHari)} hari)</span>
					{:else}
						<span class="text-slate-700 dark:text-slate-300">{tgl(r.dueDate)}</span>
					{/if}
				</div>
			</div>

			<div class="mt-3 flex items-center justify-end gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
				{#if r.status === 'belum_lunas' && r.customerPhone}
					<a
						href={waReminderLink(r)}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex h-8 items-center gap-1 rounded-md border border-green-200 bg-green-50 px-2.5 text-xs font-semibold text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/60 dark:text-green-400"
					>
						<WhatsappIcon class="h-3.5 w-3.5" /> WA
					</a>
				{/if}
				{#if r.orderId != null}
					<Button size="sm" variant="outline" onclick={() => bukaRiwayat(r)}>
						<History class="h-3.5 w-3.5 mr-1" /> Riwayat
					</Button>
				{/if}
				{#if r.status === 'belum_lunas'}
					<Button size="sm" class="bg-[#00aeef] hover:bg-[#009bd6] text-white" onclick={() => bukaBayar(r)}>
						<Wallet class="h-3.5 w-3.5 mr-1" /> Bayar
					</Button>
				{/if}
			</div>
		{/snippet}
	</ResponsiveTable>
{/if}

<!-- Dialog bayar -->
<Dialog
	bind:open={bayarOpen}
	title="Catat Pembayaran Piutang"
	description={bayarTarget
		? `Pelanggan ${bayarTarget.customerName} — sisa tagihan ${rupiah(bayarTarget.sisa)}.`
		: undefined}
>
	{#if bayarTarget}
		<form method="POST" action="?/bayar" use:enhance={bayarkan()}>
			<input type="hidden" name="receivableId" value={bayarTarget.id} />
			<div class="space-y-3">
				<div>
					<Label for="bayar-jumlah">Jumlah Pembayaran (Rp)</Label>
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
				<div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
					<Button type="button" variant="outline" onclick={() => (bayarOpen = false)}>Batal</Button>
					<Button type="submit" class="bg-[#00aeef] hover:bg-[#009bd6] text-white">Simpan pembayaran</Button>
				</div>
			</div>
		</form>
	{/if}
</Dialog>

<!-- Dialog riwayat -->
<Dialog
	bind:open={riwayatOpen}
	title="Riwayat Pembayaran"
	description={riwayatTarget
		? `${riwayatTarget.customerName} — ${riwayatTarget.orderDescription ?? 'order'}.`
		: undefined}
>
	{#if riwayatList.length === 0}
		<p class="text-sm text-slate-500 dark:text-slate-400">Belum ada pembayaran tercatat untuk order ini.</p>
	{:else}
		<ul class="divide-y divide-slate-100 dark:divide-slate-800">
			{#each riwayatList as p (p.id)}
				<li class="flex items-center justify-between py-2.5 text-sm">
					<div>
						<span class="font-bold text-slate-900 dark:text-white">{rupiah(p.amount)}</span>
						<span class="text-slate-400"> · </span>
						<span class="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase">{METODE_LABEL[p.method] ?? p.method}</span>
					</div>
					<span class="text-xs text-slate-500 dark:text-slate-400">{tglWaktu(p.paidAt)}</span>
				</li>
			{/each}
		</ul>
		<div class="mt-3 flex items-center justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-800">
			<span class="text-slate-500 dark:text-slate-400">Total dibayar:</span>
			<strong class="font-bold text-slate-900 dark:text-white">{rupiah(riwayatList.reduce((a, p) => a + p.amount, 0))}</strong>
		</div>
	{/if}
	<div class="flex justify-end pt-3">
		<Button variant="outline" onclick={() => (riwayatOpen = false)}>Tutup</Button>
	</div>
</Dialog>
