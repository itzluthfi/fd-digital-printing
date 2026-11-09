<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { Eye, MessageSquare, Pencil, Plus, ShoppingCart, Trash2, Wallet } from 'lucide-svelte';
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
	import { cn } from '#lib/utils';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type Customer = (typeof data.customers)[number];
	type Draft = { name: string; phone: string; email: string; telegramChatId: string; notes: string };

	let daftar = $state<Customer[]>(data.customers);
	let dialogOpen = $state(false);
	let detailOpen = $state(false);
	let detailTarget = $state<Customer | null>(null);
	let mode = $state<'tambah' | 'ubah'>('tambah');
	let editId = $state<number | null>(null);
	let draft = $state<Draft>({ name: '', phone: '', email: '', telegramChatId: '', notes: '' });
	let hapusTarget = $state<Customer | null>(null);
	let hapusOpen = $state(false);
	let hapusLoading = $state(false);
	let q = $state('');
	let piutangFilter = $state<'semua' | 'ada_piutang' | 'tanpa_piutang'>('semua');

	const counts = $derived({
		semua: daftar.length,
		ada_piutang: daftar.filter((c) => c.piutang > 0).length,
		tanpa_piutang: daftar.filter((c) => c.piutang <= 0).length
	});

	const tampil = $derived(
		daftar
			.filter((c) => {
				if (piutangFilter === 'ada_piutang') return c.piutang > 0;
				if (piutangFilter === 'tanpa_piutang') return c.piutang <= 0;
				return true;
			})
			.filter((c) => {
				const s = q.trim().toLowerCase();
				if (!s) return true;
				return (
					c.name.toLowerCase().includes(s) ||
					c.phone.includes(s) ||
					(c.email ?? '').toLowerCase().includes(s) ||
					(c.notes ?? '').toLowerCase().includes(s)
				);
			})
	);

	const cols: RtColumn[] = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'telepon', label: 'Telepon & WA' },
		{ key: 'email', label: 'Email' },
		{ key: 'piutang', label: 'Piutang Aktif', class: 'text-right' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right', sortable: false }
	];

	function bukaDetail(c: Customer) {
		detailTarget = c;
		detailOpen = true;
	}

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

	function waLink(phone: string, name?: string) {
		let clean = phone.replace(/\D/g, '');
		if (clean.startsWith('0')) clean = '62' + clean.slice(1);
		const msg = name
			? `Halo Kak ${name}, kami dari FD Digital Printing ingin menginfokan terkait pesanan Anda.`
			: `Halo, kami dari FD Digital Printing.`;
		return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
	}

	/** Optimistic submit untuk tambah/ubah */
	function submitSimpan() {
		const snap = [...daftar];
		const tempId = -Date.now();

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
				daftar = snap;
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
			const res = await fetch('?/hapus', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-invalidated': '01' }
			});
			const result = deserialize(await res.text()) as { type: string; data?: { message?: string } };
			if (result.type === 'failure') throw new Error(result.data?.message ?? 'Gagal menghapus.');
			if (result.type === 'error') throw new Error('Terjadi kesalahan server.');
			toast.success('Pelanggan berhasil dihapus.');
		} catch (e) {
			daftar = snap;
			toast.error(e instanceof Error ? e.message : 'Gagal menghapus.');
		} finally {
			hapusLoading = false;
			hapusTarget = null;
		}
	}
</script>

<PageHeader title="Pelanggan">
	<Button onclick={bukaTambah} class="bg-[#00aeef] hover:bg-[#009bd6] text-white">
		<Plus class="h-4 w-4 mr-1.5" /> Tambah Pelanggan
	</Button>
</PageHeader>

