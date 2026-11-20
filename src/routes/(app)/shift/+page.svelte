<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';

	import PageHeader from '#lib/components/app/page-header.svelte';
	import Button from '#lib/components/ui/button.svelte';
	import Input from '#lib/components/ui/input.svelte';
	import Label from '#lib/components/ui/label.svelte';
	import EmptyState from '#lib/components/app/empty-state.svelte';
	import ResponsiveTable, { type RtColumn } from '#lib/components/ui/responsive-table.svelte';
	import { rupiah, tglWaktu } from '#lib/format';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let busy = $state(false);

	const cols: RtColumn[] = [
		{ key: 'waktu', label: 'Shift' },
		{ key: 'cash', label: 'Cash', class: 'text-right' },
		{ key: 'selisih', label: 'Selisih', class: 'text-right' }
	];

	function hasil() {
		return async ({ result, update }: { result: any; update: () => Promise<void> }) => {
			busy = false;
			if (result.type === 'success') {
				if (typeof result.data?.selisih === 'number') {
					const s = result.data.selisih;
					toast[s === 0 ? 'success' : 'warning'](
						s === 0 ? 'Shift ditutup — cash pas.' : `Shift ditutup — selisih ${rupiah(s)}.`
					);
				} else toast.success('Shift dibuka.');
				await update();
			} else if (result.type === 'failure') {
				toast.error(String(result.data?.message ?? 'Gagal memproses.'));
			}
		};
	}

	const expectedAktif = $derived(
		data.aktif ? data.aktif.cashAwal + data.cashMasukBerjalan : 0
	);
</script>

<PageHeader title="Rekap Shift Kasir" />

{#if data.aktif}
	<section class="mb-6 max-w-xl rounded-xl border border-amber-300 bg-amber-50/80 p-4 sm:p-5 shadow-xs dark:border-amber-800/80 dark:bg-amber-950/40">
		<p class="text-sm font-bold text-amber-900 dark:text-amber-200">Shift sedang berjalan</p>
		<p class="mt-1 text-xs text-amber-700 dark:text-amber-300">Dibuka {tglWaktu(data.aktif.dibukaAt)}{data.aktif.dibukaOleh ? ` oleh ${data.aktif.dibukaOleh}` : ''}</p>
		<div class="mt-3 space-y-1.5 text-sm">
			<div class="flex justify-between"><span class="text-slate-600 dark:text-slate-400">Cash awal laci</span><span class="font-medium text-slate-800 dark:text-slate-200">{rupiah(data.aktif.cashAwal)}</span></div>
			<div class="flex justify-between"><span class="text-slate-600 dark:text-slate-400">Cash masuk (tercatat)</span><span class="font-medium text-slate-800 dark:text-slate-200">{rupiah(data.cashMasukBerjalan)}</span></div>
			<div class="flex justify-between border-t border-amber-200 dark:border-amber-800/80 pt-1.5"><span class="font-semibold text-slate-700 dark:text-slate-300">Seharusnya ada</span><span class="font-bold text-amber-900 dark:text-amber-200">{rupiah(expectedAktif)}</span></div>
		</div>
		<form
			method="POST"
			action="?/tutup"
			use:enhance={() => {
				busy = true;
				return hasil();
			}}
			class="mt-4 space-y-3 border-t border-amber-200 dark:border-amber-800/80 pt-4"
		>
			<input type="hidden" name="id" value={data.aktif.id} />
			<div>
				<Label for="cashFisik">Cash fisik di laci (Rp)</Label>
				<Input id="cashFisik" name="cashFisik" type="number" min="0" step="500" placeholder="0" required />
			</div>
			<div>
				<Label for="catatan">Catatan</Label>
				<Input id="catatan" name="catatan" placeholder="Catatan pergantian shift..." />
			</div>
			<Button type="submit" disabled={busy} class="min-h-10 w-full sm:w-auto bg-[#00aeef] hover:bg-[#009bd6] text-white">
				{busy ? 'Menutup…' : 'Tutup shift'}
			</Button>
		</form>
	</section>
{:else}
	<form
		method="POST"
		action="?/buka"
		use:enhance={() => {
			busy = true;
			return hasil();
		}}
		class="mb-6 max-w-xl rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
	>
		<div>
			<Label for="cashAwal">Cash awal di laci (Rp)</Label>
			<Input id="cashAwal" name="cashAwal" type="number" min="0" step="500" placeholder="0" required />
		</div>
		<Button type="submit" disabled={busy} class="mt-3 min-h-10 w-full sm:w-auto bg-[#00aeef] hover:bg-[#009bd6] text-white">
			{busy ? 'Membuka…' : 'Buka shift'}
		</Button>
	</form>
{/if}

<h2 class="mb-3 text-sm font-bold text-slate-900 dark:text-white">Riwayat shift</h2>
{#if data.riwayat.length === 0}
	<EmptyState message="Belum ada shift yang ditutup." actionLabel="Muat ulang" actionHref="/shift" />
{:else}
	<ResponsiveTable columns={cols} rows={data.riwayat} keyOf={(s) => s.id}>
		{#snippet cell(c, s)}
			{#if c.key === 'waktu'}
				<span class="font-medium text-slate-900 dark:text-white whitespace-nowrap">{tglWaktu(s.dibukaAt)}</span>
				<span class="block text-xs text-slate-500 dark:text-slate-400">
					s/d {s.ditutupAt ? tglWaktu(s.ditutupAt) : '-'}{s.ditutupOleh ? ` • ${s.ditutupOleh}` : ''}
				</span>
			{:else if c.key === 'cash'}
				<span class="block text-xs text-slate-500 dark:text-slate-400">Awal {rupiah(s.cashAwal ?? 0)} + masuk {rupiah(s.cashMasuk ?? 0)}</span>
				<span class="font-bold text-slate-900 dark:text-white">Fisik {rupiah(s.cashFisik ?? 0)}</span>
			{:else if c.key === 'selisih'}
				<span class={(s.selisih ?? 0) === 0 ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-bold text-red-600 dark:text-red-400'}>
					{rupiah(s.selisih ?? 0)}
				</span>
			{/if}
		{/snippet}
		{#snippet card(s)}
			<div class="flex items-start justify-between gap-2">
				<div>
					<p class="font-medium text-sm text-slate-900 dark:text-white whitespace-nowrap">{tglWaktu(s.dibukaAt)}</p>
					<p class="text-xs text-slate-500 dark:text-slate-400">s/d {s.ditutupAt ? tglWaktu(s.ditutupAt) : '-'}</p>
				</div>
				<span class={(s.selisih ?? 0) === 0 ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-bold text-red-600 dark:text-red-400'}>
					{rupiah(s.selisih ?? 0)}
				</span>
			</div>
			<p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
				Awal {rupiah(s.cashAwal ?? 0)} + masuk {rupiah(s.cashMasuk ?? 0)} = fisik {rupiah(s.cashFisik ?? 0)}
			</p>
		{/snippet}
	</ResponsiveTable>
{/if}
