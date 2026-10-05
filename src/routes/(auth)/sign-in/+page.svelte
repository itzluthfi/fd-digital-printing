<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { LogIn } from 'lucide-svelte';
	import { authClient } from '#lib/auth-client';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import PasswordInput from '#lib/components/ui/password-input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import GoogleLoginButton from '#lib/components/GoogleLoginButton.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	// Preset demo testing: sekali klik langsung login otomatis ke role terkait
	const demoPresets = [
		{ label: 'Owner', email: 'owner@fd.local', target: '/dashboard' },
		{ label: 'Admin', email: 'admin@fd.local', target: '/dashboard' },
		{ label: 'Operator', email: 'operator@fd.local', target: '/order' },
		{ label: 'Customer', email: 'customer@fd.local', target: '/dashboard' }
	] as const;

	async function quickLogin(preset: (typeof demoPresets)[number]) {
		email = preset.email;
		password = 'admin123';
		loading = true;
		try {
			const res = await authClient.signIn.email({ email: preset.email, password: 'admin123' });
			loading = false;
			if (res.error) {
				toast.error(res.error.message || 'Gagal masuk akun demo.');
				return;
			}
			toast.success(`Berhasil masuk sebagai ${preset.label}.`);
			goto(preset.target);
		} catch (e) {
			loading = false;
			toast.error('Terjadi kesalahan saat masuk.');
		}
	}

	async function submit(e: Event) {
		e.preventDefault();
		loading = true;
		const res = await authClient.signIn.email({ email, password });
		loading = false;
		if (res.error) {
			toast.error('Email atau password salah.');
			return;
		}
		toast.success('Berhasil masuk.');
		goto('/dashboard');
	}
</script>

<!-- Tab Navigasi Masuk / Daftar -->
<div class="flex rounded-2xl bg-slate-100 dark:bg-slate-800/80 p-1 mb-6 border border-slate-200/60 dark:border-slate-700/60">
	<span class="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs">
		Masuk Akun
	</span>
	<a href="/sign-up" class="flex-1 py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
		Daftar Baru
	</a>
</div>

<h1 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Selamat Datang Kembali</h1>
<p class="mt-1 mb-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400">Masuk untuk mengelola pesanan & akun Anda.</p>

<form onsubmit={submit} class="space-y-4">
	<div>
		<Label for="email">Email</Label>
		<Input id="email" type="email" required bind:value={email} placeholder="nama@contoh.id" class="rounded-xl mt-1.5" />
	</div>
	<div>
		<div class="flex items-center justify-between">
			<Label for="password">Password</Label>
			<a href="/forgot-password" class="text-[11px] font-medium text-[#00aeef] hover:underline">Lupa password?</a>
		</div>
		<PasswordInput id="password" required bind:value={password} placeholder="••••••••" class="rounded-xl mt-1.5" />
	</div>
	<Button type="submit" class="w-full font-bold rounded-xl bg-[#00aeef] hover:bg-[#0092c9] text-white py-2.5 shadow-md active:scale-98 transition" disabled={loading}>
		<LogIn class="h-4 w-4 mr-1.5" /> {loading ? 'Memproses…' : 'Masuk Sekarang'}
	</Button>

	<div class="relative my-4 flex items-center justify-center">
		<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
		<span class="relative bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">atau</span>
	</div>

	<GoogleLoginButton label="Masuk dengan Google" />
</form>

<div class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
	<p class="mb-2.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Akses Cepat Demo Akun</p>
	<div class="grid grid-cols-4 gap-2">
		{#each demoPresets as preset}
			<Button
				type="button"
				variant="outline"
				size="sm"
				onclick={() => quickLogin(preset)}
				disabled={loading}
				class="text-xs font-bold rounded-xl hover:bg-[#00aeef]/10 hover:text-[#0075a2] hover:border-[#00aeef]/40"
			>
				{preset.label}
			</Button>
		{/each}
	</div>
	<p class="mt-2 text-center text-[10px] text-slate-400">Password default: admin123</p>
</div>
