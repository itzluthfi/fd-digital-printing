<script lang="ts">
	let { children }: { children?: import('svelte').Snippet } = $props();
</script>

<thead class="border-b border-slate-200 bg-slate-50 text-left">
	{@render children?.()}
</thead>
