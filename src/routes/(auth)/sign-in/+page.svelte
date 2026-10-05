<script lang="ts">
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { LogIn } from 'lucide-svelte';
	import { authClient } from '#lib/auth-client';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import PasswordInput from '#lib/components/ui/password-input.svelte';
	import Label from '#lib/components/ui/label.svelte';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	// Preset demo untuk masa testing: isi kredensial per role sekali klik.
	const demoPresets = [
		{ label: 'Owner', email: 'owner@fd.local' },
		{ label: 'Admin', email: 'admin@fd.local' },
		{ label: 'Operator', email: 'operator@fd.local' },
		{ label: 'Customer', email: 'customer@fd.local' }
	] as const;

	function fillDemo(preset: (typeof demoPresets)[number]) {
		email = preset.email;
		password = 'admin123';
		toast.info(`Kredensial demo ${preset.label} terisi, klik Masuk.`);
	}

	async function submit(e: Event) {
		e.preventDefault();
		loading = true;
		const { error } = await authClient.signIn.email({ email, password });
		loading = false;
		if (error) {
			toast.error('Email atau password salah.');
			return;
		}
		toast.success('Berhasil masuk.');
		goto('/');
	}
</script>

<h1 class="text-lg font-bold text-slate-900">Masuk</h1>
<p class="mt-1 mb-5 text-sm text-slate-500">Masuk ke sistem FD Digital Printing.</p>

<form onsubmit={submit} class="space-y-4">
	<div>
		<Label for="email">Email</Label>
		<Input id="email" type="email" required bind:value={email} placeholder="nama@contoh.id" />
	</div>
	<div>
		<Label for="password">Password</Label>
		<PasswordInput id="password" required bind:value={password} placeholder="••••••••" />
	</div>
	<Button type="submit" class="w-full" disabled={loading}>
		<LogIn /> {loading ? 'Memproses…' : 'Masuk'}
	</Button>
</form>

<div class="mt-4">
	<p class="mb-2 text-center text-xs text-slate-400">Coba cepat sebagai (masa testing)</p>
	<div class="grid grid-cols-4 gap-2">
		{#each demoPresets as preset}
			<Button type="button" variant="outline" size="sm" onclick={() => fillDemo(preset)} disabled={loading}>
				{preset.label}
			</Button>
		{/each}
	</div>
</div>

<div class="mt-5 flex items-center justify-between text-sm">
	<a href="/forgot-password" class="text-brand-700 hover:underline">Lupa password?</a>
	<a href="/sign-up" class="font-medium text-brand-700 hover:underline">Daftar akun</a>
</div>
