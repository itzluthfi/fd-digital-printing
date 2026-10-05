<script lang="ts">
	import { onMount } from 'svelte';
	import {
		X,
		ShoppingBag,
		Clock,
		CheckCircle2,
		PackageCheck,
		ExternalLink,
		Trash2,
		Plus,
		RefreshCw
	} from 'lucide-svelte';
	import { getGuestOrders, removeGuestOrder, saveGuestOrder, type GuestOrder } from '#lib/guest-orders';
	import { rupiah, tgl } from '#lib/format';

	let { open = $bindable(false) } = $props<{ open: boolean }>();

	let orders = $state<GuestOrder[]>([]);
	let liveStatuses = $state<Record<string, { status: string; isPaid: boolean }>>({});
	let isLoadingStatuses = $state(false);
	let manualCode = $state('');
	let manualError = $state('');

	const statusLabels: Record<string, { label: string; color: string; icon: typeof Clock }> = {
		baru: { label: 'Menunggu Pembayaran', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300', icon: Clock },
		diproses: { label: 'Sedang Diproses (Lunas)', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300', icon: CheckCircle2 },
		selesai: { label: 'Siap Diambil', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300', icon: CheckCircle2 },
		diambil: { label: 'Selesai / Diambil', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', icon: PackageCheck }
	};

	function loadOrders() {
		orders = getGuestOrders();
		refreshStatuses();
	}

	async function refreshStatuses() {
		if (orders.length === 0) return;
		isLoadingStatuses = true;
		try {
			await Promise.all(
				orders.map(async (o) => {
					try {
						const res = await fetch(`/api/order/status?code=${encodeURIComponent(o.code)}`);
						const data = await res.json();
						if (data.success) {
							liveStatuses[o.code] = { status: data.status, isPaid: data.isPaid };
						}
					} catch {
						// ignore error per order
					}
				})
			);
		} finally {
			isLoadingStatuses = false;
		}
	}

	async function handleAddManualCode() {
		const clean = manualCode.trim().toUpperCase();
		if (!clean) return;
		manualError = '';
		try {
			const res = await fetch(`/api/order/status?code=${encodeURIComponent(clean)}`);
			const data = await res.json();
			if (!data.success) {
				manualError = 'Kode order tidak ditemukan di sistem.';
				return;
			}
			saveGuestOrder({
				code: data.code,
				name: `Pesanan ${data.code}`,
				total: data.total,
				createdAt: data.createdAt ?? new Date().toISOString()
			});
			manualCode = '';
			loadOrders();
		} catch {
			manualError = 'Gagal memverifikasi kode order.';
		}
	}

	function handleDelete(code: string) {
		removeGuestOrder(code);
		orders = orders.filter((o) => o.code !== code);
	}

	$effect(() => {
		if (open) {
			loadOrders();
		}
	});

	onMount(() => {
		const handler = () => loadOrders();
		window.addEventListener('fd:orders-updated', handler);
		return () => window.removeEventListener('fd:orders-updated', handler);
	});
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs antialiased">
		<div class="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 max-h-[90vh] flex flex-col">
			<!-- Header -->
			<div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
				<div class="flex items-center gap-2.5">
					<div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00aeef]/10 text-[#00aeef]">
						<ShoppingBag class="h-5 w-5" />
					</div>
					<div>
						<h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
							Riwayat Pesanan Saya
						</h3>
						<p class="text-xs text-slate-500 dark:text-slate-400">
							Tersimpan otomatis di browser ini tanpa perlu login.
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => (open = false)}
					class="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
					aria-label="Tutup"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Input Kode Manual -->
			<div class="py-3">
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleAddManualCode();
					}}
					class="flex items-center gap-2"
				>
					<input
						type="text"
						bind:value={manualCode}
						placeholder="Punya kode lain? (Misal: FD-A1B2)"
						class="flex-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white uppercase placeholder:normal-case placeholder:font-sans focus:outline-hidden focus:ring-2 focus:ring-[#00aeef]/30"
					/>
					<button
						type="submit"
						class="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition hover:opacity-90 active:scale-95 cursor-pointer shrink-0"
					>
						<Plus class="h-3.5 w-3.5" />
						<span>Tambah</span>
					</button>
				</form>
				{#if manualError}
					<p class="text-[11px] text-rose-500 mt-1">{manualError}</p>
				{/if}
			</div>

			<!-- List Order -->
			<div class="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[160px]">
				{#if orders.length === 0}
					<div class="py-12 text-center">
						<ShoppingBag class="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
						<p class="text-sm font-bold text-slate-700 dark:text-slate-300">Belum ada pesanan tercatat</p>
						<p class="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
							Pesanan yang Anda buat melalui web ini akan otomatis tampil di sini secara realtime.
						</p>
					</div>
				{:else}
					{#each orders as ord (ord.code)}
						{@const live = liveStatuses[ord.code]}
						{@const stKey = live?.status ?? ord.status ?? 'baru'}
						{@const meta = statusLabels[stKey] ?? statusLabels['baru']}
						<div class="rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition flex flex-col gap-2">
							<div class="flex items-start justify-between gap-2">
								<div>
									<div class="flex items-center gap-2">
										<span class="font-mono font-black text-sm text-slate-900 dark:text-white">
											{ord.code}
										</span>
										<span class="text-[10px] font-bold px-2 py-0.5 rounded-full {meta.color}">
											{meta.label}
										</span>
									</div>
									<p class="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium line-clamp-1">
										{ord.name}
									</p>
									{#if ord.desc}
										<p class="text-[11px] text-slate-400 line-clamp-1">{ord.desc}</p>
									{/if}
								</div>
								<button
									type="button"
									onclick={() => handleDelete(ord.code)}
									class="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition"
									title="Hapus dari daftar riwayat lokal"
								>
									<Trash2 class="h-3.5 w-3.5" />
								</button>
							</div>

							<div class="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
								<span class="text-xs font-bold text-[#00aeef]">{rupiah(ord.total)}</span>
								<a
									href={`/pesan/sukses/${ord.code}`}
									class="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-[#00aeef] transition"
								>
									<span>Lihat / Bayar QRIS</span>
									<ExternalLink class="h-3 w-3" />
								</a>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			<div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
				<button
					type="button"
					onclick={refreshStatuses}
					disabled={isLoadingStatuses}
					class="inline-flex items-center gap-1.5 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
				>
					<RefreshCw class="h-3 w-3 {isLoadingStatuses ? 'animate-spin' : ''}" />
					<span>Perbarui Status</span>
				</button>
				<span>FD Digital Printing</span>
			</div>
		</div>
	</div>
{/if}
