<script lang="ts">
	let { title, description, children }: { title: string; description?: string; children?: import('svelte').Snippet } = $props();
</script>

<div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
	<div>
		<h1 class="text-xl font-bold text-slate-900">{title}</h1>
		{#if description}
			<p class="mt-0.5 text-sm text-slate-500">{description}</p>
		{/if}
	</div>
	<div
		class="flex flex-col gap-2 sm:flex-row sm:items-center [&_a]:w-full [&_button]:w-full [&_form]:w-full sm:[&_a]:w-auto sm:[&_button]:w-auto sm:[&_form]:w-auto"
	>
		{@render children?.()}
	</div>
</div>
