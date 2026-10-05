<script lang="ts">
	let { children }: { children?: import('svelte').Snippet } = $props();
</script>

<tbody class="[&_tr]:border-b [&_tr]:border-slate-100 [&_tr:last-child]:border-0 [&_tr:hover]:bg-slate-50/70">
	{@render children?.()}
</tbody>