<div class="mb-4 space-y-2.5">
	<SearchInput bind:value={q} placeholder="Cari nama, nomor telepon, email, atau catatan…" />

	<!-- Filter Chips -->
	<div class="flex flex-wrap items-center gap-1.5">
		<span class="mr-1 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Filter Piutang:</span>
		<button
			type="button"
			onclick={() => (piutangFilter = 'semua')}
			class={cn(
				'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
				piutangFilter === 'semua'
					? 'border-[#00aeef] bg-[#00aeef] text-white shadow-xs'
					: 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
			)}
		>
			Semua ({counts.semua})
		</button>
		<button
			type="button"
			onclick={() => (piutangFilter = 'ada_piutang')}
			class={cn(
				'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
				piutangFilter === 'ada_piutang'
					? 'border-amber-600 bg-amber-600 text-white shadow-xs'
					: 'border-slate-300 bg-white text-slate-700 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400'
			)}
		>
			⚠️ Ada Piutang Aktif ({counts.ada_piutang})
		</button>
		<button
			type="button"
			onclick={() => (piutangFilter = 'tanpa_piutang')}
			class={cn(
				'cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-colors',
				piutangFilter === 'tanpa_piutang'
					? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
					: 'border-slate-300 bg-white text-slate-700 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400'
			)}
		>
			✅ Bebas Piutang ({counts.tanpa_piutang})
		</button>
	</div>
</div>

