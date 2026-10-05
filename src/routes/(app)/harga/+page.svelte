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
	import { getProductImageUrl } from '#lib/products';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Item = (typeof data.items)[number];
	type Draft = { name: string; category: string; imageUrl: string; unit: Item['unit']; price: number | undefined; isActive: boolean };

	const SATUAN = ['meter', 'pcs', 'lembar', 'paket'];

	let daftar = $state<Item[]>(data.items);
	let dialogOpen = $state(false);
	let mode = $state<'tambah' | 'ubah'>('tambah');
	let editId = $state<number | null>(null);
	let draft = $state<Draft>({ name: '', category: '', imageUrl: '', unit: 'pcs', price: undefined, isActive: true });
	let previewUrl = $state('');
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

	const cols = $derived<RtColumn[]>([
		{ key: 'foto', label: 'Foto', class: 'w-16 text-center' },
		{ key: 'nama', label: 'Item' },
		{ key: 'harga', label: 'Harga', class: 'text-right' },
		{ key: 'status', label: 'Status' },
		...(data.isStaff ? [{ key: 'aksi', label: 'Aksi', class: 'text-right' }] : [])
	]);

	function bukaTambah() {
		mode = 'tambah';
		editId = null;
		draft = { name: '', category: '', imageUrl: '', unit: 'pcs', price: undefined, isActive: true };
		previewUrl = '';
		dialogOpen = true;
	}

	function bukaUbah(it: Item) {
		mode = 'ubah';
		editId = it.id;
		draft = { name: it.name, category: it.category ?? '', imageUrl: it.imageUrl ?? '', unit: it.unit, price: it.price, isActive: it.isActive };
		previewUrl = it.imageUrl ? it.imageUrl : getProductImageUrl(it);
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
					imageUrl: draft.imageUrl || null,
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
					? { ...it, name: draft.name, category: draft.category || null, imageUrl: draft.imageUrl || null, unit: draft.unit, price: draft.price ?? 0, isActive: draft.isActive }
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
	{#if data.isStaff}
		<Button onclick={bukaTambah}><Plus /> Tambah item</Button>
	{/if}
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
			{#if col.key === 'foto'}
				<div class="h-11 w-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 mx-auto shadow-2xs">
					<img src={getProductImageUrl(it)} alt={it.name} class="h-full w-full object-cover" />
				</div>
			{:else if col.key === 'nama'}
				<p class="font-medium text-slate-900 dark:text-white">{it.name}</p>
				{#if it.category}<p class="text-xs text-slate-500 dark:text-slate-400">{it.category}</p>{/if}
			{:else if col.key === 'harga'}
				<p class="font-semibold text-slate-900 dark:text-white">{rupiah(it.price)}</p>
				<p class="text-xs text-slate-500 dark:text-slate-400">{data.satuanLabel[it.unit] ?? it.unit}</p>
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
			<div class="flex items-start gap-3">
				<div class="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs">
					<img src={getProductImageUrl(it)} alt={it.name} class="h-full w-full object-cover" />
				</div>
				<div class="flex-1 min-w-0">
					<div class="flex items-start justify-between gap-2">
						<p class="font-semibold text-slate-900 dark:text-white truncate">{it.name}</p>
						<Badge variant={it.isActive ? 'success' : 'default'}>{it.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
					</div>
					{#if it.category}<p class="text-xs text-slate-500 dark:text-slate-400">{it.category}</p>{/if}
					<p class="mt-1 text-sm font-bold text-[#00aeef]">{rupiah(it.price)} <span class="text-xs font-normal text-slate-500">{data.satuanLabel[it.unit] ?? it.unit}</span></p>
				</div>
			</div>
			{#if data.isStaff}
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
			{/if}
		{/snippet}
	</ResponsiveTable>
{/if}

<!-- Dialog tambah / ubah -->
<Dialog bind:open={dialogOpen} title={mode === 'tambah' ? 'Tambah Item Produk' : 'Ubah Item Produk'}>
	<form
		method="POST"
		action={mode === 'tambah' ? '?/tambah' : '?/ubah'}
		enctype="multipart/form-data"
		use:enhance={submitSimpan}
	>
		{#if mode === 'ubah'}
			<input type="hidden" name="id" value={editId} />
		{/if}
		<div class="space-y-4">
			<div>
				<Label for="nama">Nama Produk / Bahan</Label>
				<Input id="nama" name="name" bind:value={draft.name} placeholder="cth: Cetak Banner MM 280gsm" required class="mt-1 rounded-xl" />
			</div>

			<div>
				<Label for="kategori">Kategori</Label>
				<Input id="kategori" name="category" bind:value={draft.category} placeholder="cth: Banner, Stiker, Brosur (opsional)" class="mt-1 rounded-xl" />
			</div>

			<!-- Section Foto & Live Preview -->
			<div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
				<div class="flex items-center justify-between">
					<Label class="text-xs font-bold text-slate-800 dark:text-slate-200">Foto Produk & Preview</Label>
					{#if previewUrl || draft.imageUrl}
						<span class="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">✓ Foto Kustom Aktif</span>
					{:else}
						<span class="text-[11px] text-slate-400">Default Otomatis</span>
					{/if}
				</div>

				<div class="flex items-start gap-3.5">
					<!-- Kotak Preview Gambar -->
					<div class="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
						<img
							src={previewUrl || getProductImageUrl({ name: draft.name || 'Produk', imageUrl: draft.imageUrl })}
							alt="Preview Foto"
							class="h-full w-full object-cover"
						/>
					</div>

					<div class="flex-1 min-w-0 space-y-2.5">
						<div>
							<label for="imageFileInput" class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
								Unggah Foto dari Perangkat:
							</label>
							<input
								id="imageFileInput"
								type="file"
								name="imageFile"
								accept="image/*"
								onchange={(e) => {
									const file = e.currentTarget.files?.[0];
									if (file) {
										previewUrl = URL.createObjectURL(file);
									}
								}}
								class="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#00aeef] file:text-white hover:file:bg-[#0092c9] cursor-pointer"
							/>
						</div>

						<div>
							<label for="imgUrl" class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
								Atau URL / Path Gambar:
							</label>
							<Input
								id="imgUrl"
								name="imageUrl"
								bind:value={draft.imageUrl}
								oninput={() => { previewUrl = draft.imageUrl; }}
								placeholder="https://... atau /banner-avatar.png"
								class="text-xs rounded-xl h-8"
							/>
						</div>
					</div>
				</div>

				<!-- Quick Preset Buttons -->
				<div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
					<span class="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Preset Foto Toko Cepat:</span>
					<div class="flex flex-wrap gap-1.5">
						<button
							type="button"
							onclick={() => { draft.imageUrl = '/banner-avatar.png'; previewUrl = '/banner-avatar.png'; }}
							class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#00aeef] transition cursor-pointer"
						>
							Banner Avatar
						</button>
						<button
							type="button"
							onclick={() => { draft.imageUrl = '/landing-hero.jpg'; previewUrl = '/landing-hero.jpg'; }}
							class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#00aeef] transition cursor-pointer"
						>
							Mesin Cetak
						</button>
						<button
							type="button"
							onclick={() => { draft.imageUrl = '/landing-stiker.jpg'; previewUrl = '/landing-stiker.jpg'; }}
							class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#00aeef] transition cursor-pointer"
						>
							Stiker
						</button>
						<button
							type="button"
							onclick={() => { draft.imageUrl = '/landing-offset.jpg'; previewUrl = '/landing-offset.jpg'; }}
							class="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#00aeef] transition cursor-pointer"
						>
							Brosur
						</button>
						<button
							type="button"
							onclick={() => { draft.imageUrl = ''; previewUrl = ''; }}
							class="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition cursor-pointer"
						>
							Reset
						</button>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<Label for="satuan">Satuan Hitung</Label>
					<Select id="satuan" name="unit" bind:value={draft.unit} class="mt-1 rounded-xl">
						{#each SATUAN as s (s)}
							<option value={s}>{data.satuanLabel[s]}</option>
						{/each}
					</Select>
				</div>
				<div>
					<Label for="harga">Harga (Rp)</Label>
					<Input id="harga" name="price" type="number" min="0" step="500" bind:value={draft.price} placeholder="0" required class="mt-1 rounded-xl" />
				</div>
			</div>

			<label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
				<input type="checkbox" name="isActive" checked={draft.isActive} onchange={(e) => (draft.isActive = e.currentTarget.checked)} class="h-4 w-4 rounded accent-[#00aeef]" />
				<span>Tampilkan dan aktifkan di katalog & kasir</span>
			</label>

			<div class="flex justify-end gap-2 pt-2">
				<Button type="button" variant="outline" onclick={() => (dialogOpen = false)} class="rounded-xl">Batal</Button>
				<Button type="submit" class="rounded-xl bg-[#00aeef] hover:bg-[#0092c9] text-white font-bold">Simpan Produk</Button>
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
