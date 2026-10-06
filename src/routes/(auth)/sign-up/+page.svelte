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
		if (!name.trim()) {
			toast.error('Silakan isi nama lengkap terlebih dahulu.');
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('dipi:auth-invalid', {
						detail: { field: 'name', isSignUp: true }
					})
				);
			}
			document.getElementById('name')?.focus();
			return;
		}

		if (!email.trim()) {
			toast.error('Silakan isi alamat email terlebih dahulu.');
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('dipi:auth-invalid', {
						detail: { field: 'email', isSignUp: true }
					})
				);
			}
			document.getElementById('email')?.focus();
			return;
		}

		if (!password || password.length < 8) {
			toast.error('Password minimal 8 karakter.');
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('dipi:auth-invalid', {
						detail: { field: 'password', isSignUp: true }
					})
				);
			}
			document.getElementById('password')?.focus();
			return;
		}

		loading = true;
		const { error } = await authClient.signUp.email({ name, email, password });
		loading = false;
		if (error) {
			toast.error('Pendaftaran gagal. Email mungkin sudah terdaftar.');
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('dipi:auth-failed', {
						detail: { reason: 'register', message: error.message }
					})
				);
			}
			return;
		}
		toast.success('Akun dibuat. Cek email untuk verifikasi.');
		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('dipi:auth-success', {
					detail: { type: 'register' }
				})
			);
		}
		goto('/verify-email');
	}
</script>

<!-- Tab Navigasi Masuk / Daftar -->
<div class="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-4 border border-slate-200/60 dark:border-slate-700/60">
	<a href="/sign-in" class="flex-1 py-1.5 text-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
		Masuk Akun
	</a>
	<span class="flex-1 py-1.5 text-center text-xs font-bold rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs">
		Daftar Baru
	</span>
</div>

<form onsubmit={submit} class="space-y-3" novalidate>
	<div>
		<Label for="name" class="text-xs">Nama Lengkap</Label>
		<Input id="name" required bind:value={name} placeholder="Nama Anda" class="rounded-xl mt-1 h-9 text-xs" />
	</div>
	<div>
		<Label for="email" class="text-xs">Alamat Email</Label>
		<Input id="email" type="email" required bind:value={email} placeholder="nama@contoh.id" class="rounded-xl mt-1 h-9 text-xs" />
	</div>
	<div>
		<Label for="password" class="text-xs">Password</Label>
		<PasswordInput id="password" required bind:value={password} placeholder="Minimal 8 karakter" class="rounded-xl mt-1 h-9 text-xs" />
	</div>
	<Button type="submit" class="w-full font-bold rounded-xl bg-[#00aeef] hover:bg-[#0092c9] text-white py-2 text-xs shadow-sm active:scale-98 transition cursor-pointer" disabled={loading}>
		<UserPlus class="h-3.5 w-3.5 mr-1.5" /> {loading ? 'Memproses…' : 'Daftar Akun Sekarang'}
	</Button>

	<div class="relative my-2.5 flex items-center justify-center">
		<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
		<span class="relative bg-white dark:bg-slate-900 px-2.5 text-[11px] text-slate-400">atau</span>
	</div>

	<GoogleLoginButton label="Daftar dengan Google" />
</form>