{#if daftar.length === 0}
	<div class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center dark:border-slate-800 dark:bg-slate-900/60">
		<p class="text-sm font-medium text-slate-500 dark:text-slate-400">Belum ada pelanggan terdaftar.</p>
		<Button variant="outline" size="sm" onclick={bukaTambah}>Tambah pelanggan</Button>
	</div>
{:else}
	<ResponsiveTable columns={cols} rows={tampil} keyOf={(c) => c.id} emptyText="Tidak ada pelanggan yang cocok dengan pencarian.">
		{#snippet cell(col, c)}
			{#if col.key === 'nama'}
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="text-left font-semibold text-slate-900 hover:text-[#00aeef] dark:text-white dark:hover:text-[#00aeef] transition cursor-pointer"
						onclick={() => bukaDetail(c)}
					>
						{c.name}
					</button>
				</div>
				{#if c.notes}
					<p class="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">{c.notes}</p>
				{/if}
			{:else if col.key === 'telepon'}
				<div class="flex items-center gap-1.5">
					<span class="text-slate-800 dark:text-slate-200">{c.phone}</span>
					<a
						href={waLink(c.phone, c.name)}
						target="_blank"
						rel="noopener noreferrer"
						title="Chat WhatsApp"
						class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400 transition"
					>
						<MessageSquare class="h-3 w-3" />
					</a>
				</div>
			{:else if col.key === 'email'}
				<span class="text-slate-600 dark:text-slate-400">{c.email ?? '-'}</span>
			{:else if col.key === 'piutang'}
				{#if c.piutang > 0}
					<Badge variant="warning">{rupiah(c.piutang)}</Badge>
				{:else}
					<span class="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Lunas</span>
				{/if}
			{:else if col.key === 'aksi'}
				<div class="inline-flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onclick={() => bukaDetail(c)}
						ariaLabel="Lihat detail {c.name}"
						title="Lihat profil detail"
					>
						<Eye class="h-4 w-4 text-slate-600 dark:text-slate-300" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onclick={() => bukaUbah(c)}
						ariaLabel="Ubah {c.name}"
						title="Edit data pelanggan"
					>
						<Pencil class="h-4 w-4 text-slate-600 dark:text-slate-300" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
						onclick={() => {
							hapusTarget = c;
							hapusOpen = true;
						}}
						ariaLabel="Hapus {c.name}"
						title="Hapus pelanggan"
					>
						<Trash2 class="h-4 w-4" />
					</Button>
				</div>
			{/if}
		{/snippet}
		{#snippet card(c)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<p class="font-bold text-slate-900 dark:text-white">{c.name}</p>
					{#if c.notes}<p class="text-xs text-slate-500 dark:text-slate-400">{c.notes}</p>{/if}
				</div>
				{#if c.piutang > 0}
					<Badge variant="warning">{rupiah(c.piutang)}</Badge>
				{:else}
					<span class="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Lunas</span>
				{/if}
			</div>
			<div class="mt-2 space-y-1 text-sm">
				<div class="flex items-center justify-between">
					<p><span class="text-slate-500 dark:text-slate-400">Telepon: </span><span class="font-medium text-slate-800 dark:text-slate-200">{c.phone}</span></p>
					<a
						href={waLink(c.phone, c.name)}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold"
					>
						<MessageSquare class="h-3 w-3" /> WA
					</a>
				</div>
				{#if c.email}<p><span class="text-slate-500 dark:text-slate-400">Email: </span><span class="text-slate-700 dark:text-slate-300">{c.email}</span></p>{/if}
			</div>
			<div class="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
				<Button variant="outline" size="sm" onclick={() => bukaDetail(c)}>
					<Eye class="h-3.5 w-3.5 mr-1" /> Detail
				</Button>
				<Button variant="outline" size="sm" onclick={() => bukaUbah(c)}>
					<Pencil class="h-3.5 w-3.5 mr-1" /> Ubah
				</Button>
				<Button
					variant="ghost"
					size="sm"
					class="text-red-500 hover:text-red-700"
					onclick={() => {
						hapusTarget = c;
						hapusOpen = true;
					}}
				>
					<Trash2 class="h-3.5 w-3.5 mr-1" /> Hapus
				</Button>
			</div>
		{/snippet}
	</ResponsiveTable>
{/if}

<!-- Dialog Detail Pelanggan -->
{#if detailTarget}
	<Dialog bind:open={detailOpen} title="Profil Detail Pelanggan">
		<div class="space-y-4">
			<div class="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
				<p class="text-lg font-bold text-slate-900 dark:text-white">{detailTarget.name}</p>
				<div class="mt-2 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Nomor Telepon:</span>
						<span class="font-medium">{detailTarget.phone}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Email:</span>
						<span>{detailTarget.email ?? '-'}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-500">Telegram Chat ID:</span>
						<span>{detailTarget.telegramChatId ?? '-'}</span>
					</div>
					<div class="flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-800">
						<span class="text-slate-500">Tunggakan Piutang:</span>
						{#if detailTarget.piutang > 0}
							<strong class="font-bold text-amber-600 dark:text-amber-400">{rupiah(detailTarget.piutang)}</strong>
						{:else}
							<span class="font-bold text-emerald-600 dark:text-emerald-400">Tidak ada piutang</span>
						{/if}
					</div>
				</div>
			</div>

			{#if detailTarget.notes}
				<div>
					<p class="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Catatan Khusus</p>
					<p class="mt-1 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
						{detailTarget.notes}
					</p>
				</div>
			{/if}

			<div class="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
				<a
					href={waLink(detailTarget.phone, detailTarget.name)}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 text-xs font-semibold text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400 transition"
				>
					<MessageSquare class="h-3.5 w-3.5" /> Chat WhatsApp
				</a>
				<Button
					type="button"
					variant="outline"
					onclick={() => {
						detailOpen = false;
						bukaUbah(detailTarget!);
					}}
				>
					<Pencil class="h-3.5 w-3.5 mr-1" /> Edit Data
				</Button>
				<Button type="button" onclick={() => (detailOpen = false)}>
					Tutup
				</Button>
			</div>
		</div>
	</Dialog>
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
				<Input id="email" name="email" type="email" bind:value={draft.email} placeholder="nama@email.com" />
			</div>
			<div>
				<Label for="telegram">ID chat Telegram</Label>
				<Input id="telegram" name="telegramChatId" bind:value={draft.telegramChatId} placeholder="Chat ID Telegram" />
			</div>
			<div>
				<Label for="catatan">Catatan</Label>
				<Textarea id="catatan" name="notes" bind:value={draft.notes} rows={2} />
			</div>
			<div class="flex justify-end gap-2 pt-2">
				<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>Batal</Button>
				<Button type="submit" class="bg-[#00aeef] hover:bg-[#009bd6] text-white">Simpan</Button>
			</div>
		</div>
	</form>
</Dialog>

<!-- Konfirmasi hapus -->
{#if hapusTarget}
	<AlertDialog
		bind:open={hapusOpen}
		title="Hapus pelanggan?"
		description={`Pelanggan "${hapusTarget.name}" akan dihapus permanen.${hapusTarget.piutang > 0 ? ` PERINGATAN: Pelanggan ini masih memiliki sisa piutang sebesar ${rupiah(hapusTarget.piutang)}.` : ''} Tindakan ini tidak dapat dibatalkan.`}
		confirmLabel="Ya, Hapus"
		destructive
		loading={hapusLoading}
		onconfirm={konfirmasiHapus}
		oncancel={() => {
			hapusOpen = false;
			hapusTarget = null;
		}}
	/>
{/if}
