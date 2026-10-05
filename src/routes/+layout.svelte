<script lang="ts">
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import { theme } from '#lib/theme.svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => {
		theme.apply();
	});
</script>


<svelte:head>
	<link rel="icon" href="/logo.png" />
	<title>FD Digital Printing</title>
</svelte:head>

<Toaster
	position="top-center"
	richColors
	visibleToasts={1}
	duration={3200}
	closeButton={false}
	offset="20px"
/>

{@render children()}
