<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { Plus, Trash2 } from 'lucide-svelte';
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

	let daftar = $state<User[]>(data.users);
	let dialogOpen = $state(false);
	let nama = $state('');
	let email = $state('');
	let password = $state('');
	let role = $state('operator');
	let saving = $state(false);
	let hapusTarget = $state<User | null>(null);
	let hapusOpen = $state(false);
	let hapusLoading = $state(false);
	let q = $state('');

	const tampil = $derived(
		daftar.filter((u) => {
			const s = q.trim().toLowerCase();
			if (!s) return true;
			return u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
		})
	);

	const cols: RtColumn[] = [
		{ key: 'nama', label: 'Nama' },
		{ key: 'email', label: 'Email' },
		{ key: 'role', label: 'Role' },
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
		nama = '';
		email = '';
		password = '';
		role = 'operator';
		dialogOpen = true;
	}

	/** Optimistic: tampilkan baris baru langsung, ganti dengan data server saat sukses. */
	function submitTambah() {
		const tempId = 'temp-' + Date.now();
		const optimistic: User = {
			id: tempId,
			name: nama,
			email,
			role: role as User['role'],
			emailVerified: true,
			createdAt: new Date()
		};
		daftar = [...daftar, optimistic];
		dialogOpen = false;
		saving = true;

		return async ({ result }: { result: any }) => {
			saving = false;
			if (result.type === 'success' && result.data?.user) {
				const saved = result.data.user as User;
				daftar = daftar.map((u) => (u.id === tempId ? saved : u));
				toast.success(`Akun ${saved.name} dibuat.`);
			} else if (result.type === 'failure') {
				daftar = daftar.filter((u) => u.id !== tempId); // rollback
				toast.error((result.data?.message as string) ?? 'Gagal membuat akun.');
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
			toast.success('Pengguna dihapus.');
		} catch (e) {
			daftar = snap; // rollback
			toast.error(e instanceof Error ? e.message : 'Gagal menghapus.');
		} finally {
			hapusLoading = false;
			hapusTarget = null;
		}
	}
</script>

<PageHeader title="Pengguna" description="Kelola akun staff toko.">
	<Button onclick={bukaTambah}><Plus /> Tambah staff</Button>
</PageHeader>

<ResponsiveTable columns={cols} rows={daftar} keyOf={(u) => u.id} emptyText="Belum ada pengguna.">
		{#snippet cell(col, u)}
			{#if col.key === 'nama'}
				<p class="font-medium text-slate-900">{u.name}</p>
				{#if u.id === data.selfId}<p class="text-xs text-slate-400">Ini Anda</p>{/if}
			{:else if col.key === 'email'}
				<span class="text-slate-500">{u.email}</span>
			{:else if col.key === 'role'}
				<Badge variant={roleVariant[u.role] ?? 'default'}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
			{:else if col.key === 'verifikasi'}
				{#if u.emailVerified}
					<Badge variant="success">Terverifikasi</Badge>
				{:else}
					<Badge variant="warning">Belum</Badge>
				{/if}
			{:else if col.key === 'terdaftar'}
				<span class="text-slate-500">{tgl(u.createdAt.toISOString())}</span>
			{:else if col.key === 'aksi'}
				{#if u.id !== data.selfId}
					<Button
						variant="ghost"
						size="icon"
						class="text-red-600 hover:text-red-700"
						onclick={() => {
							hapusTarget = u;
							hapusOpen = true;
						}}
						ariaLabel="Hapus {u.name}"
					>
						<Trash2 />
					</Button>
				{/if}
			{/if}
		{/snippet}
		{#snippet card(u)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<p class="font-semibold text-slate-900">{u.name}</p>
					{#if u.id === data.selfId}<p class="text-xs text-slate-400">Ini Anda</p>{/if}
				</div>
				<Badge variant={roleVariant[u.role] ?? 'default'}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
			</div>
			<div class="mt-2 space-y-1 text-sm">
				<p class="break-all text-slate-500">{u.email}</p>
				<p>
					{#if u.emailVerified}
						<Badge variant="success">Terverifikasi</Badge>
					{:else}
						<Badge variant="warning">Belum verifikasi</Badge>
					{/if}
					<span class="ml-2 text-xs text-slate-400">Terdaftar {tgl(u.createdAt.toISOString())}</span>
				</p>
			</div>
			{#if u.id !== data.selfId}
				<Button
					variant="outline"
					class="mt-3 min-h-10 w-full text-red-600 hover:text-red-700"
					onclick={() => {
						hapusTarget = u;
						hapusOpen = true;
					}}
				>
					<Trash2 class="h-4 w-4" /> Hapus pengguna
				</Button>
			{/if}
		{/snippet}
	</ResponsiveTable>

<Dialog bind:open={dialogOpen} title="Tambah staff" description="Akun langsung aktif setelah dibuat.">
	<form method="POST" action="?/tambah" use:enhance={submitTambah}>
		<div class="space-y-4">
			<div>
				<Label for="nama">Nama</Label>
				<Input id="nama" name="name" bind:value={nama} required />
			</div>
			<div>
				<Label for="email">Email</Label>
				<Input id="email" name="email" type="email" bind:value={email} required />
			</div>
			<div>
				<Label for="password">Password</Label>
				<PasswordInput id="password" name="password" bind:value={password} minlength={8} required />
				<p class="mt-1 text-xs text-slate-400">Minimal 8 karakter.</p>
			</div>
			<div>
				<Label for="role">Role</Label>
				<Select id="role" name="role" bind:value={role}>
					<option value="owner">Owner</option>
					<option value="admin">Admin</option>
					<option value="operator">Operator</option>
				</Select>
			</div>
			<div class="flex justify-end gap-2">
				<Button type="button" variant="outline" onclick={() => (dialogOpen = false)}>Batal</Button>
				<Button type="submit" disabled={saving}>{saving ? 'Menyimpan…' : 'Buat akun'}</Button>
			</div>
		</div>
	</form>
</Dialog>

<AlertDialog
	bind:open={hapusOpen}
	title="Hapus pengguna?"
	description="Akun {hapusTarget?.name ?? ''} ({hapusTarget?.email ?? ''}) akan dihapus permanen beserta sesinya."
	confirmLabel="Ya, hapus"
	destructive
	loading={hapusLoading}
	onconfirm={konfirmasiHapus}
/>
