<script lang="ts">
	import { cn } from '#lib/utils';

	type Props = {
		value?: string;
		name?: string;
		id?: string;
		placeholder?: string;
		rows?: number;
		required?: boolean;
		class?: string;
	};

	let { value = $bindable(), class: className, rows = 3, ...rest }: Props = $props();
</script>

<textarea
	bind:value
	{rows}
	{...rest}
	class={cn(
		'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs outline-none transition-colors placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20',
		className
	)}
></textarea>
