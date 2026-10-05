<script lang="ts">
	import { cn } from '#lib/utils';

	let { class: className, children }: { class?: string; children?: import('svelte').Snippet } = $props();
</script>

<div class={cn('w-full overflow-x-auto rounded-lg border border-slate-200 bg-white', className)}>
	<table class="w-full text-sm">
		{@render children?.()}
	</table>
</div>
