<script lang="ts">
	import { enhance } from '$app/forms';
	import { Printer, Mail, ArrowLeft, ReceiptText } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import WhatsappIcon from '#lib/components/WhatsappIcon.svelte';
	import { rupiah, tgl, tglWaktu, METODE_LABEL, STATUS_LABEL } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { order, customer, payments, totalDibayar, sisa, dueDate } = data;
	let sendingEmail = $state(false);
	let sendingWa = $state(false);

	const subtotal = $derived(order.subtotal || order.total);

	const metodeUtama = $derived(
		payments.length === 1
			? (METODE_LABEL[payments[0].method] ?? payments[0].method)
			: payments.length > 1
				? `${payments.length} metode`
				: '-'
	);

	// Format nomor WA untuk link manual
	const cleanPhone = $derived(customer?.phone?.replace(/\D/g, '') ?? '');
	const waPhone = $derived(
		cleanPhone.startsWith('0')
			? '62' + cleanPhone.slice(1)
			: cleanPhone.startsWith('62')
				? cleanPhone
				: cleanPhone ? '62' + cleanPhone : ''
	);

	const waDirectText = $derived(
		encodeURIComponent(
			`*INVOICE — FD DIGITAL PRINTING*\n` +
			`No. Order: *#${order.code ?? order.id}*\n` +
			`Pelanggan: *${customer?.name ?? 'Pelanggan'}*\n` +
			`Item: ${order.description}\n` +
			`Total: *${rupiah(order.total)}*\n` +
			`Sudah Bayar: ${rupiah(totalDibayar)}\n` +
			`Sisa: *${rupiah(sisa)}*\n` +
			(sisa > 0 ? `Mohon segera lakukan pelunasan. Terima kasih!` : `Status: LUNAS. Terima kasih telah mencetak di FD Digital Printing.`)
		)
	);
</script>

<div class="no-print mb-4 flex items-center gap-2">
	<Button variant="ghost" size="sm" href="/kasir"><ArrowLeft /> Kembali ke kasir</Button>
</div>

