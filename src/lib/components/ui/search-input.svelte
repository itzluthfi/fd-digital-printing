<script lang="ts">
	import { Search } from 'lucide-svelte';
	import { cn } from '#lib/utils';

	let {
		value = $bindable(''),
		placeholder = 'Cari…',
		id,
		class: className
	}: {
		value?: string;
		placeholder?: string;
		id?: string;
		class?: string;
	} = $props();
</script>

<div class={cn('relative', className)}>
	<Search class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
	<input
		{id}
		type="search"
		bind:value
		{placeholder}
		class="h-10 w-full rounded-md border border-slate-300 bg-white pr-3 pl-9 text-sm text-slate-900 shadow-xs outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
	/>
</div>
