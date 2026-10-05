<script lang="ts">
	import { Toaster } from 'svelte-sonner';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href="/logo.webp" />
	<title>FD Digital Printing</title>
</svelte:head>

<Toaster position="top-right" richColors closeButton />

{@render children()}
