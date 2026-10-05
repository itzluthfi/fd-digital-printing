<script lang="ts">
	import { cn } from '#lib/utils';

	let { for: forId, class: className, children }: { for?: string; class?: string; children?: import('svelte').Snippet } = $props();
</script>

<label for={forId} class={cn('mb-1.5 block text-sm font-medium text-slate-700', className)}>
	{@render children?.()}
</label>
