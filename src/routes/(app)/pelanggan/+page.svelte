<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { Pencil, Plus, Trash2 } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import AlertDialog from '#lib/components/ui/alert-dialog.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Dialog from '#lib/components/ui/dialog.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import SearchInput from '#lib/components/ui/search-input.svelte';
	import Textarea from '#lib/components/ui/textarea.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { rupiah } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Customer = (typeof data.customers)[number];
	type Draft = { name: string; phone: string; email: string; telegramChatId: string; notes: string };

	let daftar = $state<Customer[]>(data.customers);
	let dialogOpen = $state(false);
	let mode = $state<'tambah' | 'ubah'>('tambah');
	let editId = $state<number | null>(null);
	let draft = $state<Draft>({ name: '', phone: '', email: '', telegramChatId: '', notes: '' });
	let hapusTarget = $state<Customer | null>(null);
	let hapusOpen = $state(false);
	let hapusLoading = $state(false);
	let q = $state('');

	const tampil = $derived(
		daftar.filter((c) => {
			const s = q.trim().toLowerCase();
			if (!s) return true;
			return (
				c.name.toLowerCase().includes(s) ||
				c.phone.includes(s) ||
				(c.email ?? '').toLowerCase().includes(s)
			);
		})
	);

	const cols: RtColumn[] = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'telepon', label: 'Telepon' },
		{ key: 'email', label: 'Email' },
		{ key: 'piutang', label: 'Piutang aktif', class: 'text-right' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right' }
	];

	function bukaTambah() {
		mode = 'tambah';
		editId = null;
		draft = { name: '', phone: '', email: '', telegramChatId: '', notes: '' };
		dialogOpen = true;
	}

	function bukaUbah(c: Customer) {
		mode = 'ubah';
		editId = c.id;
		draft = {
			name: c.name,
			phone: c.phone,
			email: c.email ?? '',
			telegramChatId: c.telegramChatId ?? '',
			notes: c.notes ?? ''
		};
		dialogOpen = true;
	}

	/** Optimistic submit untuk tambah/ubah: terapkan lokal dulu, rollback bila gagal. */
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
					phone: draft.phone,
					email: draft.email || null,
					telegramChatId: draft.telegramChatId || null,
					notes: draft.notes || null,
					piutang: 0
				}
			];
		} else if (editId !== null) {
			daftar = daftar.map((c) =>
				c.id === editId
					? {
							...c,
							name: draft.name,
							phone: draft.phone,
							email: draft.email || null,
							telegramChatId: draft.telegramChatId || null,
							notes: draft.notes || null
						}
					: c
			);
		}
		dialogOpen = false;

		return async ({ result }: { result: any }) => {
			if (result.type === 'success' && result.data?.customer) {
				const saved = result.data.customer as Customer;
				if (mode === 'tambah') {
					daftar = daftar.map((c) => (c.id === tempId ? { ...saved, piutang: 0 } : c));
				} else {
					daftar = daftar.map((c) => (c.id === saved.id ? { ...saved, piutang: c.piutang } : c));
				}
				toast.success(mode === 'tambah' ? 'Pelanggan ditambahkan.' : 'Pelanggan diperbarui.');
			} else if (result.type === 'failure') {
				daftar = snap; // rollback
				toast.error((result.data?.message as string) ?? 'Gagal menyimpan.');
			}
		};
	}

	async function konfirmasiHapus() {
		if (!hapusTarget) return;
		hapusLoading = true;
		const snap = [...daftar];
		const target = hapusTarget;
		daftar = daftar.filter((c) => c.id !== target.id);
		hapusOpen = false;

		const fd = new FormData();
		fd.append('id', String(target.id));
		try {
			// Panggil action SvelteKit seperti yang dilakukan use:enhance
			const res = await fetch('?/hapus', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-invalidated': '01' }
			});
			const result = deserialize(await res.text()) as { type: string; data?: { message?: string } };
			if (result.type === 'failure') throw new Error(result.data?.message ?? 'Gagal menghapus.');
			if (result.type === 'error') throw new Error('Terjadi kesalahan server.');
			toast.success('Pelanggan dihapus.');
		} catch (e) {
			daftar = snap; // rollback
			toast.error(e instanceof Error ? e.message : 'Gagal menghapus.');
		} finally {
			hapusLoading = false;
			hapusTarget = null;
		}
	}
