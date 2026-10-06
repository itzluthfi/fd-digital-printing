<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { Toaster } from 'svelte-sonner';
	import { theme } from '#lib/theme.svelte';
	import DipiWidget from '#lib/dipi/DipiWidget.svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => {
		theme.apply();
	});

	// Maskot Dipi aktif di halaman publik customer & halaman auth pelanggan,
	// otomatis tersembunyi hanya di area operasional internal (kasir POS, order operator, dan panel dashboard admin).
	const showDipi = $derived.by(() => {
		const p = page.url.pathname;
		const internalAdminRoutes = [
			'/dashboard',
			'/kasir',
			'/order',
			'/piutang',
			'/pelanggan',
			'/pengeluaran',
			'/shift',
			'/laporan',
			'/pengguna',
			'/notifikasi',
			'/harga',
			'/pengaturan'
		];
		return !internalAdminRoutes.some((route) => p === route || p.startsWith(route + '/'));
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

{#if showDipi}
	<DipiWidget />
{/if}
