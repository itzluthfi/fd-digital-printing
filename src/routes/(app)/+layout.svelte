<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		LayoutDashboard,
		ShoppingCart,
		ClipboardList,
		Wallet,
		Users,
		ChartColumn,
		UserCog,
		Bell,
		Tags,
		Settings,
		LogOut,
		Menu
	} from 'lucide-svelte';
	import { authClient } from '#lib/auth-client';
	import { cn } from '#lib/utils';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const role = $derived(data.user?.role ?? 'customer');
	const isStaff = $derived(role === 'owner' || role === 'admin');

	const nav = $derived(
		[
			isStaff && { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
			isStaff && { href: '/kasir', label: 'Kasir', icon: ShoppingCart },
			{ href: '/order', label: 'Order', icon: ClipboardList },
			isStaff && { href: '/piutang', label: 'Piutang', icon: Wallet },
			isStaff && { href: '/pelanggan', label: 'Pelanggan', icon: Users },
			isStaff && { href: '/laporan', label: 'Laporan', icon: ChartColumn },
			isStaff && { href: '/harga', label: 'Katalog Harga', icon: Tags },
			isStaff && { href: '/notifikasi', label: 'Notifikasi', icon: Bell },
			role === 'owner' && { href: '/pengguna', label: 'Pengguna', icon: UserCog },
			role === 'owner' && { href: '/pengaturan', label: 'Pengaturan', icon: Settings }
		].filter(Boolean) as { href: string; label: string; icon: typeof LayoutDashboard }[]
	);

	let open = $state(false);

	async function logout() {
		await authClient.signOut();
		goto('/sign-in');
	}
</script>

<div class="flex min-h-screen">
	<!-- Sidebar -->
	<aside
		class={cn(
			'no-print fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-brand-900 text-white transition-transform md:static md:translate-x-0',
			open ? 'translate-x-0' : '-translate-x-full'
		)}
	>
		<a href="/" class="flex items-center gap-2.5 px-5 py-5">
			<img src="/logo.webp" alt="FD Digital Printing" class="h-9 w-9 rounded-md bg-white object-contain p-0.5" />
			<span class="leading-tight">
				<span class="block text-sm font-bold">FD Digital Printing</span>
				<span class="block text-[11px] text-brand-200 capitalize">{role}</span>
			</span>
		</a>
		<nav class="flex-1 space-y-1 px-3">
			{#each nav as item (item.href)}
				{@const active = page.url.pathname === item.href || page.url.pathname.startsWith(item.href + '/')}
				<a
					href={item.href}
					onclick={() => (open = false)}
					class={cn(
						'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
						active ? 'bg-white/15 text-white' : 'text-brand-100 hover:bg-white/10 hover:text-white'
					)}
				>
					<item.icon class="h-4 w-4" />
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="border-t border-white/10 p-4">
			<p class="truncate text-sm font-medium">{data.user?.name}</p>
			<p class="truncate text-xs text-brand-200">{data.user?.email}</p>
			<button
				onclick={logout}
				class="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-brand-100 transition-colors hover:bg-white/10 hover:text-white"
			>
				<LogOut class="h-4 w-4" /> Keluar
			</button>
		</div>
	</aside>

	{#if open}
		<button aria-label="Tutup menu" class="fixed inset-0 z-30 bg-slate-950/40 md:hidden" onclick={() => (open = false)}></button>
	{/if}

	<!-- Konten -->
	<div class="flex min-w-0 flex-1 flex-col">
		<header class="no-print sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
			<button aria-label="Menu" class="cursor-pointer rounded-md p-1.5 hover:bg-slate-100" onclick={() => (open = true)}>
				<Menu class="h-5 w-5" />
			</button>
			<span class="text-sm font-bold text-brand-900">FD Digital Printing</span>
		</header>
		<main class="flex-1 p-4 md:p-6">
			{@render children()}
		</main>
	</div>
</div>
