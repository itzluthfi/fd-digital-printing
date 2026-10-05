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

<!-- Tab Navigasi Masuk / Daftar -->
<div class="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-6 border border-slate-200/60 dark:border-slate-700/60">
	<a href="/sign-in" class="flex-1 py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
		Masuk Akun
	</a>
	<span class="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs">
		Daftar Baru
	</span>
</div>

<h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Buat Akun Pelanggan</h1>
<p class="mt-1 mb-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400">Pantau riwayat cetakan, nota, & status pengerjaan.</p>

<form onsubmit={submit} class="space-y-4">
	<div>
		<Label for="name">Nama Lengkap</Label>
		<Input id="name" required bind:value={name} placeholder="Nama Anda" class="rounded-xl mt-1.5" />
	</div>
	<div>
		<Label for="email">Alamat Email</Label>
		<Input id="email" type="email" required bind:value={email} placeholder="nama@contoh.id" class="rounded-xl mt-1.5" />
	</div>
	<div>
		<Label for="password">Password</Label>
		<PasswordInput id="password" required bind:value={password} placeholder="Minimal 8 karakter" class="rounded-xl mt-1.5" />
	</div>
	<Button type="submit" class="w-full font-bold rounded-xl bg-[#00aeef] hover:bg-[#0092c9] text-white py-2.5 shadow-md active:scale-98 transition" disabled={loading}>
		<UserPlus class="h-4 w-4 mr-1.5" /> {loading ? 'Memproses Pendaftaran…' : 'Daftar Akun Sekarang'}
	</Button>

	<div class="relative my-4 flex items-center justify-center">
		<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
		<span class="relative bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">atau</span>
	</div>

	<GoogleLoginButton label="Daftar dengan Google" />
</form>

<p class="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
	Sudah punya akun? <a href="/sign-in" class="font-bold text-[#00aeef] hover:underline">Masuk ke Akun</a>
</p>
