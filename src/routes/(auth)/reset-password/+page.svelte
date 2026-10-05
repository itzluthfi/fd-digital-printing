<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { KeyRound } from 'lucide-svelte';
	import { authClient } from '#lib/auth-client';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import PasswordInput from '#lib/components/ui/password-input.svelte';
	import Label from '#lib/components/ui/label.svelte';

	let password = $state('');
	let confirm = $state('');
	let loading = $state(false);
	const token = $derived(page.url.searchParams.get('token') ?? '');

	async function submit(e: Event) {
		e.preventDefault();
		if (password.length < 8) {
			toast.error('Password minimal 8 karakter.');
			return;
		}
		if (password !== confirm) {
			toast.error('Konfirmasi password tidak sama.');
			return;
		}
		loading = true;
		const { error } = await authClient.resetPassword({ newPassword: password, token });
		loading = false;
		if (error) {
			toast.error('Tautan tidak valid atau kedaluwarsa. Minta tautan baru.');
			return;
		}
		toast.success('Password berhasil diganti. Silakan masuk.');
		goto('/sign-in');
	}
</script>

<h1 class="text-lg font-bold text-slate-900">Password baru</h1>
<p class="mt-1 mb-5 text-sm text-slate-500">Buat password baru untuk akun Anda.</p>

{#if !token}
	<p class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
		Tautan tidak valid. <a href="/forgot-password" class="font-medium underline">Minta tautan baru</a>.
	</p>
{:else}
	<form onsubmit={submit} class="space-y-4">
		<div>
			<Label for="password">Password baru</Label>
			<PasswordInput id="password" required bind:value={password} placeholder="Minimal 8 karakter" />
		</div>
		<div>
			<Label for="confirm">Ulangi password baru</Label>
			<PasswordInput id="confirm" required bind:value={confirm} placeholder="Ulangi password" />
		</div>
		<Button type="submit" class="w-full" disabled={loading}>
			<KeyRound /> {loading ? 'Memproses…' : 'Simpan password baru'}
		</Button>
	</form>
{/if}