<div class="print-area mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
	<div class="flex items-center gap-3 border-b border-slate-200 pb-4">
		<img src="/logo.png" alt="FD Digital Printing" class="h-11 w-11 rounded-md object-contain" />
		<div>
			<p class="font-bold text-slate-900">FD Digital Printing</p>
			<p class="text-xs text-slate-500">Invoice / Kuitansi</p>
		</div>
		<div class="ml-auto text-right">
			<p class="text-sm font-bold text-slate-900">{order.code ?? `#${order.id}`}</p>
			<p class="text-xs text-slate-500">{tglWaktu(order.createdAt)}</p>
		</div>
	</div>

	<div class="space-y-1.5 py-4 text-sm">
		<div class="flex justify-between">
			<span class="text-slate-500">Pelanggan</span>
			<span class="font-medium text-slate-900">{customer?.name ?? 'Walk-in'}</span>
		</div>
		{#if customer?.phone}
			<div class="flex justify-between">
				<span class="text-slate-500">No. WhatsApp</span>
				<span class="font-medium text-slate-900">{customer.phone}</span>
			</div>
		{/if}
		<div class="flex justify-between">
			<span class="text-slate-500">Status order</span>
			<Badge variant="brand">{STATUS_LABEL[order.status] ?? order.status}</Badge>
		</div>
	</div>

	<div class="border-t border-dashed border-slate-200 py-3 text-sm">
		<p class="font-medium text-slate-900">{order.description}</p>
	</div>

	<table class="w-full text-sm">
		<tbody>
			{#if order.discountRp && order.discountRp > 0}
				<tr>
					<td class="py-1 text-slate-500">Subtotal</td>
					<td class="py-1 text-right">{rupiah(subtotal)}</td>
				</tr>
				<tr>
					<td class="py-1 text-slate-500">
						Diskon {order.discountType === 'pct' ? `(${Math.round(((order.discountRp) / (subtotal || 1)) * 100)}%)` : ''}
					</td>
					<td class="py-1 text-right text-emerald-600">
						-{rupiah(order.discountRp)}
					</td>
				</tr>
			{/if}
			<tr class="font-bold">
				<td class="py-1.5 text-slate-900">Total</td>
				<td class="py-1.5 text-right text-slate-900">{rupiah(order.total)}</td>
			</tr>
			<tr>
				<td class="py-1 text-slate-500">Sudah dibayar ({metodeUtama})</td>
				<td class="py-1 text-right font-medium text-slate-900">{rupiah(totalDibayar)}</td>
			</tr>
			{#if sisa > 0}
				<tr class="font-bold text-amber-700">
					<td class="py-1.5">Sisa tagihan (Piutang)</td>
					<td class="py-1.5 text-right">{rupiah(sisa)}</td>
				</tr>
				{#if dueDate}
					<tr>
						<td class="py-1 text-xs text-slate-500">Jatuh tempo</td>
						<td class="py-1 text-right text-xs font-medium text-amber-800">{tgl(dueDate)}</td>
					</tr>
				{/if}
			{:else}
				<tr class="font-bold text-emerald-700">
					<td class="py-1.5">Status bayar</td>
					<td class="py-1.5 text-right">LUNAS</td>
				</tr>
			{/if}
		</tbody>
	</table>

	<p class="mt-4 text-center text-xs text-slate-400">Terima kasih atas kepercayaan Anda.</p>

	{#if data.qrisUrl && payments.some((p) => p.method === 'qris')}
		<div class="mt-4 flex flex-col items-center gap-1 border-t border-dashed border-slate-200 pt-4">
			<img src={data.qrisUrl} alt="QRIS FD Digital Printing" class="h-40 w-40 object-contain" />
			<p class="text-xs text-slate-500">Scan untuk bayar via QRIS</p>
		</div>
	{/if}
</div>

<div class="no-print mx-auto mt-4 flex max-w-md flex-wrap gap-2">
	<Button variant="outline" class="flex-1 min-w-[120px]" onclick={() => window.print()}>
		<Printer class="h-4 w-4" /> Cetak
	</Button>
	<Button variant="outline" class="flex-1 min-w-[120px]" href={`/kasir/struk/${order.id}`}>
		<ReceiptText class="h-4 w-4" /> Struk 58mm
	</Button>

	{#if customer?.phone}
		{#if data.waConfigured}
			<form
				method="POST"
				action="?/whatsapp"
				class="flex-1 min-w-[140px]"
				use:enhance={() => {
					sendingWa = true;
					return async ({ result, update }) => {
						sendingWa = false;
						if (result.type === 'success') {
							toast.success(`Invoice masuk antrean WhatsApp ke ${customer.phone}`);
							await update();
						} else if (result.type === 'failure') {
							toast.error((result.data?.message as string) ?? 'Gagal mengirim WhatsApp.');
						}
					};
				}}
			>
				<Button
					type="submit"
					class="w-full bg-[#25D366] text-white hover:bg-[#1EBE5D] border-0 shadow-xs"
					disabled={sendingWa}
				>
					<WhatsappIcon class="h-4 w-4" /> {sendingWa ? 'Mengirim…' : 'Kirim WA Bot'}
				</Button>
			</form>
		{:else}
			<a
				href={`https://wa.me/${waPhone}?text=${waDirectText}`}
				target="_blank"
				rel="noopener noreferrer"
				class="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#1EBE5D] transition"
			>
				<WhatsappIcon class="h-4 w-4" /> Buka Chat WA
			</a>
		{/if}
	{:else}
		<div class="w-full rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 text-center">
			Kirim WhatsApp butuh nomor HP — <a href="/pelanggan" class="font-medium text-brand-700 hover:underline">tambah di halaman Pelanggan</a>.
		</div>
	{/if}

	{#if customer?.email}
		<form
			method="POST"
			action="?/email"
			class="flex-1 min-w-[120px]"
			use:enhance={() => {
				sendingEmail = true;
				return async ({ result, update }) => {
					sendingEmail = false;
					if (result.type === 'success') {
						toast.success(`Invoice terkirim ke ${customer.email}.`);
						await update();
					} else if (result.type === 'failure') {
						toast.error((result.data?.message as string) ?? 'Gagal mengirim email.');
					}
				};
			}}
		>
			<Button variant="outline" type="submit" class="w-full" disabled={sendingEmail}>
				<Mail class="h-4 w-4" /> {sendingEmail ? 'Mengirim…' : 'Kirim Email'}
			</Button>
		</form>
	{/if}
</div>
