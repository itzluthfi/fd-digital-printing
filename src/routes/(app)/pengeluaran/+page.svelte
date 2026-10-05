<script lang="ts">
	import { enhance } from '$app/forms';
	import { Plus, Trash2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import Select from '#lib/components/ui/select.svelte';
	import EmptyState from '#lib/components/app/empty-state.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { rupiah, tgl } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let saving = $state(false);

	const KATEGORI = ['Bahan baku', 'Operasional', 'Gaji', 'Sewa', 'Lainnya'];

	const cols: RtColumn[] = [
		{ key: 'tanggal', label: 'Tanggal' },
		{ key: 'kategori', label: 'Kategori' },
		{ key: 'jumlah', label: 'Jumlah', class: 'text-right' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right' }
	];

	function setelahAksi() {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			saving = false;
			if (result.type === 'success') {
				await update();
			} else if (result.type === 'failure') {
				toast.error(String(result.data?.message ?? 'Gagal memproses.'));
			}
		};
	}
</script>

<PageHeader title="Pengeluaran" description="Catat biaya operasional — dipakai untuk hitung laba bersih." />

<div class="mb-4 rounded-lg border border-slate-200 bg-white p-4">
	<p class="text-sm text-slate-500">
		Total bulan ini: <span class="font-bold text-slate-900">{rupiah(data.totalBulanIni)}</span>
	</p>
</div>

<form
	method="POST"
	action="?/tambah"
	use:enhance={() => {
		saving = true;
		return setelahAksi();
	}}
	class="mb-6 max-w-xl rounded-lg border border-slate-200 bg-white p-4"
>
	<div class="grid gap-3 sm:grid-cols-2">
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
			<Label for="catatan">Catatan</Label>
			<Input id="catatan" name="catatan" placeholder="cth: Beli tinta 1L (opsional)" />
		</div>
	</div>
	<Button type="submit" disabled={saving} class="mt-3 min-h-10 w-full sm:w-auto">
		<Plus class="h-4 w-4" /> {saving ? 'Menyimpan…' : 'Catat pengeluaran'}
	</Button>
</form>

{#if data.rows.length === 0}
	<EmptyState message="Belum ada pengeluaran tercatat." actionLabel="Muat ulang" actionHref="/pengeluaran" />
{:else}
	<ResponsiveTable columns={cols} rows={data.rows} keyOf={(r) => r.id}>
		{#snippet cell(c, r)}
			{#if c.key === 'tanggal'}
				<span class="font-medium whitespace-nowrap">{tgl(r.tanggal)}</span>
				{#if r.catatan}<span class="block text-xs text-slate-400">{r.catatan}</span>{/if}
			{:else if c.key === 'kategori'}
				{r.kategori}
			{:else if c.key === 'jumlah'}
				<span class="font-semibold whitespace-nowrap">{rupiah(r.jumlah)}</span>
			{:else if c.key === 'aksi'}
				<form method="POST" action="?/hapus" use:enhance={setelahAksi} class="inline">
					<input type="hidden" name="id" value={r.id} />
					<Button type="submit" size="icon" variant="ghost" class="text-red-600 hover:text-red-700" ariaLabel="Hapus pengeluaran">
						<Trash2 class="h-4 w-4" />
					</Button>
				</form>
			{/if}
		{/snippet}
		{#snippet card(r)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<p class="font-semibold text-slate-900">{r.kategori}</p>
					<p class="text-xs text-slate-400">{tgl(r.tanggal)}{r.catatan ? ` — ${r.catatan}` : ''}</p>
				</div>
				<p class="font-bold whitespace-nowrap text-slate-900">{rupiah(r.jumlah)}</p>
			</div>
			<form method="POST" action="?/hapus" use:enhance={setelahAksi} class="mt-2 text-right">
				<input type="hidden" name="id" value={r.id} />
				<Button type="submit" size="sm" variant="ghost" class="text-red-600">Hapus</Button>
			</form>
		{/snippet}
	</ResponsiveTable>
{/if}
