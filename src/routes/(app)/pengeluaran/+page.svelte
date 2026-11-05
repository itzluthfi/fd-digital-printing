<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Trash2, Search, Filter } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import Select from '#lib/components/ui/select.svelte';
	import SearchInput from '#lib/components/ui/search-input.svelte';
	import AlertDialog from '#lib/components/ui/alert-dialog.svelte';
	import EmptyState from '#lib/components/app/empty-state.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { rupiah, tgl } from '#lib/format';
	import { cn } from '#lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Row = (typeof data.rows)[number];

	let saving = $state(false);
	let q = $state('');
	let kategoriFilter = $state('semua');
	let hapusTarget = $state<Row | null>(null);
	let hapusOpen = $state(false);
	let hapusLoading = $state(false);

	const KATEGORI = ['Bahan baku', 'Operasional', 'Gaji', 'Sewa', 'Lainnya'];

	const cols: RtColumn[] = [
		{ key: 'tanggal', label: 'Tanggal' },
		{ key: 'kategori', label: 'Kategori' },
		{ key: 'jumlah', label: 'Jumlah', class: 'text-right' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right', sortable: false }
	];

	const filteredRows = $derived(
		data.rows
			.filter((r) => kategoriFilter === 'semua' || r.kategori === kategoriFilter)
			.filter((r) => {
				const s = q.trim().toLowerCase();
				if (!s) return true;
				return (
					r.kategori.toLowerCase().includes(s) ||
					(r.catatan ?? '').toLowerCase().includes(s) ||
					String(r.jumlah).includes(s)
				);
			})
	);

	const totalTampil = $derived(filteredRows.reduce((acc, r) => acc + r.jumlah, 0));

	function bukaHapus(r: Row) {
		hapusTarget = r;
		hapusOpen = true;
	}

	async function konfirmasiHapus() {
		if (!hapusTarget) return;
		hapusLoading = true;
		const id = hapusTarget.id;

		const fd = new FormData();
		fd.append('id', String(id));

		try {
			const res = await fetch('?/hapus', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-invalidated': '01' }
			});
			if (!res.ok) throw new Error('Gagal menghapus pengeluaran.');
			toast.success('Pengeluaran berhasil dihapus.');
			hapusOpen = false;
			hapusTarget = null;
			window.location.reload();
		} catch (e) {
			toast.error(e instanceof Error ? e.message : 'Gagal menghapus.');
		} finally {
			hapusLoading = false;
		}
	}

	function setelahAksi() {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			saving = false;
			if (result.type === 'success') {
				toast.success('Pengeluaran berhasil dicatat.');
				await update();
			} else if (result.type === 'failure') {
				toast.error(String(result.data?.message ?? 'Gagal memproses.'));
			}
		};
	}
</script>

<PageHeader title="Pengeluaran" description="Catat biaya operasional — dipakai untuk hitung laba bersih." />

<!-- Ringkasan Bulan Ini -->
<div class="mb-4 grid gap-3 sm:grid-cols-2">
	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
		<p class="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Total Bulan Ini</p>
		<p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{rupiah(data.totalBulanIni)}</p>
	</div>
	<div class="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
		<p class="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Total Sesuai Filter</p>
		<p class="mt-1 text-2xl font-bold text-[#00aeef]">{rupiah(totalTampil)}</p>
		<p class="text-xs text-slate-400 mt-0.5">{filteredRows.length} transaksi pengeluaran</p>
	</div>
</div>

<!-- Form Tambah Pengeluaran -->
<form
	method="POST"
	action="?/tambah"
	use:enhance={() => {
		saving = true;
		return setelahAksi();
	}}
	class="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
