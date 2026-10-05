<script lang="ts">
	import { cn } from '#lib/utils';

	type Props = {
		value?: string | number;
		type?: string;
		placeholder?: string;
		name?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		min?: string | number;
		max?: string | number;
		minlength?: number;
		maxlength?: number;
		step?: string | number;
		class?: string;
		oninput?: (e: Event) => void;
	};

	let {
		value = $bindable(),
		type = 'text',
		class: className,
		oninput,
		...rest
	}: Props = $props();
</script>

<input
	{type}
	bind:value
	{oninput}
	{...rest}
	class={cn(
		'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-xs outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
/>
