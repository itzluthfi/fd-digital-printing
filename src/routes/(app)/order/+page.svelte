<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import {
		AlertTriangle,
		ArrowRight,
		CalendarCheck,
		CheckCircle2,
		ExternalLink,
		FileText,
		MessageSquare,
		Receipt,
		Send,
		ShieldAlert,
		Sparkles,
		X
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	/** Bentuk hasil action yang dipakai handler enhance. */
	type ActionOutcome = {
		type: 'success' | 'failure' | 'redirect' | 'error';
		data?: { message?: string; count?: number; [k: string]: unknown } | null;
	};

	import EmptyState from '#lib/components/app/empty-state.svelte';
	import PageHeader from '#lib/components/app/page-header.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Dialog from '#lib/components/ui/dialog.svelte';
	import AlertDialog from '#lib/components/ui/alert-dialog.svelte';
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
	let bayarFilter = $state<'semua' | 'lunas' | 'belum_lunas'>('semua');
	let q = $state('');

	// Bulk selection state
	let selectedIds = $state<number[]>([]);
	let bulkLoading = $state(false);

	// Safety alert state saat status 'diambil' padahal belum lunas
	let safetyAlertOpen = $state(false);
	let pendingAmbilOrder = $state<Order | null>(null);

	const mendesakCount = $derived(
		data.orders.filter((o) => o.telatJanji || o.deadlineHariIni).length
	);

	const counts = $derived<Record<string, number>>({
		semua: data.orders.length,
		mendesak: mendesakCount,
		...Object.fromEntries(STATUS_URUTAN.map((s) => [s, data.orders.filter((o) => o.status === s).length]))
	});

	const bayarCounts = $derived({
		semua: data.orders.length,
		lunas: data.orders.filter((o) => o.isLunas).length,
		belum_lunas: data.orders.filter((o) => !o.isLunas).length
	});

	const daftar = $derived(
		data.orders
			.filter((o) => {
				if (filter === 'semua') return true;
				if (filter === 'mendesak') return o.telatJanji || o.deadlineHariIni;
				return o.status === filter;
			})
			.filter((o) => {
				if (bayarFilter === 'semua') return true;
				if (bayarFilter === 'lunas') return o.isLunas;
				return !o.isLunas;
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
		{ id: 'semua', label: 'Semua Status' },
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
		{ key: 'code', label: 'Kode & Waktu' },
		{ key: 'customerName', label: 'Pelanggan' },
		{ key: 'description', label: 'Deskripsi & File' },
		...(data.isOperator ? [] : [{ key: 'total', label: 'Total & Bayar', class: 'text-right' }]),
		{ key: 'status', label: 'Status & SLA' },
		{ key: 'aksi', label: 'Aksi Cepat', class: 'text-right', sortable: false }
	]);

	function toggleSelectRow(key: string | number) {
		const num = Number(key);
		if (selectedIds.includes(num)) {
			selectedIds = selectedIds.filter((id) => id !== num);
		} else {
			selectedIds = [...selectedIds, num];
		}
	}

	function toggleSelectAll() {
		const currentVisibleIds = daftar.map((o) => o.id);
		const allSelected = currentVisibleIds.length > 0 && currentVisibleIds.every((id) => selectedIds.includes(id));
		if (allSelected) {
			selectedIds = selectedIds.filter((id) => !currentVisibleIds.includes(id));
		} else {
			selectedIds = Array.from(new Set([...selectedIds, ...currentVisibleIds]));
		}
	}

	/** Optimistic: status berubah di UI langsung, rollback bila gagal */
	function lanjutkan(order: Order) {
		return ({ cancel }: { cancel: () => void }) => {
			const next = berikutnya(order.status);
			// Jika mau 'diambil' tapi belum lunas, trigger konfirmasi keselamatan kasir
			if (next === 'diambil' && !order.isLunas) {
				cancel();
				pendingAmbilOrder = order;
				safetyAlertOpen = true;
				return;
			}

			const prev = order.status;
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

	async function eksekusiAmbilBelumLunas() {
		if (!pendingAmbilOrder) return;
		const order = pendingAmbilOrder;
		const prev = order.status;
		order.status = 'diambil';
		safetyAlertOpen = false;
		pendingAmbilOrder = null;

		const fd = new FormData();
		fd.append('orderId', String(order.id));

		try {
			const res = await fetch('?/lanjut', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-invalidated': '01' }
			});
			if (!res.ok) throw new Error('Gagal memperbarui status.');
			toast.warning(`Order #${order.id} diambil (catatan: ada sisa tagihan ${rupiah(order.sisaTagihan)}).`);
			await invalidateAll();
		} catch (e) {
			order.status = prev;
			toast.error('Gagal memperbarui status.');
		}
	}

	/** Submit bulk action */
	async function jalankanBulk(targetStatus?: string) {
		if (selectedIds.length === 0) return;
		bulkLoading = true;

		const fd = new FormData();
		fd.append('orderIds', selectedIds.join(','));
		if (targetStatus) fd.append('targetStatus', targetStatus);

		try {
			const res = await fetch('?/bulkLanjut', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-invalidated': '01' }
			});
			const r = await res.json();
			if (r.type === 'failure') throw new Error(r.data?.message ?? 'Gagal memproses bulk order.');
			toast.success(`${selectedIds.length} order berhasil diperbarui.`);
			selectedIds = [];
			await invalidateAll();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Gagal memproses bulk order.');
		} finally {
			bulkLoading = false;
		}
	}

	/** Optimistic: simpan janji selesai */
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

	/** Kirim ulang notifikasi "cetakan selesai" */
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

<PageHeader title="Antrean Order" />

<!-- Filter & Search Section -->
<div class="mb-4 space-y-3">
	<SearchInput bind:value={q} placeholder="Cari kode order, spesifikasi, nama pelanggan, atau nomor telepon…" />

	<div class="flex flex-col gap-2">
		<!-- Status Chips -->
		<div class="flex flex-wrap items-center gap-1.5">
			<span class="mr-1 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Status:</span>
			{#each chipDefs as c (c.id)}
				<button
					type="button"
					onclick={() => (filter = c.id)}
					class={cn(
						'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
						filter === c.id
							? c.id === 'mendesak'
								? 'border-red-600 bg-red-600 text-white shadow-xs'
								: 'border-[#00aeef] bg-[#00aeef] text-white shadow-xs'
							: c.id === 'mendesak' && mendesakCount > 0
								? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'
								: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
					)}
				>
					{c.label}
					<span
						class={cn(
							'ml-1.5 rounded-full px-1.5 py-0.2 text-[11px] font-semibold',
							filter === c.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
						)}
					>
						{counts[c.id] ?? 0}
					</span>
				</button>
			{/each}
		</div>

		<!-- Pelunasan Chips -->
		<div class="flex flex-wrap items-center gap-1.5">
			<span class="mr-1 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Pelunasan:</span>
			<button
				type="button"
				onclick={() => (bayarFilter = 'semua')}
				class={cn(
					'cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
					bayarFilter === 'semua'
						? 'border-slate-800 bg-slate-800 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900'
						: 'border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
				)}
			>
				Semua ({bayarCounts.semua})
			</button>
			<button
				type="button"
				onclick={() => (bayarFilter = 'lunas')}
				class={cn(
					'cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
					bayarFilter === 'lunas'
						? 'border-emerald-600 bg-emerald-600 text-white'
						: 'border-slate-300 bg-white text-slate-600 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400'
				)}
			>
				✅ Sudah Lunas ({bayarCounts.lunas})
			</button>
			<button
				type="button"
				onclick={() => (bayarFilter = 'belum_lunas')}
				class={cn(
					'cursor-pointer rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
					bayarFilter === 'belum_lunas'
						? 'border-amber-600 bg-amber-600 text-white'
						: 'border-slate-300 bg-white text-slate-600 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400'
				)}
			>
				⚠️ Ada Sisa Tagihan ({bayarCounts.belum_lunas})
			</button>
		</div>
	</div>
</div>

<!-- Bulk Action Floating Bar -->
{#if selectedIds.length > 0}
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-300 bg-sky-50 px-4 py-3 shadow-md dark:border-sky-800 dark:bg-sky-950/70">
		<div class="flex items-center gap-2">
			<span class="flex h-6 w-6 items-center justify-center rounded-full bg-[#00aeef] text-xs font-bold text-white">
				{selectedIds.length}
			</span>
			<span class="text-sm font-semibold text-slate-800 dark:text-slate-100">
				order dipilih
			</span>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<Button
				size="sm"
				variant="outline"
				class="h-8 text-xs bg-white dark:bg-slate-900"
				onclick={() => jalankanBulk('diproses')}
				disabled={bulkLoading}
			>
				Mulai Proses Terpilih
			</Button>
			<Button
				size="sm"
				variant="outline"
				class="h-8 text-xs bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
				onclick={() => jalankanBulk('selesai')}
				disabled={bulkLoading}
			>
				Tandai Selesai Terpilih
			</Button>
			<Button
				size="sm"
				class="h-8 text-xs bg-[#00aeef] hover:bg-[#009bd6] text-white"
				onclick={() => jalankanBulk()}
				disabled={bulkLoading}
			>
				Lanjut Tahap Berikutnya
			</Button>
			<button
				type="button"
				class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-sky-100 dark:hover:bg-sky-900 cursor-pointer"
				onclick={() => (selectedIds = [])}
				title="Batalkan pilihan"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	</div>
{/if}

<ResponsiveTable
	columns={cols}
	rows={daftar}
	keyOf={(order) => order.id}
	selectable={true}
	selectedKeys={selectedIds}
	onToggleSelect={toggleSelectRow}
	onToggleSelectAll={toggleSelectAll}
>
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
		{#if c.key === 'code'}
			<div class="flex flex-col">
				<div class="flex items-center gap-1.5">
					<span class="font-bold text-slate-900 dark:text-white">{order.code ?? `#${order.id}`}</span>
					<a
						href="/kasir/invoice/{order.id}"
						class="text-slate-400 hover:text-[#00aeef] transition"
						title="Buka Invoice"
					>
						<Receipt class="h-3.5 w-3.5" />
					</a>
				</div>
				<span class="text-[11px] text-slate-500 dark:text-slate-400">{tglWaktu(order.createdAt)}</span>
			</div>
		{:else if c.key === 'customerName'}
			<span class="font-semibold text-slate-900 dark:text-slate-100">{order.customerName ?? '-'}</span>
			{#if !data.isOperator && order.customerPhone}
				<span class="block text-[11px] text-slate-500 dark:text-slate-400">{order.customerPhone}</span>
			{/if}
		{:else if c.key === 'description'}
			<p class="line-clamp-2 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">{order.description}</p>
			{#if order.fileUrl}
				<a
					href={order.fileUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-1.5 inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 border border-sky-200 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800 transition"
					title="Buka file desain cetak"
				>
					<FileText class="h-3 w-3" />
					<span>File Desain</span>
					<ExternalLink class="h-2.5 w-2.5 opacity-60" />
				</a>
			{/if}
		{:else if c.key === 'total'}
			<div class="flex flex-col items-end">
				<span class="font-bold text-slate-900 dark:text-white whitespace-nowrap">{rupiah(order.total)}</span>
				{#if order.isLunas}
					<span class="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
						<CheckCircle2 class="h-3 w-3" /> Lunas
					</span>
				{:else}
					<span class="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400" title="Sisa tagihan: {rupiah(order.sisaTagihan)}">
						<AlertTriangle class="h-3 w-3" /> Sisa {rupiah(order.sisaTagihan)}
					</span>
				{/if}
			</div>
		{:else if c.key === 'status'}
			<Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABEL[order.status] ?? order.status}</Badge>
			{#if order.telatJanji}
				<span class="mt-1 block"><Badge variant="danger">⚠️ Telat Janji</Badge></span>
			{:else if order.deadlineHariIni}
				<span class="mt-1 block"><Badge variant="warning">⚡ Hari Ini</Badge></span>
			{:else if order.janjiSelesai}
				<span class="mt-1 block text-[11px] whitespace-nowrap text-slate-500 dark:text-slate-400"
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
								class="inline-flex h-7 w-7 items-center justify-center rounded-md border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400 transition"
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
						class="h-7 rounded border border-slate-300 bg-white px-1 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
					/>
					<button
						type="submit"
						class="flex h-7 w-7 items-center justify-center rounded border border-slate-200 text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:text-white cursor-pointer"
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
				<div class="flex items-center gap-1.5">
					<p class="font-bold text-slate-900 dark:text-white">{order.code ?? `#${order.id}`}</p>
					<a href="/kasir/invoice/{order.id}" class="text-slate-400 hover:text-[#00aeef]">
						<Receipt class="h-3.5 w-3.5" />
					</a>
				</div>
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
				<p><span class="text-slate-500 dark:text-slate-400">Pelanggan: </span><span class="font-medium text-slate-800 dark:text-slate-200">{order.customerName ?? '-'}</span></p>
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
						class="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800"
					>
						<FileText class="h-3 w-3" /> File Desain <ExternalLink class="h-2.5 w-2.5" />
					</a>
				</div>
			{/if}
		</div>

		{#if !data.isOperator}
			<div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
				<div>
					{#if order.isLunas}
						<span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
							<CheckCircle2 class="h-3.5 w-3.5" /> Lunas
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
							<AlertTriangle class="h-3.5 w-3.5" /> Sisa {rupiah(order.sisaTagihan)}
						</span>
					{/if}
				</div>
				<p class="text-base font-bold text-slate-900 dark:text-white">{rupiah(order.total)}</p>
			</div>
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
				class="h-10 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
			/>
			<Button type="submit" variant="outline" class="min-h-10" title="Simpan janji selesai">
				<CalendarCheck class="h-4 w-4" />
			</Button>
		</form>
	{/snippet}
</ResponsiveTable>

<!-- Safety Alert Modal saat order belum lunas mau diambil -->
{#if pendingAmbilOrder}
	<AlertDialog
		bind:open={safetyAlertOpen}
		title="Peringatan: Pesanan Belum Lunas"
		description={`Pesanan ${pendingAmbilOrder.code ?? `#${pendingAmbilOrder.id}`} atas nama ${pendingAmbilOrder.customerName ?? 'Pelanggan'} masih memiliki sisa tagihan sebesar ${rupiah(pendingAmbilOrder.sisaTagihan)}. Apakah Anda yakin pesanan sudah diambil oleh pelanggan?`}
		confirmLabel="Ya, Tetap Tandai Diambil"
		onconfirm={eksekusiAmbilBelumLunas}
		oncancel={() => {
			safetyAlertOpen = false;
			pendingAmbilOrder = null;
		}}
	/>
{/if}
