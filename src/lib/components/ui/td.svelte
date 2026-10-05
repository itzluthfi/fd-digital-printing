<script lang="ts">
	import { cn } from '#lib/utils';

	let { class: className, children }: { class?: string; children?: import('svelte').Snippet } = $props();
</script>

<td class={cn('px-3 py-2.5 align-middle text-slate-800', className)}>
	{@render children?.()}
</td>
