<script lang="ts">
	import { cn } from '#lib/utils';

	let { class: className, children }: { class?: string; children?: import('svelte').Snippet } = $props();
</script>

<tr class={cn('', className)}>
	{@render children?.()}
</tr>
