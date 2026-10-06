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
		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('dipi:auth-demo', {
					detail: { role: preset.label }
				})
			);
		}
		try {
			const res = await authClient.signIn.email({ email: preset.email, password: 'admin123' });
			loading = false;
			if (res.error) {
				toast.error(res.error.message || 'Gagal masuk akun demo.');
				if (typeof window !== 'undefined') {
					window.dispatchEvent(
						new CustomEvent('dipi:auth-failed', {
							detail: { reason: 'general', message: res.error.message }
						})
					);
				}
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
		if (!email.trim()) {
			toast.error('Silakan isi email terlebih dahulu.');
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('dipi:auth-invalid', {
						detail: { field: 'email', isSignUp: false }
					})
				);
			}
			document.getElementById('email')?.focus();
			return;
		}

		if (!password) {
			toast.error('Silakan isi password terlebih dahulu.');
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('dipi:auth-invalid', {
						detail: { field: 'password', isSignUp: false }
					})
				);
			}
			document.getElementById('password')?.focus();
			return;
		}

		loading = true;
		const res = await authClient.signIn.email({ email, password });
		loading = false;
		if (res.error) {
			toast.error('Email atau password salah.');
			if (typeof window !== 'undefined') {
				window.dispatchEvent(
					new CustomEvent('dipi:auth-failed', {
						detail: { reason: 'credential', message: res.error.message }
					})
				);
			}
			return;
		}
		toast.success('Berhasil masuk.');
		if (typeof window !== 'undefined') {
			window.dispatchEvent(
				new CustomEvent('dipi:auth-success', {
					detail: { type: 'login' }
				})
			);
		}
		goto('/dashboard');
	}
</script>

<!-- Tab Navigasi Masuk / Daftar -->
<div class="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-4 border border-slate-200/60 dark:border-slate-700/60">
	<span class="flex-1 py-1.5 text-center text-xs font-bold rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs">
		Masuk Akun
	</span>
	<a href="/sign-up" class="flex-1 py-1.5 text-center text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
		Daftar Baru
	</a>
</div>

<form onsubmit={submit} class="space-y-3" novalidate>
	<div>
		<Label for="email" class="text-xs">Email</Label>
		<Input id="email" type="email" required bind:value={email} placeholder="nama@contoh.id" class="rounded-xl mt-1 h-9 text-xs" />
	</div>
	<div>
		<div class="flex items-center justify-between">
			<Label for="password" class="text-xs">Password</Label>
			<a href="/forgot-password" class="text-[11px] font-medium text-[#00aeef] hover:underline">Lupa?</a>
		</div>
		<PasswordInput id="password" required bind:value={password} placeholder="••••••••" class="rounded-xl mt-1 h-9 text-xs" />
	</div>
	<Button type="submit" class="w-full font-bold rounded-xl bg-[#00aeef] hover:bg-[#0092c9] text-white py-2 text-xs shadow-sm active:scale-98 transition cursor-pointer" disabled={loading}>
		<LogIn class="h-3.5 w-3.5 mr-1.5" /> {loading ? 'Memproses…' : 'Masuk Sekarang'}
	</Button>

	<div class="relative my-2.5 flex items-center justify-center">
		<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
		<span class="relative bg-white dark:bg-slate-900 px-2.5 text-[11px] text-slate-400">atau</span>
	</div>

	<GoogleLoginButton label="Masuk dengan Google" />
</form>

<!-- Demo Akun Cepat -->
<div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
	<span class="text-[10px] font-semibold text-slate-400 shrink-0">Demo:</span>
	<div class="flex items-center gap-1.5 flex-1 justify-end">
		{#each demoPresets as preset}
			<button
				type="button"
				onclick={() => quickLogin(preset)}
				disabled={loading}
				class="px-2 py-1 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-[#00aeef]/10 hover:text-[#0075a2] hover:border-[#00aeef]/40 text-slate-600 dark:text-slate-300 transition active:scale-95 cursor-pointer disabled:opacity-50"
			>
				{preset.label}
			</button>
		{/each}
	</div>
</div>
