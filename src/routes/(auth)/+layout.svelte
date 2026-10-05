<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-brand-950 px-4 py-10">
	<div class="w-full max-w-sm">
		<div class="mb-6 flex flex-col items-center gap-3 text-center">
			<img src="/logo.webp" alt="FD Digital Printing" class="h-14 w-auto" />
			<p class="text-xs text-brand-200">Sistem kasir & order cetakan</p>
		</div>
		<div class="rounded-xl bg-white p-6 shadow-xl">
			{@render children()}
		</div>
	</div>
</div>