>
	<h2 class="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Tambah Pengeluaran Baru</h2>
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
		<div>
			<Label for="tanggal">Tanggal</Label>
			<Input id="tanggal" name="tanggal" type="date" value={data.hariIni} required />
		</div>
		<div>
			<Label for="kategori">Kategori</Label>
			<Select id="kategori" name="kategori" required>
				{#each KATEGORI as k (k)}
					<option value={k}>{k}</option>
				{/each}
			</Select>
		</div>
		<div>
			<Label for="jumlah">Jumlah (Rp)</Label>
			<Input id="jumlah" name="jumlah" type="number" min="1" step="500" placeholder="0" required />
		</div>
		<div>
			<Label for="catatan">Catatan / Keterangan</Label>
			<Input id="catatan" name="catatan" placeholder="cth: Beli tinta 1L (opsional)" />
		</div>
	</div>
	<Button type="submit" disabled={saving} class="mt-4 min-h-10 w-full sm:w-auto bg-[#00aeef] hover:bg-[#009bd6] text-white">
		<Plus class="h-4 w-4 mr-1.5" /> {saving ? 'Menyimpan…' : 'Catat pengeluaran'}
	</Button>
</form>

<!-- Filter & Search Toolbar -->
<div class="mb-4 space-y-2.5">
	<SearchInput bind:value={q} placeholder="Cari catatan pengeluaran, kategori, atau nominal…" />
	
	<div class="flex flex-wrap items-center gap-1.5">
		<span class="mr-1 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Kategori:</span>
		<button
			type="button"
			onclick={() => (kategoriFilter = 'semua')}
			class={cn(
				'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
				kategoriFilter === 'semua'
					? 'border-[#00aeef] bg-[#00aeef] text-white shadow-xs'
					: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
			)}
		>
			Semua Kategori
		</button>
		{#each KATEGORI as k (k)}
			<button
				type="button"
				onclick={() => (kategoriFilter = k)}
				class={cn(
					'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
					kategoriFilter === k
						? 'border-[#00aeef] bg-[#00aeef] text-white shadow-xs'
						: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
				)}
			>
				{k}
			</button>
		{/each}
	</div>
</div>

{#if filteredRows.length === 0}
	<EmptyState message="Tidak ada data pengeluaran yang cocok dengan filter." actionLabel="Reset Filter" actionHref="/pengeluaran" />
{:else}
	<ResponsiveTable columns={cols} rows={filteredRows} keyOf={(r) => r.id}>
		{#snippet cell(c, r)}
			{#if c.key === 'tanggal'}
				<span class="font-medium text-slate-900 dark:text-white whitespace-nowrap">{tgl(r.tanggal)}</span>
				{#if r.catatan}<span class="block text-xs text-slate-500 dark:text-slate-400">{r.catatan}</span>{/if}
			{:else if c.key === 'kategori'}
				<span class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
					{r.kategori}
				</span>
			{:else if c.key === 'jumlah'}
				<span class="font-bold text-slate-900 dark:text-white whitespace-nowrap">{rupiah(r.jumlah)}</span>
			{:else if c.key === 'aksi'}
				<Button
					type="button"
					size="icon"
					variant="ghost"
					class="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
					onclick={() => bukaHapus(r)}
					ariaLabel="Hapus pengeluaran"
					title="Hapus pengeluaran"
				>
					<Trash2 class="h-4 w-4" />
				</Button>
			{/if}
		{/snippet}
		{#snippet card(r)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<span class="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
						{r.kategori}
					</span>
					<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{tgl(r.tanggal)}{r.catatan ? ` — ${r.catatan}` : ''}</p>
				</div>
				<p class="font-bold text-slate-900 dark:text-white whitespace-nowrap">{rupiah(r.jumlah)}</p>
			</div>
			<div class="mt-2 text-right">
				<Button
					type="button"
					size="sm"
					variant="ghost"
					class="text-red-500 hover:text-red-700"
					onclick={() => bukaHapus(r)}
				>
					Hapus
				</Button>
			</div>
		{/snippet}
	</ResponsiveTable>
{/if}

<!-- Safety Alert Dialog Hapus Pengeluaran -->
{#if hapusTarget}
	<AlertDialog
		bind:open={hapusOpen}
		title="Hapus Catatan Pengeluaran?"
		description={`Apakah Anda yakin ingin menghapus pengeluaran "${hapusTarget.kategori}" sebesar ${rupiah(hapusTarget.jumlah)} pada tanggal ${tgl(hapusTarget.tanggal)}? Tindakan ini tidak dapat dibatalkan.`}
		confirmLabel={hapusLoading ? 'Menghapus…' : 'Ya, Hapus'}
		destructive
		loading={hapusLoading}
		onconfirm={konfirmasiHapus}
		oncancel={() => {
			hapusOpen = false;
			hapusTarget = null;
		}}
	/>
{/if}
