<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { MailSearch } from 'lucide-svelte';
	import { authClient } from '#lib/auth-client';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import Label from '#lib/components/ui/label.svelte';

	let email = $state('');
	let loading = $state(false);
	let sent = $state(false);

	async function submit(e: Event) {
		e.preventDefault();
		loading = true;
		const { error } = await authClient.requestPasswordReset({
			email,
			redirectTo: '/reset-password'
		});
		loading = false;
		if (error) {
			toast.error('Gagal mengirim. Coba lagi.');
			return;
		}
		sent = true;
	}
</script>

<h1 class="text-lg font-bold text-slate-900">Lupa password</h1>
<p class="mt-1 mb-5 text-sm text-slate-500">Masukkan email akun Anda.</p>

{#if sent}
	<div class="flex flex-col items-center gap-2 rounded-lg bg-green-50 p-5 text-center">
		<MailSearch class="h-8 w-8 text-green-700" />
		<p class="text-sm text-slate-700">
			Tautan reset sudah dikirim ke <strong>{email}</strong>. Tautan kedaluwarsa dalam 1 jam.
		</p>
	</div>
{:else}
	<form onsubmit={submit} class="space-y-4">
		<div>
			<Label for="email">Email</Label>
			<Input id="email" type="email" required bind:value={email} placeholder="nama@contoh.id" />
		</div>
		<Button type="submit" class="w-full" disabled={loading}>
			{loading ? 'Mengirim…' : 'Kirim tautan reset'}
		</Button>
	</form>
{/if}

<p class="mt-5 text-center text-sm">
	<a href="/sign-in" class="font-medium text-brand-700 hover:underline">Kembali masuk</a>
</p>
