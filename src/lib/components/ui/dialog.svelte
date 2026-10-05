<script lang="ts">
	import { cn } from '#lib/utils';

	type Props = {
		open?: boolean;
		title: string;
		description?: string;
		class?: string;
		children?: import('svelte').Snippet;
		onclose?: () => void;
	};

	let { open = $bindable(false), title, description, class: className, children, onclose }: Props = $props();

	function close() {
		open = false;
		onclose?.();
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window {onkeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<button
			aria-label="Tutup"
			class="absolute inset-0 cursor-default bg-slate-950/50"
			onclick={close}
		></button>
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			class={cn('relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl', className)}
		>
			<h2 class="text-base font-semibold text-slate-900">{title}</h2>
			{#if description}
				<p class="mt-1 text-sm text-slate-500">{description}</p>
			{/if}
			<div class="mt-4">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}
