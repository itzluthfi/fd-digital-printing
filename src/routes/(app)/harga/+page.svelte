<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { Pencil, Plus, Power, Trash2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import AlertDialog from '#lib/components/ui/alert-dialog.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Dialog from '#lib/components/ui/dialog.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import SearchInput from '#lib/components/ui/search-input.svelte';
	import Select from '#lib/components/ui/select.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { rupiah } from '#lib/format';
	import { cn } from '#lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Item = (typeof data.items)[number];
	type Draft = { name: string; category: string; unit: Item['unit']; price: number | undefined; isActive: boolean };

	const SATUAN = ['meter', 'pcs', 'lembar', 'paket'];

	let daftar = $state<Item[]>(data.items);
	let dialogOpen = $state(false);
	let mode = $state<'tambah' | 'ubah'>('tambah');
	let editId = $state<number | null>(null);
	let draft = $state<Draft>({ name: '', category: '', unit: 'pcs', price: undefined, isActive: true });
	let hapusTarget = $state<Item | null>(null);
	let hapusOpen = $state(false);
	let hapusLoading = $state(false);
	let q = $state('');

	const tampil = $derived(
		daftar.filter((it) => {
			const s = q.trim().toLowerCase();
			if (!s) return true;
			return it.name.toLowerCase().includes(s) || (it.category ?? '').toLowerCase().includes(s);
		})
	);

	const cols: RtColumn[] = [
		{ key: 'nama', label: 'Item' },
		{ key: 'harga', label: 'Harga', class: 'text-right' },
		{ key: 'status', label: 'Status' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right' }
	];

	function bukaTambah() {
		mode = 'tambah';
		editId = null;
		draft = { name: '', category: '', unit: 'pcs', price: undefined, isActive: true };
		dialogOpen = true;
	}

	function bukaUbah(it: Item) {
		mode = 'ubah';
		editId = it.id;
		draft = { name: it.name, category: it.category ?? '', unit: it.unit, price: it.price, isActive: it.isActive };
		dialogOpen = true;
	}

	/** Optimistic submit tambah/ubah: terapkan lokal dulu, rollback bila gagal. */
	function submitSimpan() {
		const snap = [...daftar];
		const tempId = -Date.now();
		const aksi = mode === 'tambah' ? '?/tambah' : '?/ubah';

		if (mode === 'tambah') {
			daftar = [
				...daftar,
				{
					id: tempId,
					name: draft.name,
					category: draft.category || null,
					unit: draft.unit,
					price: draft.price ?? 0,
					isActive: draft.isActive,
					sortOrder: 0,
					createdAt: new Date().toISOString()
				}
			];
		} else if (editId !== null) {
			daftar = daftar.map((it) =>
				it.id === editId
					? { ...it, name: draft.name, category: draft.category || null, unit: draft.unit, price: draft.price ?? 0, isActive: draft.isActive }
					: it
			);
		}
		dialogOpen = false;

		return async ({ result }: { result: any }) => {
			if (result.type === 'success' && result.data?.item) {
				const saved = result.data.item as Item;
				if (mode === 'tambah') {
					daftar = daftar.map((it) => (it.id === tempId ? saved : it));
				} else {
					daftar = daftar.map((it) => (it.id === saved.id ? saved : it));
				}
				toast.success(mode === 'tambah' ? 'Item ditambahkan.' : 'Item diperbarui.');
			} else if (result.type === 'failure') {
				daftar = snap; // rollback
				toast.error((result.data?.message as string) ?? 'Gagal menyimpan.');
			}
		};
	}

	async function toggleAktif(it: Item) {
		const snap = [...daftar];
		daftar = daftar.map((x) => (x.id === it.id ? { ...x, isActive: !x.isActive } : x));
		const fd = new FormData();
		fd.append('id', String(it.id));
		try {
			const res = await fetch('?/toggle', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-invalidated': '01' }
			});
			const result = deserialize(await res.text()) as { type: string; data?: { message?: string; item?: Item } };
			if (result.type === 'failure') throw new Error(result.data?.message ?? 'Gagal.');
			if (result.data?.item) daftar = daftar.map((x) => (x.id === it.id ? result.data!.item! : x));
			toast.success(it.isActive ? 'Item dinonaktifkan.' : 'Item diaktifkan.');
		} catch (e) {
			daftar = snap;
			toast.error(e instanceof Error ? e.message : 'Gagal mengubah status.');
		}
	}

	async function konfirmasiHapus() {
		if (!hapusTarget) return;
		hapusLoading = true;
		const snap = [...daftar];
		const target = hapusTarget;
		daftar = daftar.filter((it) => it.id !== target.id);
		hapusOpen = false;

		const fd = new FormData();
		fd.append('id', String(target.id));
		try {
			const res = await fetch('?/hapus', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-invalidated': '01' }
			});
			const result = deserialize(await res.text()) as { type: string; data?: { message?: string } };
			if (result.type === 'failure') throw new Error(result.data?.message ?? 'Gagal menghapus.');
			if (result.type === 'error') throw new Error('Terjadi kesalahan server.');
			toast.success('Item dihapus.');
		} catch (e) {
			daftar = snap; // rollback
			toast.error(e instanceof Error ? e.message : 'Gagal menghapus.');
		} finally {
			hapusLoading = false;
			hapusTarget = null;
		}
	}
</script>

