<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { Pencil, Plus, Send, Trash2, UserCheck, Users, ShieldAlert } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import AlertDialog from '#lib/components/ui/alert-dialog.svelte';
	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Dialog from '#lib/components/ui/dialog.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import PasswordInput from '#lib/components/ui/password-input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import SearchInput from '#lib/components/ui/search-input.svelte';
	import Select from '#lib/components/ui/select.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { ROLE_LABEL, tgl } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type User = (typeof data.users)[number];

	let daftar = $state<User[]>([]);
	$effect(() => {
		daftar = data.users;
	});
	let tabFilter = $state<'staf' | 'customer' | 'semua'>('staf');
	let q = $state('');

	// State Modal Tambah
	let dialogTambahOpen = $state(false);
	let tambahNama = $state('');
	let tambahEmail = $state('');
	let tambahPassword = $state('');
	let tambahRole = $state('operator');
	let tambahTgId = $state('');
	let savingTambah = $state(false);

	// State Modal Edit
	let dialogEditOpen = $state(false);
	let editTarget = $state<User | null>(null);
	let editNama = $state('');
	let editEmail = $state('');
	let editRole = $state('operator');
	let editTgId = $state('');
	let editPassword = $state('');
	let savingEdit = $state(false);

	// State Hapus
	let hapusTarget = $state<User | null>(null);
	let hapusOpen = $state(false);
	let hapusLoading = $state(false);

	// Hitungan badge filter
	const stafCount = $derived(daftar.filter((u) => u.role !== 'customer').length);
	const customerCount = $derived(daftar.filter((u) => u.role === 'customer').length);

	const tampil = $derived(
		daftar
			.filter((u) => {
				if (tabFilter === 'staf') return u.role !== 'customer';
				if (tabFilter === 'customer') return u.role === 'customer';
				return true;
			})
			.filter((u) => {
				const s = q.trim().toLowerCase();
				if (!s) return true;
				return (
					u.name.toLowerCase().includes(s) ||
					u.email.toLowerCase().includes(s) ||
					(u.telegramChatId ?? '').includes(s)
				);
			})
	);

	const cols: RtColumn[] = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'email', label: 'Email' },
		{ key: 'role', label: 'Role' },
		{ key: 'telegram', label: 'Telegram ID' },
		{ key: 'verifikasi', label: 'Verifikasi' },
		{ key: 'terdaftar', label: 'Terdaftar' },
		{ key: 'aksi', label: 'Aksi', class: 'text-right' }
	];

	const roleVariant: Record<string, 'brand' | 'default' | 'outline'> = {
		owner: 'brand',
		admin: 'default',
		operator: 'outline',
		customer: 'outline'
	};

	function bukaTambah() {
		tambahNama = '';
		tambahEmail = '';
		tambahPassword = '';
		tambahRole = 'operator';
		tambahTgId = '';
		dialogTambahOpen = true;
	}

	function bukaEdit(u: User) {
		editTarget = u;
		editNama = u.name;
		editEmail = u.email;
		editRole = u.role;
		editTgId = u.telegramChatId ?? '';
		editPassword = '';
		dialogEditOpen = true;
	}

	function submitTambah() {
		savingTambah = true;
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			savingTambah = false;
			if (result.type === 'success' && result.data?.user) {
				const baru = result.data.user as User;
				daftar = [...daftar, baru];
				dialogTambahOpen = false;
				toast.success(`Akun staf ${baru.name} berhasil dibuat.`);
				await update();
			} else if (result.type === 'failure') {
				toast.error((result.data?.message as string) ?? 'Gagal membuat akun.');
			}
		};
	}

	function submitEdit() {
		savingEdit = true;
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			savingEdit = false;
			if (result.type === 'success' && result.data?.user) {
				const updated = result.data.user as User;
				daftar = daftar.map((u) => (u.id === updated.id ? updated : u));
				dialogEditOpen = false;
				toast.success(result.data?.message ?? `Akun ${updated.name} berhasil diperbarui.`);
				await update();
			} else if (result.type === 'failure') {
				toast.error((result.data?.message as string) ?? 'Gagal memperbarui akun.');
			}
		};
	}

	async function konfirmasiHapus() {
		if (!hapusTarget) return;
		hapusLoading = true;
		const snap = [...daftar];
		const target = hapusTarget;
		daftar = daftar.filter((u) => u.id !== target.id);
		hapusOpen = false;

		const fd = new FormData();
		fd.append('id', target.id);
		try {
			const res = await fetch('?/hapus', {
				method: 'POST',
				body: fd,
				headers: { 'x-sveltekit-invalidated': '01' }
			});
			const result = deserialize(await res.text()) as { type: string; data?: { message?: string } };
			if (result.type === 'failure') throw new Error(result.data?.message ?? 'Gagal menghapus.');
			if (result.type === 'error') throw new Error('Terjadi kesalahan server.');
			toast.success('Pengguna berhasil dihapus.');
		} catch (e) {
			daftar = snap; // rollback
			toast.error(e instanceof Error ? e.message : 'Gagal menghapus.');
		} finally {
			hapusLoading = false;
			hapusTarget = null;
		}
	}
