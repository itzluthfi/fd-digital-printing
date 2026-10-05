<script lang="ts">
	import { CheckCircle2, Copy, Download, QrCode, ShieldCheck, X } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { rupiah } from '#lib/format';

	let {
		open = $bindable(false),
		amount = 0,
		orderCode = '',
		qrisUrl = '/uploads/qris.png',
		onConfirm
	}: {
		open: boolean;
		amount: number;
		orderCode?: string;
		qrisUrl?: string;
		onConfirm: () => void;
	} = $props();

	let copied = $state(false);

	function salinNominal() {
		navigator.clipboard.writeText(String(amount));
		copied = true;
		toast.success('Nominal disalin: ' + rupiah(amount));
		setTimeout(() => (copied = false), 2500);
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
		<div
			class="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl transition-all"
			role="dialog"
			aria-modal="true"
		>
			<!-- Close Button -->
			<button
				type="button"
				onclick={() => (open = false)}
				class="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
				aria-label="Tutup"
			>
				<X class="h-4 w-4" />
			</button>

			<!-- QRIS Header -->
			<div class="text-center">
				<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-200 mb-2">
					<QrCode class="h-3.5 w-3.5 text-[#00aeef]" />
					<span>QRIS RESMI TOKO</span>
				</div>
				<h3 class="text-base font-black text-slate-900 dark:text-white">FD DIGITAL PRINTING</h3>
				<p class="text-xs text-slate-500 dark:text-slate-400">NMID: ID1020021198273 · Semua Bank & E-Wallet</p>
			</div>

			<!-- QR Display Box -->
			<div class="mt-4 flex flex-col items-center justify-center rounded-2xl bg-white p-4 border border-slate-200 shadow-inner">
				<img
					src={qrisUrl}
					alt="QRIS FD Digital Printing"
					class="w-48 h-48 object-contain rounded-lg"
					onerror={(e) => {
						// Fallback jika belum upload gambar qris di server
						const target = e.currentTarget as HTMLImageElement;
						target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021126580014ID.GO.QRIS.WWW011893600999002119827302150895073708055204541153033605802ID5919FD_DIGITAL_PRINTING6008SIDOARJO61056125462070703A016304';
					}}
				/>
				<span class="mt-2 text-[10px] font-medium text-slate-400">Scan via BCA, Mandiri, BRI, GoPay, OVO, Dana, ShopeePay</span>
			</div>

			<!-- Nominal Box -->
			<div class="mt-4 rounded-xl bg-sky-50 dark:bg-slate-800/80 p-3.5 border border-sky-100 dark:border-slate-700 flex items-center justify-between">
				<div>
					<span class="block text-[10px] font-bold text-slate-400 uppercase">Total Tagihan</span>
					<span class="text-lg font-black text-slate-900 dark:text-white">{rupiah(amount)}</span>
				</div>
				<button
					type="button"
					onclick={salinNominal}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 shadow-2xs transition active:scale-95"
				>
					<Copy class="h-3 w-3" />
					<span>{copied ? 'Tersalin' : 'Salin'}</span>
				</button>
			</div>

			<!-- Actions -->
			<div class="mt-5 space-y-2">
				<button
					type="button"
					onclick={onConfirm}
					class="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00aeef] hover:bg-[#0092c9] text-white py-3 px-4 font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
				>
					<CheckCircle2 class="h-4 w-4" />
					<span>Saya Sudah Bayar</span>
				</button>
				<button
					type="button"
					onclick={() => (open = false)}
					class="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	.animate-fade-in {
		animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
</style>
