<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { UserPlus } from 'lucide-svelte';
	import { authClient } from '#lib/auth-client';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import PasswordInput from '#lib/components/ui/password-input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import GoogleLoginButton from '#lib/components/GoogleLoginButton.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		if (password.length < 8) {
			toast.error('Password minimal 8 karakter.');
			return;
		}
		loading = true;
		const { error } = await authClient.signUp.email({ name, email, password });
		loading = false;
		if (error) {
			toast.error('Pendaftaran gagal. Email mungkin sudah terdaftar.');
			return;
		}
		toast.success('Akun dibuat. Cek email untuk verifikasi.');
		goto('/verify-email');
	}
</script>

<h1 class="text-lg font-bold text-slate-900">Daftar akun pelanggan</h1>
<p class="mt-1 mb-5 text-sm text-slate-500">Untuk melihat riwayat order dan piutang Anda.</p>

<form onsubmit={submit} class="space-y-4">
	<div>
		<Label for="name">Nama lengkap</Label>
		<Input id="name" required bind:value={name} placeholder="Nama Anda" />
	</div>
	<div>
		<Label for="email">Email</Label>
		<Input id="email" type="email" required bind:value={email} placeholder="nama@contoh.id" />
	</div>
	<div>
		<Label for="password">Password</Label>
		<PasswordInput id="password" required bind:value={password} placeholder="Minimal 8 karakter" />
	</div>
	<Button type="submit" class="w-full" disabled={loading}>
		<UserPlus /> {loading ? 'Memproses…' : 'Daftar'}
	</Button>

	<div class="relative my-4 flex items-center justify-center">
		<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
		<span class="relative bg-white px-3 text-xs text-slate-400">atau</span>
	</div>

	<GoogleLoginButton label="Daftar dengan Google" />
</form>

<p class="mt-5 text-center text-sm">
	Sudah punya akun? <a href="/sign-in" class="font-medium text-brand-700 hover:underline">Masuk</a>
</p>
