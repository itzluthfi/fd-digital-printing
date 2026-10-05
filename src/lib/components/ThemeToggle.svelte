<script lang="ts">
	import { Moon, Sun } from 'lucide-svelte';
	import { theme } from '#lib/theme.svelte';

	let { class: className = '' }: { class?: string } = $props();
</script>

<button
	type="button"
	onclick={() => theme.toggle()}
	class="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 {className}"
	title={theme.isDark ? 'Beralih ke Mode Terang / Cerah' : 'Beralih ke Mode Gelap'}
	aria-label="Ganti Tema"
>
	{#if theme.isDark}
		<Sun class="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
	{:else}
		<Moon class="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
	{/if}
</button>
