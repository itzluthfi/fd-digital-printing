<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		LayoutDashboard,
		ShoppingCart,
		ShoppingBag,
		ClipboardList,
		Wallet,
		Users,
		ChartColumn,
		UserCog,
		Bell,
		Tags,
		Settings,
		LogOut,
		Menu,
		Banknote,
		History
	} from 'lucide-svelte';
	import { authClient } from '#lib/auth-client';
	import { cn } from '#lib/utils';
	import ThemeToggle from '#lib/components/ThemeToggle.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const role = $derived(data.user?.role ?? 'customer');
	const isStaff = $derived(role === 'owner' || role === 'admin');
	const isOperator = $derived(role === 'operator');

	type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };
	type NavGroup = { title: string; items: NavItem[] };

	const navGroups = $derived<NavGroup[]>(
		role === 'customer'
			? [
					{
						title: 'PORTAL PELANGGAN',
						items: [
							{ href: '/dashboard', label: 'Pesanan Saya', icon: ShoppingBag },
							{ href: '/', label: 'Katalog & Toko', icon: Tags }
						]
					}
				]
			: [
					{
						title: 'OPERASIONAL',
						items: [
							isStaff && { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
							isStaff && { href: '/kasir', label: 'Kasir', icon: ShoppingCart },
							(isStaff || isOperator) && { href: '/order', label: 'Order Cetakan', icon: ClipboardList },
							isStaff && { href: '/piutang', label: 'Piutang', icon: Wallet },
							isStaff && { href: '/pelanggan', label: 'Pelanggan', icon: Users }
						].filter(Boolean) as NavItem[]
					},
					isStaff && {
						title: 'KEUANGAN',
						items: [
							{ href: '/pengeluaran', label: 'Pengeluaran', icon: Banknote },
							{ href: '/shift', label: 'Tutup Kasir', icon: History },
							{ href: '/laporan', label: 'Laporan Omzet', icon: ChartColumn }
						]
					},
					(isStaff || isOperator) && {
						title: 'KATALOG & NOTIFIKASI',
						items: [
							{ href: '/harga', label: 'Katalog Harga', icon: Tags },
							isStaff && { href: '/notifikasi', label: 'Notifikasi', icon: Bell }
						].filter(Boolean) as NavItem[]
					},
					role === 'owner' && {
						title: 'SISTEM TOKO',
						items: [
							{ href: '/pengguna', label: 'Kelola Staf', icon: UserCog },
							{ href: '/pengaturan', label: 'Pengaturan', icon: Settings }
						]
					}
				].filter(Boolean) as NavGroup[]
	);

	let open = $state(false);

	async function logout() {
		await authClient.signOut();
		goto('/sign-in');
	}
</script>

<div class="flex h-screen overflow-hidden bg-slate-100/70 dark:bg-slate-950 transition-colors">
	<!-- Sidebar: Sticky & Pinned (Fixed Left, Independent Scroll) -->
	<aside
		class={cn(
			'no-print fixed inset-y-0 left-0 z-40 flex w-64 flex-col h-full bg-white text-slate-800 shadow-xl border-r border-slate-200 transition-transform md:static md:translate-x-0 md:shrink-0 dark:bg-[#0B1E36] dark:text-white dark:border-[#162e4e]',
			open ? 'translate-x-0' : '-translate-x-full'
		)}
	>
		<!-- Header Brand -->
		<a href="/" class="flex items-center gap-3 px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors dark:border-white/10 dark:hover:bg-white/5">
			<img src="/logo.png" alt="FD Digital Printing" class="h-9 w-9 rounded-lg object-contain bg-white p-0.5 shadow-xs border border-slate-100" />
			<div class="min-w-0 flex-1 leading-tight">
				<span class="block text-sm font-bold text-slate-900 dark:text-white truncate">FD Digital Printing</span>
				<span class="block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
					{role === 'customer' ? 'Portal Pelanggan' : 'Panel Operasional'}
				</span>
			</div>
		</a>

		<!-- Navigation Groups -->
		<div class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
			{#each navGroups as group}
				{#if group.items.length > 0}
					<div>
						<p class="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
							{group.title}
						</p>
						<nav class="space-y-0.5">
							{#each group.items as item (item.href)}
								{@const active = page.url.pathname === item.href || page.url.pathname.startsWith(item.href + '/')}
								<a
									href={item.href}
									onclick={() => (open = false)}
									class={cn(
										'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
										active
											? 'bg-[#00aeef] text-white font-semibold shadow-sm'
											: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
									)}
								>
									<item.icon class="h-4 w-4 shrink-0" />
									<span class="truncate">{item.label}</span>
								</a>
							{/each}
						</nav>
					</div>
				{/if}
			{/each}
		</div>

		<!-- Footer User & Theme Switcher -->
		<div class="border-t border-slate-100 p-4 bg-slate-50/70 dark:bg-[#08172b] dark:border-white/10">
			<div class="flex items-center justify-between gap-2">
				<div class="flex items-center gap-2.5 min-w-0 flex-1">
					<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00aeef]/15 text-[#00aeef] font-bold text-xs uppercase border border-[#00aeef]/30">
						{(data.user?.name ?? 'U').slice(0, 2)}
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-xs font-semibold text-slate-800 dark:text-white">{data.user?.name ?? 'Pengguna'}</p>
						<p class="truncate text-[11px] text-slate-500 dark:text-slate-400">{data.user?.email}</p>
					</div>
				</div>
				<ThemeToggle class="h-8 w-8 shrink-0" />
			</div>

			<button
				onclick={logout}
				class="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white dark:bg-white/5 py-1.5 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-300 border border-slate-200 dark:border-white/5 shadow-2xs"
			>
				<LogOut class="h-3.5 w-3.5" /> Keluar
			</button>
		</div>
	</aside>

	{#if open}
		<button aria-label="Tutup menu" class="fixed inset-0 z-30 bg-slate-950/40 md:hidden" onclick={() => (open = false)}></button>
	{/if}

	<!-- Konten (Scroll Mandiri) -->
	<div class="flex min-w-0 flex-1 flex-col h-full overflow-y-auto">
		<header class="no-print sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden dark:bg-slate-900/95 dark:border-slate-800">
			<div class="flex items-center gap-3">
				<button aria-label="Menu" class="cursor-pointer rounded-md p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" onclick={() => (open = true)}>
					<Menu class="h-5 w-5 text-slate-700 dark:text-slate-200" />
				</button>
				<span class="text-sm font-bold text-slate-900 dark:text-white">FD Digital Printing</span>
			</div>
			<div class="flex items-center gap-2">
				<ThemeToggle class="h-8 w-8" />
				<button
					onclick={logout}
					title="Keluar / Logout"
					aria-label="Logout"
					class="flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-300 px-2.5 py-1.5 text-xs font-bold transition shadow-2xs cursor-pointer"
				>
					<LogOut class="h-3.5 w-3.5" />
					<span>Keluar</span>
				</button>
			</div>
		</header>
		<main class="flex-1 p-4 md:p-6">
			{@render children()}
		</main>
	</div>
</div>