<PageHeader title="Katalog Harga" description="{daftar.length} item — dipakai untuk hitung otomatis di kasir.">
	<Button onclick={bukaTambah}><Plus /> Tambah item</Button>
</PageHeader>

<div class="mb-4">
	<SearchInput bind:value={q} placeholder="Cari nama item atau kategori…" />
</div>

{#if daftar.length === 0}
	<div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white py-10 text-center">
		<p class="text-sm text-slate-500">Belum ada item harga.</p>
		<Button variant="outline" size="sm" onclick={bukaTambah}>Tambah item pertama</Button>
	</div>
{:else}
	<ResponsiveTable columns={cols} rows={tampil} keyOf={(it) => it.id} emptyText="Tidak ada item yang cocok.">
		{#snippet cell(col, it)}
			{#if col.key === 'nama'}
				<p class="font-medium text-slate-900">{it.name}</p>
				{#if it.category}<p class="text-xs text-slate-500">{it.category}</p>{/if}
			{:else if col.key === 'harga'}
				<p class="font-semibold">{rupiah(it.price)}</p>
				<p class="text-xs text-slate-500">{data.satuanLabel[it.unit] ?? it.unit}</p>
			{:else if col.key === 'status'}
				<Badge variant={it.isActive ? 'success' : 'default'}>{it.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
			{:else if col.key === 'aksi'}
				<div class="inline-flex gap-1">
					<Button variant="ghost" size="icon" onclick={() => toggleAktif(it)} ariaLabel={it.isActive ? `Nonaktifkan ${it.name}` : `Aktifkan ${it.name}`}>
						<Power class={cn(!it.isActive && 'text-slate-400')} />
					</Button>
					<Button variant="ghost" size="icon" onclick={() => bukaUbah(it)} ariaLabel="Ubah {it.name}">
						<Pencil />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class="text-red-600 hover:text-red-700"
						onclick={() => {
							hapusTarget = it;
							hapusOpen = true;
						}}
						ariaLabel="Hapus {it.name}"
					>
						<Trash2 />
					</Button>
				</div>
			{/if}
		{/snippet}
		{#snippet card(it)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<p class="font-semibold text-slate-900">{it.name}</p>
					{#if it.category}<p class="text-xs text-slate-500">{it.category}</p>{/if}
				</div>
				<Badge variant={it.isActive ? 'success' : 'default'}>{it.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
			</div>
			<p class="mt-2 text-sm"><span class="font-semibold">{rupiah(it.price)}</span> <span class="text-slate-500">{data.satuanLabel[it.unit] ?? it.unit}</span></p>
			<div class="mt-3 grid grid-cols-3 gap-2">
				<Button variant="outline" class="min-h-10" onclick={() => toggleAktif(it)}>
					<Power class="h-4 w-4" /> {it.isActive ? 'Off' : 'On'}
				</Button>
				<Button variant="outline" class="min-h-10" onclick={() => bukaUbah(it)}>
					<Pencil class="h-4 w-4" /> Ubah
				</Button>
				<Button
					variant="outline"
					class="min-h-10 text-red-600 hover:text-red-700"
					onclick={() => {
						hapusTarget = it;
						hapusOpen = true;
					}}
				>
					<Trash2 class="h-4 w-4" /> Hapus
				</Button>
			</div>
		{/snippet}
	</ResponsiveTable>
{/if}

<!-- Dialog tambah / ubah -->
<Dialog bind:open={dialogOpen} title={mode === 'tambah' ? 'Tambah item harga' : 'Ubah item harga'}>
	<form
		method="POST"
		action={mode === 'tambah' ? '?/tambah' : '?/ubah'}
		use:enhance={submitSimpan}
	>
		{#if mode === 'ubah'}
			<input type="hidden" name="id" value={editId} />
		{/if}
		<div class="space-y-4">
			<div>
				<Label for="nama">Nama item</Label>
				<Input id="nama" name="name" bind:value={draft.name} placeholder="cth: Cetak banner MM" required />
			</div>
			<div>
				<Label for="kategori">Kategori</Label>
				<Input id="kategori" name="category" bind:value={draft.category} placeholder="cth: Banner, Stiker (opsional)" />
			</div>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="satuan">Satuan</Label>
					<Select id="satuan" name="unit" bind:value={draft.unit}>
						{#each SATUAN as s (s)}
							<option value={s}>{data.satuanLabel[s]}</option>
						{/each}
					</Select>
				</div>
				<div>
					<Label for="harga">Harga (Rp)</Label>
					<Input id="harga" name="price" type="number" min="0" step="500" bind:value={draft.price} placeholder="0" required />
				</div>
			</div>
			<label class="flex items-center gap-2 text-sm text-slate-700">
				<input type="checkbox" name="isActive" checked={draft.isActive} onchange={(e) => (draft.isActive = e.currentTarget.checked)} class="h-4 w-4 rounded" />
				Tampilkan di kasir
			</label>
			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>Batal</Button>
				<Button type="submit">Simpan</Button>
			</div>
		</div>
	</form>
</Dialog>

<!-- Konfirmasi hapus -->
<AlertDialog
	bind:open={hapusOpen}
	title="Hapus item?"
	description="Item {hapusTarget?.name ?? ''} akan dihapus permanen. Tidak bisa dibatalkan."
	confirmLabel="Ya, hapus"
	destructive
	loading={hapusLoading}
	onconfirm={konfirmasiHapus}
/>
