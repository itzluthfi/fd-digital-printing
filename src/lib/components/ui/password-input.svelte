<script lang="ts">
	import { Eye, EyeOff } from 'lucide-svelte';
	import { cn } from '#lib/utils';

	type Props = {
		value?: string;
		placeholder?: string;
		name?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		minlength?: number;
		maxlength?: number;
		class?: string;
	};

	let {
		value = $bindable(''),
		class: className,
		...rest
	}: Props = $props();

	let show = $state(false);
</script>

<div class="relative">
	<input
		type={show ? 'text' : 'password'}
		bind:value
		{...rest}
		class={cn(
			'h-9 w-full rounded-md border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-900 shadow-xs outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:opacity-50',
			className
		)}
	/>
	<button
		type="button"
		tabindex="-1"
		aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
		onclick={() => (show = !show)}
		class="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
	>
		{#if show}
			<EyeOff size={17} />
		{:else}
			<Eye size={17} />
		{/if}
	</button>
</div>
