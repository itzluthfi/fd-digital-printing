<script lang="ts">
	import { enhance } from '$app/forms';
	import { Printer, Mail, ArrowLeft } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	import Badge from '#lib/components/ui/badge.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import { rupiah, tgl, tglWaktu, METODE_LABEL, STATUS_LABEL } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { order, customer, payments, totalDibayar, sisa, dueDate } = data;
	let sending = $state(false);

	const subtotal = $derived(order.subtotal || order.total);

	const metodeUtama = $derived(
		payments.length === 1
			? (METODE_LABEL[payments[0].method] ?? payments[0].method)
			: payments.length > 1
				? `${payments.length} metode`
				: '-'
	);
</script>

<div class="no-print mb-4 flex items-center gap-2">
	<Button variant="ghost" size="sm" href="/kasir"><ArrowLeft /> Kembali ke kasir</Button>
</div>

<div class="print-area mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
	<div class="flex items-center gap-3 border-b border-slate-200 pb-4">
		<img src="/logo.webp" alt="FD Digital Printing" class="h-11 w-11 rounded-md object-contain" />
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
			<tr class="border-b border-slate-100">
				<td class="py-2 text-slate-500">Subtotal</td>
				<td class="py-2 text-right font-medium text-slate-900">{rupiah(subtotal)}</td>
			</tr>
			{#if (order.discountRp ?? 0) > 0}
				<tr class="border-b border-slate-100">
					<td class="py-2 text-slate-500">
						Diskon{order.discountType === 'pct' ? ' (%)' : ''}
					</td>
					<td class="py-2 text-right font-medium text-red-600">−{rupiah(order.discountRp ?? 0)}</td>
				</tr>
			{/if}
			<tr class="border-b border-slate-100">
				<td class="py-2 text-slate-500">Total</td>
				<td class="py-2 text-right font-bold text-slate-900">{rupiah(order.total)}</td>
			</tr>
			<tr class="border-b border-slate-100">
				<td class="py-2 text-slate-500">Dibayar ({metodeUtama})</td>
				<td class="py-2 text-right font-medium text-green-700">{rupiah(totalDibayar)}</td>
			</tr>
			{#if (order.kembalian ?? 0) > 0}
				<tr class="border-b border-slate-100">
					<td class="py-2 text-slate-500">Kembalian</td>
					<td class="py-2 text-right font-medium text-slate-900">{rupiah(order.kembalian ?? 0)}</td>
				</tr>
			{/if}
			<tr>
				<td class="py-2 text-slate-500">Sisa</td>
				<td class="py-2 text-right font-bold {sisa > 0 ? 'text-yellow-700' : 'text-slate-900'}">
					{rupiah(sisa)}
				</td>
			</tr>
			{#if sisa > 0 && dueDate}
				<tr>
					<td class="py-2 text-slate-500">Jatuh tempo</td>
					<td class="py-2 text-right font-medium text-slate-900">{tgl(dueDate)}</td>
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

<div class="no-print mx-auto mt-4 flex max-w-md gap-2">
	<Button variant="outline" class="flex-1" onclick={() => window.print()}>
		<Printer /> Cetak
	</Button>
	{#if customer?.email}
		<form
			method="POST"
			action="?/email"
			class="flex-1"
			use:enhance={() => {
				sending = true;
				return async ({ result, update }) => {
					sending = false;
					if (result.type === 'success') {
						toast.success(`Invoice terkirim ke ${customer.email}.`);
						await update();
					} else if (result.type === 'failure') {
						toast.error((result.data?.message as string) ?? 'Gagal mengirim email.');
					}
				};
			}}
		>
			<Button type="submit" class="w-full" disabled={sending}>
				<Mail /> {sending ? 'Mengirim…' : 'Kirim email'}
			</Button>
		</form>
	{:else}
		<div class="flex-1 rounded-md border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500">
			Kirim email butuh alamat email pelanggan — <a href="/pelanggan" class="font-medium text-brand-700 hover:underline">tambah di halaman Pelanggan</a>.
		</div>
	{/if}
</div>
