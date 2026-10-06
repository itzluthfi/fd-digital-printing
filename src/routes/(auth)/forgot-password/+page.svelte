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

<h2 class="text-sm font-bold text-slate-900 dark:text-white mb-3">Atur Ulang Password</h2>

{#if sent}
	<div class="flex flex-col items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-center">
		<MailSearch class="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
		<p class="text-xs text-slate-700 dark:text-slate-300">
			Tautan reset telah dikirim ke <strong>{email}</strong>.
		</p>
	</div>
{:else}
	<form onsubmit={submit} class="space-y-3">
		<div>
			<Label for="email" class="text-xs">Email</Label>
			<Input id="email" type="email" required bind:value={email} placeholder="nama@contoh.id" class="rounded-xl mt-1 h-9 text-xs" />
		</div>
		<Button type="submit" class="w-full font-bold rounded-xl bg-[#00aeef] hover:bg-[#0092c9] text-white py-2 text-xs shadow-sm active:scale-98 transition cursor-pointer" disabled={loading}>
			{loading ? 'Mengirim…' : 'Kirim Tautan Reset'}
		</Button>
	</form>
{/if}

<p class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
	<a href="/sign-in" class="font-semibold text-[#00aeef] hover:underline">← Kembali ke Masuk Akun</a>
</p>