</script>

<PageHeader title="Pengguna & Staf Toko" description="Kelola akun login staf, role wewenang, dan integrasi Bot Telegram.">
	<Button onclick={bukaTambah}><Plus class="h-4 w-4 mr-1.5" /> Tambah Staf Baru</Button>
</PageHeader>

<!-- Filter Tabs & Pencarian -->
<div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	<div class="flex items-center gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
		<button
			type="button"
			class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {tabFilter === 'staf' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}"
			onclick={() => (tabFilter = 'staf')}
		>
			<Users class="h-3.5 w-3.5" />
			Staf Toko
			<span class="ml-1 rounded-full bg-brand-100 px-1.5 py-0.2 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">{stafCount}</span>
		</button>

		<button
			type="button"
			class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {tabFilter === 'customer' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}"
			onclick={() => (tabFilter = 'customer')}
		>
			Pelanggan Web
			<span class="ml-1 rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">{customerCount}</span>
		</button>

		<button
			type="button"
			class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all {tabFilter === 'semua' ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'}"
			onclick={() => (tabFilter = 'semua')}
		>
			Semua ({daftar.length})
		</button>
	</div>

	<div class="w-full sm:w-72">
		<SearchInput bind:value={q} placeholder="Cari nama, email, atau ID Telegram…" />
	</div>
</div>

<ResponsiveTable columns={cols} rows={tampil} keyOf={(u) => u.id} emptyText="Tidak ada pengguna yang cocok dengan filter.">
	{#snippet cell(col, u)}
		{#if col.key === 'nama'}
			<div>
				<p class="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
					{u.name}
					{#if u.id === data.selfId}
						<span class="rounded bg-brand-50 border border-brand-200 px-1.5 py-0.2 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:border-brand-800 dark:text-brand-300">Anda</span>
					{/if}
				</p>
			</div>
		{:else if col.key === 'email'}
			<span class="text-xs text-slate-600 dark:text-slate-300">{u.email}</span>
		{:else if col.key === 'role'}
			<Badge variant={roleVariant[u.role] ?? 'default'}>
				{ROLE_LABEL[u.role] ?? u.role}
			</Badge>
		{:else if col.key === 'telegram'}
			{#if u.telegramChatId}
				<span class="inline-flex items-center gap-1 rounded-md bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-mono font-semibold text-sky-800 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-300">
					<Send class="h-3 w-3 text-sky-600" />
					{u.telegramChatId}
				</span>
			{:else}
				<span class="text-[11px] text-slate-400 italic">Belum diset</span>
			{/if}
		{:else if col.key === 'verifikasi'}
			{#if u.emailVerified}
				<Badge variant="success">Terverifikasi</Badge>
			{:else}
				<Badge variant="warning">Belum</Badge>
			{/if}
		{:else if col.key === 'terdaftar'}
			<span class="text-xs text-slate-500">{tgl(u.createdAt.toISOString())}</span>
		{:else if col.key === 'aksi'}
			<div class="flex items-center justify-end gap-1">
				<Button
					variant="ghost"
					size="icon"
					class="h-8 w-8 text-slate-600 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950"
					onclick={() => bukaEdit(u)}
					ariaLabel="Edit {u.name}"
				>
					<Pencil class="h-4 w-4" />
				</Button>

				{#if u.id !== data.selfId}
					<Button
						variant="ghost"
						size="icon"
						class="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
						onclick={() => {
							hapusTarget = u;
							hapusOpen = true;
						}}
						ariaLabel="Hapus {u.name}"
					>
						<Trash2 class="h-4 w-4" />
					</Button>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#snippet card(u)}
		<div class="flex items-start justify-between gap-2">
			<div>
				<p class="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
					{u.name}
					{#if u.id === data.selfId}
						<span class="rounded bg-brand-50 border border-brand-200 px-1 py-0.2 text-[9px] font-bold text-brand-700">Anda</span>
					{/if}
				</p>
				<p class="text-xs text-slate-500 break-all">{u.email}</p>
			</div>
			<Badge variant={roleVariant[u.role] ?? 'default'}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
		</div>

		<div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
			<div>
				{#if u.telegramChatId}
					<span class="inline-flex items-center gap-1 font-mono text-[11px] text-sky-700 dark:text-sky-400">
						<Send class="h-3 w-3" /> {u.telegramChatId}
					</span>
				{:else}
					<span class="text-[11px] text-slate-400">Telegram: -</span>
				{/if}
			</div>

			<div class="flex items-center gap-1">
				<Button variant="outline" size="sm" class="h-7 px-2 text-xs" onclick={() => bukaEdit(u)}>
					<Pencil class="h-3 w-3 mr-1" /> Edit
				</Button>
				{#if u.id !== data.selfId}
					<Button
						variant="ghost"
						size="sm"
						class="h-7 px-2 text-xs text-red-600 hover:bg-red-50"
						onclick={() => {
							hapusTarget = u;
							hapusOpen = true;
						}}
					>
						<Trash2 class="h-3 w-3" />
					</Button>
				{/if}
			</div>
		</div>
	{/snippet}
</ResponsiveTable>

<!-- MODAL TAMBAH STAF BARU -->
<Dialog bind:open={dialogTambahOpen} title="Tambah Staf Baru">
	<form method="POST" action="?/tambah" use:enhance={submitTambah} class="space-y-4">
		<div>
			<Label for="tambahNama">Nama Lengkap</Label>
			<Input id="tambahNama" name="name" bind:value={tambahNama} placeholder="Nama staf" required />
		</div>

		<div>
			<Label for="tambahEmail">Email Login</Label>
			<Input id="tambahEmail" name="email" type="email" bind:value={tambahEmail} placeholder="staf@fd.local" required />
		</div>

		<div>
			<Label for="tambahRole">Role & Hak Akses</Label>
			<Select id="tambahRole" name="role" bind:value={tambahRole}>
				<option value="operator">Operator Produksi Cetak (Khusus Workshop)</option>
				<option value="admin">Kasir / Admin Toko (POS & Finansial)</option>
				<option value="owner">Owner Toko (Akses Penuh)</option>
			</Select>
			<p class="mt-1 text-[11px] text-slate-500">
				Operator hanya bisa melihat antrean cetak workshop. Kasir/Admin memegang POS & laporan.
			</p>
		</div>

		<div>
			<Label for="tambahTgId">Telegram Chat ID (Opsional)</Label>
			<Input id="tambahTgId" name="telegramChatId" bind:value={tambahTgId} placeholder="Contoh: 88102633..." />
			<p class="mt-1 text-[11px] text-slate-400">
				Minta staf mengirim perintah <code>/id</code> ke bot Telegram toko untuk mengetahui Chat ID-nya.
			</p>
		</div>

		<div>
			<Label for="tambahPassword">Password Login Awal</Label>
			<PasswordInput id="tambahPassword" name="password" bind:value={tambahPassword} placeholder="Minimal 8 karakter" required />
		</div>

		<div class="flex justify-end gap-2 pt-2">
			<Button type="button" variant="outline" onclick={() => (dialogTambahOpen = false)}>Batal</Button>
			<Button type="submit" disabled={savingTambah}>
				{savingTambah ? 'Menyimpan…' : 'Simpan Akun Staf'}
			</Button>
		</div>
	</form>
</Dialog>

<!-- MODAL EDIT PENGGUNA & STAF -->
<Dialog bind:open={dialogEditOpen} title="Edit Pengguna / Staf">
	{#if editTarget}
		<form method="POST" action="?/update" use:enhance={submitEdit} class="space-y-4">
			<input type="hidden" name="id" value={editTarget.id} />

			<div>
				<Label for="editNama">Nama Lengkap</Label>
				<Input id="editNama" name="name" bind:value={editNama} required />
			</div>

			<div>
				<Label for="editEmail">Email Login</Label>
				<Input id="editEmail" name="email" type="email" bind:value={editEmail} required />
			</div>

			<div>
				<Label for="editRole">Role & Wewenang</Label>
				{#if editTarget.id === data.selfId}
					<input type="hidden" name="role" value="owner" />
					<div class="rounded-md bg-slate-100 p-2.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
						👑 <b>Owner Utama:</b> Role akun Anda sendiri tidak dapat diturunkan.
					</div>
				{:else}
					<Select id="editRole" name="role" bind:value={editRole}>
						<option value="operator">Operator Produksi Cetak</option>
						<option value="admin">Kasir / Admin Toko</option>
						<option value="owner">Owner Toko</option>
						<option value="customer">Pelanggan Web (Bukan Staf)</option>
					</Select>
				{/if}
			</div>

			<div class="rounded-xl border border-sky-200 bg-sky-50/60 p-3 dark:border-sky-900 dark:bg-sky-950/40 space-y-1.5">
				<Label for="editTgId" class="text-xs font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
					<Send class="h-3.5 w-3.5 text-sky-600" />
					Telegram Chat ID (Notifikasi & Menu Bot)
				</Label>
				<Input
					id="editTgId"
					name="telegramChatId"
					bind:value={editTgId}
					placeholder="Contoh: 123456789"
					class="bg-white font-mono text-xs dark:bg-slate-900"
				/>
				<p class="text-[11px] text-sky-700/80 dark:text-sky-300/80">
					Otomatis menghubungkan akun ini ke bot Telegram sesuai role-nya. Ketik <code>/id</code> di bot untuk melihat ID Telegram.
				</p>
			</div>

			<div class="border-t border-slate-100 pt-3 dark:border-slate-800">
				<Label for="editPassword">Reset Password Baru (Opsional)</Label>
				<PasswordInput
					id="editPassword"
					name="password"
					bind:value={editPassword}
					placeholder="Kosongkan jika tidak ingin mengubah password"
				/>
				<p class="mt-1 text-[11px] text-slate-400">
					Hanya isi kolom ini jika staf lupa password atau ingin mengganti password baru (minimal 8 karakter).
				</p>
			</div>

			<div class="flex justify-end gap-2 pt-2">
				<Button type="button" variant="outline" onclick={() => (dialogEditOpen = false)}>Batal</Button>
				<Button type="submit" disabled={savingEdit}>
					{savingEdit ? 'Menyimpan…' : 'Simpan Perubahan'}
				</Button>
			</div>
		</form>
	{/if}
</Dialog>

<!-- DIALOG HAPUS -->
<AlertDialog
	bind:open={hapusOpen}
	title="Hapus pengguna?"
	description="Akun {hapusTarget?.name} ({hapusTarget?.email}) akan dihapus permanen. Sesi login akan dicabut."
	confirmLabel="Hapus"
	destructive={true}
	loading={hapusLoading}
	onconfirm={konfirmasiHapus}
/>
