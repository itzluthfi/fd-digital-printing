<script lang="ts">
	import { Printer, ArrowLeft } from 'lucide-svelte';

	import Button from '#lib/components/ui/button.svelte';
	import { rupiah, tglWaktu, METODE_LABEL } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const { order, customer, payments, totalDibayar, sisa } = data;

	const subtotal = $derived(order.subtotal || order.total);
	const metodeTxt = $derived(
		payments.length > 0
			? [...new Set(payments.map((p) => METODE_LABEL[p.method] ?? p.method))].join('+')
			: '-'
	);
</script>

<svelte:head>
	<title>Struk {order.code ?? `#${order.id}`} — FD Digital Printing</title>
	<style>
		.struk {
			width: 58mm;
			max-width: 100%;
			margin: 0 auto;
			font-family: ui-monospace, monospace;
			font-size: 11px;
			line-height: 1.5;
			color: #000;
			background: #fff;
			padding: 4mm 2mm;
		}
		.struk .c { text-align: center; }
		.struk .b { font-weight: bold; }
		.struk .row { display: flex; justify-content: space-between; gap: 4px; }
		.struk .dash { border-top: 1px dashed #000; margin: 6px 0; }
		.struk .wrap { overflow-wrap: anywhere; }
		@media print {
			@page { size: 58mm auto; margin: 0; }
			body { margin: 0; }
			.struk { padding: 2mm; }
		}
	</style>
</svelte:head>

<div class="no-print mx-auto mb-4 flex max-w-md items-center gap-2">
	<Button variant="ghost" size="sm" href="/kasir"><ArrowLeft /> Kasir</Button>
	<Button variant="outline" class="flex-1" onclick={() => window.print()}>
		<Printer /> Cetak 58mm
	</Button>
</div>

<div class="struk">
	<div class="c b">FD DIGITAL PRINTING</div>
	<div class="dash"></div>
	<div class="row"><span>No</span><span class="b">{order.code ?? `#${order.id}`}</span></div>
	<div class="row"><span>Tgl</span><span>{tglWaktu(order.createdAt)}</span></div>
	<div class="row"><span>Plg</span><span class="wrap">{customer?.name ?? 'Walk-in'}</span></div>
	<div class="dash"></div>
	<div class="wrap">{order.description}</div>
	<div class="dash"></div>
	<div class="row"><span>Subtotal</span><span>{rupiah(subtotal)}</span></div>
	{#if (order.discountRp ?? 0) > 0}
		<div class="row"><span>Diskon</span><span>-{rupiah(order.discountRp ?? 0)}</span></div>
	{/if}
	<div class="row b"><span>TOTAL</span><span>{rupiah(order.total)}</span></div>
	<div class="dash"></div>
	<div class="row"><span>Bayar ({metodeTxt})</span><span>{rupiah(totalDibayar)}</span></div>
	{#if (order.kembalian ?? 0) > 0}
		<div class="row"><span>Kembali</span><span>{rupiah(order.kembalian ?? 0)}</span></div>
	{/if}
	{#if sisa > 0}
		<div class="row b"><span>SISA</span><span>{rupiah(sisa)}</span></div>
	{/if}
	<div class="dash"></div>
	<div class="c">Terima kasih</div>
	<div class="c">Dicetak {tglWaktu(new Date().toISOString())}</div>
</div>
