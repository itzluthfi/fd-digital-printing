<script lang="ts">
	import { cn } from '#lib/utils';

	let { class: className, children }: { class?: string; children?: import('svelte').Snippet } = $props();
</script>

<th class={cn('px-3 py-2.5 text-xs font-semibold tracking-wide text-slate-500 uppercase', className)}>
	{@render children?.()}
</th>