</script>

<PageHeader title="Pelanggan" description="{daftar.length} pelanggan terdaftar.">
	<Button onclick={bukaTambah}><Plus /> Tambah pelanggan</Button>
</PageHeader>

<div class="mb-4">
	<SearchInput bind:value={q} placeholder="Cari nama, telepon, atau email…" />
</div>

{#if daftar.length === 0}
	<div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white py-10 text-center">
		<p class="text-sm text-slate-500">Belum ada pelanggan.</p>
		<Button variant="outline" size="sm" onclick={bukaTambah}>Tambah pelanggan</Button>
	</div>
{:else}
	<ResponsiveTable columns={cols} rows={tampil} keyOf={(c) => c.id} emptyText="Tidak ada pelanggan yang cocok.">
		{#snippet cell(col, c)}
			{#if col.key === 'nama'}
				<p class="font-medium text-slate-900">{c.name}</p>
				{#if c.notes}<p class="text-xs text-slate-500">{c.notes}</p>{/if}
			{:else if col.key === 'telepon'}
				{c.phone}
			{:else if col.key === 'email'}
				<span class="text-slate-500">{c.email ?? '-'}</span>
			{:else if col.key === 'piutang'}
				{#if c.piutang > 0}
					<Badge variant="warning">{rupiah(c.piutang)}</Badge>
				{:else}
					<span class="text-slate-400">-</span>
				{/if}
			{:else if col.key === 'aksi'}
				<div class="inline-flex gap-1">
					<Button variant="ghost" size="icon" onclick={() => bukaUbah(c)} ariaLabel="Ubah {c.name}">
						<Pencil />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class="text-red-600 hover:text-red-700"
						onclick={() => {
							hapusTarget = c;
							hapusOpen = true;
						}}
						ariaLabel="Hapus {c.name}"
					>
						<Trash2 />
					</Button>
				</div>
			{/if}
		{/snippet}
		{#snippet card(c)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<p class="font-semibold text-slate-900">{c.name}</p>
					{#if c.notes}<p class="text-xs text-slate-500">{c.notes}</p>{/if}
				</div>
				{#if c.piutang > 0}
					<Badge variant="warning">{rupiah(c.piutang)}</Badge>
				{/if}
			</div>
			<div class="mt-2 space-y-1 text-sm">
				<p><span class="text-slate-400">Telepon: </span><a href="tel:{c.phone}" class="font-medium text-brand-700">{c.phone}</a></p>
				{#if c.email}<p><span class="text-slate-400">Email: </span><span class="text-slate-700">{c.email}</span></p>{/if}
			</div>
			<div class="mt-3 grid grid-cols-2 gap-2">
				<Button variant="outline" class="min-h-10" onclick={() => bukaUbah(c)}>
					<Pencil class="h-4 w-4" /> Ubah
				</Button>
				<Button
					variant="outline"
					class="min-h-10 text-red-600 hover:text-red-700"
					onclick={() => {
						hapusTarget = c;
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
<Dialog bind:open={dialogOpen} title={mode === 'tambah' ? 'Tambah pelanggan' : 'Ubah pelanggan'}>
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
				<Label for="nama">Nama</Label>
				<Input id="nama" name="name" bind:value={draft.name} required />
			</div>
			<div>
				<Label for="telepon">Telepon</Label>
				<Input id="telepon" name="phone" bind:value={draft.phone} required />
			</div>
			<div>
				<Label for="email">Email</Label>
				<Input id="email" name="email" type="email" bind:value={draft.email} placeholder="Untuk kirim invoice" />
			</div>
			<div>
				<Label for="telegram">ID chat Telegram</Label>
				<Input id="telegram" name="telegramChatId" bind:value={draft.telegramChatId} placeholder="Opsional" />
			</div>
			<div>
				<Label for="catatan">Catatan</Label>
				<Textarea id="catatan" name="notes" bind:value={draft.notes} rows={2} />
			</div>
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
	title="Hapus pelanggan?"
	description="Pelanggan {hapusTarget?.name ?? ''} akan dihapus permanen. Tidak bisa dibatalkan."
	confirmLabel="Ya, hapus"
	destructive
	loading={hapusLoading}
	onconfirm={konfirmasiHapus}
/>
