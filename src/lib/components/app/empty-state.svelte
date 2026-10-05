<script lang="ts">
	import Button from '#lib/components/ui/button.svelte';

	let { message, actionLabel, actionHref }: { message: string; actionLabel: string; actionHref: string } = $props();
</script>

<div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white py-10 text-center">
	<p class="text-sm text-slate-500">{message}</p>
	<Button href={actionHref} variant="outline" size="sm">{actionLabel}</Button>
</div>
