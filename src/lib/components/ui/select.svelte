<script lang="ts">
	import { cn } from '#lib/utils';

	type Props = {
		value?: string;
		name?: string;
		id?: string;
		required?: boolean;
		class?: string;
		children?: import('svelte').Snippet;
		onchange?: (e: Event) => void;
	};

	let { value = $bindable(), class: className, children, onchange, ...rest }: Props = $props();
</script>

<select
	bind:value
	{onchange}
	{...rest}
	class={cn(
		'h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-xs outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20',
		className
	)}
>
	{@render children?.()}
</select>
