<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { MailCheck } from 'lucide-svelte';
	import { authClient } from '#lib/auth-client';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import Label from '#lib/components/ui/label.svelte';

	let email = $state('');
	let loading = $state(false);
	let sent = $state(false);

	async function resend(e: Event) {
		e.preventDefault();
		loading = true;
		const { error } = await authClient.sendVerificationEmail({ email, callbackURL: '/' });
		loading = false;
		if (error) {
			toast.error('Gagal mengirim. Coba lagi.');
			return;
		}
		sent = true;
		toast.success('Email verifikasi dikirim ulang.');
	}
</script>

<div class="flex flex-col items-center gap-2 text-center">
	<MailCheck class="h-10 w-10 text-brand-700" />
	<h1 class="text-lg font-bold text-slate-900">Verifikasi email</h1>
	<p class="text-sm text-slate-500">
		Kami mengirim tautan verifikasi ke email Anda. Klik tautan itu untuk mengaktifkan akun.
	</p>
</div>

<form onsubmit={resend} class="mt-5 space-y-4">
	<div>
		<Label for="email">Kirim ulang ke email</Label>
		<Input id="email" type="email" required bind:value={email} placeholder="nama@contoh.id" />
	</div>
	<Button type="submit" variant="outline" class="w-full" disabled={loading}>
		{loading ? 'Mengirim…' : 'Kirim ulang email verifikasi'}
	</Button>
</form>

{#if sent}
	<p class="mt-3 text-center text-sm text-green-700">Terkirim. Cek kotak masuk Anda.</p>
{/if}

<p class="mt-5 text-center text-sm">
	<a href="/sign-in" class="font-medium text-brand-700 hover:underline">Kembali masuk</a>
</p>
